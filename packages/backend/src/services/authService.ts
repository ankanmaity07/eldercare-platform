import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import type { UserProfile, JWTPayload, UserRole } from '../types/index.js';

/** Firestore collection names */
const USERS_COLLECTION = 'users';
const PROFILES_COLLECTION = 'profiles';

export interface CreateUserInput {
  name: string;
  email: string;
  passcode: string;
  role: UserRole;
  profileId: string;
  phone?: string;
  emergencyContact?: string;
}

export interface LoginInput {
  email: string;
  passcode: string;
}

export interface AuthResult {
  token: string;
  user: Omit<UserProfile, 'passcodeHash'>;
}

/**
 * Hash a plain-text passcode using bcrypt.
 * @param passcode - Plain-text passcode (min 6 digits)
 * @returns bcrypt hash string
 */
export async function hashPasscode(passcode: string): Promise<string> {
  return bcrypt.hash(passcode, env.BCRYPT_ROUNDS);
}

/**
 * Verify a plain-text passcode against a bcrypt hash.
 * @param passcode - Plain-text passcode
 * @param hash - Stored bcrypt hash
 * @returns true if match
 */
export async function verifyPasscode(passcode: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passcode, hash);
}

/**
 * Sign a JWT token for an authenticated user.
 * @param user - UserProfile to encode
 * @returns Signed JWT string (expires in 24h)
 */
export function signToken(user: UserProfile): string {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    profileId: user.profileId,
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Register a new user and create their passcode-protected profile.
 * @param input - User creation input
 * @returns Auth result with token and sanitized user
 */
export async function registerUser(input: CreateUserInput): Promise<AuthResult> {
  // Check for existing email
  const existing = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', input.email)
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error('Email already registered');
  }

  const passcodeHash = await hashPasscode(input.passcode);
  const now = new Date();
  const docRef = db.collection(USERS_COLLECTION).doc();

  const userProfile: UserProfile = {
    id: docRef.id,
    name: input.name,
    email: input.email,
    role: input.role,
    profileId: input.profileId,
    passcodeHash,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    phone: input.phone,
    emergencyContact: input.emergencyContact,
  };

  await docRef.set(userProfile);

  // Ensure shared profile document exists
  await db.collection(PROFILES_COLLECTION).doc(input.profileId).set(
    { id: input.profileId, updatedAt: now },
    { merge: true },
  );

  const token = signToken(userProfile);
  const { passcodeHash: _, ...safeUser } = userProfile;
  return { token, user: safeUser };
}

/**
 * Authenticate a user by email and passcode.
 * @param input - Login credentials
 * @returns Auth result with token and sanitized user
 */
export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('email', '==', input.email)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Invalid credentials');
  }

  const doc = snapshot.docs[0];
  const user = doc?.data() as UserProfile;

  const isValid = await verifyPasscode(input.passcode, user.passcodeHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  const token = signToken(user);
  const { passcodeHash: _, ...safeUser } = user;
  return { token, user: safeUser };
}
