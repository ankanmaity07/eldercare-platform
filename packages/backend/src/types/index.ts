/** User roles in the platform */
export type UserRole = 'elderly' | 'caretaker' | 'family';

/** Adherence status for a medication dose */
export type AdherenceStatus = 'taken' | 'skipped' | 'missed' | 'pending';

/** User profile stored in Firestore */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileId: string; // shared profile group ID
  passcodeHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  phone?: string;
  emergencyContact?: string;
}

/** Medication schedule entry */
export interface Medication {
  id: string;
  profileId: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "twice daily"
  times: string[]; // e.g. ["08:00", "20:00"]
  startDate: Date;
  endDate?: Date;
  instructions?: string;
  prescribedBy?: string;
  color?: string; // for UI differentiation
  isActive: boolean;
  createdBy: string; // userId
  createdAt: Date;
  updatedAt: Date;
}

/** Adherence log for a single dose */
export interface AdherenceLog {
  id: string;
  medicationId: string;
  profileId: string;
  userId: string;
  scheduledTime: Date;
  takenTime?: Date;
  status: AdherenceStatus;
  notes?: string;
  createdAt: Date;
}

/** Doctor appointment */
export interface Appointment {
  id: string;
  profileId: string;
  doctorName: string;
  specialty?: string;
  dateTime: Date;
  location?: string;
  notes?: string;
  calendarEventId?: string; // Google Calendar event ID
  reminderSent: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/** SOS alert */
export interface SOSAlert {
  id: string;
  profileId: string;
  triggeredBy: string; // userId
  location?: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/** JWT payload */
export interface JWTPayload {
  userId: string;
  profileId: string;
  role: UserRole;
  email: string;
  iat: number;
  exp: number;
}

/** API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Pagination params */
export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

/** Email notification job */
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  text: string;
}
