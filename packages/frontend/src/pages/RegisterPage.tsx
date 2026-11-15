import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { generateProfileId } from '../utils/index.js';
import toast from 'react-hot-toast';
import type { UserRole } from '../types/index.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  passcode: z.string().min(6, 'Passcode must be at least 6 characters'),
  confirmPasscode: z.string(),
  role: z.enum(['elderly', 'caretaker', 'family'], {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
  profileId: z.string().min(5, 'Profile ID must be at least 5 characters'),
  phone: z.string().optional(),
  emergencyContact: z.string().optional(),
}).refine((d) => d.passcode === d.confirmPasscode, {
  message: 'Passcodes do not match',
  path: ['confirmPasscode'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  elderly: 'Primary care recipient — receives medication reminders',
  caretaker: 'Manages medications and appointments for the elderly',
  family: 'Family member who monitors adherence and health reports',
};

/**
 * RegisterPage — full registration form with role selection and profile ID.
 */
export default function RegisterPage(): JSX.Element {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { profileId: generateProfileId() },
  });

  const profileId = watch('profileId');

  const handleGenerateId = (): void => {
    setValue('profileId', generateProfileId(), { shouldValidate: true });
  };

  const onSubmit = async (values: RegisterFormValues): Promise<void> => {
    setLoading(true);
    try {
      const { data } = await authApi.register({
        name: values.name,
        email: values.email,
        passcode: values.passcode,
        role: values.role,
        profileId: values.profileId,
        phone: values.phone || undefined,
        emergencyContact: values.emergencyContact || undefined,
      });
      if (data.success && data.data) {
        setAuth(data.data.user, data.data.token);
        toast.success(`Welcome to ElderCare, ${data.data.user.name}!`);
      } else {
        toast.error(data.error ?? 'Registration failed. Please try again.');
        setLoading(false);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string; message?: string } } };
      const msg =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        'Unable to connect to backend. Please verify your Railway backend URL.';
      toast.error(msg);
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg)',
          padding: '24px',
        }}
      >
        <main
          id="main-content"
          aria-label="Create account"
          style={{ width: '100%', maxWidth: '560px', paddingBottom: '40px' }}
        >
          {/* Branding */}
          <header style={{ textAlign: 'center', marginBottom: '32px', paddingTop: '24px' }}>
            <div role="img" aria-label="ElderCare logo" style={{ fontSize: '40px', marginBottom: '8px' }}>💊</div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '800', color: 'var(--color-primary)', margin: '0 0 4px' }}>
              ElderCare
            </h1>
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Create your account</p>
          </header>

          <div className="card">
            <form
              onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
              noValidate
              aria-label="Registration form"
            >
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  autoComplete="name"
                  autoFocus
                  aria-required="true"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p id="name-error" className="form-error" role="alert" aria-live="polite">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="reg-email" className="form-label">
                  Email Address <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'reg-email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="reg-email-error" className="form-error" role="alert" aria-live="polite">{errors.email.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <fieldset style={{ border: 'none', padding: 0, margin: '0 0 20px' }}>
                <legend className="form-label">
                  Your Role <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </legend>
                <div role="radiogroup" aria-label="Select your role" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(['elderly', 'caretaker', 'family'] as UserRole[]).map((role) => (
                    <label
                      key={role}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '14px 16px',
                        border: `2px solid ${selectedRole === role ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        backgroundColor: selectedRole === role ? 'rgba(26,58,92,0.06)' : 'var(--color-surface)',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <input
                        type="radio"
                        value={role}
                        style={{ marginTop: '4px', width: '20px', height: '20px', flexShrink: 0 }}
                        {...register('role')}
                        onChange={(e) => {
                          setSelectedRole(e.target.value as UserRole);
                          void register('role').onChange(e);
                        }}
                      />
                      <span>
                        <strong style={{ display: 'block', textTransform: 'capitalize', fontSize: 'var(--font-size-base)' }}>
                          {role}
                        </strong>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                          {ROLE_DESCRIPTIONS[role]}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="form-error" role="alert" aria-live="polite">{errors.role.message}</p>
                )}
              </fieldset>

              {/* Profile ID */}
              <div className="form-group">
                <label htmlFor="profileId" className="form-label">
                  Profile Group ID <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 0, marginBottom: '8px' }}>
                  Share this ID with family/caretakers so they can join your profile group.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="profileId"
                    type="text"
                    className="form-input"
                    aria-required="true"
                    aria-invalid={errors.profileId ? 'true' : 'false'}
                    aria-describedby={`profileId-desc${errors.profileId ? ' profileId-error' : ''}`}
                    value={profileId}
                    {...register('profileId')}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleGenerateId}
                    aria-label="Generate a new random profile ID"
                    style={{ flexShrink: 0 }}
                  >
                    Generate
                  </button>
                </div>
                <span id="profileId-desc" className="sr-only">
                  A unique identifier for your shared medication profile
                </span>
                {errors.profileId && (
                  <p id="profileId-error" className="form-error" role="alert" aria-live="polite">{errors.profileId.message}</p>
                )}
              </div>

              {/* Passcode */}
              <div className="form-group">
                <label htmlFor="passcode" className="form-label">
                  Passcode <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="passcode"
                  type="password"
                  className="form-input"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.passcode ? 'true' : 'false'}
                  aria-describedby={errors.passcode ? 'passcode-error' : undefined}
                  {...register('passcode')}
                />
                {errors.passcode && (
                  <p id="passcode-error" className="form-error" role="alert" aria-live="polite">{errors.passcode.message}</p>
                )}
              </div>

              {/* Confirm Passcode */}
              <div className="form-group">
                <label htmlFor="confirmPasscode" className="form-label">
                  Confirm Passcode <span aria-hidden="true" style={{ color: 'var(--color-danger)' }}>*</span>
                </label>
                <input
                  id="confirmPasscode"
                  type="password"
                  className="form-input"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={errors.confirmPasscode ? 'true' : 'false'}
                  aria-describedby={errors.confirmPasscode ? 'confirm-error' : undefined}
                  {...register('confirmPasscode')}
                />
                {errors.confirmPasscode && (
                  <p id="confirm-error" className="form-error" role="alert" aria-live="polite">{errors.confirmPasscode.message}</p>
                )}
              </div>

              {/* Optional: Phone */}
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  className="form-input"
                  autoComplete="tel"
                  aria-describedby="phone-hint"
                  {...register('phone')}
                />
                <span id="phone-hint" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  Used for SMS reminders and SOS alerts
                </span>
              </div>

              {/* Optional: Emergency Contact */}
              <div className="form-group">
                <label htmlFor="emergencyContact" className="form-label">Emergency Contact (optional)</label>
                <input
                  id="emergencyContact"
                  type="text"
                  className="form-input"
                  aria-describedby="ec-hint"
                  {...register('emergencyContact')}
                />
                <span id="ec-hint" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  Name and phone number of your emergency contact
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                aria-disabled={isLoading}
                style={{ width: '100%' }}
              >
                {isLoading ? (
                  <>
                    <span aria-hidden="true">⏳</span>
                    <span>Creating account…</span>
                    <span className="sr-only">Please wait</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '24px', marginBottom: 0 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600', textDecoration: 'underline' }}>
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
