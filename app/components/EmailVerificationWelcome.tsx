"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToastHelpers } from "./Toast";

export function EmailVerificationWelcome() {
  const { user, loading } = useAuth();
  const { verificationSuccess } = useToastHelpers();
  const hasShownWelcome = useRef(false);

  useEffect(() => {
    // Only run once when user is loaded and not during initial load
    if (loading || hasShownWelcome.current || !user) return;

    // Check if user just verified their email via URL hash
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const type = params.get("type");

      // If we have an access_token and it's an email verification (not recovery/password reset)
      if (accessToken && type !== "recovery") {
        // Check if this is a new session (user just verified email)
        const lastWelcomeTime = sessionStorage.getItem("last_welcome_shown");
        const now = Date.now();

        // Only show welcome if we haven't shown it in the last 5 seconds
        // This prevents duplicate toasts on navigation
        if (!lastWelcomeTime || now - parseInt(lastWelcomeTime) > 5000) {
          sessionStorage.setItem("last_welcome_shown", now.toString());
          hasShownWelcome.current = true;

          // Show welcome notification
          setTimeout(() => {
            verificationSuccess();
          }, 500); // Small delay to ensure UI is ready

          // Clean up the hash from URL to prevent re-triggering
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
  }, [user, loading, verificationSuccess]);

  return null; // This component doesn't render anything
}
