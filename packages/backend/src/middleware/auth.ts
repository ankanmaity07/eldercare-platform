import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { JWTPayload, UserRole, ApiResponse } from '../types/index.js';

/** Extend Express Request with authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware: validates JWT Bearer token and attaches decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    const response: ApiResponse<never> = { success: false, error: 'Missing or invalid authorization header' };
    res.status(401).json(response);
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (err) {
    const response: ApiResponse<never> = { success: false, error: 'Invalid or expired token' };
    res.status(401).json(response);
  }
}

/**
 * Middleware factory: restricts access to specified roles.
 * @param roles - Allowed user roles
 */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthenticated' } as ApiResponse<never>);
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' } as ApiResponse<never>);
      return;
    }
    next();
  };
}
