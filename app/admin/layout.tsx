"use client";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Users,
  LogOut,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  Star,
  Home,
  Camera,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";

import { useAuth } from "../contexts/AuthContext";
import AdminNotificationBell from "../components/AdminNotificationBell";

// FIXED MODE: Use proper authentication but with navigation optimizations
const USE_SIMPLE_MODE = false;

function SimpleAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-red-600">Admin Panel (TEST)</h1>
          <p className="text-xs text-gray-500">
            Simple Mode - No Auth Blocking
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Home className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            href="/admin/bookings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/bookings")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Calendar className="w-5 h-5" /> Bookings
          </Link>
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/users")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Users className="w-5 h-5" /> Users
          </Link>
          <Link
            href="/admin/reviews"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/reviews")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Star className="w-5 h-5" /> Reviews
          </Link>
          <Link
            href="/admin/payments"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/payments")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <CreditCard className="w-5 h-5" /> Payments
          </Link>
          <Link
            href="/admin/reports"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/reports")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <BarChart3 className="w-5 h-5" /> Reports
          </Link>
          <Link
            href="/admin/gallery"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/gallery")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Camera className="w-5 h-5" /> Gallery
          </Link>
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive("/admin/settings")
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-blue-50"
            }`}
          >
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => (window.location.href = "/")}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4">
          <h2 className="text-xl font-semibold text-gray-700">
            TEST MODE: {pathname}
          </h2>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const { user: authUser, userRole, loading: authLoading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ✅ OPTIMIZED: Debounced auth check to prevent navigation blocking
  useEffect(() => {
    const authCheckTimer = setTimeout(() => {
      if (authLoading) return;

      if (
        authUser &&
        userRole &&
        (userRole === "admin" || userRole === "staff")
      ) {
        setUser(authUser);
        setAdminName(
          `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} User`
        );
        setLoading(false);
        return;
      }

      if (!authLoading) {
        console.log("🔐 Admin layout: Redirecting to auth (non-blocking)");
        setTimeout(() => router.replace("/auth"), 100);
      }
    }, 50); // 50ms delay to not block navigation

    return () => clearTimeout(authCheckTimer);
  }, [authUser, userRole, authLoading, router]);

  const handleLogout = async () => {
    try {
      const { safeLogout } = await import("../utils/apiTimeout");
      await safeLogout(supabase, 2000);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.href = "/";
    }
  };

  // Navigation items for reuse
  const navItems = [
    { href: "/admin", icon: Home, label: "Dashboard" },
    { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
    { href: "/admin/users", icon: Users, label: "Users" },
    { href: "/admin/reviews", icon: Star, label: "Reviews" },
    { href: "/admin/payments", icon: CreditCard, label: "Payments" },
    { href: "/admin/reports", icon: BarChart3, label: "Reports" },
    { href: "/admin/gallery", icon: Camera, label: "Gallery" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

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
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on lg+ */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-md flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="p-4 sm:p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Kampo Ibayo Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg sm:text-xl font-bold text-red-600 leading-tight">
                  Kampo Ibayo
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 sm:py-2 rounded-md transition-colors ${
                isActive(item.href)
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout Button at Bottom */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 sm:py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with hamburger menu */}
        <header className="bg-white shadow-sm p-3 sm:p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger menu for mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 truncate">
              Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Notification Bell */}
            <AdminNotificationBell />

            <div className="flex flex-col gap-1">
              <div className="hidden sm:flex items-center gap-2 text-gray-700 font-semibold bg-blue-50 px-3 py-1 rounded-full text-sm">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="hidden md:inline">
                  {adminName || user?.email || "Admin User"}
                </span>
                <span className="md:hidden">
                  {userRole?.charAt(0).toUpperCase()}
                </span>
              </div>
              {userRole && (
                <div
                  className={`text-xs px-2 sm:px-3 py-1 rounded-full text-center ${
                    userRole === "admin"
                      ? "bg-red-100 text-red-700"
                      : userRole === "staff"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="p-3 sm:p-4 md:p-6 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TEST: Use simple layout to see if navigation works without auth complexity
  if (USE_SIMPLE_MODE) {
    console.log("🧪 USING SIMPLE MODE - No auth blocking for navigation test");
    return <SimpleAdminLayout>{children}</SimpleAdminLayout>;
  }

  return <FullAdminLayout>{children}</FullAdminLayout>;
}
