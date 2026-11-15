import { describe, it, expect, vi } from 'vitest';
import {
  getAdherenceColor,
  getSeverityColor,
  isFuture,
  generateProfileId,
  debounce,
} from '../utils/index.js';

describe('utils', () => {
  describe('getAdherenceColor', () => {
    it('returns green for taken', () => {
      expect(getAdherenceColor('taken')).toContain('green');
    });

    it('returns yellow for skipped', () => {
      expect(getAdherenceColor('skipped')).toContain('yellow');
    });

    it('returns red for missed', () => {
      expect(getAdherenceColor('missed')).toContain('red');
    });

    it('returns fallback gray for unknown status', () => {
      expect(getAdherenceColor('unknown-status')).toContain('gray');
    });
  });

  describe('getSeverityColor', () => {
    it('returns appropriate color classes for severity levels', () => {
      expect(getSeverityColor('none')).toContain('green');
      expect(getSeverityColor('mild')).toContain('yellow');
      expect(getSeverityColor('moderate')).toContain('orange');
      expect(getSeverityColor('severe')).toContain('red');
    });
  });

  describe('isFuture', () => {
    it('returns true for future dates and false for past dates', () => {
      const tomorrow = new Date(Date.now() + 86400000);
      const yesterday = new Date(Date.now() - 86400000);
      expect(isFuture(tomorrow)).toBe(true);
      expect(isFuture(yesterday)).toBe(false);
    });
  });

  describe('generateProfileId', () => {
    it('generates a unique string starting with profile-', () => {
      const id1 = generateProfileId();
      const id2 = generateProfileId();
      expect(id1.startsWith('profile-')).toBe(true);
      expect(id2.startsWith('profile-')).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe('debounce', () => {
    it('delays execution and collapses bursts', async () => {
      const mockFn = vi.fn();
      const debounced = debounce(mockFn, 50);

      debounced();
      debounced();
      debounced();

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(mockFn).toHaveBeenCalledOnce();
    });
  });
});
