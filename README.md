# 💊 ElderCare — Elderly Care & Medication Management Platform

> A production-ready, accessible, multi-role healthcare ecosystem connecting elderly individuals, caretakers, and family members with automated dose tracking, smart AI insights, proactive email alerts, and Google Cloud services.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Architecture & System Flow](#-architecture--system-flow)
3. [Google Services Integration](#-google-services-integration)
4. [Elderly-First Accessibility (WCAG 2.1 AA)](#-elderly-first-accessibility-wcag-21-aa)
5. [Security & Compliance Architecture](#-security--compliance-architecture)
6. [Code Quality & TypeScript Standards](#-code-quality--typescript-standards)
7. [Runtime Efficiency & Performance](#-runtime-efficiency--performance)
8. [API Reference](#-api-reference)
9. [Automated Test Suite](#-automated-test-suite)
10. [Environment Variables](#-environment-variables)
11. [Getting Started & Local Development](#-getting-started--local-development)
12. [Project Structure](#-project-structure)

---

## 🌟 Project Overview

**ElderCare** is designed from the ground up to solve the challenges of elderly polypharmacy, routine schedule confusion, and caregiver coordination. The platform unites three distinct user personas into a shared healthcare profile:
* **Elderly Users**: Experience high-contrast visual clarity, large interactive touch targets (minimum 48×48px), voice-assisted medication logging, and a single-tap emergency SOS button.
* **Caretakers**: Manage daily medications, adjust dosage frequencies, log vitals, track doctor appointments, and sync them with Google Calendar.
* **Family Members**: Monitor adherence rates remotely, review historical dose compliance, and receive proactive automated email notifications for missed doses or emergency alerts.

---

## 🏗 Architecture & System Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ElderCare React Frontend                        │
│     (Vite + React 18 + TypeScript + Zustand + TanStack Query + WCAG)   │
│                                                                        │
│   ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐   │
│   │   Senior Mode    │  │  Voice Assistant │  │   One-Tap SOS      │   │
│   │ (48px+ targets)  │  │ (Web Speech API) │  │  Emergency Alert   │   │
│   └──────────────────┘  └──────────────────┘  └────────────────────┘   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (JWT Bearer)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ElderCare Express Backend                       │
│     (Node.js + TypeScript Strict + Zod + Helmet + Rate Limiter)        │
│                                                                        │
│  ┌───────────────────────┐ ┌──────────────────────┐ ┌──────────────┐   │
│  │ Passcode Auth & RBAC  │ │ Medication Schedule  │ │  Adherence   │   │
│  │ (bcrypt + JWT 24h)    │ │      CRUD Engine     │ │  Calculator  │   │
│  └───────────────────────┘ └──────────────────────┘ └──────────────┘   │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌──────────────────┐    ┌───────────────────────┐    ┌──────────────────┐
│ Firebase Admin   │    │ Google Cloud APIs     │    │ Communication    │
│  • Firestore DB  │    │  • Gemini Pro API     │    │  • Gmail SMTP    │
│  • Auth Service  │    │  • Calendar API v3    │    │  • node-cron     │
└──────────────────┘    └───────────────────────┘    └──────────────────┘
```

---

## 🌐 Google Services Integration

Every integration is built with robust error boundaries, retries, and strongly-typed interfaces:

### 1. Firebase (Auth & Firestore)
* **Firestore NoSQL Database**: Stores profiles, users, medications, adherence logs, and appointment records with composite indexing (`profileId`, `isActive`, `createdAt`).
* **Multi-User Profile Ecosystem**: Multiple accounts (elderly, caretakers, family) bind to a single `profileId` document, providing real-time data isolation and collaborative care.
* **Firebase Admin SDK**: Server-side credential initialization with certificate verification (`initFirebase`).

### 2. Google Gemini API (`@google/generative-ai`)
* **Medication Interaction Checks**: Uses `gemini-pro` with clinical prompts to parse multiple medications and identify dangerous drug-drug interactions, returning severity, descriptions, and clinical recommendations in structured JSON.
* **Smart Health Insights**: Analyzes 7-day adherence rates, dose timing variances, and missed doses to generate personalized, compassionate health tips tailored for elderly routines.

### 3. Google Calendar API (`googleapis`)
* **OAuth2 Synchronization**: Generates secure authorization URLs and exchanges tokens for seamless synchronization of doctor appointments.
* **Automatic Calendar Events**: Injects appointment dates, clinician names, medical specialties, clinic addresses, and automatic reminder triggers directly into the user's primary Google Calendar.

### 4. Gmail SMTP (`nodemailer`)
* **Proactive Medication Alerts**: Automated reminders dispatched 15 minutes before scheduled dose times.
* **Doctor Visit Notifications**: 24-hour advance warning emails formatted with clinical details and location maps.
* **Immediate SOS Emergency Dispatch**: Instantaneous high-priority notification to all registered family contacts and emergency services when an SOS alert is triggered.

---

## ♿ Elderly-First Accessibility (WCAG 2.1 AA)

ElderCare implements strict universal design principles to ensure unhindered usability for seniors and individuals with physical or cognitive impairments:

1. **Semantic HTML5 & Landmarks**: Full usage of `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<figure>`, and `<footer>` elements.
2. **Accessible Skip Navigation**: Hidden `.skip-link` allowing keyboard and screen-reader users to jump directly to `#main-content`.
3. **High Contrast Color Palette**: Minimum 4.5:1 contrast ratio for normal text and 3:1 for large graphical elements:
   * Primary: Deep Navy `#1a3a5c`
   * Secondary: Forest Green `#2d6a4f`
   * Danger: Crimson `#dc3545`
   * Background: Off-white `#f8f9fa` with dark mode support.
4. **Touch Target Dimensions**: All buttons, links, and input fields adhere to a minimum size of **48×48px** (WCAG 2.5.5 Level AAA recommendation).
5. **Senior Mode Toggle**: One-click senior mode that scales typography up to 24px and touch targets up to 60px with simplified high-visibility action tiles.
6. **Voice-Assisted Dose Logging**: Hands-free voice recognition using the Web Speech Recognition API and spoken confirmation via the SpeechSynthesis API.
7. **Screen-Reader & ARIA Labels**: Comprehensive `aria-live="polite"` regions, `aria-required`, `aria-invalid`, `aria-describedby` references, and descriptive `aria-label` attributes on every interactive element.
8. **Reduced Motion Support**: Automatic suppression of animations and transitions when `prefers-reduced-motion: reduce` is detected.

---

## 🔒 Security & Compliance Architecture

* **Bcrypt Passcode Hashing**: Numeric passcodes are salted and hashed with `bcryptjs` using 12 salt rounds. Plaintext passcodes are never persisted or logged.
* **Role-Based Access Control (RBAC)**: Fine-grained middleware (`authenticate`, `authorize('elderly' | 'caretaker' | 'family')`) protects all API endpoints.
* **Zod Input Validation**: Every request payload, URL query, and environment variable is validated against strict Zod schemas before processing.
* **Express Rate Limiting**: Global API requests are capped at 100 requests per 15-minute window (`apiRateLimiter`), with auth endpoints strictly throttled to 10 requests per 15 minutes (`authRateLimiter`).
* **HTTP Security Headers with Helmet**: Configures Strict-Transport-Security, X-Content-Type-Options, Frameguard (anti-clickjacking), and strict Content-Security-Policy (CSP).
* **Cross-Origin Resource Sharing (CORS)**: Strict origin whitelisting bound to the frontend origin with credential support.
* **Zero Secrets in Source**: All credentials, API keys, and connection strings are managed through validated environment variables.

---

## 💎 Code Quality & TypeScript Standards

* **Strict TypeScript Configuration**: Built with `strict: true`, `noImplicitAny: true`, `noImplicitReturns: true`, `noUncheckedIndexedAccess: true`, and zero `any` types.
* **Comprehensive JSDoc Documentation**: Every exported function, service method, hook, and middleware contains detailed JSDoc annotations detailing parameters, return values, and side effects.
* **Consistent Architecture**: Modular package separation between `@eldercare/backend` and `@eldercare/frontend` within an npm workspaces monorepo.
* **ESLint & Prettier**: Configured with strict TypeScript ESLint rules and automated code formatting.

---

## ⚡ Runtime Efficiency & Performance

* **Non-Blocking Async Operations**: Every database and third-party call leverages native Promises and async/await with zero blocking operations.
* **Database Indexing**: Firestore compound indexes on `(profileId, isActive, createdAt)` prevent full-collection scans.
* **Frontend Code Splitting**: Route-level lazy loading (`React.lazy` and `Suspense`) splits pages into independent asynchronous chunks.
* **Client-Side Cache & Stale-While-Revalidate**: Powered by TanStack React Query with a 5-minute stale-time and optimistic mutations.
* **Debounced Inputs**: Eliminates redundant API calls during text filtering and profile generation.

---

## 📡 API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register user with profile group ID and numeric passcode |
| `POST` | `/api/auth/login` | Public | Authenticate via email & passcode; returns 24h JWT |
| `GET` | `/api/medications` | Authenticated | List all active medications for current profile |
| `POST` | `/api/medications` | Authenticated | Create a new medication schedule entry |
| `GET` | `/api/medications/:id`| Authenticated | Get medication details with profile ownership verification |
| `PUT` | `/api/medications/:id`| Authenticated | Update dosage, frequency, times, or instructions |
| `DELETE`| `/api/medications/:id`| Authenticated | Soft-delete medication schedule |
| `POST` | `/api/adherence` | Authenticated | Log a dose event (`taken`, `skipped`, `missed`) |
| `GET` | `/api/adherence` | Authenticated | Fetch adherence logs within date range (`from`, `to`) |
| `PATCH`| `/api/adherence/:id`| Authenticated | Update adherence record status or notes |
| `GET` | `/api/adherence/rate`| Authenticated | Calculate compliance percentage for profile |
| `GET` | `/api/appointments` | Authenticated | List upcoming doctor appointments |
| `POST` | `/api/appointments` | Authenticated | Schedule a new appointment |
| `PUT` | `/api/appointments/:id`| Authenticated| Modify appointment date, doctor, or location |
| `DELETE`| `/api/appointments/:id`| Authenticated| Remove appointment record |
| `POST` | `/api/gemini/interactions` | Authenticated | Run Gemini AI medication interaction safety analysis |
| `GET` | `/api/gemini/insights` | Authenticated | Generate personalized adherence coaching insights |
| `GET` | `/api/calendar/auth-url` | Authenticated | Generate Google OAuth2 calendar consent URL |
| `GET` | `/api/calendar/callback` | Public | Handle Google OAuth2 token exchange |
| `POST` | `/api/calendar/sync` | Authenticated | Push appointment to Google Calendar |
| `POST` | `/api/sos/trigger` | Authenticated | Trigger one-tap emergency alert email broadcast |
| `PATCH`| `/api/sos/:id/resolve`| Authenticated | Resolve active SOS emergency alert |

---

## 🧪 Automated Test Suite

The test suite covers unit and integration tests across both frontend and backend using **Vitest**:

* `packages/backend/src/tests/authService.test.ts`:
  * Passcode hashing with bcrypt salt verification
  * Incorrect passcode rejection
  * JWT claim encoding and expiration structure
  * Profile creation and sensitive field sanitization
* `packages/backend/src/tests/medicationService.test.ts`:
  * Medication schedule creation with timestamp tracking
  * Profile-scoped retrieval and multi-tenant access control
  * Soft-deletion verification
* `packages/backend/src/tests/adherenceService.test.ts`:
  * Dose logging (`taken`, `skipped`, `missed`)
  * Dynamic compliance rate calculation (0–100%)
  * Empty log handling and boundary conditions
* `packages/backend/src/tests/emailService.test.ts`:
  * Medication reminder HTML & plain-text generation
  * Doctor appointment notification payload formatting
  * Emergency SOS email template urgency verification
* `packages/frontend/src/tests/authStore.test.ts`:
  * Zustand auth state transitions, login, and logout
* `packages/frontend/src/tests/utils.test.ts`:
  * Accessible color mapping, profile ID generator, and debounce utility
* `packages/frontend/src/tests/AdherenceGauge.test.tsx`:
  * SVG circular gauge ARIA accessibility and percentage status labels
* `packages/frontend/src/tests/Badge.test.tsx`:
  * Status badge rendering and WCAG screen-reader announcements

To execute the test suite:
```bash
# Run all tests across backend and frontend
npm test

# Run backend tests with coverage
npm run test --workspace=packages/backend

# Run frontend tests with coverage
npm run test --workspace=packages/frontend
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure credentials:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Google Cloud / Firebase project ID | `eldercare-prod` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email | `firebase-adminsdk@...` |
| `FIREBASE_DATABASE_URL` | Firebase Realtime Database URL | `https://eldercare-prod.firebaseio.com` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth2 Client ID for Google Calendar | `...apps.googleusercontent.com` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | OAuth2 Client Secret | `GOCSPX-...` |
| `GOOGLE_CALENDAR_REDIRECT_URI` | OAuth2 Callback URL | `http://localhost:3001/api/calendar/callback` |
| `GMAIL_USER` | Gmail address for automated notifications | `care.alerts@gmail.com` |
| `GMAIL_APP_PASSWORD` | 16-character Google App Password | `abcd efgh ijkl mnop` |
| `JWT_SECRET` | 32+ character random secret string | `super-secure-long-jwt-secret-string` |
| `BCRYPT_ROUNDS` | Salt rounds for passcode hashing | `12` |
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `FRONTEND_URL` | Allowed CORS frontend origin | `http://localhost:5173` |

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Node.js** >= 18.0.0
* **npm** >= 9.0.0

### Installation
```bash
# Clone repository and enter project root
cd eldercare-platform

# Install dependencies across all monorepo workspaces
npm install
```

### Running Locally
```bash
# Start backend and frontend simultaneously
npm run dev

# Or start individually:
npm run dev --workspace=packages/backend  # Runs Express on port 3001
npm run dev --workspace=packages/frontend # Runs Vite on port 5173
```

### Production Build & Verification
```bash
# Typecheck
npm run typecheck

# Lint with zero warnings
npm run lint

# Run all automated tests
npm test

# Build production bundles
npm run build
```

---

## 📂 Project Structure

```
eldercare-platform/
├── .eslintrc.json               # Shared strict TypeScript ESLint config
├── .prettierrc.json             # Formatting configuration
├── .env.example                 # Environment variables specification
├── .gitignore                   # Git exclusion rules
├── package.json                 # Monorepo workspaces definition
├── tsconfig.base.json           # Base TypeScript compiler options
├── README.md                    # Comprehensive platform documentation
│
├── packages/
│   ├── backend/                 # Node.js + Express + Firebase Backend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── src/
│   │       ├── index.ts         # Main server entrypoint
│   │       ├── config/          # Firebase & strongly-typed env setup
│   │       ├── middleware/      # Auth (JWT/RBAC), Rate Limiter, Error Handler
│   │       ├── routes/          # Express route controllers
│   │       ├── services/        # Firebase, Gemini, Calendar, Email, Scheduler
│   │       ├── types/           # Shared TypeScript domain models
│   │       └── tests/           # Vitest unit & integration tests
│   │
│   └── frontend/                # React 18 + Vite + Accessibility Frontend
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html           # WCAG compliant HTML5 entrypoint
│       └── src/
│           ├── main.tsx         # React application bootstrap
│           ├── App.tsx          # Client-side routing & auth guards
│           ├── components/      # UI, Layout, Medication, Appointments, SOS
│           ├── hooks/           # TanStack Query custom hooks
│           ├── pages/           # Dashboard, Medications, Appointments, etc.
│           ├── services/        # Axios API client
│           ├── store/           # Zustand persistent state
│           ├── styles/          # WCAG 2.1 AA accessible CSS variables
│           ├── types/           # Frontend TypeScript interfaces
│           ├── utils/           # Date formatters, debouncers, color maps
│           └── tests/           # React Testing Library & Vitest specs
```
