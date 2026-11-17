import { describe, it, expect, vi } from 'vitest';

vi.mock('../config/env.js', () => ({
  env: {
    GEMINI_API_KEY: 'test-gemini-key',
    NODE_ENV: 'test',
  },
}));

import {
  checkMedicationInteractions,
  generateHealthInsights,
} from '../services/geminiService.js';
import type { Medication } from '../types/index.js';

describe('geminiService', () => {
  const sampleMeds: Medication[] = [
    {
      id: 'med-1',
      profileId: 'group-1',
      name: 'Warfarin',
      dosage: '5mg',
      frequency: 'Once daily in evening',
      times: ['18:00'],
      startDate: new Date('2026-01-01'),
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'med-2',
      profileId: 'group-1',
      name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Once daily with breakfast',
      times: ['08:00'],
      startDate: new Date('2026-01-01'),
      isActive: true,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('checkMedicationInteractions', () => {
    it('returns no interaction risks for fewer than 2 medications', async () => {
      const singleMed = [sampleMeds[0]!];
      const result = await checkMedicationInteractions(singleMed);

      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
      expect(result.severity).toBe('none');
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('pharmacist');
    });

    it('returns an interaction analysis with recommendations and disclaimer for multiple medications', async () => {
      const result = await checkMedicationInteractions(sampleMeds);

      expect(result).toBeDefined();
      expect(typeof result.hasInteractions).toBe('boolean');
      expect(Array.isArray(result.interactions)).toBe(true);
      expect(['none', 'mild', 'moderate', 'severe']).toContain(result.severity);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.disclaimer).toBeTruthy();
    });
  });

  describe('generateHealthInsights', () => {
    it('returns structured health insights with tips, positives, and warnings', async () => {
      const insightHighAdherence = await generateHealthInsights({
        adherenceRate: 92,
        medicationCount: 3,
        recentMissed: 1,
        recentTaken: 12,
      });

      expect(insightHighAdherence.summary).toBeTruthy();
      expect(insightHighAdherence.adherenceTips.length).toBeGreaterThan(0);
      expect(insightHighAdherence.positives.length).toBeGreaterThan(0);
      expect(insightHighAdherence.warnings).toHaveLength(0);
    });

    it('generates adherence warning alerts when adherence rate drops below 80%', async () => {
      const insightLowAdherence = await generateHealthInsights({
        adherenceRate: 65,
        medicationCount: 4,
        recentMissed: 5,
        recentTaken: 8,
      });

      expect(insightLowAdherence.warnings.length).toBeGreaterThan(0);
      expect(insightLowAdherence.warnings[0]).toContain('below 80%');
    });
  });
});
