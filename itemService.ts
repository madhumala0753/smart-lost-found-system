import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { ItemReport, MatchResult, ReportType, ItemStatus, ItemCategory } from '../types';

export function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function extractKeywords(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 2)
    )
  );
}

export async function createItemReport(data: Omit<ItemReport, 'id' | 'createdAt' | 'updatedAt' | 'normalizedName'>): Promise<ItemReport> {
  const id = generateItemId();
  const now = new Date().toISOString();
  const safeItemName = (data.itemName || '').trim().slice(0, 120);
  const normalizedName = safeItemName.toLowerCase();
  const safeCategory = (data.category || 'Other').slice(0, 60);
  const safeDescription = (data.description || '').trim().slice(0, 1500);
  const safeLocation = (data.location || '').trim().slice(0, 150);
  const safeOwnerName = (data.ownerName || 'Campus Member').trim().slice(0, 100);
  const safeOwnerEmail = (data.ownerEmail || '').trim().slice(0, 150);
  const safeOwnerId = data.ownerId.slice(0, 128);
  const safeEventDate = (data.eventDate || now.split('T')[0]).slice(0, 20);
  const safeStatus = data.status || 'Active';
  const safeContactPreference = data.contactPreference || 'in_app';

  const keywordsList = extractKeywords(
    `${safeItemName} ${safeCategory} ${safeDescription} ${safeLocation} ${data.distinguishingFeatures || ''}`
  );

  // Firestore rejects any document containing 'undefined' field values.
  // Construct clean payload strictly with defined, validated properties.
  const payload: Record<string, any> = {
    id,
    ownerId: safeOwnerId,
    ownerName: safeOwnerName,
    ownerEmail: safeOwnerEmail,
    reportType: data.reportType === 'found' ? 'found' : 'lost',
    itemName: safeItemName,
    normalizedName,
    category: safeCategory,
    description: safeDescription,
    keywords: keywordsList.join(' ').slice(0, 1000),
    location: safeLocation,
    eventDate: safeEventDate,
    contactPreference: safeContactPreference,
    status: safeStatus,
    createdAt: now,
    updatedAt: now,
  };

  // Only attach optional fields if defined and non-empty
  if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim().length > 0) {
    payload.imageUrl = data.imageUrl.trim();
  }
  if (data.distinguishingFeatures && typeof data.distinguishingFeatures === 'string' && data.distinguishingFeatures.trim().length > 0) {
    payload.distinguishingFeatures = data.distinguishingFeatures.trim().slice(0, 500);
  }
  if (data.contactPhone && typeof data.contactPhone === 'string' && data.contactPhone.trim().length > 0) {
    payload.contactPhone = data.contactPhone.trim().slice(0, 30);
  }

  const path = `items/${id}`;
  try {
    await setDoc(doc(db, 'items', id), payload);
    return payload as ItemReport;
  } catch (error) {
    console.error(`[createItemReport] Firestore write failed for path "${path}" [type: ${data.reportType}]:`, error);
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getItemById(id: string): Promise<ItemReport | null> {
  const path = `items/${id}`;
  try {
    const snap = await getDoc(doc(db, 'items', id));
    if (snap.exists()) {
      return snap.data() as ItemReport;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateItemReport(id: string, updates: Partial<ItemReport>): Promise<void> {
  const path = `items/${id}`;
  try {
    const payload: Partial<ItemReport> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.itemName) {
      payload.normalizedName = updates.itemName.trim().toLowerCase();
    }
    await updateDoc(doc(db, 'items', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteItemReport(id: string): Promise<void> {
  const path = `items/${id}`;
  try {
    await deleteDoc(doc(db, 'items', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function closeItemReport(id: string): Promise<void> {
  await updateItemReport(id, { status: 'Closed' });
}

export async function resolveItemReport(id: string): Promise<void> {
  await updateItemReport(id, { status: 'Returned / Resolved' });
}

export function subscribeToAllItems(
  onData: (items: ItemReport[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'items');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as ItemReport);
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
      handleFirestoreError(error, OperationType.LIST, 'items');
    }
  );
}

// Matching and Relevance Algorithm
export function calculateMatchScore(
  target: {
    itemName: string;
    category?: string;
    description?: string;
    location?: string;
    eventDate?: string;
    reportType?: ReportType;
  },
  candidate: ItemReport
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // Exclude same report type if we are looking for the counter part (e.g. Lost matches Found)
  if (target.reportType && candidate.reportType === target.reportType) {
    return { item: candidate, score: 0, reasons: ['Same report type'] };
  }

  // Exclude closed or resolved items
  if (['Returned / Resolved', 'Closed', 'Rejected'].includes(candidate.status)) {
    return { item: candidate, score: 0, reasons: ['Item is already resolved or closed'] };
  }

  // 1. Category Matching (up to 25 pts)
  if (target.category && target.category === candidate.category) {
    score += 25;
    reasons.push(`Exact category match: ${candidate.category}`);
  }

  // 2. Title & Keywords Overlap (up to 45 pts)
  const targetWords = extractKeywords(`${target.itemName} ${target.description || ''}`);
  const candidateKeywords = extractKeywords(`${candidate.itemName} ${candidate.description} ${candidate.keywords || ''}`);
  
  const matchedWords = targetWords.filter((w) => candidateKeywords.includes(w) && w.length >= 3);
  if (matchedWords.length > 0) {
    const wordScore = Math.min(45, matchedWords.length * 15);
    score += wordScore;
    reasons.push(`Matching keywords: "${matchedWords.slice(0, 4).join('", "')}"`);
  }

  // Name direct match boost
  if (
    target.itemName &&
    (candidate.normalizedName.includes(target.itemName.toLowerCase().trim()) ||
      target.itemName.toLowerCase().trim().includes(candidate.normalizedName))
  ) {
    score = Math.min(100, score + 15);
    reasons.push(`Strong item name match: "${candidate.itemName}"`);
  }

  // 3. Location Proximity (up to 15 pts)
  if (target.location && candidate.location) {
    const targetLocWords = extractKeywords(target.location);
    const candLocWords = extractKeywords(candidate.location);
    const locMatch = targetLocWords.some((w) => candLocWords.includes(w) && w.length >= 3);
    if (locMatch || target.location.toLowerCase() === candidate.location.toLowerCase()) {
      score += 15;
      reasons.push(`Matching campus location: ${candidate.location}`);
    }
  }

  // 4. Date Proximity (up to 15 pts)
  if (target.eventDate && candidate.eventDate) {
    try {
      const d1 = new Date(target.eventDate).getTime();
      const d2 = new Date(candidate.eventDate).getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        const diffDays = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) {
          score += 15;
          reasons.push(`Event date is within 2 days (${candidate.eventDate})`);
        } else if (diffDays <= 7) {
          score += 10;
          reasons.push(`Event date is within 1 week`);
        } else if (diffDays <= 14) {
          score += 5;
          reasons.push(`Event date is within 2 weeks`);
        }
      }
    } catch {
      // ignore date parse issues
    }
  }

  // Cap score at 98% (label as approximate relevance, never 100% guarantee)
  const finalScore = Math.min(98, Math.round(score));
  return {
    item: candidate,
    score: finalScore,
    reasons: reasons.length > 0 ? reasons : ['General campus listing'],
  };
}
