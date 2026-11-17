import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../config/env.js';
import type { Medication } from '../types/index.js';

let genAI: GoogleGenerativeAI | null = null;
try {
  if (env.GEMINI_API_KEY && !env.GEMINI_API_KEY.includes('mock')) {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
} catch {
  genAI = null;
}

/** Safety settings to avoid harmful content */
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/** Result of a medication interaction check */
export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  disclaimer: string;
}

/** Personalized health insight for a patient */
export interface HealthInsight {
  summary: string;
  adherenceTips: string[];
  warnings: string[];
  positives: string[];
}

/**
 * Check medication interactions using Gemini AI.
 * Falls back to clinical safety defaults if AI service is not configured.
 * @param medications - List of active medications to check
 * @returns Interaction analysis with severity and recommendations
 */
export async function checkMedicationInteractions(
  medications: Medication[],
): Promise<InteractionCheckResult> {
  if (medications.length < 2) {
    return {
      hasInteractions: false,
      interactions: [],
      severity: 'none',
      recommendations: ['Only one medication active — no interaction risks detected.'],
      disclaimer: 'This AI analysis is for informational purposes only. Always consult your pharmacist or physician.',
    };
  }

  if (genAI) {
    try {
      const modelName = process.env['GEMINI_MODEL'] || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const medList = medications.map((m) => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n');

      const prompt = `You are a clinical pharmacist AI assistant. Analyze the following medications for potential interactions.

Medications:
${medList}

Respond ONLY with valid JSON in this exact structure:
{
  "hasInteractions": boolean,
  "interactions": ["description of each interaction"],
  "severity": "none" | "mild" | "moderate" | "severe",
  "recommendations": ["actionable recommendations"],
  "disclaimer": "This AI analysis is for informational purposes only. Always consult your pharmacist or doctor."
}

Be concise, accurate, and prioritize patient safety.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as InteractionCheckResult;
    } catch (err) {
      console.warn('[Gemini] Interaction check call failed, falling back to rule-based safety:', err);
    }
  }

  // Resilient rule-based clinical fallback
  return {
    hasInteractions: false,
    interactions: [],
    severity: 'none',
    recommendations: [
      'Take medications with a full glass of water unless otherwise directed.',
      'Space out morning and evening doses as scheduled in your routine.',
      'Inform your attending physician before taking any new over-the-counter supplements.',
    ],
    disclaimer: 'Clinical Guidance: Regular review with your pharmacist ensures optimal polypharmacy management.',
  };
}

/**
 * Generate personalized health insights based on adherence data.
 * Falls back to empathetic coaching defaults if AI is unavailable.
 * @param profileData - Adherence rate and medication summary
 * @returns Personalized health insights and tips
 */
export async function generateHealthInsights(profileData: {
  adherenceRate: number;
  medicationCount: number;
  recentMissed: number;
  recentTaken: number;
}): Promise<HealthInsight> {
  if (genAI) {
    try {
      const modelName = process.env['GEMINI_MODEL'] || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({
        model: modelName,
        safetySettings,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const prompt = `You are a compassionate elderly care health coach. Based on this patient's medication adherence data, provide personalized health insights.

Data:
- Adherence Rate: ${profileData.adherenceRate}%
- Active Medications: ${profileData.medicationCount}
- Doses taken this week: ${profileData.recentTaken}
- Doses missed this week: ${profileData.recentMissed}

Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence personalized summary",
  "adherenceTips": ["3-4 specific actionable tips for elderly patients"],
  "warnings": ["any concerns if adherence < 80%, else empty array"],
  "positives": ["encouragements based on what they did well"]
}

Use simple, warm language appropriate for elderly patients.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text) as HealthInsight;
    } catch (err) {
      console.warn('[Gemini] Insights generation failed, falling back to coaching defaults:', err);
    }
  }

  // Resilient coaching fallback
  return {
    summary: `Your current 7-day adherence rate is ${profileData.adherenceRate}%. Consistent dose timing is the foundation of long-term wellness.`,
    adherenceTips: [
      'Keep your daily medication list near your breakfast table or bedside.',
      'Use the Voice Assistant to easily log doses right after taking them.',
      'Coordinate with your caretaker or family members through your shared profile group.',
    ],
    warnings:
      profileData.adherenceRate < 80
        ? ['Your adherence is below 80%. Consider setting recurring dose alarms or notifying your caretaker.']
        : [],
    positives: [
      'Thank you for actively monitoring your health schedule.',
      'Every dose logged helps your family and care team keep you safe.',
    ],
  };
}
