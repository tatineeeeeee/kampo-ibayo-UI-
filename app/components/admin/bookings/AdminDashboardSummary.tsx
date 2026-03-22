"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

// Component to show admin dashboard summary
export function AdminDashboardSummary() {
  const [stats, setStats] = useState({
    pendingPayments: 0,
    pendingBookings: 0,
    todayCheckIns: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get pending payment proofs
        const { data: pendingProofs, error: proofsError } = await supabase
          .from("payment_proofs")
          .select("booking_id")
          .eq("status", "pending");

        // Get all bookings for other stats
        const { data: allBookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("*");

        if (proofsError || bookingsError) {
          console.error("Error fetching stats:", proofsError || bookingsError);
          return;
        }

        const today = new Date().toISOString().split("T")[0];

        setStats({
          pendingPayments: pendingProofs?.length || 0,
          pendingBookings:
            allBookings?.filter((b) => b.status === "pending").length || 0,
          todayCheckIns:
            allBookings?.filter((b) => b.check_in_date === today).length || 0,
          totalRevenue:
            allBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) ||
            0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 mb-4">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4">
      <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
        Admin Dashboard
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div
          className={`text-center p-2 sm:p-3 rounded-lg border ${
            stats.pendingPayments > 0
              ? "bg-orange-50 border-orange-200 animate-pulse"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <p
            className={`text-xl sm:text-2xl font-bold ${
              stats.pendingPayments > 0 ? "text-orange-600" : "text-gray-600"
            }`}
          >
            {stats.pendingPayments}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600">
            Payment Reviews Needed
          </p>
          {stats.pendingPayments > 0 && (
            <p className="text-xs text-orange-600 font-medium">⚠ Urgent</p>
          )}
        </div>
        <div className="text-center p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xl sm:text-2xl font-bold text-yellow-600">
            {stats.pendingBookings}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600">
            Pending Bookings
          </p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {stats.todayCheckIns}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600">
            Today&apos;s Check-ins
          </p>
        </div>
        <div className="text-center p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            ₱{stats.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-600">Total Revenue</p>
        </div>
      </div>
    </div>
  );
}
