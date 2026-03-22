"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaLock, FaEnvelope } from "react-icons/fa";
import { Eye, EyeOff } from "lucide-react";
import { useToastHelpers } from "../Toast";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  formKey: number;
  onForgotPassword: () => void;
}

export default function LoginForm({ formKey, onForgotPassword }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const {
    error: showError,
    warning,
    loginSuccess,
  } = useToastHelpers();

  // 🔹 Handle login with Supabase Auth
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Clear any existing corrupted session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);

        // Handle specific auth errors
        if (error.message.includes("Invalid login credentials")) {
          showError(
            "Invalid Credentials",
            "Please check your email and password and try again."
          );
        } else if (error.message.includes("Email not confirmed")) {
          warning(
            "Email Not Confirmed",
            "Please check your email and confirm your account before logging in."
          );
        } else {
          showError("Login Failed", error.message);
        }
        return;
      }

      if (data.user) {

        // Check user role from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, full_name, email")
          .eq("auth_id", data.user.id)
          .single();


        if (userError) {
          // This happens when user exists in Supabase Auth but not in your users table

          // If user doesn't exist in users table but auth exists, they might be deleted
          if (userError.code === "PGRST116") {

            // Account has been permanently deleted
            showError(
              "Account Deleted",
              "Your account has been permanently removed from our system. You will need to create a new account to access our services."
            );
            await supabase.auth.signOut();
            return;
          }

          // For other errors, redirect to homepage as fallback
          loginSuccess("user");
          setTimeout(() => router.push("/"), 1500);
        } else {
          const userRole = userData?.role || "user";

          if (userRole === "admin" || userRole === "staff") {
            loginSuccess(userRole);
            setTimeout(() => router.push("/admin"), 1500);
          } else {
            loginSuccess("user");
            setTimeout(() => router.push("/"), 1500);
          }
        }
      }
    } catch (error: unknown) {
      console.error("Unexpected login error:", error);

      // Handle refresh token errors specifically
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("refresh") || errorMessage.includes("token")) {
        await supabase.auth.signOut();
        localStorage.removeItem("supabase.auth.token");
        warning("Session Expired", "Please try logging in again.");
      } else {
        showError(
          "Unexpected Error",
          "An unexpected error occurred. Please try again."
        );
      }
    }
  };

  return (
    <form
      key={`login-${formKey}`}
      onSubmit={handleLogin}
      className="space-y-3 sm:space-y-4 lg:space-y-5"
      autoComplete="off"
    >
      <div className="flex items-center border border-border p-2.5 sm:p-3 rounded-lg bg-background">
        <FaEnvelope className="text-muted-foreground mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
          autoComplete="new-email"
          required
        />
      </div>

      <div className="flex items-center border border-border p-2.5 sm:p-3 rounded-lg bg-background">
        <FaLock className="text-muted-foreground mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          className="w-full outline-none bg-transparent text-foreground placeholder:text-muted-foreground text-xs sm:text-sm lg:text-base"
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="ml-2 sm:ml-3 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {showPassword ? (
            <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          ) : (
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
          )}
        </button>
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-primary-foreground py-2.5 sm:py-3 rounded-lg font-semibold shadow hover:bg-primary/90 transition text-xs sm:text-sm lg:text-base"
      >
        Sign In
      </button>

      <div className="text-center mt-3 sm:mt-4">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-primary hover:text-primary/80 text-xs sm:text-sm font-medium hover:underline transition-colors"
        >
          Forgot your password?
        </button>
      </div>
    </form>
  );
}
