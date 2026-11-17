import { describe, it, expect, vi } from 'vitest';

const { mockCronSchedule } = vi.hoisted(() => ({
  mockCronSchedule: vi.fn(),
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: mockCronSchedule,
  },
}));

vi.mock('../config/firebase.js', () => ({
  db: {
    collection: vi.fn(() => ({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    })),
  },
}));

vi.mock('../services/emailService.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildMedicationReminderEmail: vi.fn(() => ({ subject: 'Med Reminder', html: '', text: '' })),
  buildAppointmentReminderEmail: vi.fn(() => ({ subject: 'Apt Reminder', html: '', text: '' })),
}));

import { startEmailScheduler } from '../services/schedulerService.js';

describe('schedulerService', () => {
  it('registers periodic cron jobs for medication and appointment reminders', () => {
    startEmailScheduler();

    expect(mockCronSchedule).toHaveBeenCalledWith(
      '*/15 * * * *',
      expect.any(Function),
    );

    expect(mockCronSchedule).toHaveBeenCalledWith(
      '0 * * * *',
      expect.any(Function),
    );
  });
});
