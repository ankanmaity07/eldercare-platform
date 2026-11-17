import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import MedicationCard from '../components/medications/MedicationCard.js';
import type { Medication } from '../types/index.js';

describe('MedicationCard component', () => {
  const sampleMed: Medication = {
    id: 'med-card-1',
    profileId: 'group-1',
    name: 'Metformin',
    dosage: '500mg',
    frequency: 'Twice daily with meals',
    times: ['08:00', '20:00'],
    startDate: '2026-01-01T00:00:00.000Z',
    instructions: 'Take immediately after breakfast and dinner',
    prescribedBy: 'Dr. Adams',
    isActive: true,
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('renders medication name, dosage, frequency, times, and instructions', () => {
    render(
      <MedicationCard
        medication={sampleMed}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogAdherence={vi.fn()}
      />,
    );

    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText(/500mg/)).toBeInTheDocument();
    expect(screen.getByText(/Twice daily with meals/)).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
    expect(screen.getByText(/Take immediately after breakfast/)).toBeInTheDocument();
  });

  it('calls onLogAdherence when dose status buttons are clicked', () => {
    const handleLog = vi.fn();
    render(
      <MedicationCard
        medication={sampleMed}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onLogAdherence={handleLog}
      />,
    );

    const takenButton = screen.getByRole('button', { name: /Mark Metformin as taken/i });
    fireEvent.click(takenButton);
    expect(handleLog).toHaveBeenCalledWith('med-card-1', expect.any(String), 'taken');

    const skippedButton = screen.getByRole('button', { name: /Mark Metformin as skipped/i });
    fireEvent.click(skippedButton);
    expect(handleLog).toHaveBeenCalledWith('med-card-1', expect.any(String), 'skipped');
  });

  it('triggers onEdit and onDelete handlers when action buttons are clicked', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <MedicationCard
        medication={sampleMed}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onLogAdherence={vi.fn()}
      />,
    );

    const editButton = screen.getByRole('button', { name: /Edit Metformin/i });
    fireEvent.click(editButton);
    expect(handleEdit).toHaveBeenCalledWith(sampleMed);

    const deleteButton = screen.getByRole('button', { name: /Remove Metformin/i });
    fireEvent.click(deleteButton);
    expect(handleDelete).toHaveBeenCalledWith('med-card-1');
  });
});
