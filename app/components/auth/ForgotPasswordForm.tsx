"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import { useToastHelpers } from "../Toast";
import { withAuthTimeout, TimeoutError } from "../../utils/apiTimeout";

interface ForgotPasswordFormProps {
  showForgotPassword: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ showForgotPassword, onClose }: ForgotPasswordFormProps) {
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const {
    error: showError,
    passwordResetSent,
  } = useToastHelpers();

  // 🔹 Handle forgot password - OPTIMIZED with timeout protection
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("resetEmail") as string;

    if (!email || !email.includes("@")) {
      showError("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsSendingResetEmail(true);

    try {
      // Proceed with password reset (don't reveal whether email exists)
      const { error } = await withAuthTimeout(
        () =>
          supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth`,
          }),
        8000, // 8 second timeout for email operations
        1 // 1 retry attempt
      );

      if (error) {
        console.error("Password reset error:", error);
      }
      // Always show success to prevent email enumeration
      setResetEmailSent(true);
      passwordResetSent();
    } catch (error: unknown) {
      console.error("Password reset error:", error);

      if (error instanceof TimeoutError) {
        showError(
          "Request Timeout",
          "The request took too long. Please try again."
        );
      } else {
        showError(
          "Reset Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  if (!showForgotPassword) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl mx-2">
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
            Reset Password
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mb-2">
            Enter your email address and we&apos;ll send you a link to
            reset your password.
          </p>
          <p className="text-muted-foreground text-xs">
            📧 Email delivery may take 2-5 minutes. Check your spam
            folder if needed.
          </p>
        </div>{" "}
        {resetEmailSent ? (
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <div className="text-green-600 font-semibold mb-1 text-sm sm:text-base">
                Email Sent!
              </div>
              <div className="text-green-700 text-xs sm:text-sm">
                Check your inbox for password reset instructions.
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                setResetEmailSent(false);
              }}
              className="w-full bg-gray-500 text-foreground py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition text-xs sm:text-sm"
            >
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleForgotPassword}
            className="space-y-3 sm:space-y-4"
          >
            <div className="flex items-center border border-border p-2.5 sm:p-3 rounded-lg">
              <FaEnvelope className="text-muted-foreground mr-2 sm:mr-3 text-xs sm:text-sm flex-shrink-0" />
              <input
                type="email"
                name="resetEmail"
                placeholder="your@email.com"
                className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setResetEmailSent(false);
                }}
                className="w-full sm:w-1/2 bg-gray-500 text-foreground py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition text-xs sm:text-sm order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingResetEmail}
                className="w-full sm:w-1/2 bg-primary text-foreground py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-primary transition text-xs sm:text-sm order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingResetEmail ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

interface PasswordResetFormProps {
  isUpdatingPassword: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function PasswordResetForm({ isUpdatingPassword, onSubmit }: PasswordResetFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 sm:space-y-4 lg:space-y-5"
    >
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Reset Your Password
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password below
        </p>
      </div>

      <div className="flex items-center border border-border p-2.5 sm:p-3 rounded-lg">
        <FaLock className="text-muted-foreground mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
        <input
          type={showPassword ? "text" : "password"}
          name="newPassword"
          placeholder="New Password"
          className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 sm:ml-3 text-muted-foreground hover:text-muted-foreground transition-colors p-1"
        >
          {showPassword ? (
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          ) : (
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          )}
        </button>
      </div>

      <div className="flex items-center border border-border p-2.5 sm:p-3 rounded-lg">
        <FaLock className="text-muted-foreground mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmNewPassword"
          placeholder="Confirm New Password"
          className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
          required
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="ml-2 sm:ml-3 text-muted-foreground hover:text-muted-foreground transition-colors p-1"
        >
          {showConfirmPassword ? (
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          ) : (
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          )}
        </button>
      </div>

      <button
        type="submit"
        disabled={isUpdatingPassword}
        className="w-full bg-primary text-foreground py-2.5 sm:py-3 rounded-lg font-semibold shadow hover:bg-primary transition text-xs sm:text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUpdatingPassword
          ? "Updating Password..."
          : "Update Password"}
      </button>

      <div className="text-center mt-3 sm:mt-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          🔒 For security, you must set a new password to continue
        </p>
      </div>
    </form>
  );
}
