import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, loginUser } from '../services/authService.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import type { ApiResponse } from '../types/index.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  passcode: z.string().min(6).max(20).regex(/^\d+$/, 'Passcode must be numeric'),
  role: z.enum(['elderly', 'caretaker', 'family']),
  profileId: z.string().min(4).max(50).regex(/^[a-zA-Z0-9-_]+$/),
  phone: z.string().optional(),
  emergencyContact: z.string().email().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  passcode: z.string().min(6).max(20),
});

/**
 * POST /api/auth/register
 * Register a new user with passcode authentication.
 */
authRouter.post('/register', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    const response: ApiResponse<typeof result> = { success: true, data: result, message: 'Registration successful' };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT.
 */
authRouter.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    const response: ApiResponse<typeof result> = { success: true, data: result, message: 'Login successful' };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
});
