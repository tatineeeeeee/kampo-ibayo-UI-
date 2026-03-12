import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from './middleware';

function createRequest(pathname: string, cookies: Record<string, string> = {}): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  const req = new NextRequest(url);
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

describe('middleware — admin routes', () => {
  it('redirects unauthenticated users to /auth', () => {
    const res = middleware(createRequest('/admin'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth');
  });

  it('redirects regular users (role=user) to /auth', () => {
    const res = middleware(createRequest('/admin', {
      kb_authenticated: 'true',
      kb_role: 'user',
    }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth');
  });

  it('allows admin users through', () => {
    const res = middleware(createRequest('/admin', {
      kb_authenticated: 'true',
      kb_role: 'admin',
    }));
    expect(res.status).toBe(200);
  });

  it('allows staff users through admin routes', () => {
    const res = middleware(createRequest('/admin/bookings', {
      kb_authenticated: 'true',
      kb_role: 'staff',
    }));
    expect(res.status).toBe(200);
  });

  it('protects nested admin routes', () => {
    const res = middleware(createRequest('/admin/users', {
      kb_authenticated: 'false',
    }));
    expect(res.status).toBe(307);
  });
});

describe('middleware — /sms-test route', () => {
  it('allows admin users', () => {
    const res = middleware(createRequest('/sms-test', {
      kb_authenticated: 'true',
      kb_role: 'admin',
    }));
    expect(res.status).toBe(200);
  });

  it('blocks staff users from /sms-test', () => {
    const res = middleware(createRequest('/sms-test', {
      kb_authenticated: 'true',
      kb_role: 'staff',
    }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/auth');
  });

  it('blocks unauthenticated users from /sms-test', () => {
    const res = middleware(createRequest('/sms-test'));
    expect(res.status).toBe(307);
  });
});

describe('middleware — public routes', () => {
  it('allows access to /auth', () => {
    const res = middleware(createRequest('/auth'));
    expect(res.status).toBe(200);
  });

  it('allows access to / (home)', () => {
    const res = middleware(createRequest('/'));
    expect(res.status).toBe(200);
  });

  it('allows access to /book', () => {
    const res = middleware(createRequest('/book'));
    expect(res.status).toBe(200);
  });
});
