import { describe, it, expect, vi } from 'vitest';

const mockDocSet = vi.fn().mockResolvedValue(undefined);
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);
const mockDocDelete = vi.fn().mockResolvedValue(undefined);
const mockDocGet = vi.fn();

const mockDocRef = {
  id: 'apt-mock-id',
  set: mockDocSet,
  update: mockDocUpdate,
  delete: mockDocDelete,
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
  createAppointment,
  getUpcomingAppointments,
  updateAppointment,
  deleteAppointment,
} from '../services/appointmentService.js';
import type { Appointment } from '../types/index.js';

describe('appointmentService', () => {
  const sampleAptData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> = {
    profileId: 'group-elder-1',
    doctorName: 'Dr. Sarah Connor',
    specialty: 'Geriatric Cardiology',
    dateTime: new Date('2026-12-01T10:00:00Z'),
    location: 'Metropolitan Hospital Suite 400',
    notes: 'Bring current medication list and blood pressure records',
    createdBy: 'caregiver-1',
    reminderSent: false,
  };

  it('creates an appointment with auto-generated id and timestamps', async () => {
    const apt = await createAppointment(sampleAptData);
    expect(apt.id).toBe('apt-mock-id');
    expect(apt.doctorName).toBe('Dr. Sarah Connor');
    expect(apt.createdAt).toBeInstanceOf(Date);
    expect(apt.updatedAt).toBeInstanceOf(Date);
    expect(mockDocSet).toHaveBeenCalled();
  });

  it('retrieves upcoming appointments for a profile group', async () => {
    const fakeApt: Appointment = {
      ...sampleAptData,
      id: 'apt-mock-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockQueryGet.mockResolvedValueOnce({
      docs: [{ data: () => fakeApt }],
    });

    const list = await getUpcomingAppointments('group-elder-1');
    expect(list).toHaveLength(1);
    expect(list[0]?.doctorName).toBe('Dr. Sarah Connor');
  });

  it('updates an appointment if document exists and profile matches', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleAptData, id: 'apt-mock-id', profileId: 'group-elder-1' }),
    });

    const updated = await updateAppointment('apt-mock-id', 'group-elder-1', {
      doctorName: 'Dr. Sarah Connor-Smith',
      location: 'Suite 500',
    });

    expect(updated).not.toBeNull();
    expect(updated?.doctorName).toBe('Dr. Sarah Connor-Smith');
    expect(updated?.location).toBe('Suite 500');
    expect(mockDocUpdate).toHaveBeenCalled();
  });

  it('returns null when updating appointment with profile mismatch or non-existent document', async () => {
    mockDocGet.mockResolvedValueOnce({ exists: false });
    const notFound = await updateAppointment('non-existent', 'group-elder-1', { doctorName: 'Test' });
    expect(notFound).toBeNull();

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleAptData, profileId: 'different-group' }),
    });
    const unauthorized = await updateAppointment('apt-mock-id', 'group-elder-1', { doctorName: 'Test' });
    expect(unauthorized).toBeNull();
  });

  it('deletes an appointment when authorized', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleAptData, id: 'apt-mock-id', profileId: 'group-elder-1' }),
    });

    const success = await deleteAppointment('apt-mock-id', 'group-elder-1');
    expect(success).toBe(true);
    expect(mockDocDelete).toHaveBeenCalled();
  });

  it('returns false when deleting appointment that does not exist or profile mismatches', async () => {
    mockDocGet.mockResolvedValueOnce({ exists: false });
    const notFound = await deleteAppointment('missing', 'group-elder-1');
    expect(notFound).toBe(false);

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ ...sampleAptData, profileId: 'other-profile' }),
    });
    const unauthorized = await deleteAppointment('apt-mock-id', 'group-elder-1');
    expect(unauthorized).toBe(false);
  });
});
