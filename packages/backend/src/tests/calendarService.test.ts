import { describe, it, expect, vi } from 'vitest';

const mockGenerateAuthUrl = vi.fn().mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?client_id=mock');
const mockGetToken = vi.fn().mockResolvedValue({
  tokens: { access_token: 'mock-access-token', refresh_token: 'mock-refresh-token' },
});
const mockSetCredentials = vi.fn();
const mockInsertEvent = vi.fn().mockResolvedValue({ data: { id: 'calendar-event-id-999' } });

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        generateAuthUrl: mockGenerateAuthUrl,
        getToken: mockGetToken,
        setCredentials: mockSetCredentials,
      })),
    },
    calendar: vi.fn(() => ({
      events: {
        insert: mockInsertEvent,
      },
    })),
  },
}));

vi.mock('../config/env.js', () => ({
  env: {
    GOOGLE_CALENDAR_CLIENT_ID: 'mock-client-id',
    GOOGLE_CALENDAR_CLIENT_SECRET: 'mock-client-secret',
    GOOGLE_CALENDAR_REDIRECT_URI: 'http://localhost:3001/api/calendar/callback',
    NODE_ENV: 'test',
  },
}));

import {
  getAuthUrl,
  exchangeCodeForTokens,
  createCalendarEvent,
} from '../services/calendarService.js';
import type { Appointment } from '../types/index.js';

describe('calendarService', () => {
  it('generates a Google OAuth2 authorization URL with calendar scope', () => {
    const url = getAuthUrl();
    expect(url).toContain('https://accounts.google.com/o/oauth2');
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
      }),
    );
  });

  it('exchanges OAuth2 authorization code for access and refresh tokens', async () => {
    const tokens = await exchangeCodeForTokens('auth-code-12345');
    expect(tokens.accessToken).toBe('mock-access-token');
    expect(tokens.refreshToken).toBe('mock-refresh-token');
    expect(mockGetToken).toHaveBeenCalledWith('auth-code-12345');
  });

  it('throws an error if token exchange fails to return both tokens', async () => {
    mockGetToken.mockResolvedValueOnce({ tokens: { access_token: 'only-access' } });
    await expect(exchangeCodeForTokens('bad-code')).rejects.toThrow('Failed to retrieve tokens');
  });

  it('creates a Google Calendar event for an appointment with reminders', async () => {
    const sampleAppointment: Appointment = {
      id: 'apt-1',
      profileId: 'group-elder-1',
      doctorName: 'Gregory House',
      specialty: 'Nephrology',
      dateTime: new Date('2026-11-20T14:30:00Z'),
      location: 'Clinic Suite 2B',
      notes: 'BUN and creatinine review',
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      reminderSent: false,
    };

    const eventId = await createCalendarEvent(
      sampleAppointment,
      'mock-access-token',
      'mock-refresh-token',
    );

    expect(eventId).toBe('calendar-event-id-999');
    expect(mockSetCredentials).toHaveBeenCalledWith({
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
    });
    expect(mockInsertEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        calendarId: 'primary',
        requestBody: expect.objectContaining({
          summary: 'Doctor Appointment: Dr. Gregory House',
          location: 'Clinic Suite 2B',
        }),
      }),
    );
  });
});
