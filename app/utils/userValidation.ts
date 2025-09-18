"use client";
import { supabase } from '../supabaseClient';

/**
 * Validates if the current user still exists in the database before allowing actions
 * Use this before any important user actions (booking, profile updates, etc.)
 */
export async function validateUserAction(): Promise<{ isValid: boolean; userRole?: string | null }> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return { isValid: false };
    }

    // Check if user still exists in database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, name, email")
      .eq("auth_id", session.user.id)
      .single();

    if (userError || !userData) {
      console.log("🚫 Action blocked: User account has been deleted");
      
      // Force logout
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      
      // Show message and redirect
      alert("Your account has been permanently removed from our system. You will be redirected to the login page.");
      window.location.href = '/auth';
      
      return { isValid: false };
    }

    return { isValid: true, userRole: userData.role };
  } catch (error) {
    console.error("Error validating user action:", error);
    return { isValid: false };
  }
}

/**
 * Higher-order function to wrap async functions with user validation
 * Example: const safeBooking = withUserValidation(createBooking);
 */
export function withUserValidation<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | null> => {
    const validation = await validateUserAction();
    
    if (!validation.isValid) {
      throw new Error("User account has been deactivated");
    }
    
    return fn(...args);
  };
}

/**
 * React hook for periodic user validation (useful for long-running sessions)
 */
export function usePeriodicValidation(intervalMs: number = 30000) { // Check every 30 seconds
  if (typeof window !== 'undefined') {
    setInterval(async () => {
      const validation = await validateUserAction();
      if (!validation.isValid) {
        // User will be redirected automatically by validateUserAction
        return;
      }
    }, intervalMs);
  }
}