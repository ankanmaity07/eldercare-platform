import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { getAuthUrl, exchangeCodeForTokens, createCalendarEvent } from '../services/calendarService.js';
import { getUpcomingAppointments, updateAppointment } from '../services/appointmentService.js';
import type { ApiResponse } from '../types/index.js';

export const calendarRouter = Router();

/** GET /api/calendar/auth-url — get Google OAuth2 authorization URL */
calendarRouter.get('/auth-url', authenticate, (_req: Request, res: Response) => {
  const url = getAuthUrl();
  res.json({ success: true, data: { url } } as ApiResponse<{ url: string }>);
});

/** GET /api/calendar/callback — handle Google OAuth2 callback and exchange code for tokens */
calendarRouter.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = z.string().min(1).parse(req.query['code']);
    const tokens = await exchangeCodeForTokens(code);
    // In production, store tokens securely in Firestore associated with the user's account
    res.json({ success: true, data: tokens, message: 'Calendar authorized successfully' } as ApiResponse<typeof tokens>);
  } catch (err) { next(err); }
});

/** Validation schema for syncing an appointment to Google Calendar */
const syncSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  appointmentId: z.string().min(1),
});

/** POST /api/calendar/sync — sync an existing appointment to Google Calendar */
calendarRouter.post('/sync', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accessToken, refreshToken, appointmentId } = syncSchema.parse(req.body);
    const appointments = await getUpcomingAppointments(req.user!.profileId);
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    const eventId = await createCalendarEvent(apt, accessToken, refreshToken);
    await updateAppointment(appointmentId, req.user!.profileId, { calendarEventId: eventId });
    res.json({
      success: true,
      data: { eventId },
      message: 'Appointment synced to Google Calendar',
    } as ApiResponse<{ eventId: string }>);
  } catch (err) { next(err); }
});
