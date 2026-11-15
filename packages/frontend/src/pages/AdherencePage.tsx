import React, { useState } from 'react';
import Layout from '../components/layout/Layout.js';
import AdherenceGauge from '../components/adherence/AdherenceGauge.js';
import Badge from '../components/ui/Badge.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { useAdherence } from '../hooks/useAdherence.js';
import { useMedications } from '../hooks/useMedications.js';
import { formatDateTime } from '../utils/index.js';
import type { AdherenceStatus } from '../types/index.js';
import { BarChart3, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function AdherencePage(): JSX.Element {
  const [filterDays, setFilterDays] = useState(7);
  const { logs, adherenceRate, isLoading, updateStatus } = useAdherence(filterDays);
  const { medications } = useMedications();

  const getMedName = (medId: string): string => {
    return medications.find((m) => m.id === medId)?.name ?? 'Prescribed Dose';
  };

  const statusVariantMap: Record<AdherenceStatus, 'success' | 'warning' | 'danger' | 'info'> = {
    taken: 'success',
    skipped: 'warning',
    missed: 'danger',
    pending: 'info',
  };

  const takenCount = logs.filter((l) => l.status === 'taken').length;
  const skippedCount = logs.filter((l) => l.status === 'skipped').length;
  const missedCount = logs.filter((l) => l.status === 'missed').length;

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Header */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'var(--font-size-2xl)',
                color: 'var(--color-primary)',
                fontWeight: 800,
              }}
            >
              Adherence Monitoring
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
              Track taken, skipped, and missed medication doses across the care ecosystem.
            </p>
          </div>

          {/* Time range selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              borderRadius: '8px',
              padding: '6px 12px',
            }}
          >
            <Filter size={18} aria-hidden="true" color="var(--color-text-muted)" />
            <label htmlFor="range-select" className="sr-only">
              Select time period
            </label>
            <select
              id="range-select"
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
              style={{
                border: 'none',
                background: 'transparent',
                fontWeight: 700,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days</option>
              <option value={30}>Last 30 Days</option>
            </select>
          </div>
        </header>

        {/* Stats Grid */}
        <section
          aria-label="Adherence Metrics"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
            }}
          >
            <AdherenceGauge rate={adherenceRate} size={150} />
          </div>

          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              borderLeft: '5px solid #27ae60',
            }}
          >
            <CheckCircle2 size={36} color="#27ae60" aria-hidden="true" />
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Taken On Time
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#155724' }}>
                {takenCount}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              borderLeft: '5px solid #f39c12',
            }}
          >
            <Clock size={36} color="#f39c12" aria-hidden="true" />
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Skipped
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#856404' }}>
                {skippedCount}
              </p>
            </div>
          </div>

          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '24px',
              borderLeft: '5px solid #c0392b',
            }}
          >
            <XCircle size={36} color="#c0392b" aria-hidden="true" />
            <div>
              <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Missed
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: 800, color: '#721c24' }}>
                {missedCount}
              </p>
            </div>
          </div>
        </section>

        {/* Adherence Logs Table */}
        <section aria-labelledby="logs-table-heading" className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <BarChart3 size={20} color="var(--color-primary)" aria-hidden="true" />
            <h2 id="logs-table-heading" style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
              Recent Dose Logs ({logs.length})
            </h2>
          </div>

          {isLoading ? (
            <div style={{ padding: '40px' }}>
              <LoadingSpinner size="md" aria-label="Loading dose history" />
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No medication logs recorded in this period yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                <caption className="sr-only">List of medication dose records and their status</caption>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                    <th scope="col" style={{ padding: '14px 24px', fontWeight: 700 }}>Medication</th>
                    <th scope="col" style={{ padding: '14px 24px', fontWeight: 700 }}>Scheduled Time</th>
                    <th scope="col" style={{ padding: '14px 24px', fontWeight: 700 }}>Status</th>
                    <th scope="col" style={{ padding: '14px 24px', fontWeight: 700 }}>Notes</th>
                    <th scope="col" style={{ padding: '14px 24px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background-color 150ms ease',
                      }}
                    >
                      <td style={{ padding: '14px 24px', fontWeight: 700, color: 'var(--color-text)' }}>
                        {getMedName(log.medicationId)}
                      </td>
                      <td style={{ padding: '14px 24px', color: 'var(--color-text-muted)' }}>
                        {formatDateTime(log.scheduledTime)}
                      </td>
                      <td style={{ padding: '14px 24px' }}>
                        <Badge
                          label={log.status.toUpperCase()}
                          variant={statusVariantMap[log.status]}
                        />
                      </td>
                      <td style={{ padding: '14px 24px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        {log.notes || '—'}
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        {log.status !== 'taken' && (
                          <button
                            type="button"
                            onClick={() => updateStatus({ id: log.id, status: 'taken', notes: 'Marked taken' })}
                            className="btn btn-outline"
                            style={{
                              padding: '6px 12px',
                              minHeight: '36px',
                              fontSize: '13px',
                              borderRadius: '6px',
                            }}
                          >
                            Mark Taken
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
