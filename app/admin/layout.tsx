"use client";
import Link from "next/link";
import { Calendar, Users, FileText, LogOut } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
                  <Link href="/admin/notifications" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Notifications
          </Link>
                  <Link href="/admin/payments" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Payments
          </Link>
                  <Link href="/admin/help" className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-blue-50 hover:text-blue-600">
            <FileText className="w-5 h-5" /> Help/FAQs
          </Link>
          
        </nav>
        <div className="p-4 border-t">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-md">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
          <span className="text-gray-600">Admin User</span>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
