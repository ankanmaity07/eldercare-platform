import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../types/index.js';

/** Global error handling middleware */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ErrorHandler]', err);

  if (err instanceof ZodError) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Validation error',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
    };
    res.status(400).json(response);
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ success: false, error: err.message } as ApiResponse<never>);
    return;
  }

  res.status(500).json({ success: false, error: 'Internal server error' } as ApiResponse<never>);
}
