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

// Security headers with relaxed CSP for modern frontends
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);

// Resilient CORS configuration supporting Vercel and Railway
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow configured FRONTEND_URL, Vercel deployments, and localhost
      if (
        env.FRONTEND_URL === '*' ||
        origin === env.FRONTEND_URL ||
        /\.vercel\.app$/.test(origin) ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }

      // Default allow in cloud to prevent breaking Vercel preview URLs
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  }),
);

// Preflight OPTIONS handler
app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting
app.use('/api', apiRateLimiter);

// Health check endpoints for Railway, Uptime monitors, and load balancers
app.get(['/', '/health', '/api/health'], (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ElderCare Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
  });
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

// Start background email reminder scheduler
try {
  startEmailScheduler();
} catch (err) {
  console.warn('[Scheduler] Could not start scheduler:', err);
}

// Bind to 0.0.0.0 for Railway / cloud containers
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.info(`[Server] ElderCare backend running on 0.0.0.0:${PORT} (${env.NODE_ENV})`);
});

export default app;
