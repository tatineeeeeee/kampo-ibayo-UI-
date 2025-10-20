"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch actual user role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();
          
          setUserRole(userData?.role || 'user');
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change:", event);
        
        if (session?.user) {
          setUser(session.user);
          
          // Fetch actual user role from database
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();
          
          setUserRole(userData?.role || 'user');
        } else {
          setUser(null);
          setUserRole(null);
        }
        
        // Don't set loading here since it's already set to false after initial load
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}