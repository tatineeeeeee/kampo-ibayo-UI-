"use client";

import { useAuth } from '../contexts/AuthContext';

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
 * Now uses AuthContext for consistency
 */
export function useRoleAccess(): UserRole {
  const { userRole, loading } = useAuth();

  return {
    role: userRole,
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'staff', 
    isUser: userRole === 'user',
    loading
  };
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