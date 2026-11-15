import React, { useState } from 'react';
import Layout from '../components/layout/Layout.js';
import MedicationCard from '../components/medications/MedicationCard.js';
import Modal from '../components/ui/Modal.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { useMedications } from '../hooks/useMedications.js';
import { useAdherence } from '../hooks/useAdherence.js';
import { geminiApi } from '../services/api.js';
import type { Medication, InteractionCheckResult, AdherenceStatus } from '../types/index.js';
import { Plus, Sparkles, AlertCircle, ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const medicationFormSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required (e.g., 500mg)'),
  frequency: z.string().min(1, 'Frequency is required (e.g., Once daily)'),
  times: z.string().min(1, 'Please specify times (e.g., 08:00, 20:00)'),
  startDate: z.string().min(1, 'Start date is required'),
  instructions: z.string().optional(),
  prescribedBy: z.string().optional(),
  color: z.string().optional(),
});

type MedFormData = z.infer<typeof medicationFormSchema>;

export default function MedicationsPage(): JSX.Element {
  const { medications, isLoading, createMedication, updateMedication, deleteMedication } =
    useMedications();
  const { logDose } = useAdherence();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Gemini AI Interaction Check state
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<InteractionCheckResult | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MedFormData>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      color: '#1a3a5c',
      startDate: new Date().toISOString().split('T')[0],
      times: '08:00',
    },
  });

  const openAddModal = (): void => {
    setEditingMed(null);
    reset({
      name: '',
      dosage: '',
      frequency: 'Once daily',
      times: '08:00',
      startDate: new Date().toISOString().split('T')[0],
      instructions: 'Take with food',
      prescribedBy: '',
      color: '#1a3a5c',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medication): void => {
    setEditingMed(med);
    setValue('name', med.name);
    setValue('dosage', med.dosage);
    setValue('frequency', med.frequency);
    setValue('times', med.times.join(', '));
    setValue('startDate', med.startDate ? med.startDate.split('T')[0] ?? '' : '');
    setValue('instructions', med.instructions ?? '');
    setValue('prescribedBy', med.prescribedBy ?? '');
    setValue('color', med.color ?? '#1a3a5c');
    setIsModalOpen(true);
  };

  const onSubmit = (data: MedFormData): void => {
    const timesArray = data.times
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingMed) {
      updateMedication({
        id: editingMed.id,
        data: {
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency,
          times: timesArray,
          startDate: new Date(data.startDate).toISOString(),
          instructions: data.instructions || undefined,
          prescribedBy: data.prescribedBy || undefined,
          color: data.color || undefined,
        },
      });
    } else {
      createMedication({
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        times: timesArray,
        startDate: new Date(data.startDate).toISOString(),
        instructions: data.instructions || undefined,
        prescribedBy: data.prescribedBy || undefined,
        color: data.color || undefined,
      });
    }
    setIsModalOpen(false);
  };

  const handleCheckAIInteractions = async (): Promise<void> => {
    setIsCheckingInteractions(true);
    try {
      const res = await geminiApi.checkInteractions();
      if (res.data.success && res.data.data) {
        setInteractionResult(res.data.data);
        setIsResultModalOpen(true);
      } else {
        toast.error(res.data.error ?? 'Could not check interactions at this time.');
      }
    } catch {
      toast.error('AI Interaction service is temporarily unavailable.');
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const handleLogAdherence = (medId: string, scheduledTime: string, status: AdherenceStatus): void => {
    logDose({
      medicationId: medId,
      scheduledTime,
      status,
      notes: 'Logged from Medications screen',
    });
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
              Medications Schedule
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)' }}>
              Manage daily prescriptions, dosages, and healthcare routines.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void handleCheckAIInteractions()}
              disabled={isCheckingInteractions || medications.length === 0}
              aria-label="Run Gemini AI medication interaction check"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={18} aria-hidden="true" color="#7928ca" />
              {isCheckingInteractions ? 'Checking AI...' : 'AI Interaction Check'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={openAddModal}
              aria-label="Add new medication schedule"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Plus size={18} aria-hidden="true" />
              Add Medication
            </button>
          </div>
        </header>

        {/* Content list */}
        {isLoading ? (
          <LoadingSpinner size="lg" aria-label="Loading your medications" />
        ) : medications.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <AlertCircle size={48} color="var(--color-text-muted)" aria-hidden="true" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-xl)' }}>No medications yet</h2>
            <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted)', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              Add daily medications so our automated system can send timely dose alerts and track adherence.
            </p>
            <button type="button" className="btn btn-primary" onClick={openAddModal}>
              <Plus size={18} aria-hidden="true" /> Add Medication
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
            {medications.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onEdit={openEditModal}
                onDelete={deleteMedication}
                onLogAdherence={handleLogAdherence}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingMed ? 'Edit Medication' : 'Add New Medication'}
          size="md"
        >
          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            noValidate
            aria-label={editingMed ? 'Edit medication form' : 'Add medication form'}
          >
            <div className="form-group">
              <label htmlFor="med-name" className="form-label">
                Medication Name <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="med-name"
                type="text"
                className="form-input"
                placeholder="e.g., Lisinopril, Metformin"
                aria-required="true"
                aria-invalid={errors.name ? 'true' : 'false'}
                {...register('name')}
              />
              {errors.name && <p className="form-error" role="alert">{errors.name.message}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="med-dosage" className="form-label">
                  Dosage <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="med-dosage"
                  type="text"
                  className="form-input"
                  placeholder="e.g., 20mg, 1 tablet"
                  aria-required="true"
                  {...register('dosage')}
                />
                {errors.dosage && <p className="form-error" role="alert">{errors.dosage.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="med-freq" className="form-label">
                  Frequency <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="med-freq"
                  type="text"
                  className="form-input"
                  placeholder="e.g., Once daily, Twice daily"
                  aria-required="true"
                  {...register('frequency')}
                />
                {errors.frequency && <p className="form-error" role="alert">{errors.frequency.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="med-times" className="form-label">
                Daily Times (comma separated 24h format) <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                id="med-times"
                type="text"
                className="form-input"
                placeholder="08:00, 20:00"
                aria-required="true"
                {...register('times')}
              />
              {errors.times && <p className="form-error" role="alert">{errors.times.message}</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label htmlFor="med-start" className="form-label">Start Date</label>
                <input
                  id="med-start"
                  type="date"
                  className="form-input"
                  {...register('startDate')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="med-doctor" className="form-label">Prescribed By</label>
                <input
                  id="med-doctor"
                  type="text"
                  className="form-input"
                  placeholder="Dr. Johnson"
                  {...register('prescribedBy')}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="med-instructions" className="form-label">Special Instructions</label>
              <textarea
                id="med-instructions"
                className="form-input"
                rows={2}
                placeholder="Take with a full glass of water after breakfast"
                {...register('instructions')}
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
              <button type="submit" className="btn btn-primary">
                {editingMed ? 'Save Changes' : 'Add Medication'}
              </button>
            </div>
          </form>
        </Modal>

        {/* AI Interaction Check Results Modal */}
        <Modal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          title="Gemini AI Interaction Analysis"
          size="lg"
        >
          {interactionResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  background:
                    interactionResult.severity === 'severe'
                      ? '#f8d7da'
                      : interactionResult.severity === 'moderate'
                        ? '#fff3cd'
                        : '#d4edda',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <ShieldAlert
                  size={28}
                  color={
                    interactionResult.severity === 'severe'
                      ? '#721c24'
                      : interactionResult.severity === 'moderate'
                        ? '#856404'
                        : '#155724'
                  }
                  aria-hidden="true"
                />
                <div>
                  <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                    Severity: {interactionResult.severity}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)' }}>
                    {interactionResult.hasInteractions
                      ? 'Potential interactions were detected between your medications.'
                      : 'No adverse interactions detected among current medications.'}
                  </p>
                </div>
              </div>

              {interactionResult.interactions.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-base)' }}>
                    Detected Interactions:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {interactionResult.interactions.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {interactionResult.recommendations.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: 'var(--font-size-base)' }}>
                    Recommendations:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {interactionResult.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  fontStyle: 'italic',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '12px',
                  margin: 0,
                }}
              >
                Disclaimer: {interactionResult.disclaimer}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsResultModalOpen(false)}
                >
                  Understood
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}
