import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import AppointmentCard from '../components/appointments/AppointmentCard.js';
import type { Appointment } from '../types/index.js';

describe('AppointmentCard component', () => {
  const sampleApt: Appointment = {
    id: 'apt-card-1',
    profileId: 'group-1',
    doctorName: 'Sarah Connor',
    specialty: 'Geriatric Medicine',
    dateTime: '2026-11-20T10:00:00.000Z',
    location: 'Metropolitan Hospital Suite 400',
    notes: 'Bring current blood work and medication list',
    createdBy: 'user-1',
    createdAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:00.000Z',
    reminderSent: false,
  };

  it('renders doctor name, specialty, location, notes, and sync button', () => {
    render(
      <AppointmentCard
        appointment={sampleApt}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSyncCalendar={vi.fn()}
      />,
    );

    expect(screen.getByText('Dr. Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('Geriatric Medicine')).toBeInTheDocument();
    expect(screen.getByText('Metropolitan Hospital Suite 400')).toBeInTheDocument();
    expect(screen.getByText(/Bring current blood work/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sync appointment with Dr\. Sarah Connor to Google Calendar/i })).toBeInTheDocument();
  });

  it('triggers onSyncCalendar when Google Calendar sync button is clicked', () => {
    const handleSync = vi.fn();
    render(
      <AppointmentCard
        appointment={sampleApt}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSyncCalendar={handleSync}
      />,
    );

    const syncButton = screen.getByRole('button', { name: /Sync appointment with Dr\. Sarah Connor to Google Calendar/i });
    fireEvent.click(syncButton);
    expect(handleSync).toHaveBeenCalledWith('apt-card-1');
  });

  it('displays "Synced to Google Calendar" badge if calendarEventId exists', () => {
    const syncedApt: Appointment = {
      ...sampleApt,
      calendarEventId: 'google-event-12345',
    };

    render(
      <AppointmentCard
        appointment={syncedApt}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSyncCalendar={vi.fn()}
      />,
    );

    expect(screen.getByText('Synced to Google Calendar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Sync appointment with Dr\. Sarah Connor to Google Calendar/i })).not.toBeInTheDocument();
  });

  it('triggers onEdit and onDelete callbacks', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <AppointmentCard
        appointment={sampleApt}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSyncCalendar={vi.fn()}
      />,
    );

    const editBtn = screen.getByRole('button', { name: /Edit appointment with Dr\. Sarah Connor/i });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(sampleApt);

    const deleteBtn = screen.getByRole('button', { name: /Delete appointment with Dr\. Sarah Connor/i });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith('apt-card-1');
  });
});
