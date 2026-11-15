import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'super-secure-jwt-secret-with-at-least-32-chars-length',
    BCRYPT_ROUNDS: 8,
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_PRIVATE_KEY: 'test-private-key',
    FIREBASE_CLIENT_EMAIL: 'test@project.iam.gserviceaccount.com',
    FIREBASE_DATABASE_URL: 'https://test-project.firebaseio.com',
    NODE_ENV: 'test',
  },
}));

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocRef = { id: 'user-mock-id', set: mockDocSet };
const mockDocFn = vi.fn().mockReturnValue(mockDocRef);
const mockWhereGet = vi.fn();
const mockLimitGet = vi.fn();
const mockWhereChain = {
  limit: vi.fn().mockReturnValue({ get: mockLimitGet }),
  where: vi.fn().mockReturnThis(),
  get: mockWhereGet,
};

vi.mock('../config/firebase.js', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnValue(mockWhereChain),
      doc: mockDocFn,
    })),
  },
  auth: {},
}));

import { hashPasscode, verifyPasscode, signToken, registerUser } from '../services/authService.js';
import type { UserProfile } from '../types/index.js';

describe('authService', () => {
  describe('hashPasscode & verifyPasscode', () => {
    it('should hash a numeric passcode with bcrypt and verify it matches', async () => {
      const passcode = '123456';
      const hash = await hashPasscode(passcode);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(passcode);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await verifyPasscode(passcode, hash);
      expect(isValid).toBe(true);
    });

    it('should fail verification when an incorrect passcode is supplied', async () => {
      const passcode = '654321';
      const hash = await hashPasscode(passcode);
      const isMatch = await verifyPasscode('000000', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('signToken', () => {
    it('should generate a valid JWT string containing expected claims', () => {
      const testUser: UserProfile = {
        id: 'usr-1',
        name: 'Eleanor Vance',
        email: 'eleanor@example.com',
        role: 'elderly',
        profileId: 'family-profile-01',
        passcodeHash: 'hash-value',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      const token = signToken(testUser);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('registerUser', () => {
    it('should register a new user and return token + safe user object without passcodeHash', async () => {
      mockLimitGet.mockResolvedValueOnce({ empty: true });

      const result = await registerUser({
        name: 'Grandma Mary',
        email: 'mary@care.com',
        passcode: '889900',
        role: 'elderly',
        profileId: 'group-mary-1',
      });

      expect(result.token).toBeDefined();
      expect(result.user.name).toBe('Grandma Mary');
      expect(result.user.email).toBe('mary@care.com');
      expect(result.user.role).toBe('elderly');
      expect((result.user as unknown as Record<string, unknown>)['passcodeHash']).toBeUndefined();
      expect(mockDocSet).toHaveBeenCalled();
    });
  });
});
