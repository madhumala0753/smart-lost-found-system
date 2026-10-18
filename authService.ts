import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from '../types';

export const ADMIN_EMAIL = 'pmadhumala75@gmail.com';

export function isSystemAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function syncUserProfile(
  user: FirebaseUser,
  extraData?: { fullName?: string; studentId?: string; department?: string; desiredRole?: UserRole }
): Promise<UserProfile> {
  const isMasterAdmin = isSystemAdminEmail(user.email);
  const assignedRole: UserRole = isMasterAdmin ? 'admin' : (extraData?.desiredRole === 'admin' ? 'admin' : 'user');

  const existing = await getUserProfile(user.uid);
  const now = new Date().toISOString();

  if (existing) {
    const shouldUpdateRole = isMasterAdmin && existing.role !== 'admin';
    if (shouldUpdateRole) {
      await updateDoc(doc(db, 'users', user.uid), {
        role: 'admin',
        updatedAt: now,
      });
      existing.role = 'admin';
    }
    // Also ensure admin doc entry exists if admin
    if (existing.role === 'admin' || isMasterAdmin) {
      await setDoc(doc(db, 'admins', user.uid), {
        id: user.uid,
        email: user.email || '',
        updatedAt: now,
      }, { merge: true });
    }
    return existing;
  }

  const newProfile: UserProfile = {
    id: user.uid,
    fullName: extraData?.fullName || user.displayName || user.email?.split('@')[0] || 'Campus Student',
    email: user.email || '',
    role: assignedRole,
    studentId: extraData?.studentId || '',
    department: extraData?.department || 'General Campus',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'users', user.uid), newProfile);
    if (assignedRole === 'admin') {
      await setDoc(doc(db, 'admins', user.uid), {
        id: user.uid,
        email: user.email || '',
        createdAt: now,
      });
    }
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function registerWithEmail(
  fullName: string,
  email: string,
  pass: string,
  studentId?: string,
  department?: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(cred.user, { displayName: fullName });
  return await syncUserProfile(cred.user, { fullName, studentId, department });
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    profile = await syncUserProfile(cred.user);
  }
  return profile;
}

export async function loginWithGoogle(): Promise<UserProfile> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return await syncUserProfile(cred.user);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function updateUserProfileDoc(uid: string, data: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
