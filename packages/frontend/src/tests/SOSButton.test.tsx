import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const mockTriggerSOS = vi.fn().mockResolvedValue({
  data: { success: true, message: 'Alert sent' },
});

vi.mock('../services/api.js', () => ({
  sosApi: {
    trigger: (name: string) => mockTriggerSOS(name),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import SOSButton from '../components/sos/SOSButton.js';

describe('SOSButton component', () => {
  it('renders initial SOS button with accessible emergency label', () => {
    render(<SOSButton triggeredByName="Grandpa Frank" />);
    const button = screen.getByRole('button', { name: /SOS Emergency Alert/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('SOS');
  });

  it('prompts confirmation on first tap to prevent accidental triggers', () => {
    render(<SOSButton triggeredByName="Grandpa Frank" />);
    const button = screen.getByRole('button', { name: /SOS Emergency Alert/i });

    fireEvent.click(button);

    expect(screen.getByText('Tap again to send SOS alert!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm SOS/i })).toBeInTheDocument();
    expect(mockTriggerSOS).not.toHaveBeenCalled();
  });

  it('triggers emergency API on confirmed second tap', async () => {
    render(<SOSButton triggeredByName="Grandpa Frank" />);
    const button = screen.getByRole('button', { name: /SOS Emergency Alert/i });

    // First click -> Enter confirmation mode
    fireEvent.click(button);

    // Second click -> Trigger SOS
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockTriggerSOS).toHaveBeenCalledWith('Grandpa Frank');
    });
  });
});
