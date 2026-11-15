import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Medication, AdherenceStatus } from '../../types/index.js';

interface VoiceLoggerProps {
  medications: Medication[];
  onLogDose: (medicationId: string, status: AdherenceStatus) => void;
  seniorMode?: boolean;
}

// Window type extension for Web Speech API
interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

/**
 * VoiceLogger component provides hands-free, voice-assisted medication logging
 * using the Web Speech Recognition API and Speech Synthesis for audio feedback.
 */
export default function VoiceLogger({
  medications,
  onLogDose,
  seniorMode = false,
}: VoiceLoggerProps): JSX.Element {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(true);

  // Check speech synthesis & recognition availability
  useEffect(() => {
    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setHasSpeechSupport(false);
    }
  }, []);

  const speak = (text: string): void => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for elderly comprehension
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = (): void => {
    if (!hasSpeechSupport) {
      toast.error('Voice recognition is not supported in this browser. Please use the buttons.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognitionClass =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const spoken = event.results[0]?.[0]?.transcript.trim().toLowerCase() ?? '';
        setTranscript(spoken);
        processVoiceCommand(spoken);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setFeedback('Could not hear clearly. Please try again.');
        speak('I did not catch that. Please try again or tap the button.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setIsListening(true);
      setFeedback('Listening... Say e.g. "I took Aspirin" or "Skip Metformin"');
      speak('Listening. Please state your medication and status.');
    } catch {
      setIsListening(false);
    }
  };

  const processVoiceCommand = (command: string): void => {
    const isSkipped = command.includes('skip') || command.includes('skipped');
    const isMissed = command.includes('miss') || command.includes('missed');
    const isTaken = command.includes('took') || command.includes('taken') || command.includes('done');

    const status: AdherenceStatus = isSkipped ? 'skipped' : isMissed ? 'missed' : isTaken ? 'taken' : 'taken';

    // Match spoken word with active medication names
    const matchedMed = medications.find((m) =>
      command.toLowerCase().includes(m.name.toLowerCase()),
    );

    if (matchedMed) {
      onLogDose(matchedMed.id, status);
      const msg = `Marked ${matchedMed.name} as ${status}.`;
      setFeedback(msg);
      speak(msg);
      toast.success(msg);
    } else {
      const errorMsg = `Heard "${command}", but could not find a matching medication.`;
      setFeedback(errorMsg);
      speak('Medication not recognized. Please choose from your list.');
    }
  };

  return (
    <section
      aria-label="Voice-Assisted Medication Logging"
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: seniorMode ? '28px' : '20px',
        textAlign: 'center',
        background: isListening ? '#f0f7ff' : 'var(--color-surface)',
        borderColor: isListening ? 'var(--color-primary)' : 'var(--color-border)',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Volume2 size={24} color="var(--color-primary)" aria-hidden="true" />
        <h3
          style={{
            margin: 0,
            fontSize: seniorMode ? 'var(--font-size-xl)' : 'var(--font-size-lg)',
            color: 'var(--color-primary)',
          }}
        >
          Voice Assistant
        </h3>
      </div>
      <p
        style={{
          margin: '0 0 16px',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)',
          maxWidth: '400px',
        }}
      >
        Tap the microphone and say &ldquo;I took Aspirin&rdquo; or &ldquo;Skip Metformin&rdquo;
      </p>

      <button
        type="button"
        onClick={toggleListening}
        aria-label={isListening ? 'Stop listening' : 'Start voice logging assistant'}
        aria-pressed={isListening}
        style={{
          width: seniorMode ? '72px' : '64px',
          height: seniorMode ? '72px' : '64px',
          borderRadius: '50%',
          border: `3px solid ${isListening ? '#dc3545' : 'var(--color-primary)'}`,
          background: isListening ? '#dc3545' : 'var(--color-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isListening ? '0 0 16px rgba(220, 53, 69, 0.6)' : 'var(--shadow)',
          transition: 'all 150ms ease',
        }}
      >
        {isListening ? (
          <MicOff size={seniorMode ? 32 : 28} aria-hidden="true" />
        ) : (
          <Mic size={seniorMode ? 32 : 28} aria-hidden="true" />
        )}
      </button>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginTop: '16px',
            padding: '10px 16px',
            borderRadius: '8px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            fontSize: seniorMode ? 'var(--font-size-base)' : 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}
        >
          {feedback}
        </div>
      )}

      {transcript && (
        <p style={{ marginTop: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
          Spoken: &ldquo;{transcript}&rdquo;
        </p>
      )}
    </section>
  );
}
