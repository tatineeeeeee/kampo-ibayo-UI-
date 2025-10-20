"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface UserRole {
  role: string | null;
  isAdmin: boolean;
  isStaff: boolean;
  isUser: boolean;
  loading: boolean;
}

/**
 * Hook to manage role-based access control
 * Returns user role information and helper functions
 */
export function useRoleAccess(): UserRole {
  const [userRole, setUserRole] = useState<UserRole>({
    role: null,
    isAdmin: false,
    isStaff: false,
    isUser: false,
    loading: true
  });

  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.user) {
          setUserRole({
            role: null,
            isAdmin: false,
            isStaff: false,
            isUser: false,
            loading: false
          });
          return;
        }

        // Get user role from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', session.user.id)
          .single();

        if (userError || !userData) {
          console.error('Error fetching user role:', userError);
          setUserRole({
            role: null,
            isAdmin: false,
            isStaff: false,
            isUser: false,
            loading: false
          });
          return;
        }

        const role = userData.role;
        setUserRole({
          role,
          isAdmin: role === 'admin',
          isStaff: role === 'staff',
          isUser: role === 'user',
          loading: false
        });

      } catch (error) {
        console.error('Error in useRoleAccess:', error);
        setUserRole({
          role: null,
          isAdmin: false,
          isStaff: false,
          isUser: false,
          loading: false
        });
      }
    };

    getCurrentUserRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getCurrentUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return userRole;
}

/**
 * Component to show "Admin Required" message for staff users
 */
interface AdminRequiredProps {
  action: string;
  className?: string;
}

export function AdminRequired({ action, className = "" }: AdminRequiredProps) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="text-amber-600 text-sm">
          🔐 <strong>Admin Access Required</strong>
        </div>
      </div>
      <p className="text-amber-700 text-sm mt-1">
        {action} requires administrator privileges. Please contact your resort manager.
      </p>
    </div>
  );
}

/**
 * Higher-order component to wrap admin-only actions
 */
interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  action?: string;
  asFragment?: boolean; // New prop for table elements
}

export function AdminOnly({ children, fallback, action = "This action", asFragment = false }: AdminOnlyProps) {
  const { isAdmin, loading } = useRoleAccess();

  if (loading) {
    // For table elements, return fragment to avoid div wrapper
    if (asFragment) {
      return <>{children}</>;
    }
    // Return invisible placeholder to prevent layout shift
    return <div className="opacity-0 pointer-events-none">{children}</div>;
  }

  if (!isAdmin) {
    return fallback || <AdminRequired action={action} />;
  }

  // For table elements, return fragment to avoid div wrapper
  if (asFragment) {
    return <>{children}</>;
  }

  return <>{children}</>;
}