import React, { useState } from 'react';
import Layout from '../components/layout/Layout.js';
import AppointmentCard from '../components/appointments/AppointmentCard.js';
import Modal from '../components/ui/Modal.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { useAppointments } from '../hooks/useAppointments.js';
import type { Appointment } from '../types/index.js';
import { Plus, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const appointmentFormSchema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required'),
  specialty: z.string().optional(),
  dateTime: z.string().min(1, 'Date and time is required'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type AptFormData = z.infer<typeof appointmentFormSchema>;

export default function AppointmentsPage(): JSX.Element {
  const { appointments, isLoading, createAppointment, updateAppointment, deleteAppointment } =
    useAppointments();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AptFormData>({
    resolver: zodResolver(appointmentFormSchema),
  });

  const openAddModal = (): void => {
    setEditingApt(null);
    reset({
      doctorName: '',
      specialty: 'General Practice',
      dateTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      location: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (apt: Appointment): void => {
    setEditingApt(apt);
    setValue('doctorName', apt.doctorName);
    setValue('specialty', apt.specialty ?? '');
    setValue('dateTime', new Date(apt.dateTime).toISOString().slice(0, 16));
    setValue('location', apt.location ?? '');
    setValue('notes', apt.notes ?? '');
    setIsModalOpen(true);
  };

  const onSubmit = (data: AptFormData): void => {
    if (editingApt) {
      updateAppointment({
        id: editingApt.id,
        data: {
          doctorName: data.doctorName,
          specialty: data.specialty || undefined,
          dateTime: new Date(data.dateTime).toISOString(),
          location: data.location || undefined,
          notes: data.notes || undefined,
        },
      });
    } else {
      createAppointment({
        doctorName: data.doctorName,
        specialty: data.specialty || undefined,
        dateTime: new Date(data.dateTime).toISOString(),
        location: data.location || undefined,
        notes: data.notes || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleSyncGoogleCalendar = (id: string): void => {
    toast.success(`Google Calendar sync requested for appointment ${id}. Connect your Google account in Settings.`);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Page Header */}
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
              Doctor Appointments
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
              Shared healthcare visits, routine check-ups, and Google Calendar sync.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openAddModal}
            aria-label="Schedule a new appointment"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} aria-hidden="true" />
            Schedule Visit
          </button>
        </header>

        {/* Appointment Cards */}
        {isLoading ? (
          <LoadingSpinner size="lg" aria-label="Loading appointments" />
        ) : appointments.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Calendar size={48} color="var(--color-text-muted)" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-xl)' }}>No scheduled visits</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', maxWidth: '400px', marginInline: 'auto' }}>
              Keep family and caretakers aligned by adding your upcoming clinical consultations.
            </p>
            <button type="button" className="btn btn-secondary" onClick={openAddModal}>
              <Plus size={18} aria-hidden="true" /> Schedule First Visit
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {appointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                onEdit={openEditModal}
                onDelete={deleteAppointment}
                onSyncCalendar={handleSyncGoogleCalendar}
              />
            ))}
          </div>
        )}

        {/* Schedule Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingApt ? 'Edit Appointment' : 'Schedule Doctor Visit'}
          size="md"
        >
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            noValidate
            aria-label={editingApt ? 'Edit appointment form' : 'Schedule appointment form'}
          >
            <div className="form-group">
              <label htmlFor="apt-doc" className="form-label">
                Doctor Name <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="apt-doc"
                type="text"
                className="form-input"
                placeholder="e.g., Dr. Sarah Connor"
                aria-required="true"
                aria-invalid={errors.doctorName ? 'true' : 'false'}
                {...register('doctorName')}
              />
              {errors.doctorName && <p className="form-error" role="alert">{errors.doctorName.message}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="apt-spec" className="form-label">Specialty</label>
                <input
                  id="apt-spec"
                  type="text"
                  className="form-input"
                  placeholder="Cardiology, Geriatrics..."
                  {...register('specialty')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="apt-date" className="form-label">
                  Date &amp; Time <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="apt-date"
                  type="datetime-local"
                  className="form-input"
                  aria-required="true"
                  {...register('dateTime')}
                />
                {errors.dateTime && <p className="form-error" role="alert">{errors.dateTime.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="apt-loc" className="form-label">Location / Clinic Address</label>
              <input
                id="apt-loc"
                type="text"
                className="form-input"
                placeholder="St. Jude Medical Center, Suite 402"
                {...register('location')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="apt-notes" className="form-label">Preparation Notes</label>
              <textarea
                id="apt-notes"
                className="form-input"
                rows={2}
                placeholder="Bring recent lab reports and fasting blood sugar records"
                {...register('notes')}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-secondary">
                {editingApt ? 'Save Changes' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
}
