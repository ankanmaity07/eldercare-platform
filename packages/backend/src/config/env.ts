import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.union([z.string().transform(Number), z.number()]).default(3001),
  FIREBASE_PROJECT_ID: z.string().default('eldercare-dev-project'),
  FIREBASE_PRIVATE_KEY: z.string().default('-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6\n-----END PRIVATE KEY-----\n'),
  FIREBASE_CLIENT_EMAIL: z.string().default('firebase-adminsdk@eldercare-dev-project.iam.gserviceaccount.com'),
  FIREBASE_DATABASE_URL: z.string().default('https://eldercare-dev-project-default-rtdb.firebaseio.com'),
  GEMINI_API_KEY: z.string().default('mock-gemini-api-key'),
  GOOGLE_CALENDAR_CLIENT_ID: z.string().default('mock-client-id'),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().default('mock-client-secret'),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().default('http://localhost:3001/api/calendar/callback'),
  GMAIL_USER: z.string().default('eldercare.reminders@gmail.com'),
  GMAIL_APP_PASSWORD: z.string().default('abcdefghijklmnop'),
  JWT_SECRET: z.string().min(16).default('super-secret-jwt-signing-key-minimum-32-chars-long-123456'),
  BCRYPT_ROUNDS: z.union([z.string().transform(Number), z.number()]).default(12),
  FRONTEND_URL: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.union([z.string().transform(Number), z.number()]).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.union([z.string().transform(Number), z.number()]).default(500),
  SOS_ALERT_EMAIL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Validated, strongly-typed environment variables with safe defaults */
export const env = envSchema.parse(process.env);
