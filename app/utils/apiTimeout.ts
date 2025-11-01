// 🔧 API Timeout Utility - Prevents hanging API calls after tab inactivity
// This utility wraps API calls with timeout protection

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
  timeoutMs: number = 5000, 
  errorMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Wraps Supabase auth operations with timeout and retry logic
 * @param operation The Supabase operation function
 * @param timeoutMs Timeout in milliseconds (default: 3000ms for auth)
 * @param retries Number of retry attempts (default: 1)
 */
export async function withAuthTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 3000,
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
 * Safe logout function that always completes even if Supabase hangs
 * @param supabase Supabase client
 * @param timeoutMs Timeout for the signOut operation (default: 2000ms)
 */
export async function safeLogout(supabase: { auth: { signOut: (options?: { scope?: 'global' | 'local' | 'others' }) => Promise<{ error: unknown }> } }, timeoutMs: number = 2000): Promise<void> {
  try {
    // Try to sign out with timeout
    await withTimeout(
      supabase.auth.signOut({ scope: 'global' }),
      timeoutMs,
      'Logout operation timed out'
    );
    console.log('✅ Supabase logout successful');
  } catch (error) {
    if (error instanceof TimeoutError) {
      console.warn('⏰ Logout timed out, proceeding with local cleanup');
    } else {
      console.error('❌ Logout error:', error);
    }
    // Continue with cleanup regardless of Supabase response
  }

  // Always clear local storage
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
  }
}