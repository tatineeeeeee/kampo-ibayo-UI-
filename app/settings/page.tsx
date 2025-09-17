"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { 
  FaHome, 
  FaUser, 
  FaLock, 
  FaBell, 
  FaShieldAlt, 
  FaEye, 
  FaEyeSlash,
  FaSave,
  FaTrash,
  FaToggleOn,
  FaToggleOff
} from "react-icons/fa";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Form states
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    bookingReminders: true,
    promotionalEmails: false,
    marketingEmails: false
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session?.user) {
        router.push("/auth");
      } else {
        // Load user profile data
        setProfileData({
          name: data.session.user.user_metadata?.name || "",
          email: data.session.user.email || "",
          phone: data.session.user.user_metadata?.phone || ""
        });
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.push("/auth");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["profile", "security", "notifications", "privacy"];
      const scrollPos = window.scrollY + 200;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          if (
            scrollPos >= element.offsetTop &&
            scrollPos < element.offsetTop + element.offsetHeight
          ) {
            setActiveSection(section);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone
        }
      });

      if (error) throw error;

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      alert("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Error updating password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!confirmed) return;

    const doubleConfirm = confirm(
      "This will permanently delete all your data including bookings. Are you absolutely sure?"
    );

    if (!doubleConfirm) return;

    try {
      // In a real app, you'd call your backend to delete user data
      // For now, we'll just sign out the user
      await supabase.auth.signOut();
      alert("Account deletion initiated. You have been signed out.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("Error deleting account. Please contact support.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-400 hover:text-white transition">
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-white">
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-gray-400">Manage your account preferences</p>
            </div>
          </div>
          <Link href="/profile">
            <button className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition">
              Back to Profile
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4">Settings</h3>
            <nav className="space-y-2">
              <a 
                href="#profile" 
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "profile" 
                    ? "bg-red-600 text-white" 
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaUser className="w-4 h-4" />
                Profile Information
              </a>
              <a 
                href="#security" 
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "security" 
                    ? "bg-red-600 text-white" 
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaLock className="w-4 h-4" />
                Security & Password
              </a>
              <a 
                href="#notifications" 
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "notifications" 
                    ? "bg-red-600 text-white" 
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaBell className="w-4 h-4" />
                Notifications
              </a>
              <a 
                href="#privacy" 
                className={`flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "privacy" 
                    ? "bg-red-600 text-white" 
                    : "text-gray-300 hover:bg-red-600 hover:text-white"
                }`}
              >
                <FaShieldAlt className="w-4 h-4" />
                Privacy & Data
              </a>
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Information */}
          <section id="profile" className="bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaUser className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full bg-gray-600 border border-gray-600 text-gray-400 rounded-lg px-4 py-3 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                <FaSave className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Security & Password */}
          <section id="security" className="bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaLock className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Security & Password</h2>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                <FaLock className="w-4 h-4" />
                {saving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </section>

          {/* Notifications */}
          <section id="notifications" className="bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaBell className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
            </div>

            <div className="space-y-6">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div>
                    <h3 className="text-white font-semibold">
                      {key === 'emailNotifications' && 'Email Notifications'}
                      {key === 'bookingReminders' && 'Booking Reminders'}
                      {key === 'promotionalEmails' && 'Promotional Emails'}
                      {key === 'marketingEmails' && 'Marketing Emails'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {key === 'emailNotifications' && 'Receive general email notifications'}
                      {key === 'bookingReminders' && 'Get reminders about your bookings'}
                      {key === 'promotionalEmails' && 'Receive special offers and promotions'}
                      {key === 'marketingEmails' && 'Receive marketing and newsletter emails'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotificationSettings({
                      ...notificationSettings,
                      [key]: !value
                    })}
                    className="text-2xl"
                  >
                    {value ? (
                      <FaToggleOn className="text-red-500" />
                    ) : (
                      <FaToggleOff className="text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Privacy & Data */}
          <section id="privacy" className="bg-gray-800 rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaShieldAlt className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Privacy & Data</h2>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-700 p-6 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Data Export</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Download a copy of your personal data and booking history.
                </p>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition">
                  Export My Data
                </button>
              </div>

              <div className="bg-red-900/20 border border-red-700 p-6 rounded-lg">
                <h3 className="text-red-400 font-semibold mb-2">Danger Zone</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  <FaTrash className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}