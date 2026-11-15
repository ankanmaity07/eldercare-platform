import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, React.CSSProperties> = {
  success: { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
  warning: { background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba' },
  danger: { background: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
  info: { background: '#d1ecf1', color: '#0c5460', border: '1px solid #bee5eb' },
  neutral: { background: '#e9ecef', color: '#495057', border: '1px solid #dee2e6' },
};

/** Status badge with high-contrast colors meeting WCAG AA. */
export default function Badge({ label, variant = 'neutral' }: BadgeProps): JSX.Element {
  return (
    <span
      style={{
        ...variantStyles[variant],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
}
