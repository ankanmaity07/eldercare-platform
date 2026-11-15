import React from 'react';
import Layout from '../components/layout/Layout.js';
import AdherenceGauge from '../components/adherence/AdherenceGauge.js';
import MedicationCard from '../components/medications/MedicationCard.js';
import AppointmentCard from '../components/appointments/AppointmentCard.js';
import VoiceLogger from '../components/voice/VoiceLogger.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { useAuthStore } from '../store/authStore.js';
import { useMedications } from '../hooks/useMedications.js';
import { useAppointments } from '../hooks/useAppointments.js';
import { useAdherence } from '../hooks/useAdherence.js';
import { Link } from 'react-router-dom';
import { Pill, Calendar, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdherenceStatus } from '../types/index.js';

export default function DashboardPage(): JSX.Element {
  const user = useAuthStore((s) => s.user);
  const { medications, isLoading: isMedsLoading, deleteMedication } = useMedications();
  const { appointments, isLoading: isAptsLoading, deleteAppointment } = useAppointments();
  const { adherenceRate, logDose } = useAdherence(7);

  const handleEditMed = (): void => {
    toast('Editing is available on the Medications page.');
  };

  const handleEditApt = (): void => {
    toast('Editing is available on the Appointments page.');
  };

  const handleSyncCalendar = (): void => {
    toast.success('Syncing with Google Calendar...');
  };

  const handleLogCardDose = (medId: string, scheduledTime: string, status: AdherenceStatus): void => {
    logDose({
      medicationId: medId,
      scheduledTime,
      status,
      notes: 'Logged from dashboard',
    });
  };

  const handleLogVoiceDose = (medId: string, status: AdherenceStatus): void => {
    logDose({
      medicationId: medId,
      scheduledTime: new Date().toISOString(),
      status,
      notes: 'Logged via voice assistant',
    });
  };

  const upcomingApts = appointments.slice(0, 3);
  const activeMeds = medications.slice(0, 4);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Welcome & Profile Summary */}
        <header
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 800 }}>
              Welcome, {user?.name ?? 'Friend'}!
            </h1>
            <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: 'var(--font-size-base)' }}>
              Here is your healthcare routine overview for today.
            </p>
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '12px 20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Users size={20} aria-hidden="true" />
            <div>
              <span style={{ fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Profile Group ID
              </span>
              <strong style={{ fontSize: '16px', letterSpacing: '1px' }}>{user?.profileId}</strong>
            </div>
          </div>
        </header>

        {/* Top Grid: Adherence Gauge + Voice Assistant */}
        <section
          aria-label="Health Highlights"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Adherence Rate Card */}
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px',
            }}
          >
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 'var(--font-size-xl)',
                color: 'var(--color-primary)',
              }}
            >
              7-Day Adherence
            </h2>
            <AdherenceGauge rate={adherenceRate} size={180} />
            <p
              style={{
                margin: '16px 0 0',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Keep up consistent dose times to maintain optimal health!
            </p>
          </div>

          {/* Voice Logger Assistant */}
          <VoiceLogger
            medications={medications}
            onLogDose={(medId, status) => handleLogVoiceDose(medId, status)}
          />
        </section>

        {/* Medications Today */}
        <section aria-labelledby="meds-heading">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pill size={24} color="var(--color-primary)" aria-hidden="true" />
              <h2
                id="meds-heading"
                style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}
              >
                Today&apos;s Medications
              </h2>
            </div>
            <Link
              to="/medications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-primary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Manage all <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {isMedsLoading ? (
            <LoadingSpinner size="md" aria-label="Loading medications" />
          ) : activeMeds.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)' }}>
                No active medications in your schedule yet.
              </p>
              <Link to="/medications" className="btn btn-primary">
                + Add First Medication
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {activeMeds.map((med) => (
                <MedicationCard
                  key={med.id}
                  medication={med}
                  onEdit={handleEditMed}
                  onDelete={deleteMedication}
                  onLogAdherence={handleLogCardDose}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Appointments */}
        <section aria-labelledby="apts-heading">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={24} color="var(--color-secondary)" aria-hidden="true" />
              <h2
                id="apts-heading"
                style={{ margin: 0, fontSize: 'var(--font-size-xl)', color: 'var(--color-text)' }}
              >
                Upcoming Doctor Visits
              </h2>
            </div>
            <Link
              to="/appointments"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-secondary)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              View calendar <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          {isAptsLoading ? (
            <LoadingSpinner size="md" aria-label="Loading appointments" />
          ) : upcomingApts.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted)' }}>
                No upcoming appointments scheduled.
              </p>
              <Link to="/appointments" className="btn btn-secondary">
                Schedule Appointment
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
              }}
            >
              {upcomingApts.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onEdit={handleEditApt}
                  onDelete={deleteAppointment}
                  onSyncCalendar={handleSyncCalendar}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
