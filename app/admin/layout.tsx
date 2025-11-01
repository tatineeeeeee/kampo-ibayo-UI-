"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { NotificationDropdown } from "../components/NotificationDropdown";
import { useToastHelpers } from "../components/Toast";
import { useRoleAccess } from "../hooks/useRoleAccess";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const { error: showError } = useToastHelpers();
  const { role, isAdmin, isStaff } = useRoleAccess();

  // Helper function to check if link is active
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 10000)
        );

        const authPromise = supabase.auth.getSession();
        
        const authResult = await Promise.race([authPromise, timeoutPromise]);
        const { data: { session } } = authResult as Awaited<typeof authPromise>;
        
        if (!isMounted) return;
        
        if (!session?.user) {
          console.log("No session found, redirecting to auth");
          router.push("/auth");
          return;
        }

        console.log("Session found, setting user:", session.user.email);
        setUser(session.user);

        // Get user role from database with timeout
        const dbTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 8000)
        );

        const dbPromise = supabase
          .from("users")
          .select("role, name")
          .eq("auth_id", session.user.id);

        const dbResult = await Promise.race([dbPromise, dbTimeoutPromise]);
        const { data: userData, error } = dbResult as Awaited<typeof dbPromise>;

        if (!isMounted) return;

        console.log("Database query result:", { userData, error });

        if (error) {
          console.error("Admin layout - database error:", error);
          showError("Database connection error. Please refresh the page.");
          setLoading(false);
          return;
        }

        const user = userData?.[0];

        if (!user) {
          console.log("User not found in database");
          showError("User not found. Access denied.");
          router.push("/");
          return;
        }

        if (user.role !== "admin" && user.role !== "staff") {
          console.log("User role is not admin or staff:", user.role);
          showError("Access denied. Admin or Staff privileges required.");
          router.push("/");
          return;
        }

        console.log("Admin authenticated successfully:", user.name);
        setAdminName(user.name);
        setLoading(false);
      } catch (error) {
        if (isMounted) {
          console.error("Admin layout - unexpected error:", error);
          showError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setLoading(false);
          
          // On timeout or critical error, redirect to auth
          if (error instanceof Error && error.message.includes('timeout')) {
            setTimeout(() => router.push("/auth"), 2000);
          }
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        console.log("Auth state change:", event, session?.user?.email);
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
      // Use safe logout utility to prevent hanging
      const { safeLogout } = await import('../utils/apiTimeout');
      await safeLogout(supabase, 2000);
      
      // Direct redirect for admin
      window.location.href = "/";
    } catch (error) {
      console.error('Admin logout error:', error);
      
      // Force cleanup and redirect
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/";
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
          <Link 
            href="/admin" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <Calendar className="w-5 h-5" /> Dashboard
          </Link>
          <Link 
            href="/admin/bookings" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/bookings') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5" /> Bookings
          </Link>
          <Link 
            href="/admin/users" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/users') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link 
            href="/admin/reviews" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/reviews') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5" /> Reviews
          </Link>
          <Link 
            href="/admin/reports" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/reports') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5" /> Reports
          </Link>
        <Link 
          href="/admin/settings" 
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            isActive('/admin/settings') 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
            <FileText className="w-5 h-5" /> Settings
          </Link>
                  <Link 
            href="/admin/payments" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/payments') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5" /> Payments
          </Link>
                  <Link 
            href="/admin/help" 
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/admin/help') 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
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
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-700 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {adminName || user?.email || "Admin User"}
              </div>
              {role && (
                <div className={`text-xs px-3 py-1 rounded-full text-center ${
                  isAdmin 
                    ? 'bg-red-100 text-red-700' 
                    : isStaff 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </div>
              )}
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