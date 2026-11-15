import React from 'react';

interface AdherenceGaugeProps {
  rate: number; // 0-100
  size?: number;
}

/**
 * Circular SVG gauge displaying adherence rate with ARIA accessibility.
 * Color-coded: red < 60%, yellow 60-79%, green >= 80%.
 */
export default function AdherenceGauge({ rate, size = 160 }: AdherenceGaugeProps): JSX.Element {
  const clampedRate = Math.min(100, Math.max(0, rate));
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedRate / 100) * circumference;
  const color = clampedRate >= 80 ? '#27ae60' : clampedRate >= 60 ? '#f39c12' : '#c0392b';
  const label = clampedRate >= 80 ? 'Excellent' : clampedRate >= 60 ? 'Good' : 'Needs Attention';

  return (
    <figure
      role="img"
      aria-label={`Medication adherence rate: ${clampedRate}% — ${label}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', margin: 0 }}
    >
      <svg width={size} height={size} viewBox="0 0 140 140" aria-hidden="true">
        {/* Background track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e9ecef" strokeWidth="12" />
        {/* Progress arc */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        {/* Center text */}
        <text x="70" y="62" textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>
          {clampedRate}%
        </text>
        <text x="70" y="82" textAnchor="middle" fontSize="13" fill="#666">
          Adherence
        </text>
      </svg>
      <figcaption style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color }}>
        {label}
      </figcaption>
    </figure>
  );
}
