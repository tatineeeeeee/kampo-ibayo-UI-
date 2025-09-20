"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import { useBookingStats } from "../hooks/useBookingStats";
import { useAuth } from "../contexts/AuthContext";
import type { User } from "@supabase/supabase-js";
import { FaUser, FaEnvelope, FaUserTag, FaEdit, FaSignOutAlt, FaHome, FaCalendarAlt, FaClock, FaChartLine, FaStar, FaCalendarPlus, FaHistory, FaCog } from "react-icons/fa";

function ProfilePageContent({ user }: { user: User }) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  
  // Use the booking stats hook
  const { stats: bookingStats, loading: statsLoading } = useBookingStats(user);

  // Removed auth state listener - it was causing tab switching issues

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Clear local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Redirect to home page
      router.push("/");
      
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      // Force redirect even if sign out fails
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: newName.trim() }
      });

      if (error) {
        console.error('Error updating name:', error);
        alert('Failed to update name. Please try again.');
      } else {
        setEditingName(false);
        // Refresh user data
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          // User data updated - could trigger a re-render through auth state
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewName("");
  };

  const handleStartEdit = () => {
    setNewName(user?.user_metadata?.name || "");
    setEditingName(true);
  };

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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-2">
          {/* Profile Information */}
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 mb-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="bg-red-600 p-4 rounded-full shadow-lg ring-4 ring-red-600/20">
                <FaUser className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {user.user_metadata?.name || "User"}
                </h2>
                <p className="text-gray-400">Member since {bookingStats.memberSince || new Date(user.created_at).toLocaleDateString()}</p>
                <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold mt-1">
                  ● Active
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {/* Name */}
              <div className="flex items-center gap-4 p-4 bg-gray-700/70 rounded-lg hover:bg-gray-700 transition-all duration-200 group border border-gray-600/30">
                <FaUser className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  {editingName ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:border-red-500 focus:outline-none flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateName();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <button
                        onClick={handleUpdateName}
                        disabled={updating || !newName.trim()}
                        className="text-green-500 hover:text-green-400 disabled:text-gray-500 disabled:cursor-not-allowed"
                      >
                        {updating ? '...' : '✓'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-red-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <p className="text-white font-semibold">
                      {user.user_metadata?.name || "Not provided"}
                    </p>
                  )}
                </div>
                {!editingName && (
                  <button 
                    onClick={handleStartEdit}
                    className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gray-700/70 rounded-lg hover:bg-gray-700 transition-all duration-200 group border border-gray-600/30">
                <FaEnvelope className="w-5 h-5 text-red-400" />
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
              <div className="flex items-center gap-4 p-4 bg-gray-700/70 rounded-lg border border-gray-600/30">
                <FaUserTag className="w-5 h-5 text-red-400" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Account Type
                  </label>
                  <span className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
                    {user.user_metadata?.role || "Guest"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Stats - Moved from Sidebar */}
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Account Overview
              </h3>
              {statsLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
              )}
            </div>
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400">
                📊 Stats based on admin-confirmed completed stays only. Pending bookings await admin approval.
              </p>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <FaCalendarAlt className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{bookingStats.totalBookings}</div>
                <div className="text-xs text-gray-400">Total Bookings</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <FaClock className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{bookingStats.totalNights}</div>
                <div className="text-xs text-gray-400">Nights Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <FaChartLine className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">₱{bookingStats.totalSpent.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total Spent</div>
              </div>
              <div className="text-center p-4 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <FaStar className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                <div className={`text-2xl font-bold ${
                  bookingStats.loyaltyStatus === 'Elite' ? 'text-yellow-500' :
                  bookingStats.loyaltyStatus === 'VIP' ? 'text-purple-500' :
                  bookingStats.loyaltyStatus === 'Regular' ? 'text-blue-500' :
                  'text-green-500'
                }`}>
                  {bookingStats.loyaltyStatus}
                </div>
                <div className="text-xs text-gray-400">Status</div>
              </div>
            </div>

            {/* Status Alerts */}
            <div className="space-y-3">
              {bookingStats.upcomingBookings > 0 && (
                <div className="p-3 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 text-sm">Confirmed Upcoming</span>
                    <span className="text-blue-300 font-semibold">{bookingStats.upcomingBookings}</span>
                  </div>
                </div>
              )}
              
              {bookingStats.pendingBookings > 0 && (
                <div className="p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 text-sm">Awaiting Admin Approval</span>
                    <span className="text-yellow-300 font-semibold">{bookingStats.pendingBookings}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Breakdown section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300 mb-4">Booking Status Breakdown</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                  <span className="text-green-400 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                    Completed
                  </span>
                  <span className="text-green-400 font-semibold">{bookingStats.completedBookings}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                  <span className="text-blue-400 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                    Upcoming
                  </span>
                  <span className="text-blue-400 font-semibold">{bookingStats.upcomingBookings}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                  <span className="text-yellow-400 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
                    Pending
                  </span>
                  <span className="text-yellow-400 font-semibold">{bookingStats.pendingBookings}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-gray-700/30 rounded">
                  <span className="text-red-400 text-sm flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full flex-shrink-0"></div>
                    Cancelled
                  </span>
                  <span className="text-red-400 font-semibold">{bookingStats.cancelledBookings}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings - Moved from Sidebar */}
          {bookingStats.recentBookings.length > 0 && (
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Recent Bookings
                  </h3>
                  <p className="text-gray-400 text-sm">Latest {bookingStats.recentBookings.length} booking{bookingStats.recentBookings.length > 1 ? 's' : ''}</p>
                </div>
                <Link href="/bookings" className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-red-600/30">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                {bookingStats.recentBookings.map((booking) => {
                  const checkInDate = new Date(booking.check_in_date);
                  const checkOutDate = new Date(booking.check_out_date);
                  const status = booking.status || 'pending';
                  const isUpcoming = checkInDate > new Date();
                  const isActive = checkInDate <= new Date() && checkOutDate >= new Date();
                  
                  return (
                    <div key={booking.id} className="bg-gray-700/30 border border-gray-600/50 rounded-lg p-4 hover:bg-gray-700/50 transition-all duration-200">
                      {/* Header with Guest Name and Status */}
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-semibold text-base">{booking.guest_name}</h4>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                          status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          status === 'confirmed' && checkOutDate < new Date() ? 'bg-green-500/20 text-green-400' :
                          status === 'confirmed' && isActive ? 'bg-blue-500/20 text-blue-400' :
                          status === 'confirmed' && isUpcoming ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {status === 'cancelled' ? 'Cancelled' :
                           status === 'pending' ? 'Pending' :
                           status === 'confirmed' && checkOutDate < new Date() ? 'Completed' :
                           status === 'confirmed' && isActive ? 'Active' :
                           status === 'confirmed' && isUpcoming ? 'Confirmed' :
                           'Unknown'}
                        </span>
                      </div>

                      {/* Date Range */}
                      <div className="mb-3">
                        <p className="text-gray-300 text-sm">
                          📅 {checkInDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })} - {checkOutDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Bottom Row */}
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-gray-600/50 text-gray-300 px-2 py-1 rounded flex items-center gap-1">
                            <span>👥</span>
                            {booking.number_of_guests} guest{booking.number_of_guests > 1 ? 's' : ''}
                          </span>
                          {booking.brings_pet && (
                            <span className="bg-amber-600/20 text-amber-400 px-2 py-1 rounded flex items-center gap-1">
                              <span>🐕</span>
                              Pet
                            </span>
                          )}
                        </div>
                        <p className="text-white font-bold text-sm">
                          ₱{booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 sticky top-6 self-start">
          {/* Quick Actions */}
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Quick Actions
            </h3>
            <div className="grid gap-4">
              <Link href="/book" className="flex items-center gap-3 p-4 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-all duration-200 border border-red-600/30 group">
                <FaCalendarPlus className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                <div>
                  <p className="text-white font-semibold">New Booking</p>
                  <p className="text-gray-400 text-sm">Reserve your stay</p>
                </div>
              </Link>
              <Link href="/bookings" className="flex items-center gap-3 p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-all duration-200 border border-blue-600/30 group">
                <FaHistory className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                <div>
                  <p className="text-white font-semibold">Booking History</p>
                  <p className="text-gray-400 text-sm">View all reservations</p>
                </div>
              </Link>
              <Link href="/settings" className="flex items-center gap-3 p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-all duration-200 border border-purple-600/30 group">
                <FaCog className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                <div>
                  <p className="text-white font-semibold">Account Settings</p>
                  <p className="text-gray-400 text-sm">Manage preferences</p>
                </div>
              </Link>
              <button 
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex items-center gap-3 p-4 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-all duration-200 border border-gray-600/30 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaSignOutAlt className="w-5 h-5 text-gray-400 group-hover:text-gray-300" />
                <div className="text-left">
                  <p className="text-white font-semibold">
                    {signingOut ? 'Signing out...' : 'Sign Out'}
                  </p>
                  <p className="text-gray-400 text-sm">Secure logout</p>
                </div>
              </button>
            </div>
          </div>

          {/* Help & Support */}
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Help & Support
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/30">
                <h4 className="text-white font-semibold mb-2">📞 Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">📧 kampoibayo@resort.com</p>
                  <p className="text-gray-300">📱 +63 912 345 6789</p>
                  <p className="text-gray-300">🕒 Available 24/7</p>
                </div>
              </div>
              
              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/30">
                <h4 className="text-white font-semibold mb-2">🏨 Resort Information</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">📍 Kampo Ibayo Beach Resort</p>
                  <p className="text-gray-300">🌊 Premium beachfront experience</p>
                  <p className="text-gray-300">⭐ 4.8/5 guest rating</p>
                </div>
              </div>

              <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600/30">
                <h4 className="text-white font-semibold mb-2">💡 Quick Tips</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">• Book 2+ weeks ahead for discounts</p>
                  <p className="text-gray-300">• Pet-friendly rooms available</p>
                  <p className="text-gray-300">• Free cancellation up to 24hrs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Use global auth context to avoid conflicts
export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return <ProfilePageContent user={user} />;
}
