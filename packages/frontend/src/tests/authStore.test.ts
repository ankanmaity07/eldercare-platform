import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/authStore.js';
import type { User } from '../types/index.js';

const mockUser: User = {
  id: 'usr-456',
  name: 'Martha Stewart',
  email: 'martha@care.com',
  role: 'elderly',
  profileId: 'family-martha',
  createdAt: new Date().toISOString(),
  isActive: true,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('updates state on setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-jwt-token-string');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe('test-jwt-token-string');
  });

  it('resets state on clearAuth', () => {
    useAuthStore.getState().setAuth(mockUser, 'jwt');
    useAuthStore.getState().clearAuth();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('toggles isLoading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
