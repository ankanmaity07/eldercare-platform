import { describe, it, expect, vi } from 'vitest';

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);
const mockDocGet = vi.fn();

const mockDocRef = {
  id: 'med-mock-id',
  set: mockDocSet,
  update: mockDocUpdate,
  get: mockDocGet,
};

const mockQueryGet = vi.fn();
const mockQuery = {
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
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
  createMedication,
  getMedicationsByProfile,
  getMedicationById,
  deleteMedication,
} from '../services/medicationService.js';
import type { Medication } from '../types/index.js';

describe('medicationService', () => {
  const sampleMedData: Omit<Medication, 'id' | 'createdAt' | 'updatedAt'> = {
    profileId: 'group-101',
    name: 'Atorvastatin',
    dosage: '20mg',
    frequency: 'Once daily at bedtime',
    times: ['21:00'],
    startDate: new Date('2026-01-01'),
    isActive: true,
    createdBy: 'care-user-1',
  };

  it('creates medication with id and timestamps', async () => {
    const created = await createMedication(sampleMedData);
    expect(created.id).toBe('med-mock-id');
    expect(created.name).toBe('Atorvastatin');
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(mockDocSet).toHaveBeenCalled();
  });

  it('fetches medications by profile ID', async () => {
    const fakeMed: Medication = {
      ...sampleMedData,
      id: 'med-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockQueryGet.mockResolvedValueOnce({
      docs: [{ data: () => fakeMed }],
    });

    const result = await getMedicationsByProfile('group-101');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Atorvastatin');
  });

  it('returns null if medication does not exist or profile mismatch', async () => {
    mockDocGet.mockResolvedValueOnce({ exists: false });
    const notFound = await getMedicationById('missing-id', 'group-101');
    expect(notFound).toBeNull();

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleMedData, profileId: 'different-group' }),
    });
    const unauthorized = await getMedicationById('med-1', 'group-101');
    expect(unauthorized).toBeNull();
  });

  it('soft-deletes medication by setting isActive to false', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleMedData, id: 'med-mock-id', profileId: 'group-101' }),
    });

    const success = await deleteMedication('med-mock-id', 'group-101');
    expect(success).toBe(true);
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});
