import { describe, it, expect, vi } from 'vitest';

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);
const mockDocGet = vi.fn();

const mockDocRef = {
  id: 'adherence-mock-id',
  set: mockDocSet,
  update: mockDocUpdate,
  get: mockDocGet,
};

const mockQueryGet = vi.fn();
const mockQuery = {
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
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

vi.mock('../config/env.js', () => ({
  env: { NODE_ENV: 'test' },
}));

import {
  logAdherence,
  getAdherenceRate,
  updateAdherenceStatus,
} from '../services/adherenceService.js';
import type { AdherenceLog } from '../types/index.js';

describe('adherenceService', () => {
  it('logs a new adherence event', async () => {
    const scheduled = new Date('2026-03-01T08:00:00Z');
    const log = await logAdherence({
      medicationId: 'med-01',
      profileId: 'group-elder-1',
      userId: 'usr-1',
      scheduledTime: scheduled,
      status: 'taken',
      notes: 'Taken with breakfast',
    });

    expect(log.id).toBe('adherence-mock-id');
    expect(log.status).toBe('taken');
    expect(log.scheduledTime).toEqual(scheduled);
    expect(mockDocSet).toHaveBeenCalled();
  });

  it('calculates correct adherence rate percentages', async () => {
    const sampleLogs: Partial<AdherenceLog>[] = [
      { status: 'taken' },
      { status: 'taken' },
      { status: 'skipped' },
      { status: 'taken' },
    ];

    mockQueryGet.mockResolvedValueOnce({
      docs: sampleLogs.map((l) => ({ data: () => l })),
    });

    const rate = await getAdherenceRate(
      'group-elder-1',
      new Date('2026-01-01'),
      new Date('2026-01-07'),
    );
    expect(rate).toBe(75); // 3 out of 4 taken = 75%
  });

  it('returns 0 adherence rate when no logs exist in period', async () => {
    mockQueryGet.mockResolvedValueOnce({ docs: [] });
    const rate = await getAdherenceRate(
      'group-elder-1',
      new Date('2026-01-01'),
      new Date('2026-01-07'),
    );
    expect(rate).toBe(0);
  });

  it('updates adherence status and sets takenTime when status becomes taken', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        id: 'adherence-mock-id',
        profileId: 'group-elder-1',
        status: 'pending',
      }),
    });

    const updated = await updateAdherenceStatus(
      'adherence-mock-id',
      'group-elder-1',
      'taken',
      'Dose taken via voice logger',
    );

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('taken');
    expect(updated?.takenTime).toBeInstanceOf(Date);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'taken' }),
    );
  });
});
