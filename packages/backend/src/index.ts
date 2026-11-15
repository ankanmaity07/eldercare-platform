import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { medicationRouter } from './routes/medications.js';
import { appointmentRouter } from './routes/appointments.js';
import { adherenceRouter } from './routes/adherence.js';
import { geminiRouter } from './routes/gemini.js';
import { calendarRouter } from './routes/calendar.js';
import { sosRouter } from './routes/sos.js';
import { startEmailScheduler } from './services/schedulerService.js';

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global rate limiting
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/medications', medicationRouter);
app.use('/api/appointments', appointmentRouter);
app.use('/api/adherence', adherenceRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/sos', sosRouter);

// Global error handler (must be last)
app.use(errorHandler);

// Start email reminder scheduler
startEmailScheduler();

app.listen(env.PORT, () => {
  console.info(`[Server] ElderCare backend running on port ${env.PORT} (${env.NODE_ENV})`);
});

export default app;
