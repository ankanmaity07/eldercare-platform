import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdherenceGauge from '../components/adherence/AdherenceGauge.js';

describe('AdherenceGauge', () => {
  it('renders with ARIA role img and descriptive label', () => {
    render(<AdherenceGauge rate={85} />);
    const figure = screen.getByRole('img');
    expect(figure).toBeInTheDocument();
    expect(figure).toHaveAttribute(
      'aria-label',
      expect.stringContaining('85% — Excellent'),
    );
  });

  it('displays Excellent badge for rate >= 80', () => {
    render(<AdherenceGauge rate={92} />);
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('displays Good badge for rate 60–79', () => {
    render(<AdherenceGauge rate={68} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('displays Needs Attention for rate < 60', () => {
    render(<AdherenceGauge rate={45} />);
    expect(screen.getByText('Needs Attention')).toBeInTheDocument();
  });

  it('clamps values below 0 to 0 and above 100 to 100', () => {
    render(<AdherenceGauge rate={120} />);
    const figure = screen.getByRole('img');
    expect(figure).toHaveAttribute(
      'aria-label',
      expect.stringContaining('100%'),
    );
  });
});
