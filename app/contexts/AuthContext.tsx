"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { User, Session } from '@supabase/supabase-js';

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
    // Get initial session with retry logic
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

        // 🛡️ SAFE FIX: Add retry logic with timeout
        let session = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`🔄 AuthContext: Session check attempt ${attempt}/3`);
            
              const sessionPromise = supabase.auth.getSession();
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Session timeout')), 5000)
              );

              const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
              session = result.data?.session;
            break; // Success - exit retry loop
            
          } catch (retryError) {
            console.log(`⚠️ AuthContext: Attempt ${attempt} failed:`, retryError);
            if (attempt === 3) {
              throw retryError; // Final attempt failed
            }
            // Wait 1 second before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (session?.user) {
          setUser(session.user);
          
          // 🛡️ SAFE FIX: Add error recovery for role query
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('auth_id', session.user.id)
              .single();
            
            setUserRole(userData?.role || 'user');
          } catch (roleError) {
            console.warn('AuthContext: Role query failed, defaulting to user:', roleError);
            setUserRole('user'); // Safe fallback
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("AuthContext: All session attempts failed:", error);
        setUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // ✅ THROTTLED: Listen for auth changes (prevent navigation blocking)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔔 AuthContext: Auth state change:", event);
        
        // ✅ THROTTLE: Ignore rapid auth changes that can block navigation
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 AuthContext: Token refreshed (ignoring to prevent navigation hang)');
          return;
        }
        
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
          
          // ✅ NON-BLOCKING: Fetch user role without blocking navigation
          setTimeout(async () => {
            try {
              console.log('🔄 AuthContext: Fetching user role (non-blocking)...');
              const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('auth_id', session.user.id)
              .single();
            
              setUserRole(userData?.role || 'user');
              console.log('✅ AuthContext: User role fetched (non-blocking)');
            } catch (error) {
              console.error('❌ AuthContext: Failed to fetch user role:', error);
              setUserRole('user');
            }
          }, 50); // 50ms delay to not block navigation
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 🛡️ COMPLETELY DISABLED: Auto-refresh was causing 30-second navigation hanging
  useEffect(() => {
    console.log('🔕 AuthContext: Auto-refresh COMPLETELY DISABLED to fix navigation hanging');
    // All auto-refresh logic removed to prevent navigation issues
  }, []); // Empty dependency array, no auto-refresh

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