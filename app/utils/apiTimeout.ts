// 🔧 API Timeout Utility - Prevents hanging API calls after tab inactivity
// This utility wraps API calls with timeout protection

import { SESSION_TIMEOUT_MS, AUTH_TIMEOUT_MS, LOGOUT_TIMEOUT_MS, SESSION_REFRESH_BUFFER_MS } from "../lib/constants/timeouts";

export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout to prevent hanging operations
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 5000ms)
 * @param errorMessage Custom error message
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number = SESSION_TIMEOUT_MS,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Wraps Supabase auth operations with timeout and retry logic
 * @param operation The Supabase operation function
 * @param timeoutMs Timeout in milliseconds (default: 3000ms for auth)
 * @param retries Number of retry attempts (default: 1)
 */
export async function withAuthTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = AUTH_TIMEOUT_MS,
  retries: number = 1
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(operation(), timeoutMs);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retries) {
        console.warn(`Auth operation failed (attempt ${attempt + 1}/${retries + 1}):`, error);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError!;
}

/**
 * Gets a valid session token for API calls.
 * Uses getSession() (fast, cached). Only calls refreshSession() if token
 * is expired or about to expire within 60 seconds.
 * This avoids 429 rate limits from calling refreshSession() on every request.
 */
export async function getFreshSession(supabaseClient: {
  auth: {
    getSession: () => Promise<{ data: { session: { access_token: string; expires_at?: number; user?: { id: string; email?: string } } | null } }>;
    refreshSession: () => Promise<{ data: { session: { access_token: string; expires_at?: number; user?: { id: string; email?: string } } | null }; error: unknown }>;
  };
}) {
  const { data: { session: cached } } = await supabaseClient.auth.getSession();
  if (!cached) return null;

  // Check if token is expired or about to expire (within 60 seconds)
  const expiresAt = cached.expires_at ? cached.expires_at * 1000 : 0;
  const isExpiringSoon = expiresAt > 0 && expiresAt - Date.now() < SESSION_REFRESH_BUFFER_MS;

  if (!isExpiringSoon) return cached;

  // Only refresh when truly needed
  try {
    const { data: { session: refreshed }, error } = await supabaseClient.auth.refreshSession();
    if (!error && refreshed) return refreshed;
  } catch {
    // Refresh failed — token is unusable
  }

  // Token is expiring/expired and refresh failed — don't return stale token
  return null;
}

/**
 * Fetch with automatic auth token and 401 retry.
 * If the server returns 401, attempts one token refresh and retries the request.
 */
export async function fetchWithAuth(
  supabaseClient: Parameters<typeof getFreshSession>[0],
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await getFreshSession(supabaseClient);
  if (!session?.access_token) {
    throw new Error("Authentication required. Please log in again.");
  }

  const makeRequest = (token: string) =>
    fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  const response = await makeRequest(session.access_token);

  if (response.status === 401) {
    // Token may have expired between getFreshSession check and server validation
    try {
      const { data: { session: refreshed }, error } =
        await supabaseClient.auth.refreshSession();
      if (!error && refreshed) {
        return makeRequest(refreshed.access_token);
      }
    } catch {
      // Refresh failed
    }
    throw new Error("Authentication required. Please log in again.");
  }

  return response;
}

/**
 * Safe logout function that always completes even if Supabase hangs
 * @param supabase Supabase client
 * @param timeoutMs Timeout for the signOut operation (default: 2000ms)
 */
export async function safeLogout(supabase: { auth: { signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<{ error: unknown }> } }, timeoutMs: number = LOGOUT_TIMEOUT_MS): Promise<void> {
  try {
    // Try to sign out with timeout
    await withTimeout(
      supabase.auth.signOut({ scope: 'global' }),
      timeoutMs,
      'Logout operation timed out'
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.warn('⏰ Logout timed out, proceeding with local cleanup');
    } else {
      console.error('❌ Logout error:', error);
    }
    // Continue with cleanup regardless of Supabase response
  }

  // Clear auth-related storage only (not all user preferences)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
    // Clear any Supabase-specific auth keys
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        localStorage.removeItem(key);
      }
    }
    sessionStorage.clear();
  }
}