import { describe, it, expect, vi } from 'vitest';

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);
const mockDocGet = vi.fn();

const mockDocRef = {
  id: 'sos-mock-id',
  set: mockDocSet,
  update: mockDocUpdate,
  get: mockDocGet,
};

const mockQueryGet = vi.fn();
const mockQuery = {
  where: vi.fn().mockReturnThis(),
  get: mockQueryGet,
};

vi.mock('../config/firebase.js', () => ({
  db: {
    collection: vi.fn(() => ({
      doc: vi.fn(() => mockDocRef),
      where: vi.fn(() => mockQuery),
    })),
  },
}));

const mockSendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/emailService.js', () => ({
  sendEmail: vi.fn((args: unknown) => mockSendEmail(args)),
  buildSOSAlertEmail: vi.fn(() => ({
    subject: 'EMERGENCY SOS ALERT',
    html: '<p>SOS</p>',
    text: 'SOS',
  })),
}));

vi.mock('../config/env.js', () => ({
  env: {
    SOS_ALERT_EMAIL: 'emergency-dispatch@care.com',
    NODE_ENV: 'test',
  },
}));

import { triggerSOS, resolveSOSAlert } from '../services/sosService.js';
import type { UserProfile } from '../types/index.js';

describe('sosService', () => {
  it('triggers an SOS alert, saves record in Firestore, and sends emergency emails', async () => {
    const mockUsers: Partial<UserProfile>[] = [
      { email: 'caretaker@care.com', name: 'John Caretaker' },
      { email: 'daughter@family.com', name: 'Alice Daughter' },
    ];

    mockQueryGet.mockResolvedValueOnce({
      docs: mockUsers.map((u) => ({ data: () => u })),
    });

    const alert = await triggerSOS({
      profileId: 'group-elder-1',
      triggeredBy: 'elderly-user-1',
      triggeredByName: 'Grandpa Frank',
      location: 'Living Room',
    });

    expect(alert.id).toBe('sos-mock-id');
    expect(alert.profileId).toBe('group-elder-1');
    expect(alert.resolved).toBe(false);
    expect(alert.location).toBe('Living Room');
    expect(mockDocSet).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it('resolves an active SOS alert', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ id: 'sos-mock-id', resolved: false }),
    });

    const success = await resolveSOSAlert('sos-mock-id', 'caretaker-user-1');
    expect(success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        resolved: true,
        resolvedBy: 'caretaker-user-1',
      }),
    );
  });

  it('returns false when trying to resolve a non-existent SOS alert', async () => {
    mockDocGet.mockResolvedValueOnce({ exists: false });
    const success = await resolveSOSAlert('non-existent-alert', 'caretaker-1');
    expect(success).toBe(false);
  });
});
