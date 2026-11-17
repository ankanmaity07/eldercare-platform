import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { AddressInfo } from 'net';

vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'super-secure-jwt-secret-with-at-least-32-chars-length',
    BCRYPT_ROUNDS: 8,
    FRONTEND_URL: '*',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 1000,
  },
}));

// Mock Firebase Admin in integration route tests
const mockUsers = new Map<string, Record<string, unknown>>();
vi.mock('../config/firebase.js', () => ({
  db: {
    collection: vi.fn((colName: string) => ({
      doc: vi.fn((id?: string) => {
        const docId = id ?? 'doc-123';
        return {
          id: docId,
          set: vi.fn(async (data: Record<string, unknown>) => {
            if (colName === 'users') mockUsers.set(docId, data);
          }),
          get: vi.fn(async () => ({
            exists: mockUsers.has(docId),
            id: docId,
            data: () => mockUsers.get(docId),
          })),
        };
      }),
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(async () => {
            const list = Array.from(mockUsers.values());
            return {
              empty: list.length === 0,
              docs: list.map((u) => ({ data: () => u })),
            };
          }),
        })),
        get: vi.fn(async () => ({ docs: [] })),
      })),
    })),
  },
  auth: {},
}));

import app from '../index.js';

describe('HTTP Route Integration Tests', () => {
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  describe('Health check endpoints', () => {
    it('GET /health returns 200 OK with service details', async () => {
      const res = await fetch(`${baseUrl}/health`);
      expect(res.status).toBe(200);

      const data = (await res.json()) as { status: string; service: string };
      expect(data.status).toBe('ok');
      expect(data.service).toContain('ElderCare');
    });

    it('GET /api/health returns 200 OK', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      expect(res.status).toBe(200);
      const data = (await res.json()) as { status: string };
      expect(data.status).toBe('ok');
    });
  });

  describe('Unauthenticated route protection', () => {
    it('rejects GET /api/medications without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/medications`);
      expect(res.status).toBe(401);
      const data = (await res.json()) as { success: boolean; error: string };
      expect(data.success).toBe(false);
      expect(data.error).toContain('authorization header');
    });

    it('rejects GET /api/appointments without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/appointments`);
      expect(res.status).toBe(401);
    });

    it('rejects GET /api/adherence without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/adherence?from=2026-01-01T00:00:00Z&to=2026-01-07T00:00:00Z`);
      expect(res.status).toBe(401);
    });

    it('rejects POST /api/sos/trigger without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/sos/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredByName: 'Elderly Person' }),
      });
      expect(res.status).toBe(401);
    });

    it('rejects POST /api/gemini/interactions without Authorization header with 401', async () => {
      const res = await fetch(`${baseUrl}/api/gemini/interactions`, {
        method: 'POST',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Auth Validation', () => {
    it('rejects registration with non-numeric passcode with 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice',
          email: 'alice@care.com',
          passcode: 'abcdef', // invalid non-numeric
          role: 'elderly',
          profileId: 'group-1',
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as { success: boolean; error: string };
      expect(data.success).toBe(false);
    });

    it('rejects registration with invalid email with 400', async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Alice',
          email: 'not-an-email',
          passcode: '123456',
          role: 'elderly',
          profileId: 'group-1',
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});
