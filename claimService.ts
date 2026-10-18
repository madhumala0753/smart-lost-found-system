import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ClaimRequest, ClaimStatus } from '../types';
import { createNotification } from './notificationService';
import { updateItemReport } from './itemService';

export function generateClaimId(): string {
  return `claim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function submitClaim(
  data: Omit<ClaimRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ClaimRequest> {
  const id = generateClaimId();
  const now = new Date().toISOString();

  const claim: ClaimRequest = {
    ...data,
    id,
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
  };

  const path = `claims/${id}`;
  try {
    await setDoc(doc(db, 'claims', id), claim);

    // Update item status to 'Claim Pending' so others know a claim is underway
    try {
      await updateItemReport(data.itemId, { status: 'Claim Pending' });
    } catch (e) {
      console.warn('Could not update item status on claim creation:', e);
    }

    // Send notification to item owner
    try {
      await createNotification({
        userId: data.ownerId,
        title: 'New Ownership Claim Submitted',
        message: `${data.claimantName} filed a claim on your report "${data.itemTitle}". Review their verification details.`,
        type: 'claim_created',
        itemId: data.itemId,
        claimId: id,
      });
    } catch (e) {
      console.warn('Failed to send notification to owner:', e);
    }

    return claim;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToClaimsByClaimant(
  claimantId: string,
  onData: (claims: ClaimRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'claims'), where('claimantId', '==', claimantId));
  return onSnapshot(
    q,
    (snapshot) => {
      const claims = snapshot.docs.map((d) => d.data() as ClaimRequest);
      claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(claims);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'claims');
    }
  );
}

export function subscribeToClaimsForOwner(
  ownerId: string,
  onData: (claims: ClaimRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'claims'), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snapshot) => {
      const claims = snapshot.docs.map((d) => d.data() as ClaimRequest);
      claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(claims);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'claims');
    }
  );
}

export function subscribeToAllClaims(
  onData: (claims: ClaimRequest[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'claims');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const claims = snapshot.docs.map((d) => d.data() as ClaimRequest);
      claims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(claims);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'claims');
    }
  );
}

export async function reviewClaimStatus(
  claim: ClaimRequest,
  newStatus: ClaimStatus,
  reviewerId: string,
  adminNotes?: string
): Promise<void> {
  const path = `claims/${claim.id}`;
  const now = new Date().toISOString();

  try {
    await updateDoc(doc(db, 'claims', claim.id), {
      status: newStatus,
      reviewedBy: reviewerId,
      adminNotes: adminNotes || '',
      updatedAt: now,
    });

    // Notify claimant
    const title =
      newStatus === 'Approved'
        ? 'Claim Approved! 🎉'
        : newStatus === 'Rejected'
        ? 'Claim Update: Not Verified'
        : `Claim Status: ${newStatus}`;

    const message =
      newStatus === 'Approved'
        ? `Your claim for "${claim.itemTitle}" was approved! Contact or visit the campus desk for pickup.`
        : newStatus === 'Rejected'
        ? `Your claim for "${claim.itemTitle}" was not approved. ${adminNotes ? 'Reason: ' + adminNotes : 'Details did not match records.'}`
        : `Your claim for "${claim.itemTitle}" is now ${newStatus}.`;

    await createNotification({
      userId: claim.claimantId,
      title,
      message,
      type: newStatus === 'Approved' ? 'claim_approved' : 'claim_rejected',
      itemId: claim.itemId,
      claimId: claim.id,
    });

    // If approved, update item to Matched or Returned / Resolved
    if (newStatus === 'Approved') {
      await updateItemReport(claim.itemId, { status: 'Matched' });
    } else if (newStatus === 'Completed') {
      await updateItemReport(claim.itemId, { status: 'Returned / Resolved' });
    } else if (newStatus === 'Rejected') {
      // Revert item back to Active if no other approved claim
      await updateItemReport(claim.itemId, { status: 'Active' });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
