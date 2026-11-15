import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import type { EmailJob } from '../types/index.js';

/** Nodemailer transporter (Gmail SMTP with App Password) */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email notification via Gmail SMTP.
 * @param job - EmailJob containing recipient address, subject, and HTML/text content
 * @returns Promise that resolves when the email has been accepted by the SMTP server
 */
export async function sendEmail(job: EmailJob): Promise<void> {
  await transporter.sendMail({
    from: `"ElderCare Reminders" <${env.GMAIL_USER}>`,
    to: job.to,
    subject: job.subject,
    html: job.html,
    text: job.text,
  });
}

/**
 * Build a medication reminder email payload.
 * @param params.recipientName - Display name of the email recipient
 * @param params.medicationName - Name of the medication to be taken
 * @param params.dosage - Dosage string (e.g. "10mg")
 * @param params.scheduledTime - HH:mm formatted scheduled time string
 * @returns Partial EmailJob with subject, html, and text fields
 */
export function buildMedicationReminderEmail(params: {
  recipientName: string;
  medicationName: string;
  dosage: string;
  scheduledTime: string;
}): Pick<EmailJob, 'subject' | 'html' | 'text'> {
  return {
    subject: `💊 Medication Reminder: ${params.medicationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 8px;">
        <h1 style="color: #1a3a5c; font-size: 24px;">Medication Reminder</h1>
        <p style="font-size: 18px; color: #333;">Hello ${params.recipientName},</p>
        <div style="background: #fff; border-left: 4px solid #1a3a5c; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="font-size: 20px; font-weight: bold; color: #1a3a5c; margin: 0;">${params.medicationName}</p>
          <p style="font-size: 16px; color: #555; margin: 8px 0 0;">Dosage: ${params.dosage}</p>
          <p style="font-size: 16px; color: #555; margin: 4px 0 0;">Time: ${params.scheduledTime}</p>
        </div>
        <p style="font-size: 16px; color: #555;">Please take your medication as scheduled. Log it in the ElderCare app after taking.</p>
        <footer style="margin-top: 24px; font-size: 14px; color: #888;">ElderCare Platform — Keeping you healthy</footer>
      </div>
    `,
    text: `Medication Reminder: ${params.medicationName} (${params.dosage}) at ${params.scheduledTime}. Please take as scheduled.`,
  };
}

/**
 * Build an appointment reminder email payload.
 * @param params.recipientName - Display name of the email recipient
 * @param params.doctorName - Name of the doctor for the appointment
 * @param params.specialty - Doctor's medical specialty
 * @param params.dateTime - Human-readable date/time string for the appointment
 * @param params.location - Optional clinic or hospital location
 * @returns Partial EmailJob with subject, html, and text fields
 */
export function buildAppointmentReminderEmail(params: {
  recipientName: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  location?: string;
}): Pick<EmailJob, 'subject' | 'html' | 'text'> {
  return {
    subject: `📅 Appointment Reminder: Dr. ${params.doctorName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8f9fa; border-radius: 8px;">
        <h1 style="color: #1a3a5c; font-size: 24px;">Upcoming Appointment</h1>
        <p style="font-size: 18px; color: #333;">Hello ${params.recipientName},</p>
        <div style="background: #fff; border-left: 4px solid #2d6a4f; padding: 16px; margin: 16px 0; border-radius: 4px;">
          <p style="font-size: 20px; font-weight: bold; color: #2d6a4f; margin: 0;">Dr. ${params.doctorName}</p>
          <p style="font-size: 16px; color: #555; margin: 8px 0 0;">${params.specialty}</p>
          <p style="font-size: 16px; color: #555; margin: 4px 0 0;">📅 ${params.dateTime}</p>
          ${params.location ? `<p style="font-size: 16px; color: #555; margin: 4px 0 0;">📍 ${params.location}</p>` : ''}
        </div>
        <footer style="margin-top: 24px; font-size: 14px; color: #888;">ElderCare Platform</footer>
      </div>
    `,
    text: `Appointment Reminder: Dr. ${params.doctorName} (${params.specialty}) on ${params.dateTime}${params.location ? ` at ${params.location}` : ''}.`,
  };
}

/**
 * Build an SOS alert email for emergency contacts.
 * @param params.patientName - Name of the patient who triggered the SOS
 * @param params.timestamp - Human-readable timestamp of the SOS event
 * @param params.location - Optional last-known location string
 * @returns Partial EmailJob with subject, html, and text fields
 */
export function buildSOSAlertEmail(params: {
  patientName: string;
  timestamp: string;
  location?: string;
}): Pick<EmailJob, 'subject' | 'html' | 'text'> {
  return {
    subject: `🚨 SOS ALERT: ${params.patientName} needs help!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #fff3cd; border: 2px solid #dc3545; border-radius: 8px;">
        <h1 style="color: #dc3545; font-size: 28px;">🚨 EMERGENCY SOS ALERT</h1>
        <p style="font-size: 20px; font-weight: bold; color: #dc3545;">${params.patientName} has triggered an SOS alert!</p>
        <p style="font-size: 16px;">Time: ${params.timestamp}</p>
        ${params.location ? `<p style="font-size: 16px;">Location: ${params.location}</p>` : ''}
        <p style="font-size: 18px; font-weight: bold; color: #333;">Please contact them immediately or call emergency services.</p>
      </div>
    `,
    text: `SOS ALERT: ${params.patientName} has triggered an emergency alert at ${params.timestamp}. Please contact them immediately.`,
  };
}
