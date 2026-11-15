import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { triggerSOS, resolveSOSAlert } from '../services/sosService.js';
import type { ApiResponse, SOSAlert } from '../types/index.js';

export const sosRouter = Router();
sosRouter.use(authenticate);

/** Validation schema for the SOS trigger request body */
const triggerSchema = z.object({
  location: z.string().max(300).optional(),
  triggeredByName: z.string().min(1).max(100),
});

/** POST /api/sos/trigger — one-tap SOS alert, rate-limited to prevent abuse */
sosRouter.post('/trigger', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, triggeredByName } = triggerSchema.parse(req.body);
    const alert = await triggerSOS({
      profileId: req.user!.profileId,
      triggeredBy: req.user!.userId,
      triggeredByName,
      location,
    });
    res.status(201).json({
      success: true,
      data: alert,
      message: 'SOS alert sent to all emergency contacts',
    } as ApiResponse<SOSAlert>);
  } catch (err) { next(err); }
});

/** PATCH /api/sos/:id/resolve — mark an SOS alert as resolved */
sosRouter.patch('/:id/resolve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await resolveSOSAlert(req.params['id'] ?? '', req.user!.userId);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }
    res.json({ success: true, message: 'SOS alert resolved' } as ApiResponse<never>);
  } catch (err) { next(err); }
});
