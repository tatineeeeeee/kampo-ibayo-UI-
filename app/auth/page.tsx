"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaFacebook, FaLock, FaEnvelope, FaUser } from "react-icons/fa";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  // 🔹 Handle login form submit
  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Login successful!");
      console.log("User:", data.user);
      router.push("/"); // 🚀 redirect to /
    } else {
      alert(data.error || "Login failed");
    }
  }

  // 🔹 Handle register form submit
  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Account created! Please sign in.");
      setIsLogin(true); // switch to login tab
    } else {
      alert(data.error || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4b0f12] via-[#7c1f23] to-[#2c0a0c]">
      <div className="w-full max-w-5xl flex rounded-3xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-lg">
        {/* Left Side */}
        <div className="w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-12 flex flex-col justify-between">
          <div>
            {/* Logo */}
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
          {/* Tabs */}
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

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-gray-700 font-medium">
                  <input type="checkbox" className="accent-red-500 w-4 h-4" /> 
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-red-500 hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition"
              >
                Sign In
              </button>

              <div className="flex items-center gap-2 my-6">
                <hr className="flex-1 border-gray-200" />
                <span className="text-sm text-gray-400">Or continue with</span>
                <hr className="flex-1 border-gray-200" />
              </div>
              <div className="flex gap-4">
                <button type="button" className="flex items-center justify-center gap-2 border border-gray-300 py-3 w-1/2 rounded-lg hover:bg-gray-50 transition">
                  <FaGoogle className="text-[#4285F4]" /> 
                  <span className="text-gray-700 font-semibold">Google</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-2 border border-gray-300 py-3 w-1/2 rounded-lg hover:bg-gray-50 transition">
                  <FaFacebook className="text-[#1877F2]" /> 
                  <span className="text-gray-700 font-semibold">Facebook</span>
                </button>
              </div>

              <p className="text-xs text-center text-gray-400 mt-6">
                © 2025 Kampo Ibayo. All rights reserved.
              </p>
            </form>
          ) : (
            /* Register Form */
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

              <label className="flex items-center text-sm text-gray-700 font-medium mt-2 mb-2">
                <input type="checkbox" className="mr-2 accent-red-500 w-4 h-4" required /> 
                I agree to the
                <a href="#" className="text-red-500 ml-2 mr-2 hover:underline font-semibold">
                  Terms
                </a>
                and
                <a href="#" className="text-red-500 ml-2 hover:underline font-semibold">
                  Privacy Policy
                </a>
              </label>

              <button type="submit" className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold shadow hover:bg-red-600 transition">
                Create Account →
              </button>
              <p className="text-sm text-center mt-8 text-gray-400">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-red-500 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
