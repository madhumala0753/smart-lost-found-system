import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { AuditLogEntry } from '../types';

export function generateAuditLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function recordAuditLog(
  data: Omit<AuditLogEntry, 'id' | 'createdAt'>
): Promise<AuditLogEntry> {
  const id = generateAuditLogId();
  const now = new Date().toISOString();

  const entry: AuditLogEntry = {
    ...data,
    id,
    createdAt: now,
  };

  const path = `auditLogs/${id}`;
  try {
    await setDoc(doc(db, 'auditLogs', id), entry);
    return entry;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToAuditLogs(
  onData: (logs: AuditLogEntry[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'auditLogs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs = snapshot.docs.map((d) => d.data() as AuditLogEntry);
      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(logs);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'auditLogs');
    }
  );
}
