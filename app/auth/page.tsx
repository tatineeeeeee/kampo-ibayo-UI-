"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient"; // adjust path if needed
import {FaLock, FaEnvelope, FaUser, FaPhone, FaUserPlus } from "react-icons/fa";
import { 
  Eye, EyeOff, Check, X, Shield, Star, Users, 
  Mountain
} from "lucide-react";
import { useToastHelpers } from "../components/Toast";
import { cleanPhoneForDatabase, formatPhoneForDisplay, validatePhilippinePhone } from "../utils/phoneUtils";
import Image from "next/image";

export default function AuthPage() {
  // Check for recovery mode immediately
  const isInRecoveryMode = typeof window !== 'undefined' && 
    window.location.hash.includes('type=recovery') && 
    window.location.hash.includes('access_token');

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(isInRecoveryMode); // Set immediately if in recovery
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [recoveryProcessed, setRecoveryProcessed] = useState(false);
  const router = useRouter();
  const { error: showError, warning, info, loginSuccess, registrationSuccess, passwordResetSent } = useToastHelpers();

  // Handle session recovery and cleanup on component mount
  useEffect(() => {
    const handleSessionRecovery = async () => {
      try {
        // Only check for recovery mode if not already processed
        if (!recoveryProcessed) {
          const urlParams = new URLSearchParams(window.location.search);
          const hashParams = new URLSearchParams(window.location.hash.slice(1));
          const mode = urlParams.get('mode');
          const hasRecoveryToken = hashParams.has('access_token') && hashParams.get('type') === 'recovery';
          
          // Only enter password reset mode if we have a recovery token
          if (hasRecoveryToken) {
            console.log("🔄 User returning from password reset email - MUST set new password");
            setIsPasswordReset(true);
            setRecoveryProcessed(true);
            info("Password Reset", "You must enter a new password to complete the reset process.");
            setIsLoading(false);
            return; // Exit early for password reset flow - MUST complete password reset
          } else if (mode === 'recovery') {
            // If mode=recovery but no hash, clear it and continue to normal login
            console.log("⚠️ Recovery mode detected but no token - clearing URL");
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log("Session error:", error.message);
          // Clear any corrupted session data
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
        }
        
        // Check for recovery mode more strictly
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const isRecoverySession = hashParams.has('access_token') && hashParams.get('type') === 'recovery';
        
        // If in recovery mode, NEVER auto-login regardless of session
        if (isRecoverySession) {
          console.log("🔒 RECOVERY MODE - Blocking all auto-login, user MUST set new password");
          // Force password reset mode and exit early
          if (!recoveryProcessed) {
            setIsPasswordReset(true);
            setRecoveryProcessed(true);
            info("Password Reset Required", "You must enter a new password to complete the reset process.");
          }
          setIsLoading(false);
          return; // Exit early - NO auto-login allowed
        }
        
        if (session?.user) {
          // Only auto-login if NOT in recovery mode
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", session.user.id)
            .single();
            
          if (userData?.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/");
          }
          return;
        }
      } catch (error) {
        console.log("Session recovery error:", error);
        // Clear any corrupted data
        await supabase.auth.signOut();
      }
      
      setIsLoading(false);
    };

    handleSessionRecovery();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);
      
      // Check if we're in recovery mode from URL hash
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const isInRecoveryMode = hashParams.has('access_token') && hashParams.get('type') === 'recovery';
      
      if (event === 'SIGNED_OUT') {
        // Clear any remaining session data
        localStorage.removeItem('supabase.auth.token');
      } else if (event === 'PASSWORD_RECOVERY' && !recoveryProcessed) {
        // User clicked password reset link - they have a temporary session
        console.log("🔒 Password recovery event - user must set new password");
        setRecoveryProcessed(true);
        setIsPasswordReset(true);
        info("Security Required", "You must enter a new password to complete the reset process.");
      } else if (event === 'SIGNED_IN' && session) {
        // BLOCK auto-redirect if in recovery mode
        if (isInRecoveryMode || window.location.hash.includes('type=recovery')) {
          console.log("🚫 BLOCKING auto-redirect - user in recovery mode must set password first");
          // Force password reset mode
          if (!isPasswordReset) {
            setIsPasswordReset(true);
            setRecoveryProcessed(true);
            info("Password Reset Required", "You must set a new password before continuing.");
          }
          return; // Block any auto-redirect
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router, info, recoveryProcessed, isPasswordReset]);

  // 🔹 Handle login with Supabase Auth
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
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
          showError("Invalid Credentials", "Please check your email and password and try again.");
        } else if (error.message.includes("Email not confirmed")) {
          warning("Email Not Confirmed", "Please check your email and confirm your account before logging in.");
        } else {
          showError("Login Failed", error.message);
        }
        return;
      }

      if (data.user) {
        console.log("✅ Login successful, checking user role...");
        console.log("User ID:", data.user.id);
        console.log("User Email:", data.user.email);
        
        // Check user role from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, name, email")
          .eq("auth_id", data.user.id)
          .single();

        console.log("🔍 Checking user in database for auth_id:", data.user.id);
        console.log("User query result:", { userData, userError });

        if (userError) {
          // This happens when user exists in Supabase Auth but not in your users table
          console.log("⚠️ User not found in users table - this is expected for deleted users");
          
          // Only log detailed error info in development mode
          if (process.env.NODE_ENV === 'development') {
            console.log("🔧 Development mode - showing detailed error info:");
            console.log("- Error object:", userError);
            console.log("- Error type:", typeof userError);
            console.log("- Error keys:", Object.keys(userError));
            
            if (userError.code) console.log("- Code:", userError.code);
            if (userError.message) console.log("- Message:", userError.message);
            if (userError.details) console.log("- Details:", userError.details);
            if (userError.hint) console.log("- Hint:", userError.hint);
          }
          
          // Direct check for admin email as fallback
          if (data.user.email === 'admin@kampoibayow.com') {
            console.log("🔑 Admin email detected, redirecting to admin dashboard");
            loginSuccess("admin");
            setTimeout(() => router.push("/admin"), 1500);
            return;
          }
          
          // If user doesn't exist in users table but auth exists, they might be deleted
          if (userError.code === 'PGRST116') {
            console.log("⚠️ User not found in users table");
            
            // Account has been permanently deleted
            showError("Account Deleted", "Your account has been permanently removed from our system. You will need to create a new account to access our services.");
            await supabase.auth.signOut();
            return;
          }
          
          // For other errors, redirect to homepage as fallback
          loginSuccess("user");
          setTimeout(() => router.push("/"), 1500);
        } else {
          const userRole = userData?.role || "user";
          console.log("User role detected:", userRole);
          
          if (userRole === "admin") {
            loginSuccess("admin");
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("refresh") || errorMessage.includes("token")) {
        console.log("Clearing corrupted session data...");
        await supabase.auth.signOut();
        localStorage.removeItem('supabase.auth.token');
        warning("Session Expired", "Please try logging in again.");
      } else {
        showError("Unexpected Error", "An unexpected error occurred. Please try again.");
      }
    }
  }

  // 🔹 Handle register with Supabase Auth
// 🔹 Handle register with Supabase Auth
async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    showError("Password Mismatch", "Passwords do not match!");
    return;
  }

  if (!validatePhilippinePhone(phone)) {
    showError("Invalid Phone Number", "Phone number must be exactly 11 digits long!");
    return;
  }

  // Clean and format phone number for database storage (international format)
  const cleanedPhone = cleanPhoneForDatabase(phone);

  if (!termsAccepted) {
    setTermsError(true);
    showError("Terms Required", "Please accept the Terms of Service and Privacy Policy to continue.");
    return;
  }

  // Clear any previous terms error
  setTermsError(false);

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    showError("Weak Password", "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
    return;
  }

  try {
    // Clear any existing session first
    await supabase.auth.signOut();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: `${firstName} ${lastName}` },
      },
    });

    if (error) {
      console.error("Registration error:", error);
      
      // Handle specific registration errors
      if (error.message.includes("User already registered")) {
        showError("Account Exists", "An account with this email already exists. Please try logging in instead.");
      } else if (error.message.includes("Password")) {
        showError("Password Issue", "Password is too weak. Please choose a stronger password.");
      } else {
        showError("Registration Failed", error.message);
      }
      return;
    }

    if (data.user) {
      try {
        // Create PayMongo customer first
        let paymongoCustomerId = null;
        try {
          const paymongoResponse = await fetch('/api/paymongo/create-customer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: cleanedPhone
            }),
          });

          if (paymongoResponse.ok) {
            const paymongoData = await paymongoResponse.json();
            paymongoCustomerId = paymongoData.customer_id;
            console.log('PayMongo customer created:', paymongoCustomerId);
          } else {
            const errorData = await paymongoResponse.json();
            console.error('Failed to create PayMongo customer:', errorData);
          }
        } catch (paymongoError) {
          console.error('PayMongo customer creation error:', paymongoError);
          // Continue with registration even if PayMongo fails
        }

        // Store extra user info in your "users" table
        const { error: insertError } = await supabase.from("users").insert({
          auth_id: data.user.id,
          name: `${firstName} ${lastName}`,
          email: email,
          phone: cleanedPhone, // Store in international format (+63XXXXXXXXXX)
          role: "user", // Regular users are always "user" role
          paymongo_id: paymongoCustomerId, // Store PayMongo customer ID
          created_at: new Date().toISOString(), // Convert to ISO string
        });

        if (insertError) {
          console.error("Error creating user profile:", insertError);
          // Continue anyway - auth account was created successfully
        }
      } catch (insertError) {
        console.error("Failed to create user profile:", insertError);
        // Continue anyway - auth account was created successfully
      }

      registrationSuccess();
      // 🚀 Force logout so they must sign in manually
      await supabase.auth.signOut();
      // Switch UI to login form instead of redirecting home
      setTimeout(() => setIsLogin(true), 2000);
    }
  } catch (error: unknown) {
    console.error("Unexpected registration error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("refresh") || errorMessage.includes("token")) {
      console.log("Clearing corrupted session data...");
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
    }
    
    showError("Registration Error", "An unexpected error occurred during registration. Please try again.");
  }
}

  // 🔹 Handle forgot password
  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("resetEmail") as string;

    if (!email || !email.includes('@')) {
      showError("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=recovery`,
      });

      if (error) {
        console.error("Password reset error:", error);
        
        // Handle specific error cases
        if (error.message.includes("not found") || error.message.includes("invalid")) {
          info("Reset Email Sent", "If an account with this email exists, you will receive a password reset link shortly.");
        } else {
          showError("Reset Failed", error.message);
        }
        return;
      }

      setResetEmailSent(true);
      passwordResetSent();
      console.log("✅ Password reset email sent successfully");
    } catch (error: unknown) {
      console.error("Unexpected password reset error:", error);
      showError("Reset Error", "An unexpected error occurred. Please try again.");
    }
  }

  // 🔹 Handle password update (for password reset)
  async function handlePasswordUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmNewPassword = formData.get("confirmNewPassword") as string;

    if (!newPassword.trim()) {
      showError("Missing Password", "Please enter a new password");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showError("Password Mismatch", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      showError("Weak Password", "Password must be at least 6 characters long");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        console.error("Password update error:", error);
        showError("Update Failed", error.message);
        setIsUpdatingPassword(false);
        return;
      }

      // Sign out the user after password reset to force re-login with new password
      await supabase.auth.signOut();
      
      info("Password Updated", "Your password has been successfully updated. Please log in with your new password.");
      setIsPasswordReset(false);
      setRecoveryProcessed(false);
      setIsLogin(true);
      setPasswordValue('');
      setConfirmPasswordValue('');
      // Clear URL completely
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log("✅ Password updated successfully - user must re-login");
    } catch (error: unknown) {
      console.error("Unexpected password update error:", error);
      showError("Update Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    return formatPhoneForDisplay(value);
  };

  // Password strength validation
  const validatePasswordStrength = (password: string): {
    isValid: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    score: number;
  } => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score === 5;

    return { isValid, requirements, score };
  };

  // Real-time password matching validation
  const handlePasswordChange = (value: string) => {
    setPasswordValue(value);
    if (confirmPasswordValue) {
      setPasswordsMatch(value === confirmPasswordValue);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPasswordValue(value);
    if (value && passwordValue) {
      setPasswordsMatch(passwordValue === value);
    } else {
      setPasswordsMatch(null);
    }
  };



  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If in recovery mode, show ONLY password reset form
  if (isInRecoveryMode && !recoveryProcessed) {
    console.log("🔒 IMMEDIATE RECOVERY MODE DETECTION - forcing password reset");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c] p-2 sm:p-4">
        <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Password Reset Required</h2>
            <p className="text-gray-600 mt-2">You must set a new password to continue</p>
          </div>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="flex items-center border border-gray-300 p-3 rounded-lg">
              <FaLock className="text-gray-400 mr-3" />
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                className="w-full outline-none bg-transparent text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex items-center border border-gray-300 p-3 rounded-lg">
              <FaLock className="text-gray-400 mr-3" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmNewPassword"
                placeholder="Confirm New Password"
                className="w-full outline-none bg-transparent text-gray-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              {isUpdatingPassword ? "Updating..." : "Set New Password"}
            </button>
            <p className="text-center text-sm text-gray-500">
              🔒 For security, you must complete this step
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c] p-2 sm:p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg">
        {/* Left Side - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 xl:p-12 flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-6 xl:mb-10">
              <div className="w-12 h-12 xl:w-16 xl:h-16 relative">
                <Image
                  src="/logo.png"
                  alt="Kampo Ibayo Logo"
                  fill
                  className="object-contain drop-shadow-lg rounded-lg"
                  priority
                />
              </div>
              <h1 className="text-xl xl:text-3xl font-extrabold tracking-tight">
                <span className="text-red-500">Kampo</span> Ibayo
              </h1>
            </div>

            <p className="text-base xl:text-xl font-semibold mb-4 xl:mb-8 opacity-90">
              Where adventure meets comfort
            </p>

            <h2 className="font-bold mb-3 xl:mb-6 text-sm xl:text-lg">Your Wilderness Experience</h2>

            {/* Features List */}
            <ul className="space-y-3 xl:space-y-5 text-xs xl:text-base">
              <li className="flex items-start gap-2 xl:gap-3">
                <div className="w-6 h-6 xl:w-8 xl:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-3 h-3 xl:w-4 xl:h-4 text-red-400" />
                </div>
                <span>
                  <strong>24/7 Security</strong> <br />
                  Professional staff ensuring your safety
                </span>
              </li>
              <li className="flex items-start gap-2 xl:gap-3">
                <div className="w-6 h-6 xl:w-8 xl:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mountain className="w-3 h-3 xl:w-4 xl:h-4 text-red-400" />
                </div>
                <span>
                  <strong>Breathtaking Views</strong> <br />
                  Unmatched natural beauty of Cavite
                </span>
              </li>
              <li className="flex items-start gap-2 xl:gap-3">
                <div className="w-6 h-6 xl:w-8 xl:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-3 h-3 xl:w-4 xl:h-4 text-red-400" />
                </div>
                <span>
                  <strong>Family-Friendly</strong> <br />
                  Perfect for all ages and group sizes
                </span>
              </li>
              <li className="flex items-start gap-2 xl:gap-3">
                <div className="w-6 h-6 xl:w-8 xl:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 xl:w-4 xl:h-4 text-red-400" />
                </div>
                <span>
                  <strong>Easy Booking</strong> <br />
                  Reserve your spot in minutes
                </span>
              </li>
            </ul>
          </div>

          {/* Bottom testimonial */}
          <div className="mt-6 xl:mt-8">
            <div className="flex items-center gap-1 mb-2 xl:mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3 h-3 xl:w-4 xl:h-4 text-yellow-500 fill-yellow-500" />
              ))}
              <span className="text-gray-400 text-xs xl:text-sm ml-2">4.9/5</span>
            </div>
            <p className="text-xs xl:text-sm opacity-80 italic">
              &quot;The best camping experience I&apos;ve ever had!&quot; <br />
              <span className="text-gray-400">Maria S., Frequent Camper</span>
            </p>
          </div>
        </div>

        {/* Right Side - Main content on mobile, right side on desktop */}
        <div className="w-full lg:w-1/2 bg-white p-4 sm:p-6 lg:p-8 xl:p-12 flex flex-col overflow-y-auto max-h-screen">
          <div className="flex-1 flex flex-col justify-center min-h-0">
          {/* Mobile Header - Only shown on mobile */}
          <div className="lg:hidden text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Kampo Ibayo Logo"
                  fill
                  className="object-contain drop-shadow-lg rounded-lg"
                  priority
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                <span className="text-red-500">Kampo</span> <span className="text-gray-700">Ibayo</span>
              </h1>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Where adventure meets comfort</p>
          </div>

          {/* Tab buttons - hide during password reset */}
          {!isPasswordReset && (
            <div className="flex mb-4 sm:mb-6 lg:mb-8 rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => setIsLogin(true)}
                className={`w-1/2 py-2.5 sm:py-3 font-semibold transition-colors duration-200 text-xs sm:text-sm lg:text-base ${
                  isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`w-1/2 py-2.5 sm:py-3 font-semibold transition-colors duration-200 text-xs sm:text-sm lg:text-base ${
                  !isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Password Reset Form */}
          {isPasswordReset ? (
            <form onSubmit={handlePasswordUpdate} className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Reset Your Password</h3>
                <p className="text-sm text-gray-600 mt-1">Enter your new password below</p>
              </div>

              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="New Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  )}
                </button>
              </div>

              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  placeholder="Confirm New Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                className="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition text-xs sm:text-sm lg:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>

              <div className="text-center mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm text-gray-500">
                  🔒 For security, you must set a new password to continue
                </p>
              </div>
            </form>
          ) : /* Sign In Form */
          isLogin ? (
            <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
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
                className="w-full bg-red-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition text-xs sm:text-sm lg:text-base"
              >
                Sign In
              </button>

              <div className="text-center mt-3 sm:mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-red-500 hover:text-red-600 text-xs sm:text-sm font-medium hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg w-full sm:w-1/2">
                  <FaUser className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                    required
                  />
                </div>
                <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg w-full sm:w-1/2">
                  <FaUser className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaPhone className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="09XX-XXX-XXXX (11 digits)"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                  }}
                  onBlur={(e) => {
                    if (e.target.value && !validatePhilippinePhone(e.target.value)) {
                      e.target.setCustomValidity('Phone number must be exactly 11 digits (09XX-XXX-XXXX)');
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  required
                />
              </div>

              {/* Password Field - Full Width */}
              <div className="space-y-2 sm:space-y-3">
                <div className="w-full">
                  <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                    <FaLock className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={passwordValue}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Requirements & Strength */}
                  <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500 text-xs">Use 8+ characters with letters, numbers and symbols</span>
                    {passwordValue && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400 text-xs">Strength:</span>
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-200 ${
                                level <= validatePasswordStrength(passwordValue).score
                                  ? level <= 1
                                    ? 'bg-red-400'
                                    : level <= 2
                                    ? 'bg-yellow-400'
                                    : level <= 3
                                    ? 'bg-blue-400'
                                    : 'bg-green-500'
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirm Password Field - Full Width */}
                <div className="w-full">
                  <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                    <FaLock className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirmPasswordValue}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="ml-2 sm:ml-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Match Validation */}
                  <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-xs min-h-[14px] sm:min-h-[16px]">
                    <span className="text-gray-500 text-xs">Password confirmation</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-400 text-xs">Match:</span>
                      {confirmPasswordValue ? (
                        passwordsMatch ? (
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500" />
                        ) : (
                          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400" />
                        )
                      ) : (
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms and Privacy Policy Consent */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <input
                    type="checkbox"
                    id="terms-consent"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) {
                        setTermsError(false);
                      }
                    }}
                    className="mt-0.5 sm:mt-1 w-3 h-3 sm:w-4 sm:h-4 text-red-600 accent-red-600 flex-shrink-0"
                    required
                  />
                  <label htmlFor="terms-consent" className="text-xs leading-relaxed text-gray-600">
                    I agree to Kampo Ibayo&apos;s{" "}
                    <a
                      href="/legal/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:text-red-600 underline font-medium transition-colors"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="/legal/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:text-red-600 underline font-medium transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {termsError && (
                  <div className="flex items-center space-x-1 text-xs text-red-500 ml-5 sm:ml-7">
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                    <span>You must accept the Terms of Service and Privacy Policy to create an account</span>
                  </div>
                )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold shadow-lg hover:bg-red-600 hover:shadow-xl transition-all duration-200 text-xs sm:text-sm lg:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 mt-4 sm:mt-6"
              >
                <FaUserPlus className="text-xs sm:text-sm lg:text-base" />
                <span>Create Account</span>
              </button>
            </form>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl mx-2">
                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Reset Password</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {resetEmailSent ? (
                  <div className="text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                      <div className="text-green-600 font-semibold mb-1 text-sm sm:text-base">Email Sent!</div>
                      <div className="text-green-700 text-xs sm:text-sm">
                        Check your inbox for password reset instructions.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                      className="w-full bg-gray-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition text-xs sm:text-sm"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3 sm:space-y-4">
                    <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                      <FaEnvelope className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm flex-shrink-0" />
                      <input
                        type="email"
                        name="resetEmail"
                        placeholder="your@email.com"
                        className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm"
                        required
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                        }}
                        className="w-full sm:w-1/2 bg-gray-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-600 transition text-xs sm:text-sm order-2 sm:order-1"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-1/2 bg-red-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-red-600 transition text-xs sm:text-sm order-1 sm:order-2"
                      >
                        Send Reset Link
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Footer - Mobile optimized spacing */}
          <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          </div>
        </div>
          </div>
      </div>
    </div>
  );
}
