import React from 'react';
import { Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';
import type { Medication, AdherenceStatus } from '../../types/index.js';

interface MedicationCardProps {
  medication: Medication;
  onEdit: (med: Medication) => void;
  onDelete: (id: string) => void;
  onLogAdherence: (medId: string, scheduledTime: string, status: AdherenceStatus) => void;
  seniorMode?: boolean;
}

/**
 * Medication card with dose logging controls.
 * Large touch targets and high-contrast colors for elderly accessibility.
 */
export default function MedicationCard({
  medication,
  onEdit,
  onDelete,
  onLogAdherence,
  seniorMode = false,
}: MedicationCardProps): JSX.Element {
  return (
    <article
      aria-label={`Medication: ${medication.name}`}
      style={{
        background: 'var(--color-surface)',
        border: `2px solid ${medication.color ?? 'var(--color-border)'}`,
        borderRadius: '12px',
        padding: seniorMode ? '24px' : '20px',
        boxShadow: 'var(--shadow)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: seniorMode ? 'var(--font-size-xl)' : 'var(--font-size-lg)',
              color: 'var(--color-text)',
            }}
          >
            {medication.name}
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              color: 'var(--color-text-muted)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {medication.dosage} · {medication.frequency}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onEdit(medication)}
            aria-label={`Edit ${medication.name}`}
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
            onClick={() => onDelete(medication.id)}
            aria-label={`Remove ${medication.name}`}
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

      {/* Schedule times */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <Clock size={16} aria-hidden="true" color="var(--color-text-muted)" />
        {medication.times.map((time) => (
          <span
            key={time}
            style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
            }}
          >
            {time}
          </span>
        ))}
      </div>

      {medication.instructions && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}
        >
          <AlertCircle
            size={14}
            aria-hidden="true"
            style={{ marginRight: '4px', verticalAlign: 'middle' }}
          />
          {medication.instructions}
        </p>
      )}

      {/* Dose logging buttons */}
      <div
        role="group"
        aria-label={`Log dose for ${medication.name}`}
        style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}
      >
        {(['taken', 'skipped', 'missed'] as AdherenceStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onLogAdherence(medication.id, new Date().toISOString(), status)}
            aria-label={`Mark ${medication.name} as ${status}`}
            style={{
              flex: 1,
              minHeight: seniorMode ? '56px' : '44px',
              padding: seniorMode ? '14px' : '10px',
              borderRadius: '8px',
              border: '2px solid',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: seniorMode ? 'var(--font-size-base)' : 'var(--font-size-sm)',
              textTransform: 'capitalize',
              ...(status === 'taken'
                ? {
                    background: '#d4edda',
                    color: '#155724',
                    borderColor: '#c3e6cb',
                  }
                : status === 'skipped'
                  ? {
                      background: '#fff3cd',
                      color: '#856404',
                      borderColor: '#ffeeba',
                    }
                  : {
                      background: '#f8d7da',
                      color: '#721c24',
                      borderColor: '#f5c6cb',
                    }),
            }}
          >
            {status === 'taken' ? '✓ Taken' : status === 'skipped' ? '→ Skipped' : '✕ Missed'}
          </button>
        ))}
      </div>
    </article>
  );
}
