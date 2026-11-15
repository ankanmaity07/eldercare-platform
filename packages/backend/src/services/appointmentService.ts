import { db } from '../config/firebase.js';
import type { Appointment } from '../types/index.js';

const COL = 'appointments';

/**
 * Create a new appointment.
 * @param data - Appointment fields excluding auto-generated id and timestamps
 * @returns The newly created Appointment document
 */
export async function createAppointment(
  data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Appointment> {
  const now = new Date();
  const ref = db.collection(COL).doc();
  const apt: Appointment = { ...data, id: ref.id, createdAt: now, updatedAt: now };
  await ref.set(apt);
  return apt;
}

/**
 * Get upcoming appointments for a profile (next 30 days by default).
 * @param profileId - The profile group ID
 * @returns Array of Appointment documents ordered by dateTime ascending
 */
export async function getUpcomingAppointments(profileId: string): Promise<Appointment[]> {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const snap = await db
    .collection(COL)
    .where('profileId', '==', profileId)
    .where('dateTime', '>=', now)
    .where('dateTime', '<=', future)
    .orderBy('dateTime', 'asc')
    .get();
  return snap.docs.map((d) => d.data() as Appointment);
}

/**
 * Update an appointment.
 * @param id - Firestore document ID of the appointment
 * @param profileId - The profile group ID of the requesting user
 * @param updates - Partial appointment fields to update
 * @returns Updated Appointment, or null if not found or unauthorized
 */
export async function updateAppointment(
  id: string,
  profileId: string,
  updates: Partial<Omit<Appointment, 'id' | 'profileId' | 'createdAt' | 'createdBy'>>,
): Promise<Appointment | null> {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return null;
  const apt = snap.data() as Appointment;
  if (apt.profileId !== profileId) return null;
  const now = new Date();
  await db.collection(COL).doc(id).update({ ...updates, updatedAt: now });
  return { ...apt, ...updates, updatedAt: now };
}

/**
 * Delete an appointment permanently.
 * @param id - Firestore document ID of the appointment
 * @param profileId - The profile group ID of the requesting user
 * @returns true if deleted, false if not found or unauthorized
 */
export async function deleteAppointment(id: string, profileId: string): Promise<boolean> {
  const snap = await db.collection(COL).doc(id).get();
  if (!snap.exists) return false;
  const apt = snap.data() as Appointment;
  if (apt.profileId !== profileId) return false;
  await db.collection(COL).doc(id).delete();
  return true;
}
