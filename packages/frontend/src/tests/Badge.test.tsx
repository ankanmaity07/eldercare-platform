import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../components/ui/Badge.js';

describe('Badge', () => {
  it('renders badge label text correctly', () => {
    render(<Badge label="TAKEN" variant="success" />);
    expect(screen.getByText('TAKEN')).toBeInTheDocument();
  });

  it('provides accessible ARIA label with status indication', () => {
    render(<Badge label="MISSED" variant="danger" />);
    const badge = screen.getByLabelText('Status: MISSED');
    expect(badge).toBeInTheDocument();
  });

  it('renders with default neutral variant without error', () => {
    render(<Badge label="PENDING" />);
    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });
});
