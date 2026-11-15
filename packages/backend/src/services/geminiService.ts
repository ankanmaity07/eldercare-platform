import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../config/env.js';
import type { Medication } from '../types/index.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

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
      recommendations: ['Only one medication — no interaction check needed.'],
      disclaimer: 'This AI analysis is for informational purposes only. Always consult your pharmacist or doctor.',
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
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
}

/**
 * Generate personalized health insights based on adherence data.
 * @param profileData - Adherence rate and medication summary
 * @returns Personalized health insights and tips
 */
export async function generateHealthInsights(profileData: {
  adherenceRate: number;
  medicationCount: number;
  recentMissed: number;
  recentTaken: number;
}): Promise<HealthInsight> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
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
}
