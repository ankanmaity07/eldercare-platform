import { db } from '../config/firebase.js';
import type { Medication, PaginationParams } from '../types/index.js';

const COL = 'medications';

/** Create indexes hint (enforced via firestore.indexes.json — see docs) */

/**
 * Create a new medication entry in Firestore.
 * Indexed on: profileId, isActive, createdAt
 * @param data - Medication fields excluding auto-generated id and timestamps
 * @returns The newly created Medication document
 */
export async function createMedication(
  data: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Medication> {
  const now = new Date();
  const ref = db.collection(COL).doc();
  const med: Medication = { ...data, id: ref.id, createdAt: now, updatedAt: now };
  await ref.set(med);
  return med;
}

/**
 * Fetch all active medications for a profile.
 * @param profileId - The profile group ID
 * @param params - Optional pagination parameters
 * @returns Array of active Medication documents ordered by createdAt desc
 */
export async function getMedicationsByProfile(
  profileId: string,
  params?: PaginationParams,
): Promise<Medication[]> {
  let query = db
    .collection(COL)
    .where('profileId', '==', profileId)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc');

  if (params?.limit) query = query.limit(params.limit) as typeof query;
  const snap = await query.get();
  return snap.docs.map((d) => d.data() as Medication);
}

/**
 * Get a single medication by ID, with profile ownership check.
 * @param id - Firestore document ID of the medication
 * @param profileId - The profile group ID of the requesting user
 * @returns The Medication, or null if not found or unauthorized
 */
export async function getMedicationById(id: string, profileId: string): Promise<Medication | null> {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  const med = snap.data() as Medication;
  if (med.profileId !== profileId) return null;
  return med;
}

/**
 * Update a medication entry.
 * @param id - Firestore document ID of the medication
 * @param profileId - The profile group ID of the requesting user
 * @param updates - Partial medication fields to update
 * @returns Updated Medication, or null if not found or unauthorized
 */
export async function updateMedication(
  id: string,
  profileId: string,
  updates: Partial<Omit<Medication, 'id' | 'profileId' | 'createdAt' | 'createdBy'>>,
): Promise<Medication | null> {
  const existing = await getMedicationById(id, profileId);
  if (!existing) return null;
  const now = new Date();
  await db.collection(COL).doc(id).update({ ...updates, updatedAt: now });
  return { ...existing, ...updates, updatedAt: now };
}

/**
 * Soft-delete a medication (set isActive = false).
 * @param id - Firestore document ID of the medication
 * @param profileId - The profile group ID of the requesting user
 * @returns true if deleted, false if not found or unauthorized
 */
export async function deleteMedication(id: string, profileId: string): Promise<boolean> {
  const existing = await getMedicationById(id, profileId);
  if (!existing) return false;
  await db.collection(COL).doc(id).update({ isActive: false, updatedAt: new Date() });
  return true;
}
