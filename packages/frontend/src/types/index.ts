export type UserRole = 'elderly' | 'caretaker' | 'family';
export type AdherenceStatus = 'taken' | 'skipped' | 'missed' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileId: string;
  phone?: string;
  emergencyContact?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  prescribedBy?: string;
  color?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdherenceLog {
  id: string;
  medicationId: string;
  profileId: string;
  userId: string;
  scheduledTime: string;
  takenTime?: string;
  status: AdherenceStatus;
  notes?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  profileId: string;
  doctorName: string;
  specialty?: string;
  dateTime: string;
  location?: string;
  notes?: string;
  calendarEventId?: string;
  reminderSent: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  disclaimer: string;
}

export interface HealthInsight {
  summary: string;
  adherenceTips: string[];
  warnings: string[];
  positives: string[];
}
