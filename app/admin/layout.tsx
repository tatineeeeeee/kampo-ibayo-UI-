"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useToastHelpers } from "../components/Toast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { error: showError } = useToastHelpers();

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (!session?.user) {
          router.push("/auth");
          return;
        }

        setUser(session.user);

        // Get user role from database
        const { data: userData, error } = await supabase
          .from("users")
          .select("role, name")
          .eq("auth_id", session.user.id);

        if (!isMounted) return;

        const user = userData?.[0];

        if (error) {
          console.error("Admin layout - database error:", error);
          showError("Database connection error. Please refresh the page.");
          setLoading(false);
          return;
        }

        if (!user) {
          showError("User not found. Access denied.");
          router.push("/");
          return;
        }

        if (user.role !== "admin") {
          showError("Access denied. Admin privileges required.");
          router.push("/");
          return;
        }

        setAdminName(user.name);
        setLoading(false);
      } catch (error) {
        if (isMounted) {
          console.error("Admin layout - unexpected error:", error);
          showError("An unexpected error occurred. Please refresh the page.");
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (!session?.user) {
          router.push("/auth");
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to prevent infinite loop

  const handleLogout = async () => {
    try {
      // Check if there's a session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Only try to sign out if there's a session
        await supabase.auth.signOut();
      }
      
      // Clear any local storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      
      // Always redirect to home regardless of sign out success
      router.push("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear storage and redirect
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      router.push("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image
                src="/logo.png"
                alt="Kampo Ibayo Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-red-600 leading-tight">Kampo Ibayo</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
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