import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore.js';
import type {
  ApiResponse, Medication, AdherenceLog, Appointment,
  InteractionCheckResult, HealthInsight, User,
} from '../types/index.js';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — clear auth and redirect
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// --- Auth ---
export const authApi = {
  login: (email: string, passcode: string) =>
    apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, passcode }),
  register: (data: {
    name: string; email: string; passcode: string;
    role: string; profileId: string; phone?: string; emergencyContact?: string;
  }) => apiClient.post<ApiResponse<{ token: string; user: User }>>('/auth/register', data),
};

// --- Medications ---
export const medicationApi = {
  list: () => apiClient.get<ApiResponse<Medication[]>>('/medications'),
  create: (data: Omit<Medication, 'id' | 'profileId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'isActive'>) =>
    apiClient.post<ApiResponse<Medication>>('/medications', data),
  update: (id: string, data: Partial<Medication>) =>
    apiClient.put<ApiResponse<Medication>>(`/medications/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<never>>(`/medications/${id}`),
};

// --- Adherence ---
export const adherenceApi = {
  log: (data: { medicationId: string; scheduledTime: string; status: string; notes?: string }) =>
    apiClient.post<ApiResponse<AdherenceLog>>('/adherence', data),
  list: (from: string, to: string) =>
    apiClient.get<ApiResponse<AdherenceLog[]>>(`/adherence?from=${from}&to=${to}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiClient.patch<ApiResponse<AdherenceLog>>(`/adherence/${id}`, { status, notes }),
  getRate: (from: string, to: string) =>
    apiClient.get<ApiResponse<{ rate: number }>>(`/adherence/rate?from=${from}&to=${to}`),
};

// --- Appointments ---
export const appointmentApi = {
  list: () => apiClient.get<ApiResponse<Appointment[]>>('/appointments'),
  create: (data: { doctorName: string; specialty?: string; dateTime: string; location?: string; notes?: string }) =>
    apiClient.post<ApiResponse<Appointment>>('/appointments', data),
  update: (id: string, data: Partial<Appointment>) =>
    apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}`, data),
  delete: (id: string) => apiClient.delete<ApiResponse<never>>(`/appointments/${id}`),
  syncToCalendar: (appointmentId: string, accessToken: string, refreshToken: string) =>
    apiClient.post<ApiResponse<{ eventId: string }>>('/calendar/sync', { appointmentId, accessToken, refreshToken }),
};

// --- Gemini AI ---
export const geminiApi = {
  checkInteractions: () => apiClient.post<ApiResponse<InteractionCheckResult>>('/gemini/interactions'),
  getInsights: () => apiClient.get<ApiResponse<HealthInsight>>('/gemini/insights'),
};

// --- SOS ---
export const sosApi = {
  trigger: (triggeredByName: string, location?: string) =>
    apiClient.post<ApiResponse<{ id: string }>>('/sos/trigger', { triggeredByName, location }),
  resolve: (alertId: string) => apiClient.patch<ApiResponse<never>>(`/sos/${alertId}/resolve`),
};
