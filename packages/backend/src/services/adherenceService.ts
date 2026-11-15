import { db } from '../config/firebase.js';
import type { AdherenceLog, AdherenceStatus } from '../types/index.js';

const COL = 'adherenceLogs';

/**
 * Log a dose adherence event.
 * @param data - AdherenceLog fields excluding auto-generated id and createdAt
 * @returns The newly created AdherenceLog document
 */
export async function logAdherence(
  data: Omit<AdherenceLog, 'id' | 'createdAt'>,
): Promise<AdherenceLog> {
  const now = new Date();
  const ref = db.collection(COL).doc();
  const log: AdherenceLog = { ...data, id: ref.id, createdAt: now };
  await ref.set(log);
  return log;
}

/**
 * Get adherence logs for a profile within a date range.
 * @param profileId - The profile group ID
 * @param from - Start of the date range (inclusive)
 * @param to - End of the date range (inclusive)
 * @returns Array of AdherenceLog documents ordered by scheduledTime desc
 */
export async function getAdherenceLogs(
  profileId: string,
  from: Date,
  to: Date,
): Promise<AdherenceLog[]> {
  const snap = await db
    .collection(COL)
    .where('profileId', '==', profileId)
    .where('scheduledTime', '>=', from)
    .where('scheduledTime', '<=', to)
    .orderBy('scheduledTime', 'desc')
    .get();
  return snap.docs.map((d) => d.data() as AdherenceLog);
}

/**
 * Update an adherence log's status (e.g., from pending to taken).
 * @param logId - Firestore document ID of the adherence log
 * @param profileId - The profile group ID of the requesting user
 * @param status - New adherence status
 * @param notes - Optional notes about the status update
 * @returns Updated AdherenceLog, or null if not found or unauthorized
 */
export async function updateAdherenceStatus(
  logId: string,
  profileId: string,
  status: AdherenceStatus,
  notes?: string,
): Promise<AdherenceLog | null> {
  const snap = await db.collection(COL).doc(logId).get();
  if (!snap.exists) return null;
  const log = snap.data() as AdherenceLog;
  if (log.profileId !== profileId) return null;

  const updates: Partial<AdherenceLog> = {
    status,
    notes,
    takenTime: status === 'taken' ? new Date() : undefined,
  };
  await db.collection(COL).doc(logId).update(updates);
  return { ...log, ...updates };
}

/**
 * Get adherence rate for a profile (taken / total scheduled), expressed as a percentage.
 * @param profileId - The profile group ID
 * @param from - Start of the date range (inclusive)
 * @param to - End of the date range (inclusive)
 * @returns Integer percentage (0–100); 0 when no logs exist in range
 */
export async function getAdherenceRate(profileId: string, from: Date, to: Date): Promise<number> {
  const logs = await getAdherenceLogs(profileId, from, to);
  if (logs.length === 0) return 0;
  const taken = logs.filter((l) => l.status === 'taken').length;
  return Math.round((taken / logs.length) * 100);
}
