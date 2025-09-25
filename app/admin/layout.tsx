"use client";
import Link from "next/link";
import { Calendar, Users, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { NotificationDropdown } from "../components/NotificationDropdown";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/auth");
        return;
      }

      setUser(session.user);

      // Get user role from database
      const { data: userData, error } = await supabase
        .from("users")
        .select("role, name")
        .eq("auth_id", session.user.id)
        .single();

      if (error || userData?.role !== "admin") {
        // Not an admin, redirect to home
        alert("Access denied. Admin privileges required.");
        router.push("/");
        return;
      }

      setUserRole(userData.role);
      setAdminName(userData.name); // Store the admin name from database
      setLoading(false);
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          router.push("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  if (!user || userRole !== "admin") {
    return null; // Will redirect
  }
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Admin Panel</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <Calendar className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/bookings" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Bookings
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Reports
          </Link>
        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Settings
          </Link>
                  <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Payments
          </Link>
                  <Link href="/admin/help" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Help/FAQs
          </Link>
          
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            <NotificationDropdown />
            {/* Admin Profile */}
            <div className="flex items-center gap-2 text-gray-700 font-semibold bg-blue-50 px-3 py-1 rounded-full">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              {adminName || user?.email || "Admin User"}
            </div>
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
