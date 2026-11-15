import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { sosApi } from '../../services/api.js';
import toast from 'react-hot-toast';

interface SOSButtonProps {
  triggeredByName: string;
}

/**
 * One-tap SOS emergency alert button.
 * Prominent, high-contrast, large touch target for elderly users.
 */
export default function SOSButton({ triggeredByName }: SOSButtonProps): JSX.Element {
  const [isTriggering, setIsTriggering] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSOS = async () => {
    if (!confirmOpen) {
      setConfirmOpen(true);
      // Auto-close confirm after 5s without action
      setTimeout(() => setConfirmOpen(false), 5000);
      return;
    }
    setIsTriggering(true);
    setConfirmOpen(false);
    try {
      await sosApi.trigger(triggeredByName);
      toast.error('🚨 SOS Alert sent to all emergency contacts!', { duration: 8000 });
    } catch {
      toast.error('Failed to send SOS. Please call emergency services directly.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {confirmOpen && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            position: 'absolute', top: '56px', right: 0,
            background: '#fff3cd', border: '2px solid #dc3545',
            borderRadius: '8px', padding: '12px 16px', whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-lg)', zIndex: 100, fontSize: '14px', fontWeight: 600,
          }}
        >
          Tap again to send SOS alert!
        </div>
      )}
      <button
        onClick={() => void handleSOS()}
        disabled={isTriggering}
        aria-label={
          confirmOpen
            ? 'Confirm SOS — tap again to alert emergency contacts'
            : 'SOS Emergency Alert — tap to alert emergency contacts'
        }
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: confirmOpen ? '#c0392b' : '#dc3545',
          color: '#fff', border: 'none', borderRadius: '8px',
          padding: '10px 20px', cursor: 'pointer', fontWeight: 700,
          fontSize: '16px', minHeight: '48px',
          boxShadow: '0 2px 8px rgba(220,53,69,0.4)',
          transition: 'all 150ms ease',
          animation: confirmOpen ? 'pulse 1s infinite' : 'none',
        }}
      >
        <AlertTriangle size={20} aria-hidden="true" />
        {isTriggering ? 'Sending...' : confirmOpen ? 'Confirm SOS!' : 'SOS'}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }`}</style>
      </button>
    </div>
  );
}
