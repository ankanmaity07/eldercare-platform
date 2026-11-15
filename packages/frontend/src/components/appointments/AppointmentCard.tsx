import React from 'react';
import { Calendar, MapPin, Trash2, Edit2, ExternalLink, CheckCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/index.js';
import type { Appointment } from '../../types/index.js';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: string) => void;
  onSyncCalendar: (id: string) => void;
  seniorMode?: boolean;
}

/**
 * Appointment card with Google Calendar sync integration.
 */
export default function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  onSyncCalendar,
  seniorMode = false,
}: AppointmentCardProps): JSX.Element {
  return (
    <article
      aria-label={`Appointment with Dr. ${appointment.doctorName} on ${formatDateTime(appointment.dateTime)}`}
      style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: '12px',
        padding: seniorMode ? '24px' : '20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: '5px solid var(--color-secondary)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: seniorMode ? 'var(--font-size-xl)' : 'var(--font-size-lg)',
              color: 'var(--color-text)',
            }}
          >
            Dr. {appointment.doctorName}
          </h3>
          {appointment.specialty && (
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
              }}
            >
              {appointment.specialty}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onEdit(appointment)}
            aria-label={`Edit appointment with Dr. ${appointment.doctorName}`}
            style={{
              background: 'none',
              border: '2px solid var(--color-border)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--color-text)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit2 size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(appointment.id)}
            aria-label={`Delete appointment with Dr. ${appointment.doctorName}`}
            style={{
              background: 'none',
              border: '2px solid var(--color-danger)',
              borderRadius: '8px',
              cursor: 'pointer',
              padding: '8px',
              color: 'var(--color-danger)',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text)',
          }}
        >
          <Calendar size={18} aria-hidden="true" color="var(--color-primary)" />
          <time dateTime={appointment.dateTime} style={{ fontWeight: 600 }}>
            {formatDateTime(appointment.dateTime)}
          </time>
        </div>
        {appointment.location && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
            }}
          >
            <MapPin size={18} aria-hidden="true" />
            <span>{appointment.location}</span>
          </div>
        )}
        {appointment.notes && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
            }}
          >
            Note: {appointment.notes}
          </p>
        )}
      </div>

      {!appointment.calendarEventId ? (
        <button
          type="button"
          onClick={() => onSyncCalendar(appointment.id)}
          aria-label={`Sync appointment with Dr. ${appointment.doctorName} to Google Calendar`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            justifyContent: 'center',
            padding: '10px 16px',
            borderRadius: '8px',
            border: '2px solid #4285f4',
            background: 'rgba(66, 133, 244, 0.08)',
            color: '#1a73e8',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 'var(--font-size-sm)',
            minHeight: '44px',
            marginTop: '8px',
          }}
        >
          <ExternalLink size={16} aria-hidden="true" />
          Sync with Google Calendar
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-success)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            marginTop: '8px',
          }}
        >
          <CheckCircle size={16} aria-hidden="true" />
          <span>Synced to Google Calendar</span>
        </div>
      )}
    </article>
  );
}
