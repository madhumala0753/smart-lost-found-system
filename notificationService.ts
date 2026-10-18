import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AppNotification } from '../types';

export function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function createNotification(
  data: Omit<AppNotification, 'id' | 'read' | 'createdAt'>
): Promise<AppNotification> {
  const id = generateNotificationId();
  const now = new Date().toISOString();

  const notif: AppNotification = {
    ...data,
    id,
    read: false,
    createdAt: now,
  };

  const path = `notifications/${id}`;
  try {
    await setDoc(doc(db, 'notifications', id), notif);
    return notif;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToUserNotifications(
  userId: string,
  onData: (notifications: AppNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as AppNotification);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    }
  );
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;

  const batch = writeBatch(db);
  for (const n of unread) {
    batch.update(doc(db, 'notifications', n.id), { read: true });
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'notifications');
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const path = `notifications/${id}`;
  try {
    await deleteDoc(doc(db, 'notifications', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
