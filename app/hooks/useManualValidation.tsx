"use client";
import { useCallback } from 'react';
import { supabase } from '../supabaseClient';

export function useManualValidation() {
  const validateCurrentUser = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return { isValid: false, reason: 'No session' };
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("role, full_name, email")
        .eq("auth_id", user.id)
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