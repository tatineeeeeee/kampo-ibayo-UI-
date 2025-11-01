"use client";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, FileText, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";

import { useAuth } from "../contexts/AuthContext";

// FIXED MODE: Use proper authentication but with navigation optimizations
const USE_SIMPLE_MODE = false;

function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-red-600">Admin Panel (TEST)</h1>
          <p className="text-xs text-gray-500">Simple Mode - No Auth Blocking</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <Calendar className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/bookings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/bookings') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Bookings
          </Link>
          <Link href="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/users') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link href="/admin/reviews" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/reviews') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Reviews
          </Link>
          <Link href="/admin/payments" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/payments') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Payments
          </Link>
          <Link href="/admin/reports" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/reports') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Reports
          </Link>
          <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/settings') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Settings
          </Link>
          <Link href="/admin/help" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/help') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}>
            <FileText className="w-5 h-5" /> Help
          </Link>
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-700">TEST MODE: {pathname}</h2>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function FullAdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const { user: authUser, userRole, loading: authLoading } = useAuth();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // ✅ OPTIMIZED: Debounced auth check to prevent navigation blocking
  useEffect(() => {
    const authCheckTimer = setTimeout(() => {
      if (authLoading) return;
      
      if (authUser && userRole && (userRole === 'admin' || userRole === 'staff')) {
        setUser(authUser);
        setAdminName(`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} User`);
        setLoading(false);
        return;
      }
      
      if (!authLoading) {
        console.log('🔐 Admin layout: Redirecting to auth (non-blocking)');
        setTimeout(() => router.replace("/auth"), 100);
      }
    }, 50); // 50ms delay to not block navigation

    return () => clearTimeout(authCheckTimer);
  }, [authUser, userRole, authLoading, router]);

  const handleLogout = async () => {
    try {
      const { safeLogout } = await import('../utils/apiTimeout');
      await safeLogout(supabase, 2000);
      window.location.href = "/";
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/";
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image src="/logo.png" alt="Kampo Ibayo Logo" fill className="object-contain" priority />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-red-600 leading-tight">Kampo Ibayo</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Calendar className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/admin/bookings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/bookings') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Bookings
          </Link>
          <Link href="/admin/users" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/users') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link href="/admin/reviews" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/reviews') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Reviews
          </Link>
          <Link href="/admin/payments" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/payments') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Payments
          </Link>
          <Link href="/admin/reports" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/reports') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Reports
          </Link>
          <Link href="/admin/settings" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/settings') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Settings
          </Link>
          <Link href="/admin/help" className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${isActive('/admin/help') ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}>
            <FileText className="w-5 h-5" /> Help
          </Link>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-700 font-semibold bg-blue-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                {adminName || user?.email || "Admin User"}
              </div>
              {userRole && (
                <div className={`text-xs px-3 py-1 rounded-full text-center ${userRole === 'admin' ? 'bg-red-100 text-red-700' : userRole === 'staff' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </div>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200" title="Logout">
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // TEST: Use simple layout to see if navigation works without auth complexity
  if (USE_SIMPLE_MODE) {
    console.log("🧪 USING SIMPLE MODE - No auth blocking for navigation test");
    return <SimpleAdminLayout>{children}</SimpleAdminLayout>;
  }
  
  return <FullAdminLayout>{children}</FullAdminLayout>;
}