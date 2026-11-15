import { db } from '../config/firebase.js';
import { sendEmail, buildSOSAlertEmail } from './emailService.js';
import { env } from '../config/env.js';
import type { SOSAlert, UserProfile } from '../types/index.js';
import { format } from 'date-fns';

/** Firestore collection name for SOS alerts */
const COL = 'sosAlerts';

/**
 * Trigger an SOS alert and notify all active emergency contacts in the profile.
 * @param params - Trigger parameters including profile, user, and optional location
 * @returns Created SOS alert document
 */
export async function triggerSOS(params: {
  profileId: string;
  triggeredBy: string;
  triggeredByName: string;
  location?: string;
}): Promise<SOSAlert> {
  const now = new Date();
  const ref = db.collection(COL).doc();

  const alert: SOSAlert = {
    id: ref.id,
    profileId: params.profileId,
    triggeredBy: params.triggeredBy,
    location: params.location,
    timestamp: now,
    resolved: false,
  };

  await ref.set(alert);

  // Fetch all active users on this profile to notify
  const usersSnap = await db
    .collection('users')
    .where('profileId', '==', params.profileId)
    .where('isActive', '==', true)
    .get();

  const emailContent = buildSOSAlertEmail({
    patientName: params.triggeredByName,
    timestamp: format(now, 'PPpp'),
    location: params.location,
  });

  const sendPromises: Promise<void>[] = usersSnap.docs.map((d) => {
    const user = d.data() as UserProfile;
    return sendEmail({ to: user.email, ...emailContent }).catch((err: unknown) =>
      console.error(`[SOS] Failed to notify ${user.email}:`, err),
    );
  });

  // Also notify the platform-level SOS alert email if configured
  if (env.SOS_ALERT_EMAIL) {
    sendPromises.push(
      sendEmail({ to: env.SOS_ALERT_EMAIL, ...emailContent }).catch((err: unknown) =>
        console.error('[SOS] Failed to notify SOS email:', err),
      ),
    );
  }

  await Promise.allSettled(sendPromises);
  return alert;
}

/**
 * Resolve an existing SOS alert.
 * @param alertId - Firestore ID of the SOS alert document
 * @param resolvedBy - userId of the person resolving the alert
 * @returns `true` if resolved, `false` if the alert was not found
 */
export async function resolveSOSAlert(alertId: string, resolvedBy: string): Promise<boolean> {
  const snap = await db.collection(COL).doc(alertId).get();
  if (!snap.exists) return false;
  await db.collection(COL).doc(alertId).update({
    resolved: true,
    resolvedAt: new Date(),
    resolvedBy,
  });
  return true;
}
