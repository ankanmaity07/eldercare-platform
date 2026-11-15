import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  passcode: z.string().min(4, 'Passcode must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * LoginPage — accessible login form with email and passcode.
 * Fully keyboard navigable with ARIA live regions for errors.
 */
export default function LoginPage(): JSX.Element {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await authApi.login(values.email, values.passcode);
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        toast.success(`Welcome back, ${data.data.user.name}!`);
      } else {
        toast.error(data.error ?? 'Login failed. Please try again.');
        setLoading(false);
      }
    } catch {
      toast.error('Unable to connect. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          padding: '24px',
        }}
      >
        <main
          id="main-content"
          aria-label="Login"
          style={{ width: '100%', maxWidth: '480px' }}
        >
          {/* Logo / Branding */}
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div
              role="img"
              aria-label="ElderCare logo"
              style={{
                fontSize: '48px',
                marginBottom: '12px',
                lineHeight: 1,
              }}
            >
              💊
            </div>
            <h1
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: '800',
                color: 'var(--color-primary)',
                margin: '0 0 8px',
              }}
            >
              ElderCare
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-base)' }}>
              Medication Management Platform
            </p>
          </header>

          {/* Login Card */}
          <div className="card">
            <h2
              style={{ fontSize: 'var(--font-size-xl)', fontWeight: '700', marginBottom: '24px', marginTop: 0 }}
            >
              Sign In
            </h2>

            <form
              onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
              noValidate
              aria-label="Sign in form"
            >
              {/* Email field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  autoComplete="email"
                  autoFocus
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="form-error" role="alert" aria-live="polite">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Passcode field */}
              <div className="form-group">
                <label htmlFor="passcode" className="form-label">
                  Passcode <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="passcode"
                  type="password"
                  className="form-input"
                  autoComplete="current-password"
                  aria-required="true"
                  aria-invalid={errors.passcode ? 'true' : 'false'}
                  aria-describedby={errors.passcode ? 'passcode-error' : undefined}
                  {...register('passcode')}
                />
                {errors.passcode && (
                  <p id="passcode-error" className="form-error" role="alert" aria-live="polite">
                    {errors.passcode.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                aria-disabled={isLoading}
                style={{ width: '100%', marginTop: '8px' }}
              >
                {isLoading ? (
                  <>
                    <span aria-hidden="true">⏳</span>
                    <span>Signing in…</span>
                    <span className="sr-only">Please wait</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Register link */}
            <p style={{ textAlign: 'center', marginTop: '24px', marginBottom: 0 }}>
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}
              >
                Create account
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
