import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { sendEmail, buildMedicationReminderEmail, buildAppointmentReminderEmail } from './emailService.js';
import type { Medication, Appointment, UserProfile } from '../types/index.js';
import { format, addMinutes } from 'date-fns';

/**
 * Fetch all active user profiles that belong to a given shared profile group.
 * @param profileId - The shared profile group ID
 * @returns Array of active UserProfile documents
 */
async function getProfileUsers(profileId: string): Promise<UserProfile[]> {
  const snap = await db
    .collection('users')
    .where('profileId', '==', profileId)
    .where('isActive', '==', true)
    .get();
  return snap.docs.map((d) => d.data() as UserProfile);
}

/**
 * Check all active medications and send reminder emails for doses scheduled
 * in the upcoming 15-minute window.
 */
async function sendMedicationReminders(): Promise<void> {
  const now = new Date();
  const windowEnd = addMinutes(now, 15);
  const currentTime = format(now, 'HH:mm');
  const windowEndTime = format(windowEnd, 'HH:mm');

  const snap = await db.collection('medications').where('isActive', '==', true).get();

  for (const doc of snap.docs) {
    const med = doc.data() as Medication;
    const dueTime = med.times.find((t) => t >= currentTime && t <= windowEndTime);
    if (!dueTime) continue;

    const users = await getProfileUsers(med.profileId);
    for (const user of users) {
      const emailContent = buildMedicationReminderEmail({
        recipientName: user.name,
        medicationName: med.name,
        dosage: med.dosage,
        scheduledTime: dueTime,
      });
      await sendEmail({ to: user.email, ...emailContent }).catch((err: unknown) =>
        console.error(`[Scheduler] Failed to send med reminder to ${user.email}:`, err),
      );
    }
  }
}

/**
 * Check for upcoming doctor appointments within the next 24 hours that have
 * not yet had a reminder sent, and dispatch reminder emails.
 */
async function sendAppointmentReminders(): Promise<void> {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const snap = await db
    .collection('appointments')
    .where('dateTime', '>=', now)
    .where('dateTime', '<=', tomorrow)
    .where('reminderSent', '==', false)
    .get();

  for (const doc of snap.docs) {
    const apt = doc.data() as Appointment;
    const users = await getProfileUsers(apt.profileId);

    for (const user of users) {
      const emailContent = buildAppointmentReminderEmail({
        recipientName: user.name,
        doctorName: apt.doctorName,
        specialty: apt.specialty ?? 'General Practice',
        dateTime: format(apt.dateTime, 'PPpp'),
        location: apt.location,
      });
      await sendEmail({ to: user.email, ...emailContent }).catch((err: unknown) =>
        console.error(`[Scheduler] Failed to send apt reminder to ${user.email}:`, err),
      );
    }

    // Mark reminder as sent to prevent duplicate emails
    await doc.ref.update({ reminderSent: true });
  }
}

/**
 * Start all scheduled background jobs for the ElderCare platform.
 * - Medication reminders: runs every 15 minutes
 * - Appointment reminders: runs every hour on the hour
 * Call once at application startup.
 */
export function startEmailScheduler(): void {
  // Medication reminders every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    void sendMedicationReminders().catch((err: unknown) =>
      console.error('[Scheduler] Medication reminder job failed:', err),
    );
  });

  // Appointment reminders every hour
  cron.schedule('0 * * * *', () => {
    void sendAppointmentReminders().catch((err: unknown) =>
      console.error('[Scheduler] Appointment reminder job failed:', err),
    );
  });

  console.info('[Scheduler] Email reminder scheduler started');
}
