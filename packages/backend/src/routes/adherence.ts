import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  logAdherence,
  getAdherenceLogs,
  updateAdherenceStatus,
  getAdherenceRate,
} from '../services/adherenceService.js';
import type { ApiResponse, AdherenceLog } from '../types/index.js';

/** Express router for adherence log endpoints */
export const adherenceRouter = Router();
adherenceRouter.use(authenticate);

const logSchema = z.object({
  medicationId: z.string().min(1),
  scheduledTime: z.string().datetime(),
  status: z.enum(['taken', 'skipped', 'missed', 'pending']),
  notes: z.string().max(500).optional(),
  takenTime: z.string().datetime().optional(),
});

const dateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

const updateStatusSchema = z.object({
  status: z.enum(['taken', 'skipped', 'missed', 'pending']),
  notes: z.string().max(500).optional(),
});

/**
 * POST /api/adherence — log a dose adherence event.
 */
adherenceRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = logSchema.parse(req.body);
    const log = await logAdherence({
      ...body,
      profileId: req.user!.profileId,
      userId: req.user!.userId,
      scheduledTime: new Date(body.scheduledTime),
      takenTime: body.takenTime ? new Date(body.takenTime) : undefined,
    });
    res.status(201).json({ success: true, data: log } as ApiResponse<AdherenceLog>);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/adherence?from=&to= — retrieve adherence logs within a date range.
 */
adherenceRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = dateRangeSchema.parse({
      from: req.query['from'],
      to: req.query['to'],
    });
    const logs = await getAdherenceLogs(req.user!.profileId, new Date(from), new Date(to));
    res.json({ success: true, data: logs } as ApiResponse<AdherenceLog[]>);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/adherence/rate?from=&to= — get adherence rate percentage for a date range.
 * NOTE: This route must be declared before /:id to avoid route shadowing.
 */
adherenceRouter.get('/rate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to } = dateRangeSchema.parse({
      from: req.query['from'],
      to: req.query['to'],
    });
    const rate = await getAdherenceRate(req.user!.profileId, new Date(from), new Date(to));
    res.json({ success: true, data: { rate } } as ApiResponse<{ rate: number }>);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/adherence/:id — update the status of an adherence log entry.
 */
adherenceRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = updateStatusSchema.parse(req.body);
    const log = await updateAdherenceStatus(
      req.params.id ?? '',
      req.user!.profileId,
      status,
      notes,
    );
    if (!log) {
      res.status(404).json({ success: false, error: 'Log not found' });
      return;
    }
    res.json({ success: true, data: log } as ApiResponse<AdherenceLog>);
  } catch (err) {
    next(err);
  }
});
