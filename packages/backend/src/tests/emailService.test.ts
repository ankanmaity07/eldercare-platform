import { describe, it, expect, vi } from 'vitest';

const { mockSendMail } = vi.hoisted(() => ({
  mockSendMail: vi.fn().mockResolvedValue({ messageId: 'msg-mock-123' }),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

vi.mock('../config/env.js', () => ({
  env: {
    GMAIL_USER: 'test-care@gmail.com',
    GMAIL_APP_PASSWORD: 'apppassword1234',
  },
}));

import {
  sendEmail,
  buildMedicationReminderEmail,
  buildAppointmentReminderEmail,
  buildSOSAlertEmail,
} from '../services/emailService.js';

describe('emailService', () => {
  it('builds medication reminder email with proper subject and HTML content', () => {
    const payload = buildMedicationReminderEmail({
      recipientName: 'Robert',
      medicationName: 'Lisinopril',
      dosage: '10mg',
      scheduledTime: '08:00',
    });

    expect(payload.subject).toContain('Lisinopril');
    expect(payload.html).toContain('Robert');
    expect(payload.html).toContain('10mg');
    expect(payload.text).toContain('08:00');
  });

  it('builds appointment reminder email with doctor and location details', () => {
    const payload = buildAppointmentReminderEmail({
      recipientName: 'Robert',
      doctorName: 'House',
      specialty: 'Diagnostics',
      dateTime: 'Monday, March 10 at 10:00 AM',
      location: 'Princeton-Plainsboro',
    });

    expect(payload.subject).toContain('Dr. House');
    expect(payload.html).toContain('Princeton-Plainsboro');
    expect(payload.text).toContain('Diagnostics');
  });

  it('builds emergency SOS alert email', () => {
    const payload = buildSOSAlertEmail({
      patientName: 'Grandma Eleanor',
      timestamp: '2026-03-01 14:22:00',
      location: 'Home - Bedroom',
    });

    expect(payload.subject).toContain('SOS ALERT: Grandma Eleanor');
    expect(payload.html).toContain('EMERGENCY SOS ALERT');
    expect(payload.html).toContain('Home - Bedroom');
  });

  it('sends an email job through the nodemailer transporter', async () => {
    await sendEmail({
      to: 'family@care.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
      text: 'Test',
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'family@care.com',
        subject: 'Test Subject',
      }),
    );
  });
});
