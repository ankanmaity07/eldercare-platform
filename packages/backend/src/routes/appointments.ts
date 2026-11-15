import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import {
  createAppointment,
  getUpcomingAppointments,
  updateAppointment,
  deleteAppointment,
} from '../services/appointmentService.js';
import type { ApiResponse, Appointment } from '../types/index.js';

/** Express router for appointment CRUD endpoints */
export const appointmentRouter = Router();
appointmentRouter.use(authenticate);

const createAptSchema = z.object({
  doctorName: z.string().min(1).max(200),
  specialty: z.string().max(100).optional(),
  dateTime: z.string().datetime(),
  location: z.string().max(300).optional(),
  notes: z.string().max(500).optional(),
});

const updateAptSchema = createAptSchema.partial();

/**
 * GET /api/appointments — list upcoming appointments (next 30 days) for the authenticated profile.
 */
appointmentRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apts = await getUpcomingAppointments(req.user!.profileId);
    res.json({ success: true, data: apts } as ApiResponse<Appointment[]>);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/appointments — create a new appointment.
 */
appointmentRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createAptSchema.parse(req.body);
    const apt = await createAppointment({
      ...body,
      profileId: req.user!.profileId,
      createdBy: req.user!.userId,
      dateTime: new Date(body.dateTime),
      reminderSent: false,
    });
    res.status(201).json({ success: true, data: apt } as ApiResponse<Appointment>);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/appointments/:id — update an existing appointment.
 */
appointmentRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = updateAptSchema.parse(req.body);
    const apt = await updateAppointment(req.params.id ?? '', req.user!.profileId, {
      ...body,
      dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
    });
    if (!apt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    res.json({ success: true, data: apt } as ApiResponse<Appointment>);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/appointments/:id — permanently delete an appointment.
 */
appointmentRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await deleteAppointment(req.params.id ?? '', req.user!.profileId);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }
    res.json({ success: true, message: 'Appointment removed' } as ApiResponse<never>);
  } catch (err) {
    next(err);
  }
});
