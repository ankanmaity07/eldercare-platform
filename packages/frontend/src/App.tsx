import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import LoadingSpinner from './components/ui/LoadingSpinner.js';

// Lazy-loaded pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage.js'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.js'));
const MedicationsPage = lazy(() => import('./pages/MedicationsPage.js'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.js'));
const AdherencePage = lazy(() => import('./pages/AdherencePage.js'));
const InsightsPage = lazy(() => import('./pages/InsightsPage.js'));

/** Protected route wrapper */
function ProtectedRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

/** Public route wrapper — redirects if already authenticated */
function PublicRoute({ children }: { children: React.ReactNode }): JSX.Element {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App(): JSX.Element {
  return (
    <Suspense fallback={<LoadingSpinner fullPage aria-label="Loading page" />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><RegisterPage /></PublicRoute>}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
        />
        <Route
          path="/medications"
          element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>}
        />
        <Route
          path="/appointments"
          element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>}
        />
        <Route
          path="/adherence"
          element={<ProtectedRoute><AdherencePage /></ProtectedRoute>}
        />
        <Route
          path="/insights"
          element={<ProtectedRoute><InsightsPage /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
