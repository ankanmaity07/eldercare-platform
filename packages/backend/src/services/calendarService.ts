import { google } from 'googleapis';
import { env } from '../config/env.js';
import type { Appointment } from '../types/index.js';

/**
 * Generate Google OAuth2 authorization URL.
 * @returns URL for user to authorize Google Calendar access
 */
export function getAuthUrl(): string {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI,
  );
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens.
 * @param code - OAuth2 authorization code from Google callback
 * @returns Access and refresh tokens
 */
export async function exchangeCodeForTokens(
  code: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI,
  );
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to retrieve tokens from Google');
  }
  return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
}

/**
 * Create a Google Calendar event for an appointment.
 * @param appointment - Appointment data to sync
 * @param accessToken - User's Google OAuth2 access token
 * @param refreshToken - User's Google OAuth2 refresh token
 * @returns Created Google Calendar event ID
 */
export async function createCalendarEvent(
  appointment: Appointment,
  accessToken: string,
  refreshToken: string,
): Promise<string> {
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CALENDAR_CLIENT_ID,
    env.GOOGLE_CALENDAR_CLIENT_SECRET,
    env.GOOGLE_CALENDAR_REDIRECT_URI,
  );
  oauth2Client.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Default appointment duration: 1 hour
  const endTime = new Date(appointment.dateTime.getTime() + 60 * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Doctor Appointment: Dr. ${appointment.doctorName}`,
      description: `${appointment.specialty ?? ''}\n${appointment.notes ?? ''}`.trim(),
      location: appointment.location ?? undefined,
      start: { dateTime: appointment.dateTime.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endTime.toISOString(), timeZone: 'UTC' },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    },
  });

  const eventId = res.data?.id;
  if (!eventId) throw new Error('Failed to create Calendar event');
  return eventId;
}
