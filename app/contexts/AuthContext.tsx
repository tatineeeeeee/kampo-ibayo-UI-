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
        // Check if we're in password reset mode - only block if explicitly set
        const inPasswordReset = typeof window !== 'undefined' && 
          localStorage.getItem('in_password_reset') === 'true';
        
        if (inPasswordReset) {
          console.log('🔒 AuthContext: In password reset mode, skipping auto-login');
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

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
        console.log("AuthContext: Auth state change:", event);
        
        // Always handle SIGNED_OUT events
        if (event === 'SIGNED_OUT') {
          console.log('🚪 AuthContext: User signed out');
          setUser(null);
          setUserRole(null);
          return;
        }
        
        // Check if we're in password reset mode
        const inPasswordReset = typeof window !== 'undefined' && 
          localStorage.getItem('in_password_reset') === 'true';
        
        // During password reset, ignore all auth events except SIGNED_OUT
        if (inPasswordReset) {
          console.log('🔒 AuthContext: Ignoring auth change during password reset:', event);
          return;
        }

        // Handle normal sign in events
        if (session?.user) {
          console.log('👤 AuthContext: User signed in');
          setUser(session.user);
          
          // Fetch actual user role from database
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('auth_id', session.user.id)
              .single();
            
            setUserRole(userData?.role || 'user');
          } catch (error) {
            console.error('Failed to fetch user role:', error);
            setUserRole('user');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🛡️ SAFE GRADUAL FIX: Handle window focus to refresh auth state after periods of inactivity  
  // This prevents the "buttons not working after tab inactivity" issue
  // TOGGLE: Set to false if any issues occur
  useEffect(() => {
    const ENABLE_AUTO_REFRESH = true; // 🔧 Set to false to disable if needed
    
    if (!ENABLE_AUTO_REFRESH) {
      console.log('🔕 AuthContext: Auto-refresh disabled');
      return;
    }

    const handleFocus = async () => {
      try {
        // Only refresh if we have a user AND it's been more than 5 minutes since last activity
        if (user) {
          const lastActivity = localStorage.getItem('lastActivity');
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (!lastActivity || (now - parseInt(lastActivity)) > fiveMinutes) {
            console.log('🔄 AuthContext: Refreshing session on window focus (5+ min inactive)');
            await supabase.auth.refreshSession();
            localStorage.setItem('lastActivity', now.toString());
          }
        }
      } catch (error) {
        // Fail completely silently - never break existing functionality
        console.log('AuthContext: Session refresh on focus failed (non-critical):', error);
      }
    };

    // Update activity timestamp on any interaction
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Only add listener if we have a window (client-side)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleFocus);
      window.addEventListener('click', updateActivity);
      window.addEventListener('keydown', updateActivity);
      
      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('click', updateActivity);
        window.removeEventListener('keydown', updateActivity);
      };
    }
  }, [user]); // Depend on user so it only runs when logged in

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