"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

export function useAuthGuard() {
  const [isValidUser, setIsValidUser] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setIsValidUser(true);
          setUserRole(session.user.user_metadata?.role || null);
        } else {
          setIsValidUser(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsValidUser(true);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  return {
    isValidUser,
    userRole,
    isLoading
  };
}

export function withAuthGuard<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuardedComponent(props: T) {
    const { isValidUser, isLoading } = useAuthGuard();
    const router = useRouter();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <div className="text-lg text-gray-300">Loading...</div>
          </div>
        </div>
      );
    }

    if (isValidUser === false) {
      router.push('/auth');
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
