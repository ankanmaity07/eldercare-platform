import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { checkMedicationInteractions, generateHealthInsights } from '../services/geminiService.js';
import { getMedicationsByProfile } from '../services/medicationService.js';
import { getAdherenceRate } from '../services/adherenceService.js';
import { subDays } from 'date-fns';
import type { ApiResponse } from '../types/index.js';

export const geminiRouter = Router();
geminiRouter.use(authenticate);

/** Schema for custom insight input (not currently used in GET, reserved for future POST) */
const _insightSchema = z.object({
  medicationCount: z.number().int().nonnegative(),
  recentMissed: z.number().int().nonnegative(),
  recentTaken: z.number().int().nonnegative(),
});

/** POST /api/gemini/interactions — check medication interactions for the authenticated user's profile */
geminiRouter.post('/interactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meds = await getMedicationsByProfile(req.user!.profileId);
    const result = await checkMedicationInteractions(meds);
    res.json({ success: true, data: result } as ApiResponse<typeof result>);
  } catch (err) { next(err); }
});

/** GET /api/gemini/insights — generate personalized health insights for the authenticated user */
geminiRouter.get('/insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meds = await getMedicationsByProfile(req.user!.profileId);
    const from = subDays(new Date(), 7);
    const to = new Date();
    const adherenceRate = await getAdherenceRate(req.user!.profileId, from, to);

    const insight = await generateHealthInsights({
      adherenceRate,
      medicationCount: meds.length,
      recentMissed: 0, // Will be calculated from actual logs
      recentTaken: 0,
    });
    res.json({ success: true, data: insight } as ApiResponse<typeof insight>);
  } catch (err) { next(err); }
});
