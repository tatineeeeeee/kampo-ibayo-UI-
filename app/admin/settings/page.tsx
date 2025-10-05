"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { saveMaintenanceSettings, getMaintenanceSettings } from "../../utils/maintenanceMode";
import type { User } from "@supabase/supabase-js";
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Settings,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [resortSettings, setResortSettings] = useState({
    maintenance_mode: false,
    emergency_contact: "+63 945 277 9541"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Toast helpers
  const { success, error: showError } = useToastHelpers();

  useEffect(() => {
    const loadData = async () => {
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

        // Load maintenance settings from database
        const loadMaintenanceSettings = async () => {
          try {
            const maintenanceSettings = await getMaintenanceSettings();
            setResortSettings(prev => ({
              ...prev,
              maintenance_mode: maintenanceSettings.isActive || false,
              emergency_contact: "+63 945 277 9541" // Always provide default value
            }));
          } catch (error) {
            console.error('Error loading maintenance settings:', error);
            setResortSettings(prev => ({
              ...prev,
              maintenance_mode: false,
              emergency_contact: "+63 945 277 9541"
            }));
          }
        };
        
        loadMaintenanceSettings();
      }
      
      setLoading(false);
    };

    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);

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

      success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showError("Error updating profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResortSettings = async () => {
    setSaving(true);
    try {
      console.log('⚙️ Admin saving settings:', {
        maintenance_mode: resortSettings.maintenance_mode,
        emergency_contact: resortSettings.emergency_contact
      }); // Debug log
      
      // Save maintenance settings to database (cross-device)
      await saveMaintenanceSettings({
        isActive: resortSettings.maintenance_mode,
        message: "Kampo Ibayo is temporarily closed for maintenance. Please call for assistance."
      });
      
      success("Resort status updated successfully! Changes are now live across all devices.");
      
      // Dispatch a custom event to notify other components in same session
      if (typeof window !== 'undefined') {
        console.log('⚙️ Dispatching maintenanceSettingsChanged event'); // Debug log
        window.dispatchEvent(new CustomEvent('maintenanceSettingsChanged'));
      }
    } catch (error) {
      console.error('⚙️ Error saving settings:', error); // Debug log
      showError("Error updating resort status.");
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-blue-100 mt-1">Essential settings for Kampo Ibayo operations</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Admin Profile */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Admin Profile</h3>
              <p className="text-sm text-gray-700">Your administrator information</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 mb-3">
                <UserIcon className="w-4 h-4 text-blue-600" />
                Full Name
              </label>
              <input
                type="text"
                value={adminData.name}
                onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 mb-3">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address
              </label>
              <input
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="admin@example.com"
                required
              />
              <p className="text-xs text-gray-600 mt-2">
                This is your login email. 
                <span className="text-blue-600 font-medium"> Password changes are handled through Supabase Auth</span> - contact support if needed.
              </p>
            </div>
            
            <div>
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800 mb-3">
                <Phone className="w-4 h-4 text-blue-600" />
                Phone Number
                <span className="text-xs text-gray-500 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={adminData.phone}
                onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="+63 xxx xxx xxxx"
              />
              <p className="text-xs text-gray-600 mt-2">Contact number for resort operations (optional)</p>
            </div>
            
            <button 
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>

        {/* Resort Operations */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white shadow-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Resort Operations</h3>
              <p className="text-sm text-gray-700">Temporarily close resort for maintenance or repairs</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-gray-900">Close Resort Temporarily</span>
                  <p className="text-xs text-gray-700 mt-1">Stops new bookings and shows maintenance notice to visitors</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={!!resortSettings.maintenance_mode}
                    onChange={(e) => setResortSettings({ ...resortSettings, maintenance_mode: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-orange-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              
              {resortSettings.maintenance_mode && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                  <p className="text-xs text-orange-700 font-medium mb-2">⚠️ Resort is temporarily closed</p>
                  <p className="text-xs text-gray-600">New bookings are disabled. Existing reservations remain active. Visitors will see a notice with your contact number.</p>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-semibold text-gray-800 mb-3 block">
                Emergency Contact Number
              </label>
              <input
                type="tel"
                value={resortSettings.emergency_contact || "+63 945 277 9541"}
                onChange={(e) => setResortSettings({ ...resortSettings, emergency_contact: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="+63 xxx xxx xxxx"
              />
              <p className="text-xs text-gray-600 mt-2">This number will be shown to visitors during maintenance</p>
            </div>
            
            <button 
              onClick={handleSaveResortSettings}
              disabled={saving}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {resortSettings.maintenance_mode ? 'Update Resort Status' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}