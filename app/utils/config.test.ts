import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getBaseUrl } from './config';

describe('getBaseUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env to a clean state for each test
    vi.stubGlobal('window', undefined);
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_BASE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it('returns NEXT_PUBLIC_BASE_URL when set (highest priority)', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://kampoibayow.com';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site-url.com';
    process.env.VERCEL_URL = 'vercel-deploy.vercel.app';

    expect(getBaseUrl()).toBe('https://kampoibayow.com');
  });

  it('falls back to NEXT_PUBLIC_SITE_URL when BASE_URL not set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://site-url.com';
    process.env.VERCEL_URL = 'vercel-deploy.vercel.app';

    expect(getBaseUrl()).toBe('https://site-url.com');
  });

  it('falls back to VERCEL_URL with https prefix', () => {
    process.env.VERCEL_URL = 'my-app-abc123.vercel.app';

    expect(getBaseUrl()).toBe('https://my-app-abc123.vercel.app');
  });

  it('falls back to localhost when no env vars set', () => {
    expect(getBaseUrl()).toBe('http://localhost:3000');
  });

  it('returns window.location.origin on client side', () => {
    vi.stubGlobal('window', { location: { origin: 'https://browser-origin.com' } });

    // Even if env vars are set, client-side should use window.location.origin
    process.env.NEXT_PUBLIC_BASE_URL = 'https://kampoibayow.com';

    expect(getBaseUrl()).toBe('https://browser-origin.com');
  });
});
