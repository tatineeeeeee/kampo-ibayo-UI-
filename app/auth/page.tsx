"use client";
import { useState, useEffect, useRef } from "react";
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
  const [formKey, setFormKey] = useState(0); // Force form refresh
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [forcePasswordReset, setForcePasswordReset] = useState(() => {
    // Check localStorage on initial load for password reset state
    if (typeof window !== 'undefined') {
      return localStorage.getItem('in_password_reset') === 'true';
    }
    return false;
  });
  const router = useRouter();
  const { error: showError, warning, info, loginSuccess, registrationSuccess, passwordResetSent } = useToastHelpers();
  
  // Prevent infinite loops in recovery detection
  const recoveryHandled = useRef(false);
  const authStateChangeDebounce = useRef<NodeJS.Timeout | null>(null);

  // Handle password recovery properly with Supabase's built-in flow
  useEffect(() => {
    const handleRecovery = async () => {
      if (typeof window === 'undefined' || recoveryHandled.current) return;

      const hash = window.location.hash.slice(1);
      const search = window.location.search;
      
      console.log('🔍 Checking for recovery tokens...');
      console.log('Hash:', hash);
      console.log('Search:', search);

      if (!hash && !search) return;

      // Check hash parameters (new format)
      const hashParams = new URLSearchParams(hash);
      const hashType = hashParams.get('type');
      
      // Check search parameters (fallback)
      const searchParams = new URLSearchParams(search);
      const searchMode = searchParams.get('mode');

      // Handle password recovery the correct way
      if (hashType === 'recovery' || searchMode === 'recovery') {
        recoveryHandled.current = true; // Prevent infinite loops
        
        console.log('🔒 Password recovery detected - setting up password reset form');
        console.log('Recovery method:', hashType === 'recovery' ? 'hash' : 'search');
        
        // Check if we have recovery tokens in the hash
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('✅ Recovery tokens found in URL hash');
          
          try {
            // Set recovery state immediately for faster UI response
            setForcePasswordReset(true);
            setIsPasswordReset(true);
            localStorage.setItem('in_password_reset', 'true');
            
            // Try to set the session with the recovery tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('❌ Failed to set recovery session:', sessionError);
              // Reset states if session setup failed
              setForcePasswordReset(false);
              setIsPasswordReset(false);
              localStorage.removeItem('in_password_reset');
              showError('Invalid Reset Link', 'This password reset link is invalid or expired. Please request a new password reset.');
              setIsLoading(false);
              return;
            }

            if (sessionData.session) {
              console.log('✅ Recovery session established successfully');
              setIsLoading(false);
              
              // Clear any previous recovery notifications
              sessionStorage.removeItem('recovery-info-shown');
              
              // Show quick success message
              info('Ready!', 'Please set your new password below.');
            } else {
              console.error('❌ No session created from recovery tokens');
              // Reset states if no session created
              setForcePasswordReset(false);
              setIsPasswordReset(false);
              localStorage.removeItem('in_password_reset');
              showError('Invalid Reset Link', 'Failed to establish reset session. Please request a new password reset.');
              setIsLoading(false);
            }
          } catch (error) {
            console.error('❌ Error setting recovery session:', error);
            // Reset states on error
            setForcePasswordReset(false);
            setIsPasswordReset(false);
            localStorage.removeItem('in_password_reset');
            showError('Reset Error', 'An error occurred while processing your reset link. Please try again.');
            setIsLoading(false);
          }
        } else {
          console.log('❌ No recovery tokens in URL - invalid reset link');
          showError('Invalid Reset Link', 'This password reset link is invalid or expired. Please request a new password reset.');
          setIsLoading(false);
        }
      }
    };

    handleRecovery();
  }, [info, showError]);

  // Handle session recovery and cleanup on component mount
  useEffect(() => {
    const handleSessionRecovery = async () => {
      try {
        // FIRST PRIORITY: Check if we're in password reset mode from localStorage or state
        const inPasswordReset = localStorage.getItem('in_password_reset') === 'true';
        if (forcePasswordReset || inPasswordReset) {
          console.log('🔒 Already in password reset mode - skipping session recovery');
          setIsPasswordReset(true);
          setForcePasswordReset(true);
          setIsLoading(false);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');

        // Check if we already have recovery tokens stored (from the first useEffect)
        const hasStoredTokens = sessionStorage.getItem('recovery_access_token') && 
                               sessionStorage.getItem('recovery_refresh_token');

        if (mode === 'recovery' && !hasStoredTokens) {
          console.log('ℹ️ Recovery mode without tokens detected - showing one-time message');
          setIsPasswordReset(true);
          // Only show this message once, not repeatedly
          if (!sessionStorage.getItem('recovery-info-shown')) {
            info('Check Your Email', 'Please use the reset link sent to your email to set a new password.');
            sessionStorage.setItem('recovery-info-shown', 'true');
          }
        } else if (hasStoredTokens) {
          console.log('✅ Recovery tokens found in storage - password reset flow ready');
          setIsPasswordReset(true);
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.log('Session error:', error.message);
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
        }

        // IMPORTANT: Only proceed with normal login flow if NOT in password reset mode
        if (session?.user && !forcePasswordReset && !inPasswordReset) {
          const hashParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.hash.slice(1)) : null;
          const inRecoveryMode = hashParams?.get('type') === 'recovery' || hashParams?.get('access_token');

          // If URL indicates recovery mode, don't auto-login
          if (inRecoveryMode) {
            console.log('🔒 Recovery tokens in URL - staying in password reset mode');
            setIsPasswordReset(true);
            setForcePasswordReset(true);
            localStorage.setItem('in_password_reset', 'true');
            setIsLoading(false);
            return;
          }

          // Normal login flow - only if no recovery indicators
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('auth_id', session.user.id)
            .single();

          if (userData?.role === 'admin' || userData?.role === 'staff') {
            router.push('/admin');
          } else {
            router.push('/');
          }
          return;
        }
      } catch (error) {
        console.log('Session recovery error:', error);
        await supabase.auth.signOut();
      }

      setIsLoading(false);
    };

    handleSessionRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Debounce auth state changes to prevent conflicts
      if (authStateChangeDebounce.current) {
        clearTimeout(authStateChangeDebounce.current);
      }
      
      authStateChangeDebounce.current = setTimeout(async () => {
        console.log('🔔 Auth state change (debounced):', event);

        try {
      // IMMEDIATE RECOVERY CHECK - Before processing any events
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.slice(1);
        const search = window.location.search;
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(search);
        const hasRecoveryTokens = hashParams.get('access_token') || 
                                hashParams.get('type') === 'recovery' || 
                                searchParams.get('mode') === 'recovery' ||
                                hashParams.get('refresh_token');
        
        const inPasswordResetStorage = localStorage.getItem('in_password_reset') === 'true';
        
        if ((hasRecoveryTokens || inPasswordResetStorage) && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          console.log('🚫 IMMEDIATE BLOCK: Recovery detected - preventing auto-login');
          console.log('Event:', event);
          console.log('Hash:', hash);
          console.log('Access token present:', !!hashParams.get('access_token'));
          console.log('localStorage password reset:', inPasswordResetStorage);
          
          // Set state and persist to localStorage to prevent any auto-login
          setForcePasswordReset(true);
          setIsPasswordReset(true);
          localStorage.setItem('in_password_reset', 'true');
          
          // Clean URL after setting state (only if we have recovery tokens in URL)
          if (hasRecoveryTokens) {
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('✅ URL cleaned to prevent token exposure');
          }
          
          return; // Exit immediately to prevent any redirect
        }
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('supabase.auth.token');
      } else if (event === 'PASSWORD_RECOVERY') {
        console.log('🔒 Password recovery event - enforcing password reset');
        setForcePasswordReset(true);
        setIsPasswordReset(true);
        info('Password Reset', 'Please set a new password to continue.');
      } else if (event === 'SIGNED_IN' && session) {
        // COMPREHENSIVE AUTO-LOGIN PREVENTION CHECK
        const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const hashParams = new URLSearchParams(hash);
        const searchParams = new URLSearchParams(search);
        const isRecoveryMode = hashParams.get('type') === 'recovery' || 
                              searchParams.get('mode') === 'recovery' ||
                              hashParams.get('access_token') ||
                              hashParams.get('refresh_token');
        
        console.log('🔍 SIGNED_IN event - comprehensive recovery check');
        console.log('Hash:', hash);
        console.log('Search:', search);
        console.log('Has access_token:', !!hashParams.get('access_token'));
        console.log('Is recovery mode:', isRecoveryMode);
        
        // Check all possible password reset indicators
        const inPasswordReset = localStorage.getItem('in_password_reset') === 'true';
        const shouldBlockLogin = isRecoveryMode || forcePasswordReset || isPasswordReset || inPasswordReset;
        
        if (shouldBlockLogin) {
          console.log('🚫 BLOCKING AUTO-LOGIN - Password reset mode active');
          console.log('Reasons - Recovery mode:', isRecoveryMode, 'Force reset:', forcePasswordReset, 'Is reset:', isPasswordReset, 'localStorage:', inPasswordReset);
          
          // Ensure password reset state is set
          setForcePasswordReset(true);
          setIsPasswordReset(true);
          localStorage.setItem('in_password_reset', 'true');
          
          // Clean the URL if we have recovery tokens
          if (isRecoveryMode && (hash || search.includes('recovery'))) {
            window.history.replaceState({}, document.title, window.location.pathname);
            console.log('✅ URL cleaned and password reset state enforced');
          }
          
          return; // CRITICAL: Exit here to prevent auto-login redirect
        }

        // Normal login flow - only proceed if no password reset indicators
        console.log('✅ Proceeding with normal login flow');
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', session.user.id)
          .single();

        if (userData?.role === 'admin' || userData?.role === 'staff') {
          router.push('/admin');
        } else {
          router.push('/');
        }
        }
      } catch (error: unknown) {
        console.error("Auth state change error:", error);
        // Handle authentication errors gracefully
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
      }, 300); // 300ms debounce
    });

    return () => {
      subscription.unsubscribe();
      // Clean up recovery info when component unmounts
      if (!isPasswordReset && !forcePasswordReset) {
        sessionStorage.removeItem('recovery-info-shown');
      }
    };
  }, [router, info, forcePasswordReset, isPasswordReset, showError, warning]);

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
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
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
    
    // Check if email already exists in the database first
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();
    
    // Only show error if user actually exists (ignore "not found" errors)
    if (existingUser && !checkError) {
      showError("Account Exists", "An account with this email already exists. Please try logging in instead.");
      return;
    }
    
    // If there's a database error other than "not found", log it but continue
    if (checkError && !checkError.message.includes('not found') && checkError.code !== 'PGRST116') {
      console.warn('Database check warning:', checkError);
      // Continue anyway - we'll catch duplicates in Supabase Auth
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: `${firstName} ${lastName}` },
      },
    });

    if (error) {
      console.error("Registration error:", error);
      
      // Handle specific registration errors - enhanced duplicate detection
      if (error.message.includes("User already registered") || 
          error.message.includes("already been registered") ||
          error.message.includes("already exists") ||
          error.message.includes("duplicate") ||
          error.code === "user_already_exists") {
        showError("Account Exists", "An account with this email already exists. Please try logging in instead.");
      } else if (error.message.includes("Password")) {
        showError("Password Issue", "Password is too weak. Please choose a stronger password.");
      } else if (error.message.includes("email") && error.message.includes("valid")) {
        showError("Invalid Email", "Please enter a valid email address.");
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
      
      // Clear all form data and force form refresh
      setPasswordValue('');
      setConfirmPasswordValue('');
      setPasswordsMatch(null);
      setTermsAccepted(false);
      setTermsError(false);
      setFormKey(prev => prev + 1); // Force form refresh to clear browser autofill
      
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
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("resetEmail") as string;

    if (!email || !email.includes('@')) {
      showError("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
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

  // 🔹 Handle password update (for password reset) - OPTIMIZED FOR SPEED
  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
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
      console.log('🔄 Attempting password update...');

      // Create a timeout wrapper for faster response
      const updatePasswordWithTimeout = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        try {
          const { error } = await supabase.auth.updateUser({ 
            password: newPassword 
          });
          clearTimeout(timeoutId);
          return { error };
        } catch (err) {
          clearTimeout(timeoutId);
          if (controller.signal.aborted) {
            throw new Error('Request timeout - please try again');
          }
          throw err;
        }
      };

      const { error } = await updatePasswordWithTimeout();

      if (error) {
        console.error("❌ Password update error:", error);
        
        // Handle specific error cases with simpler logic
        if (error.message.includes('session') || error.message.includes('expired')) {
          showError("Session Expired", "Please request a new password reset link.");
        } else if (error.message.includes('weak') || error.message.includes('password')) {
          showError("Weak Password", "Please choose a stronger password.");
        } else {
          showError("Update Failed", error.message || "Please try again.");
        }
        return;
      }

      console.log('✅ Password updated successfully!');

      // Immediate UI updates for faster perceived response
      info("Success!", "Password updated successfully. Redirecting to login...");
      
      // Clear states immediately
      setIsPasswordReset(false);
      setForcePasswordReset(false);
      setPasswordValue('');
      setConfirmPasswordValue('');
      
      // Clean storage and URL immediately
      localStorage.removeItem('in_password_reset');
      sessionStorage.removeItem('recovery-info-shown');
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Quick transition to login form
      setTimeout(() => {
        setIsLogin(true);
        // Sign out in background after UI update
        supabase.auth.signOut().then(() => {
          console.log("✅ Signed out - ready for fresh login");
        });
      }, 1000);
      
    } catch (error: unknown) {
      console.error("Password update error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('timeout')) {
        showError("Timeout", "Request timed out. Please try again.");
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        showError("Network Error", "Connection issue. Please check your internet.");
      } else {
        showError("Error", "Failed to update password. Please try again.");
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c] p-2 sm:p-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg">
        {/* Left Side - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 xl:p-12 flex-col justify-between">
          <div>
            {/* Brand Header with Home Button */}
            <div className="flex items-center justify-between mb-6 xl:mb-10">
              <div className="flex items-center gap-3">
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
              
              {/* Home/Back Button - Desktop */}
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors p-2 xl:p-3 rounded-lg hover:bg-white/10 border border-white/20 hover:border-white/30"
                title="Back to Home"
              >
                <svg className="w-4 h-4 xl:w-5 xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-sm xl:text-base font-medium">Home</span>
              </button>
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
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              {/* Home/Back Button - Mobile */}
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 transition-colors p-1 sm:p-2 rounded-lg hover:bg-gray-50"
                title="Back to Home"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Home</span>
              </button>
              
              {/* Logo and Title */}
              <div className="flex items-center gap-2 sm:gap-3">
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
              
              {/* Spacer to center the logo */}
              <div className="w-12 sm:w-16"></div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Where adventure meets comfort</p>
          </div>

          {/* Tab buttons - hide during password reset */}
          {!isPasswordReset && (
            <div className="flex mb-4 sm:mb-6 lg:mb-8 rounded-lg overflow-hidden border border-gray-200">
              <button
                onClick={() => {
                  setIsLogin(true);
                  // Clear form when switching to login
                  setPasswordValue('');
                  setConfirmPasswordValue('');
                  setPasswordsMatch(null);
                  setTermsAccepted(false);
                  setTermsError(false);
                  setFormKey(prev => prev + 1);
                }}
                className={`w-1/2 py-2.5 sm:py-3 font-semibold transition-colors duration-200 text-xs sm:text-sm lg:text-base ${
                  isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  // Clear form when switching to register
                  setPasswordValue('');
                  setConfirmPasswordValue('');
                  setPasswordsMatch(null);
                  setFormKey(prev => prev + 1);
                }}
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
                {isUpdatingPassword ? "Updating Password..." : "Update Password"}
              </button>

              <div className="text-center mt-3 sm:mt-4">
                <p className="text-xs sm:text-sm text-gray-500">
                  🔒 For security, you must set a new password to continue
                </p>
              </div>
            </form>
          ) : /* Sign In Form */
          isLogin ? (
            <form key={`login-${formKey}`} onSubmit={handleLogin} className="space-y-3 sm:space-y-4 lg:space-y-5" autoComplete="off">
              <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                  autoComplete="new-email"
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
                  autoComplete="new-password"
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
            <form key={`register-${formKey}`} onSubmit={handleRegister} className="space-y-3 sm:space-y-4 lg:space-y-5" autoComplete="off">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center border border-gray-300 p-2.5 sm:p-3 rounded-lg w-full sm:w-1/2">
                  <FaUser className="text-gray-400 mr-2 sm:mr-3 text-xs sm:text-sm lg:text-base flex-shrink-0" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-xs sm:text-sm lg:text-base"
                    autoComplete="new-firstname"
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
                    autoComplete="new-lastname"
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
                  autoComplete="new-email"
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
                  autoComplete="new-phone"
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
