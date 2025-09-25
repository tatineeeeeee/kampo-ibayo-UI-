"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient"; // adjust path if needed
import {FaLock, FaEnvelope, FaUser, FaPhone, FaUserPlus } from "react-icons/fa";
import { Eye, EyeOff, Check, X } from "lucide-react";

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const router = useRouter();

  // Handle session recovery and cleanup on component mount
  useEffect(() => {
    const handleSessionRecovery = async () => {
      try {
        // Check if user is returning from password reset email
        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get('mode');
        
        if (mode === 'recovery') {
          console.log("🔄 User returning from password reset email");
          alert("You can now set a new password. Please log in with your new password after setting it.");
        }
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log("Session error:", error.message);
          // Clear any corrupted session data
          await supabase.auth.signOut();
          localStorage.removeItem('supabase.auth.token');
        }
        
        if (session?.user) {
          // User is already logged in, redirect appropriately
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          // Clear any remaining session data
          localStorage.removeItem('supabase.auth.token');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

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
          alert("Invalid email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          alert("Please check your email and confirm your account before logging in.");
        } else {
          alert(`Login error: ${error.message}`);
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
            alert("Welcome Admin!");
            router.push("/admin");
            return;
          }
          
          // If user doesn't exist in users table but auth exists, they might be deleted
          if (userError.code === 'PGRST116') {
            console.log("⚠️ User not found in users table");
            
            // Account has been permanently deleted
            alert("Your account has been permanently removed from our system. You will need to create a new account to access our services.");
            await supabase.auth.signOut();
            return;
          }
          
          // For other errors, redirect to homepage as fallback
          alert("Login successful!");
          router.push("/");
        } else {
          const userRole = userData?.role || "user";
          console.log("User role detected:", userRole);
          
          if (userRole === "admin") {
            alert("Welcome Admin!");
            router.push("/admin");
          } else {
            alert("Login successful!");
            router.push("/");
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
        alert("Session expired. Please try logging in again.");
      } else {
        alert("An unexpected error occurred. Please try again.");
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
    alert("Passwords do not match!");
    return;
  }

  if (!validatePhoneNumber(phone)) {
    alert("Phone number must be exactly 11 digits long!");
    return;
  }

  if (!termsAccepted) {
    setTermsError(true);
    alert("Please accept the Terms of Service and Privacy Policy to continue.");
    return;
  }

  // Clear any previous terms error
  setTermsError(false);

  // Validate password strength
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.isValid) {
    alert("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character!");
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
        alert("An account with this email already exists. Please try logging in instead.");
      } else if (error.message.includes("Password")) {
        alert("Password is too weak. Please choose a stronger password.");
      } else {
        alert(`Registration error: ${error.message}`);
      }
      return;
    }

    if (data.user) {
      try {
        // Store extra user info in your "users" table
        const { error: insertError } = await supabase.from("users").insert({
          auth_id: data.user.id,
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          role: "user", // Regular users are always "user" role
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

      alert("✅ Registration successful! Please log in.");
      // 🚀 Force logout so they must sign in manually
      await supabase.auth.signOut();
      // Switch UI to login form instead of redirecting home
      setIsLogin(true);
    }
  } catch (error: unknown) {
    console.error("Unexpected registration error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes("refresh") || errorMessage.includes("token")) {
      console.log("Clearing corrupted session data...");
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
    }
    
    alert("An unexpected error occurred during registration. Please try again.");
  }
}

  // 🔹 Handle forgot password
  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("resetEmail") as string;

    if (!email || !email.includes('@')) {
      alert("Please enter a valid email address.");
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
          alert("If an account with this email exists, you will receive a password reset link shortly.");
        } else {
          alert(`Error: ${error.message}`);
        }
        return;
      }

      setResetEmailSent(true);
      console.log("✅ Password reset email sent successfully");
    } catch (error: unknown) {
      console.error("Unexpected password reset error:", error);
      alert("An unexpected error occurred. Please try again.");
    }
  }

  // Phone number validation function
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 11;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limited = digitsOnly.slice(0, 11);
    
    // Format as 09XX-XXX-XXXX
    if (limited.length >= 8) {
      return `${limited.slice(0, 4)}-${limited.slice(4, 7)}-${limited.slice(7)}`;
    } else if (limited.length >= 4) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`;
    }
    return limited;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c] p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg">
        {/* Left Side - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8 xl:p-12 flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8 xl:mb-10">
              <div className="bg-red-600 p-2 xl:p-3 rounded-full shadow-lg">
                <span className="text-2xl xl:text-3xl">⛺</span>
              </div>
              <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight">
                <span className="text-red-500">Kampo</span> Ibayo
              </h1>
            </div>

            <p className="text-lg xl:text-xl font-semibold mb-6 xl:mb-8 opacity-90">
              Where adventure meets comfort
            </p>

            <h2 className="font-bold mb-4 xl:mb-6 text-base xl:text-lg">Your Wilderness Experience</h2>

            <ul className="space-y-4 xl:space-y-5 text-sm xl:text-base">
              <li className="flex items-start gap-3">
                <span>🏕️</span>
                <span>
                  <strong>Premium Camping</strong> <br />
                  Modern facilities in pristine wilderness
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>🌄</span>
                <span>
                  <strong>Breathtaking Views</strong> <br />
                  Unmatched natural beauty
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>🔒</span>
                <span>
                  <strong>24/7 Security</strong> <br />
                  Your safety is our priority
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>✅</span>
                <span>
                  <strong>Easy Booking</strong> <br />
                  Reserve your spot in minutes
                </span>
              </li>
            </ul>
          </div>

          <p className="text-xs mt-8 opacity-80 italic">
            &quot;The best camping experience I&apos;ve ever had!&quot; <br />
            <span className="text-gray-400">Maria S., Frequent Camper</span>
          </p>
        </div>

        {/* Right Side - Main content on mobile, right side on desktop */}
        <div className="w-full lg:w-1/2 bg-white p-6 sm:p-8 lg:p-12 flex flex-col overflow-y-auto max-h-screen">
          <div className="flex-1 flex flex-col justify-center min-h-0">
          {/* Mobile Header - Only shown on mobile */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-red-600 p-2 rounded-full shadow-lg">
                <span className="text-2xl">⛺</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                <span className="text-red-500">Kampo</span> <span className="text-gray-700">Ibayo</span>
              </h1>
            </div>
            <p className="text-gray-600 text-sm">Where adventure meets comfort</p>
          </div>

          <div className="flex mb-6 lg:mb-8 rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-2 lg:py-3 font-semibold transition-colors duration-200 text-sm lg:text-base ${
                isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-2 lg:py-3 font-semibold transition-colors duration-200 text-sm lg:text-base ${
                !isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-3 text-sm lg:text-base" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-3 text-sm lg:text-base" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" />
                  ) : (
                    <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition text-sm lg:text-base"
              >
                Sign In
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium hover:underline transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister} className="space-y-4 lg:space-y-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center border border-gray-300 p-3 rounded-lg w-full sm:w-1/2">
                  <FaUser className="text-gray-400 mr-3 text-sm lg:text-base" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                    required
                  />
                </div>
                <div className="flex items-center border border-gray-300 p-3 rounded-lg w-full sm:w-1/2">
                  <FaUser className="text-gray-400 mr-3 text-sm lg:text-base" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-3 text-sm lg:text-base" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaPhone className="text-gray-400 mr-3 text-sm lg:text-base" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="09XX-XXX-XXXX (11 digits)"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    e.target.value = formatted;
                  }}
                  onBlur={(e) => {
                    const phone = e.target.value.replace(/\D/g, '');
                    if (phone.length > 0 && !validatePhoneNumber(e.target.value)) {
                      e.target.setCustomValidity('Phone number must be exactly 11 digits');
                    } else {
                      e.target.setCustomValidity('');
                    }
                  }}
                  required
                />
              </div>

              {/* Password Field - Full Width */}
              <div className="space-y-3">
                <div className="w-full">
                  <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                    <FaLock className="text-gray-400 mr-3 text-sm lg:text-base" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={passwordValue}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Requirements & Strength */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Use 8+ characters with letters, numbers and symbols</span>
                    {passwordValue && (
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">Strength:</span>
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
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
                  <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                    <FaLock className="text-gray-400 mr-3 text-sm lg:text-base" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={confirmPasswordValue}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm lg:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 lg:w-5 lg:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 lg:w-5 lg:h-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Match Validation */}
                  {confirmPasswordValue && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-gray-500">Password confirmation</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">Match:</span>
                        {passwordsMatch ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Privacy Policy Consent */}
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
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
                    className="mt-1 w-4 h-4 text-red-600  accent-red-600"
                    required
                  />
                  <label htmlFor="terms-consent" className="text-xs text-gray-600 leading-relaxed">
                    I agree to Kampo Ibayo&apos;s{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-red-500 hover:text-red-600 underline font-medium transition-colors"
                    >
                      Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-red-500 hover:text-red-600 underline font-medium transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
                {termsError && (
                  <div className="flex items-center space-x-1 text-xs text-red-500 ml-7">
                    <X className="w-3 h-3" />
                    <span>You must accept the Terms of Service and Privacy Policy to create an account</span>
                  </div>
                )}
              </div>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:bg-red-600 hover:shadow-xl transition-all duration-200 text-sm lg:text-base flex items-center justify-center space-x-2 mt-6"
              >
                <FaUserPlus className="text-sm lg:text-base" />
                <span>Create Account</span>
              </button>
            </form>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h3>
                  <p className="text-gray-600 text-sm">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                {resetEmailSent ? (
                  <div className="text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="text-green-600 font-semibold mb-1">Email Sent!</div>
                      <div className="text-green-700 text-sm">
                        Check your inbox for password reset instructions.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetEmailSent(false);
                      }}
                      className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                      <FaEnvelope className="text-gray-400 mr-3 text-sm" />
                      <input
                        type="email"
                        name="resetEmail"
                        placeholder="your@email.com"
                        className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400 text-sm"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetEmailSent(false);
                        }}
                        className="w-1/2 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
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
          <div className="mt-6 lg:mt-8 text-center">
          </div>
        </div>
          </div>

        {/* Terms of Service Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Terms of Service</h2>
                    <p className="text-sm text-gray-600">Effective Date: September 26, 2025</p>
                  </div>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</span>
                        Resort Services & Acceptance
                      </h3>
                      <p className="text-gray-700 leading-relaxed pl-9">
                        Welcome to Kampo Ibayo, a premium eco-resort located in the pristine wilderness of Palawan, Philippines. By using our booking platform, you agree to these terms and confirm you are at least 18 years old or booking with parental consent. Our services include luxury camping accommodations, guided nature tours, water sports, and organic dining experiences.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</span>
                        Booking & Payment Policy
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Reservations:</strong> All bookings require a 50% deposit within 24 hours of confirmation. Full payment is due 14 days before arrival.</p>
                        <p><strong>Peak Season:</strong> December-April bookings require full payment upon confirmation due to high demand.</p>
                        <p><strong>Group Bookings:</strong> Parties of 8+ guests qualify for group rates and flexible payment terms.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</span>
                        Cancellation & Refund Policy
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Free Cancellation:</strong> Full refund if cancelled 30+ days before arrival.</p>
                        <p><strong>Partial Refund:</strong> 50% refund if cancelled 14-29 days before arrival.</p>
                        <p><strong>No Refund:</strong> Cancellations within 14 days of arrival are non-refundable.</p>
                        <p><strong>Weather Policy:</strong> 100% refund for cancellations due to typhoons or government travel advisories.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">4</span>
                        Resort Rules & Conduct
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Eco-Friendly Policy:</strong> Kampo Ibayo is a sustainable resort. Single-use plastics are prohibited. We provide reusable water bottles and eco-friendly amenities.</p>
                        <p><strong>Quiet Hours:</strong> 10 PM - 6 AM to preserve the natural ambiance and respect wildlife.</p>
                        <p><strong>Safety Requirements:</strong> Life jackets mandatory for water activities. Professional guides required for jungle treks.</p>
                        <p><strong>Wildlife Protection:</strong> Feeding or disturbing local wildlife is strictly prohibited and may result in immediate removal.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">5</span>
                        Liability & Insurance
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Travel Insurance:</strong> We strongly recommend comprehensive travel insurance covering medical emergencies, trip cancellation, and adventure activities.</p>
                        <p><strong>Activity Risks:</strong> Guests participate in outdoor activities at their own risk. Kampo Ibayo provides safety equipment and professional guides but cannot guarantee against natural hazards.</p>
                        <p><strong>Personal Property:</strong> The resort is not liable for lost, stolen, or damaged personal items. We recommend using our complimentary safety deposit boxes.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">6</span>
                        Force Majeure & Modifications
                      </h3>
                      <p className="text-gray-700 leading-relaxed pl-9">
                        Kampo Ibayo reserves the right to modify activities, accommodations, or services due to weather conditions, natural disasters, government regulations, or other circumstances beyond our control. In such cases, we will provide alternative arrangements or partial refunds as appropriate.
                      </p>
                    </section>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Questions? Contact us at <span className="font-medium">legal@kampoibayo.com</span>
                  </p>
                  <button
                    onClick={() => setShowTermsModal(false)}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-1">Privacy Policy</h2>
                    <p className="text-sm text-gray-600">Last Updated: September 26, 2025</p>
                  </div>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="px-8 py-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <div className="space-y-8">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Your privacy matters.</span> This policy explains how we collect, use, and protect your information when you use Kampo Ibayo.
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">1</span>
                        Information We Collect
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Personal Information:</strong> Name, email, phone number, date of birth, and emergency contact details for booking and safety purposes.</p>
                        <p><strong>Payment Data:</strong> Credit card information is processed securely through Stripe and PayPal. We never store complete card details on our servers.</p>
                        <p><strong>Travel Preferences:</strong> Dietary restrictions, accessibility needs, activity preferences, and previous booking history to personalize your experience.</p>
                        <p><strong>Location Data:</strong> GPS coordinates during guided tours (with permission) for safety tracking and emergency response.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">2</span>
                        How We Use Your Information
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Booking Management:</strong> Processing reservations, sending confirmations, and coordinating arrival logistics including airport transfers.</p>
                        <p><strong>Safety & Security:</strong> Emergency contact procedures, guest check-ins during activities, and coordination with local authorities if needed.</p>
                        <p><strong>Personalized Service:</strong> Customizing meals for dietary needs, arranging accessibility accommodations, and recommending activities based on interests.</p>
                        <p><strong>Communication:</strong> Pre-arrival preparation emails, weather updates, activity schedules, and post-stay feedback requests.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">3</span>
                        Information Sharing & Partners
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Service Providers:</strong> Local tour operators, transport companies, and activity partners receive necessary booking details to provide services.</p>
                        <p><strong>Payment Processors:</strong> Stripe, PayPal, and GCash process payments securely with bank-level encryption.</p>
                        <p><strong>Emergency Services:</strong> Local hospitals and rescue services may receive guest information during medical emergencies.</p>
                        <p><strong>Government Compliance:</strong> Tourist registration with Philippine Department of Tourism as required by law.</p>
                        <p><strong>Never Sold:</strong> We never sell, rent, or trade your personal information to marketing companies or data brokers.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">4</span>
                        Data Security & Protection
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Encryption:</strong> All data is encrypted using AES-256 encryption in transit and at rest. Our servers are hosted on AWS with SOC 2 compliance.</p>
                        <p><strong>Access Control:</strong> Only authorized staff with legitimate business needs can access guest information, with full audit trails maintained.</p>
                        <p><strong>Physical Security:</strong> Guest registration documents are stored in locked, fireproof safes at the resort and destroyed after legal retention periods.</p>
                        <p><strong>Regular Audits:</strong> Quarterly security assessments and annual penetration testing by certified cybersecurity firms.</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">5</span>
                        Your Privacy Rights
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Access & Download:</strong> Request a complete copy of your personal data in portable format within 30 days.</p>
                        <p><strong>Correction & Updates:</strong> Modify your profile information, preferences, and contact details anytime through your account dashboard.</p>
                        <p><strong>Deletion Rights:</strong> Request complete account deletion. Note: Some booking records may be retained for legal compliance (7 years).</p>
                        <p><strong>Marketing Opt-out:</strong> Unsubscribe from promotional emails while still receiving important booking-related communications.</p>
                        <p><strong>Location Tracking:</strong> Disable GPS tracking for tours (required for some remote activities for safety).</p>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3">6</span>
                        Contact & Complaints
                      </h3>
                      <div className="text-gray-700 leading-relaxed pl-9 space-y-2">
                        <p><strong>Privacy Officer:</strong> privacy@kampoibayo.com or +63-917-555-0123</p>
                        <p><strong>Data Protection Authority:</strong> You may file complaints with the Philippine National Privacy Commission if privacy concerns are not resolved.</p>
                        <p><strong>Response Time:</strong> We respond to all privacy requests within 5 business days and resolve issues within 30 days.</p>
                      </div>
                    </section>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Questions about privacy? Email <span className="font-medium">privacy@kampoibayo.com</span>
                  </p>
                  <button
                    onClick={() => setShowPrivacyModal(false)}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors shadow-sm"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
