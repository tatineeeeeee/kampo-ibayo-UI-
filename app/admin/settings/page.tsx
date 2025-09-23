"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { 
  CheckCircle, 
  AlertCircle, 
  User as UserIcon, 
  Mail, 
  Phone, 
  Users, 
  Clock, 
  Calendar,
  FileText,
  Settings,
  Bell,
  CreditCard,
  Moon,
  Save,
  RefreshCw
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadAdminData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;
      
      setUser(session.user);
      
      // Get admin data from database
      const { data: userData, error } = await supabase
        .from("users")
        .select("name, email, phone")
        .eq("auth_id", session.user.id)
        .single();

      if (!error && userData) {
        setAdminData({
          name: userData.name || "",
          email: userData.email || session.user.email || "",
          phone: userData.phone || "",
        });
      }
      
      setLoading(false);
    };

    loadAdminData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setMessage("");

    try {
      // Update user data in database
      const { error: dbError } = await supabase
        .from("users")
        .update({
          name: adminData.name,
          email: adminData.email,
          phone: adminData.phone,
        })
        .eq("auth_id", user.id);

      if (dbError) throw dbError;

      // Update email in auth if changed
      if (adminData.email !== user.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: adminData.email,
        });
        if (authError) throw authError;
      }

      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings & Configuration</h1>
            <p className="text-blue-100 mt-1">Manage your admin preferences and system settings</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <UserIcon className="w-4 h-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <Clock className="w-4 h-4" />
            <span>{adminData.name || 'Administrator'}</span>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-5 rounded-2xl text-sm border-l-4 shadow-lg transform transition-all duration-500 ease-out ${
          message.includes("successfully") 
            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-500 shadow-green-100" 
            : "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-500 shadow-red-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              message.includes("successfully") ? "bg-green-100" : "bg-red-100"
            }`}>
              {message.includes("successfully") ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <span className="font-semibold">{message}</span>
              <p className="text-xs mt-1 opacity-75">
                {message.includes("successfully") ? "Changes have been saved successfully" : "Please check your input and try again"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Profile Settings</h3>
              <p className="text-sm text-gray-500">Update your personal information</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="flex flex-col flex-1">
            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  Full Name
                </label>
                <input
                  type="text"
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  Email Address
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={adminData.phone}
                  onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 placeholder-gray-400"
                  placeholder="+63 xxx xxx xxxx"
                />
              </div>
            </div>
            
            <div className="pt-8 mt-auto">
              <button 
                type="submit"
                disabled={saving}
                className="w-full group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                <div className="flex items-center justify-center gap-3">
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Save Profile</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>

        {/* System Preferences */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">System Preferences</h3>
              <p className="text-sm text-gray-500">Configure system-wide settings</p>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <div className="space-y-5 flex-1">
              <div className="group/item">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover/item:bg-purple-100 transition-colors">
                      <Bell className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Enable Notifications</span>
                      <p className="text-xs text-gray-500 mt-1">Receive system alerts and updates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      defaultChecked 
                      aria-label="Enable notifications to receive system alerts and updates"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="group/item">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover/item:bg-purple-100 transition-colors">
                      <CreditCard className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Allow Online Payments</span>
                      <p className="text-xs text-gray-500 mt-1">Enable payment processing</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      aria-label="Allow online payments and enable payment processing"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              <div className="group/item">
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-purple-200">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover/item:bg-purple-100 transition-colors">
                      <Moon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-800">Enable Dark Mode</span>
                      <p className="text-xs text-gray-500 mt-1">Switch to dark theme</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      aria-label="Enable dark mode to switch to dark theme"
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-8 mt-auto">
              <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-sm font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <div className="flex items-center justify-center gap-3">
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Save Preferences</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Booking Rules */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Booking Rules</h3>
              <p className="text-sm text-gray-500">Configure booking limitations and policies</p>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  Maximum Guests Per Booking
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300"
                  defaultValue={10}
                  min="1"
                  max="50"
                />
              </div>
              
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  Booking Cutoff Time (hours before)
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300"
                  defaultValue={2}
                  min="1"
                  max="48"
                />
              </div>
              
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                    <Calendar className="w-4 h-4 text-green-600" />
                  </div>
                  Advanced Booking Days
                </label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-green-100 focus:border-green-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300"
                  defaultValue={30}
                  min="1"
                  max="365"
                />
              </div>
            </div>
            
            <div className="pt-8 mt-auto">
              <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl text-sm font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <div className="flex items-center justify-center gap-3">
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Save Rules</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full group">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Policies</h3>
              <p className="text-sm text-gray-500">Manage terms and conditions</p>
            </div>
          </div>
          <div className="flex flex-col flex-1">
            <div className="space-y-6 flex-1">
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  Cancellation Policy
                </label>
                <div className="relative">
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 resize-none placeholder-gray-400"
                    rows={3}
                    defaultValue="Cancellations must be made at least 24 hours before the booking date."
                    placeholder="Enter your cancellation policy..."
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-xl pointer-events-none"></div>
                </div>
              </div>
              
              <div className="group">
                <label className="flex items-center gap-3 text-sm font-semibold text-gray-700 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  Pet Policy
                </label>
                <div className="relative">
                  <textarea
                    className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-sm text-gray-700 focus:ring-4 focus:ring-orange-100 focus:border-orange-500 bg-gray-50 hover:bg-white focus:bg-white transition-all duration-300 resize-none placeholder-gray-400"
                    rows={3}
                    defaultValue="Pets are welcome with prior notice and additional fee."
                    placeholder="Enter your pet policy..."
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent rounded-xl pointer-events-none"></div>
                </div>
              </div>
            </div>
            
            <div className="pt-8 mt-auto">
              <button className="w-full group relative px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl text-sm font-semibold hover:from-orange-700 hover:to-orange-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <div className="flex items-center justify-center gap-3">
                  <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Save Policies</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}