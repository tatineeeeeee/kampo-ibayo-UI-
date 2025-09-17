"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient"; // adjust path if needed
import {FaLock, FaEnvelope, FaUser } from "react-icons/fa";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // 🔹 Handle login with Supabase Auth
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      console.log("✅ Login successful, checking user role...");
      console.log("User ID:", data.user.id);
      console.log("User Email:", data.user.email);
      
      // Check user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, name, email")
        .eq("auth_id", data.user.id)
        .single();

      console.log("User query result:", { userData, userError });
      console.log("UserError details:", JSON.stringify(userError));

      if (userError) {
        console.error("Error fetching user role:", userError);
        
        // Direct check for admin email as fallback
        if (data.user.email === 'admin@kampoibayow.com') {
          console.log("🔑 Admin email detected, redirecting to admin dashboard");
          alert("Welcome Admin!");
          router.push("/admin");
          return;
        }
        
        // If user doesn't exist in users table, treat as regular user
        if (userError.code === 'PGRST116') {
          console.log("⚠️ User not found in users table - treating as regular user");
          
          // Create user entry in database for future logins
          try {
            const { error: insertError } = await supabase.from("users").insert({
              auth_id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              email: data.user.email || '',
              role: "user",
              created_at: new Date().toISOString(),
            });
            
            if (insertError) {
              console.error("Error creating user profile:", insertError);
            } else {
              console.log("✅ Created user profile in database");
            }
          } catch (error) {
            console.error("Failed to create user profile:", error);
          }
        }
        
        // Redirect regular user to homepage
        alert("Login successful!");
        router.push("/");
      } else {
        const userRole = userData?.role || "user";
        console.log("User role detected:", userRole);
        
        if (userRole === "admin") {
          alert("Welcome Admin!");
          router.push("/admin"); // 🚀 redirect to admin dashboard
        } else {
          alert("Login successful!");
          router.push("/"); // 🚀 redirect to regular home page
        }
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
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: `${firstName} ${lastName}` },
    },
  });

  if (error) {
    alert(error.message);
  } else if (data.user) {
    try {
      // Store extra user info in your "users" table
      const { error: insertError } = await supabase.from("users").insert({
        auth_id: data.user.id,
        name: `${firstName} ${lastName}`,
        email: email,
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
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c]">
      <div className="w-full max-w-5xl flex rounded-3xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg">
        {/* Left Side */}
        <div className="w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-red-600 p-3 rounded-full shadow-lg">
                <span className="text-3xl">⛺</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                <span className="text-red-500">Kampo</span> Ibayo
              </h1>
            </div>

            <p className="text-xl font-semibold mb-8 opacity-90">
              Where adventure meets comfort
            </p>

            <h2 className="font-bold mb-6 text-lg">Your Wilderness Experience</h2>

            <ul className="space-y-5 text-base">
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

        {/* Right Side */}
        <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
          <div className="flex mb-8 rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setIsLogin(true)}
              className={`w-1/2 py-3 font-semibold transition-colors duration-200 ${
                isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`w-1/2 py-3 font-semibold transition-colors duration-200 ${
                !isLogin ? "bg-gray-200 text-gray-900" : "bg-gray-50 text-gray-500"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-3" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition"
              >
                Sign In
              </button>
            </form>
          ) : (
            // Register Form
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex gap-3">
                <div className="flex items-center border border-gray-300 p-3 rounded-lg w-1/2">
                  <FaUser className="text-gray-400 mr-3" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
                <div className="flex items-center border border-gray-300 p-3 rounded-lg w-1/2">
                  <FaUser className="text-gray-400 mr-3" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaEnvelope className="text-gray-400 mr-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-3" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <div className="flex items-center border border-gray-300 p-3 rounded-lg">
                <FaLock className="text-gray-400 mr-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="w-full outline-none bg-transparent text-gray-700 placeholder-gray-400"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition"
              >
                Create Account →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
