"use client";
import { useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useManualValidation() {
  const validateCurrentUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        return { isValid: false, reason: 'No session' };
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role, name, email")
        .eq("auth_id", session.user.id)
        .single();

      if (error || !userData) {
        return { isValid: false, reason: 'User deleted' };
      }

      return { isValid: true, user: userData, reason: 'Valid' };
    } catch {
      return { isValid: false, reason: 'Error checking user' };
    }
  }, []);

  return { validateCurrentUser };
}