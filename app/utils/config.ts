/**
 * Application configuration utilities
 * Provides consistent environment variable handling across the app
 */

/**
 * Get the base URL for the application
 * Priority: NEXT_PUBLIC_BASE_URL > NEXT_PUBLIC_SITE_URL > VERCEL_URL > localhost
 */
export function getBaseUrl(): string {
  // For client-side (browser)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // For server-side
  // 1. Check for explicitly set base URL (highest priority)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // 2. Check for site URL (backward compatibility)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // 3. Check for Vercel URL (automatic in Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // 4. Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the API base URL for internal API calls
 */
export function getApiBaseUrl(): string {
  return getBaseUrl();
}

/**
 * Build a full URL from a path
 */
export function buildUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
}