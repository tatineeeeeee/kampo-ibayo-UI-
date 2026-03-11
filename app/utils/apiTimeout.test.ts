import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, withAuthTimeout, safeLogout, TimeoutError } from './apiTimeout';

describe('TimeoutError', () => {
  it('creates error with default message', () => {
    const err = new TimeoutError();
    expect(err.message).toBe('Operation timed out');
    expect(err.name).toBe('TimeoutError');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(TimeoutError);
  });

  it('creates error with custom message', () => {
    const err = new TimeoutError('Custom timeout');
    expect(err.message).toBe('Custom timeout');
    expect(err.name).toBe('TimeoutError');
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when promise completes before timeout', async () => {
    const promise = Promise.resolve('success');
    const result = await withTimeout(promise, 5000);
    expect(result).toBe('success');
  });

  it('rejects with TimeoutError when promise exceeds timeout', async () => {
    const neverResolves = new Promise<string>(() => {});
    const wrapped = withTimeout(neverResolves, 1000);

    vi.advanceTimersByTime(1001);

    await expect(wrapped).rejects.toThrow(TimeoutError);
    await expect(wrapped).rejects.toThrow('Operation timed out after 1000ms');
  });

  it('uses custom error message when provided', async () => {
    const neverResolves = new Promise<string>(() => {});
    const wrapped = withTimeout(neverResolves, 1000, 'Custom message');

    vi.advanceTimersByTime(1001);

    await expect(wrapped).rejects.toThrow('Custom message');
  });

  it('uses default 5000ms timeout', async () => {
    const neverResolves = new Promise<string>(() => {});
    const wrapped = withTimeout(neverResolves);

    vi.advanceTimersByTime(4999);
    // Should not have timed out yet — we can't easily check pending state,
    // but advancing past 5000 should trigger it
    vi.advanceTimersByTime(2);

    await expect(wrapped).rejects.toThrow(TimeoutError);
  });

  it('clears timeout when promise resolves first', async () => {
    const clearSpy = vi.spyOn(global, 'clearTimeout');

    const promise = Promise.resolve('done');
    await withTimeout(promise, 5000);

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it('propagates original error when promise rejects before timeout', async () => {
    const promise = Promise.reject(new Error('original error'));
    await expect(withTimeout(promise, 5000)).rejects.toThrow('original error');
  });
});

describe('withAuthTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves on first attempt when operation succeeds', async () => {
    const operation = vi.fn().mockResolvedValue('auth-data');
    const result = await withAuthTimeout(operation, 3000, 1);
    expect(result).toBe('auth-data');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds on second attempt', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('first fail'))
      .mockResolvedValueOnce('retry-success');

    // withAuthTimeout uses real setTimeout for the 500ms retry delay,
    // so we need to advance timers
    const resultPromise = withAuthTimeout(operation, 3000, 1);

    // Advance past the 500ms retry delay
    await vi.advanceTimersByTimeAsync(501);

    const result = await resultPromise;
    expect(result).toBe('retry-success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('throws last error after all retries exhausted', async () => {
    let callCount = 0;
    const operation = vi.fn(() => {
      callCount++;
      return Promise.reject(new Error(`fail-${callCount}`));
    });

    const resultPromise = withAuthTimeout(operation, 3000, 1).catch((e: Error) => e);

    await vi.advanceTimersByTimeAsync(501);

    const error = await resultPromise;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('fail-2');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('uses default timeout of 3000ms and 1 retry', async () => {
    const operation = vi.fn().mockResolvedValue('ok');
    await withAuthTimeout(operation);
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('does not retry when retries is 0', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('fail'));

    await expect(withAuthTimeout(operation, 3000, 0)).rejects.toThrow('fail');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('safeLogout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('completes successfully when signOut resolves', async () => {
    const mockSupabase = {
      auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
    };

    await safeLogout(mockSupabase);
    expect(mockSupabase.auth.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('handles timeout without throwing', async () => {
    const mockSupabase = {
      auth: { signOut: vi.fn(() => new Promise(() => {})) }, // never resolves
    };

    const logoutPromise = safeLogout(mockSupabase, 1000);
    vi.advanceTimersByTime(1001);

    // Should not throw — safeLogout catches TimeoutError
    await expect(logoutPromise).resolves.toBeUndefined();
  });

  it('handles signOut error without throwing', async () => {
    const mockSupabase = {
      auth: { signOut: vi.fn().mockRejectedValue(new Error('network error')) },
    };

    await expect(safeLogout(mockSupabase)).resolves.toBeUndefined();
  });
});
