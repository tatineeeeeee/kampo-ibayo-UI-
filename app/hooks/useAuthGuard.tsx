"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

export function useAuthGuard() {
  const [isValidUser, setIsValidUser] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const checkUserExists = useCallback(async () => {
    // Only check once to avoid repetitive calls
    if (hasChecked) return isValidUser;
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        setIsValidUser(false);
        setHasChecked(true);
        return false;
      }

      // Check if user still exists in database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, name, email")
        .eq("auth_id", session.user.id)
        .single();

      if (userError || !userData) {
        console.log("🚫 User account has been deleted");
        
        // Force logout
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        
        setIsValidUser(false);
        setUserRole(null);
        setHasChecked(true);
        return false;
      }

      setIsValidUser(true);
      setUserRole(userData.role);
      setHasChecked(true);
      return true;
    } catch (error) {
      console.error("Error checking user existence:", error);
      setIsValidUser(false);
      setHasChecked(true);
      return false;
    }
  }, [hasChecked, isValidUser]);

  useEffect(() => {
    checkUserExists();
  }, [checkUserExists]);

  return {
    isValidUser,
    userRole,
    checkUserExists,
    isLoading: isValidUser === null && !hasChecked
  };
}

// Higher-order component to protect pages
export function withAuthGuard<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuardedComponent(props: T) {
    const { isValidUser, isLoading } = useAuthGuard();
    const [showDeactivated, setShowDeactivated] = useState(false);
    const router = useRouter();

    // Handle deactivation state
    useEffect(() => {
      if (isValidUser === false && !isLoading) {
        setShowDeactivated(true);
        // Delay redirect to avoid interfering with modals
        const timer = setTimeout(() => {
          router.push('/auth');
        }, 3000); // 3 second delay

        return () => clearTimeout(timer);
      }
    }, [isValidUser, isLoading, router]);

    // Show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-xl text-gray-600">Verifying account...</div>
        </div>
      );
    }

    // Show deactivation message (non-blocking)
    if (showDeactivated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Removed</h2>
            <p className="text-gray-600 mb-6">
              Your account has been permanently removed from our system. 
              You will be redirected to the login page in a few seconds.
            </p>
            <button 
              onClick={() => router.push('/auth')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      );
    }

    // Render the protected component
    return <WrappedComponent {...props} />;
  };
}