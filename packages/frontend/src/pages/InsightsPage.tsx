import React, { useState } from 'react';
import Layout from '../components/layout/Layout.js';
import LoadingSpinner from '../components/ui/LoadingSpinner.js';
import { geminiApi } from '../services/api.js';
import type { HealthInsight, InteractionCheckResult } from '../types/index.js';
import { Brain, Sparkles, CheckCircle, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

export default function InsightsPage(): JSX.Element {
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactions, setInteractions] = useState<InteractionCheckResult | null>(null);

  const {
    data: insights,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<HealthInsight>({
    queryKey: ['gemini-insights'],
    queryFn: async () => {
      const res = await geminiApi.getInsights();
      if (!res.data.data) {
        throw new Error(res.data.error ?? 'Failed to retrieve insights');
      }
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });

  const handleCheckInteractions = async (): Promise<void> => {
    setCheckingInteractions(true);
    try {
      const res = await geminiApi.checkInteractions();
      if (res.data.success && res.data.data) {
        setInteractions(res.data.data);
        toast.success('AI interaction check complete.');
      } else {
        toast.error(res.data.error ?? 'Check failed.');
      }
    } catch {
      toast.error('AI Service currently unavailable.');
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={28} color="#7928ca" aria-hidden="true" />
              <h1
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-2xl)',
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                }}
              >
                Smart Health Insights
              </h1>
            </div>
            <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
              AI-driven adherence coaching, routine guidance, and drug interaction analysis powered by Google Gemini.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => void refetch()}
              disabled={isLoading || isRefetching}
              aria-label="Refresh AI insights"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {isRefetching ? 'Refreshing...' : 'Refresh Insights'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void handleCheckInteractions()}
              disabled={checkingInteractions}
              aria-label="Check drug interactions with Gemini"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Sparkles size={16} aria-hidden="true" />
              {checkingInteractions ? 'Analyzing...' : 'Check Drug Interactions'}
            </button>
          </div>
        </header>

        {/* Loading state */}
        {isLoading ? (
          <div style={{ padding: '60px 0' }}>
            <LoadingSpinner size="lg" aria-label="Gemini AI is generating personalized health insights..." />
          </div>
        ) : (
          <>
            {/* Summary Banner */}
            {insights?.summary && (
              <section
                aria-label="Executive AI Summary"
                style={{
                  background: 'linear-gradient(135deg, #f3e8ff 0%, #e0e7ff 100%)',
                  border: '2px solid #c7d2fe',
                  borderRadius: '16px',
                  padding: '24px 28px',
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Sparkles size={20} color="#6366f1" aria-hidden="true" />
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: '#312e81' }}>
                    Personalized Care Summary
                  </h2>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--font-size-base)', color: '#1e1b4b', lineHeight: 1.6 }}>
                  {insights.summary}
                </p>
              </section>
            )}

            {/* Interactions Result (if triggered) */}
            {interactions && (
              <section
                aria-label="Medication Interaction Result"
                className="card"
                style={{
                  borderLeft: `6px solid ${
                    interactions.severity === 'severe'
                      ? '#dc3545'
                      : interactions.severity === 'moderate'
                        ? '#ffc107'
                        : '#28a745'
                  }`,
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                  Interaction Analysis Result (Severity: {interactions.severity.toUpperCase()})
                </h2>
                {interactions.interactions.length === 0 ? (
                  <p style={{ color: '#155724' }}>
                    ✓ No harmful interactions detected among your active medications.
                  </p>
                ) : (
                  <ul style={{ paddingLeft: '20px', margin: '8px 0 16px' }}>
                    {interactions.interactions.map((interaction, i) => (
                      <li key={i} style={{ marginBottom: '6px' }}>{interaction}</li>
                    ))}
                  </ul>
                )}
                {interactions.recommendations.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 'var(--font-size-base)', margin: '12px 0 6px' }}>Recommendations:</h3>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                      {interactions.recommendations.map((rec, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '16px', fontStyle: 'italic' }}>
                  Note: {interactions.disclaimer}
                </p>
              </section>
            )}

            {/* Tips & Positives Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {/* Adherence Tips */}
              <section
                aria-label="Adherence Tips"
                className="card"
                style={{ borderTop: '4px solid var(--color-primary)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Lightbulb size={24} color="var(--color-primary)" aria-hidden="true" />
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                    Actionable Routine Tips
                  </h2>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights?.adherenceTips.map((tip, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5, color: 'var(--color-text)' }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Positives */}
              <section
                aria-label="Positive Accomplishments"
                className="card"
                style={{ borderTop: '4px solid #27ae60' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle size={24} color="#27ae60" aria-hidden="true" />
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                    Celebrated Milestones
                  </h2>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {insights?.positives.map((pos, idx) => (
                    <li key={idx} style={{ lineHeight: 1.5, color: '#155724' }}>
                      {pos}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Warnings (if any) */}
            {insights && insights.warnings.length > 0 && (
              <section
                aria-label="Health Attention Items"
                className="card"
                style={{ borderLeft: '5px solid #dc3545', background: '#fff5f5' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <AlertTriangle size={24} color="#dc3545" aria-hidden="true" />
                  <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', color: '#721c24' }}>
                    Points of Attention
                  </h2>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {insights.warnings.map((warn, idx) => (
                    <li key={idx} style={{ color: '#721c24', marginBottom: '8px' }}>
                      {warn}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
