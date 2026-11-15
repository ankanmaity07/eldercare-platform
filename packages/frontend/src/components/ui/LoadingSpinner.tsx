import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  'aria-label'?: string;
}

/**
 * Accessible loading spinner with ARIA live region.
 */
export default function LoadingSpinner({
  size = 'md',
  fullPage = false,
  'aria-label': ariaLabel = 'Loading, please wait',
}: LoadingSpinnerProps): JSX.Element {
  const sizeMap = { sm: '24px', md: '40px', lg: '64px' };
  const dim = sizeMap[size];

  const spinner = (
    <div
      role="status"
      aria-label={ariaLabel}
      aria-live="polite"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 50 50"
        aria-hidden="true"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        <circle
          cx="25" cy="25" r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="80 20"
          style={{ color: 'var(--color-primary)' }}
        />
      </svg>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
        {ariaLabel}
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--color-bg)', zIndex: 50,
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
