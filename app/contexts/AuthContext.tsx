"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
import { useToastHelpers } from "../components/Toast";

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
  const [isHydrated, setIsHydrated] = useState(false);
  const { verificationSuccess } = useToastHelpers();
  const [welcomeShown, setWelcomeShown] = useState(false);

  // Fix hydration mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        // Check if we're in password reset mode - only block if explicitly set
        const inPasswordReset =
          typeof window !== "undefined" &&
          localStorage.getItem("in_password_reset") === "true";

        if (inPasswordReset) {
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        // 🛡️ SAFE FIX: Add retry logic with timeout
        let session = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {

            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Session timeout")), 5000)
            );

            const result = (await Promise.race([
              sessionPromise,
              timeoutPromise,
            ])) as { data: { session: Session | null } };
            session = result.data?.session;
            break; // Success - exit retry loop
          } catch (retryError) {
            if (attempt === 3) {
              throw retryError; // Final attempt failed
            }
            // Wait 1 second before retry
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        if (session?.user) {
          setUser(session.user);

          // 🛡️ SAFE FIX: Add error recovery for role query
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", session.user.id)
              .single();

            setUserRole(userData?.role || "user");
          } catch (roleError) {
            console.warn(
              "AuthContext: Role query failed, defaulting to user:",
              roleError
            );
            setUserRole("user"); // Safe fallback
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // ✅ THROTTLE: Ignore rapid auth changes that can block navigation
      if (event === "TOKEN_REFRESHED") {
        return;
      }

      // Always handle SIGNED_OUT events
      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole(null);
        return;
      }

      // Check if we're in password reset mode
      const inPasswordReset =
        typeof window !== "undefined" &&
        localStorage.getItem("in_password_reset") === "true";

      // During password reset, ignore all auth events except SIGNED_OUT
      if (inPasswordReset) {
        return;
      }

      // Handle normal sign in events
      if (session?.user) {
        setUser(session.user);

        // ✅ NON-BLOCKING: Fetch user role without blocking navigation
        setTimeout(async () => {
          try {
            const { data: userData } = await supabase
              .from("users")
              .select("role")
              .eq("auth_id", session.user.id)
              .single();

            setUserRole(userData?.role || "user");
          } catch (error) {
            console.error("❌ AuthContext: Failed to fetch user role:", error);
            setUserRole("user");
          }
        }, 50); // 50ms delay to not block navigation

        // 🔔 Guarded welcome toast for email verification sign-in
        try {
          if (typeof window !== "undefined" && !welcomeShown) {
            const hash = window.location.hash || "";
            const params = new URLSearchParams(
              hash.startsWith("#") ? hash.substring(1) : hash
            );
            const accessToken = params.get("access_token");
            const type = params.get("type");

            // Fire only for verification (not password recovery), only once
            const awaitingEmailVerification =
              localStorage.getItem("awaiting_email_verification") === "true";
            if (
              (accessToken && type !== "recovery") ||
              awaitingEmailVerification
            ) {
              // Debounce using sessionStorage to avoid duplicates across navigations
              const lastWelcome = sessionStorage.getItem(
                "email_verify_welcome"
              );
              const now = Date.now();
              if (!lastWelcome || now - parseInt(lastWelcome) > 5000) {
                sessionStorage.setItem("email_verify_welcome", now.toString());
                setWelcomeShown(true);
                // Slight delay to ensure UI/providers ready
                setTimeout(() => {
                  verificationSuccess();
                }, 200);
                // If we came from signup (flag set), clear it now
                if (awaitingEmailVerification) {
                  localStorage.removeItem("awaiting_email_verification");
                }
                // Clean hash to prevent re-trigger
                if (window.history.replaceState) {
                  window.history.replaceState(
                    null,
                    "",
                    window.location.pathname + window.location.search
                  );
                }
              }
            }
          }
        } catch (e) {
          console.warn("AuthContext: Welcome toast guard failed silently:", e);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  // 🛡️ COMPLETELY DISABLED: Auto-refresh was causing 30-second navigation hanging
  useEffect(() => {
    // All auto-refresh logic removed to prevent navigation issues
  }, []); // Empty dependency array, no auto-refresh

  // Don't render anything until hydrated to prevent button issues
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
