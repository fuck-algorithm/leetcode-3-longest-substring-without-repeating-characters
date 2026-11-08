import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearRetryAfter,
  getCached,
  getCachedEvenExpired,
  getRetryAfter,
  getSetting,
  setCached,
  setRetryAfter,
  setSetting
} from './indexedDbStore';

describe('indexedDbStore', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists and reads settings', async () => {
    await setSetting('test-setting', 'python');
    await expect(getSetting('test-setting', 'java')).resolves.toBe('python');
  });

  it('returns fallback for missing settings', async () => {
    await expect(getSetting('missing-setting', 1)).resolves.toBe(1);
  });

  it('returns fresh cache values and accepts zero as a value', async () => {
    await setCached('fresh-cache', { value: 42 }, 60);
    await expect(getCached<{ value: number }>('fresh-cache')).resolves.toEqual({ value: 42 });

    await setCached('zero-star-count', 0, 1800);
    await expect(getCached<number>('zero-star-count')).resolves.toBe(0);
  });

  it('expires cache entries but keeps them for stale fallback', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    await setCached('expiring-cache', 'old', 1);
    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));

    await expect(getCached('expiring-cache')).resolves.toBeUndefined();
    await expect(getCachedEvenExpired('expiring-cache')).resolves.toBe('old');
  });

  it('persists retry cooldown across reloads and expires it on schedule', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    await setRetryAfter('retry-key', 30 * 60 * 1000);
    await expect(getRetryAfter('retry-key')).resolves.toBeGreaterThan(Date.now());

    vi.setSystemTime(new Date('2026-01-01T00:30:01Z'));
    await expect(getRetryAfter('retry-key')).resolves.toBeNull();

    await setRetryAfter('retry-key', 1000);
    await clearRetryAfter('retry-key');
    await expect(getRetryAfter('retry-key')).resolves.toBeNull();
  });
});
