import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  createMedication,
  getMedicationsByProfile,
  getMedicationById,
  updateMedication,
  deleteMedication,
} from '../services/medicationService.js';
import type { ApiResponse, Medication } from '../types/index.js';

/** Express router for medication CRUD endpoints */
export const medicationRouter = Router();
medicationRouter.use(authenticate);

const createMedSchema = z.object({
  name: z.string().min(1).max(200),
  dosage: z.string().min(1).max(100),
  frequency: z.string().min(1).max(100),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  instructions: z.string().max(500).optional(),
  prescribedBy: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

const updateMedSchema = createMedSchema.partial();

/**
 * GET /api/medications — list all active medications for the authenticated profile.
 */
medicationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meds = await getMedicationsByProfile(req.user!.profileId);
    res.json({ success: true, data: meds } as ApiResponse<Medication[]>);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/medications — create a new medication entry.
 */
medicationRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createMedSchema.parse(req.body);
    const med = await createMedication({
      ...body,
      profileId: req.user!.profileId,
      createdBy: req.user!.userId,
      isActive: true,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
    res.status(201).json({ success: true, data: med } as ApiResponse<Medication>);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/medications/:id — get a single medication by ID.
 */
medicationRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const med = await getMedicationById(req.params.id ?? '', req.user!.profileId);
    if (!med) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, data: med } as ApiResponse<Medication>);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/medications/:id — update a medication entry.
 */
medicationRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateMedSchema.parse(req.body);
    const med = await updateMedication(req.params.id ?? '', req.user!.profileId, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
    if (!med) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, data: med } as ApiResponse<Medication>);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/medications/:id — soft-delete a medication (sets isActive = false).
 */
medicationRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await deleteMedication(req.params.id ?? '', req.user!.profileId);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Medication not found' });
      return;
    }
    res.json({ success: true, message: 'Medication removed' } as ApiResponse<never>);
  } catch (err) {
    next(err);
  }
});
