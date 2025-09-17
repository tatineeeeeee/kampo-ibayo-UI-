"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { FaUser, FaEnvelope, FaUserTag, FaEdit, FaSignOutAlt, FaHome } from "react-icons/fa";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">Please log in to view your profile.</p>
          <div className="space-y-3">
            <Link href="/auth">
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                Login
              </button>
            </Link>
            <Link href="/">
              <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
                Back to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-white">
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-gray-400">Manage your account information</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            <FaSignOutAlt className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-full shadow-lg">
                <FaUser className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {user.user_metadata?.name || "User"}
                </h2>
                <p className="text-gray-400">Member since {new Date(user.created_at).toLocaleDateString()}</p>
                <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold mt-1">
                  ● Active
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Name */}
              <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors group">
                <FaUser className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <p className="text-white font-semibold">
                    {user.user_metadata?.name || "Not provided"}
                  </p>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors group">
                <FaEnvelope className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <p className="text-white font-semibold">{user.email}</p>
                </div>
                <button className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>

              {/* Role */}
              <div className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                <FaUserTag className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Account Type
                  </label>
                  <span className="inline-block bg-gradient-to-r from-red-600 to-red-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {user.user_metadata?.role || "Guest"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/book">
                <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition-all duration-200 text-left px-4 flex items-center gap-3 group mb-3">
                  <span className="text-xl">🏕️</span>
                  <span>Make a Booking</span>
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              </Link>
              <Link href="/bookings">
                <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition-all duration-200 text-left px-4 flex items-center gap-3 group mb-3">
                  <span className="text-xl">📋</span>
                  <span>My Bookings</span>
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              </Link>
              <Link href="/settings">
                <button className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-red-600 hover:scale-105 transition-all duration-200 text-left px-4 flex items-center gap-3 group">
                  <span className="text-xl flex-shrink-0">⚙️</span>
                  <span className="whitespace-nowrap">Account Settings</span>
                  <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">→</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Account Stats */}
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Account Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Bookings</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nights Stayed</span>
                <span className="text-white font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Account Status</span>
                <span className="text-green-500 font-semibold">Active</span>
              </div>
            </div>
          </div>

          {/* Kampo Ibayo Info */}
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-600 p-2 rounded-full">
                <span className="text-xl">⛺</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                <span className="text-red-500">Kampo</span> Ibayo
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Your gateway to nature&apos;s tranquility in General Trias, Cavite.
            </p>
            <Link href="/">
              <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition text-sm">
                Explore Resort
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
