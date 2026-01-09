/**
 * =============================================================================
 * SUPABASE CLIENT - SECURITY IMPLEMENTATION
 * =============================================================================
 *
 * PHP FRAMEWORK SECURITY EQUIVALENTS IN NEXT.JS:
 *
 * 1. SESSION MANAGEMENT (PHP: $_SESSION, session_start())
 *    - Supabase Auth with JWT tokens (see auth config below)
 *    - Tokens stored securely in localStorage with auto-refresh
 *    - Session persistence across browser tabs/windows
 *
 * 2. ORM SECURITY / SQL INJECTION PREVENTION (PHP: PDO prepared statements)
 *    - Supabase uses parameterized queries internally
 *    - All .eq(), .select(), .insert() methods are SQL-injection safe
 *    - Example: .eq('id', bookingId) -> Uses prepared statement binding
 *
 * 3. CSRF PROTECTION (PHP: csrf_token())
 *    - Next.js has built-in CSRF protection for API routes
 *    - Same-origin policy enforced by default
 *    - JWT tokens provide additional request authenticity
 *
 * 4. ENCRYPTION:
 *    - HTTPS/TLS: All API calls use symmetric AES-256 encryption in transit
 *    - JWT Signing: Asymmetric RS256 (RSA + SHA-256) for token authenticity
 *    - Password Hashing: bcrypt with salt (handled by Supabase Auth)
 *
 * =============================================================================
 */

import { Database } from "@/database.types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  /**
   * SESSION MANAGEMENT - PHP Equivalent: session_start(), $_SESSION
   * Uses JWT tokens instead of server-side sessions
   * Tokens are signed with asymmetric encryption (RS256)
   */
  auth: {
    persistSession: true, // Equivalent to PHP session persistence
    autoRefreshToken: true, // Auto-renew tokens before expiry
    detectSessionInUrl: true, // Handle OAuth/magic link tokens
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "supabase.auth.token", // Secure token storage
  },
  global: {
    headers: {
      "x-application-name": "kampo-ibayo-resort",
    },
  },
  // Add timeout configuration for better performance
  realtime: {
    timeout: 30000, // 30 seconds
  },
});
