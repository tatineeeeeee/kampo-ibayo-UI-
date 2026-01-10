"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  PhilippinePeso,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Optimized stats interface
interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  totalRevenue: number;
  confirmedRevenue: number;
  completedRevenue: number;
  averageBookingValue: number;
}

interface ChartData {
  monthlyRevenue: Array<{
    name: string;
    revenue: number;
    bookings: number;
    confirmed: number;
    cancelled: number;
    pending: number;
    completed: number;
  }>;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    confirmedRevenue: 0,
    completedRevenue: 0,
    averageBookingValue: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    monthlyRevenue: [],
    statusDistribution: [],
  });
  const [loading, setLoading] = useState(false); // Start false for instant UI
  const [error, setError] = useState<string | null>(null);

  // ✅ LIVE STATISTICS - Auto-refresh every 30 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Enhanced query for charts - get both created_at and check_in_date for monthly data
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("status, total_amount, created_at, check_in_date")
          .order("created_at", { ascending: false })
          .limit(500); // Limit for performance

        if (bookingsError) throw bookingsError;

        console.log(
          "🔍 Debug - Raw bookings from database:",
          bookings?.length || 0,
          "bookings found"
        );

        if (bookings && bookings.length > 0) {
          const totalBookings = bookings.length;
          const confirmedBookings = bookings.filter(
            (b) => b.status === "confirmed"
          ).length;
          const pendingBookings = bookings.filter(
            (b) => b.status === "pending"
          ).length;
          const cancelledBookings = bookings.filter(
            (b) => b.status === "cancelled"
          ).length;
          const completedBookingsCount = bookings.filter(
            (b) => b.status === "completed"
          ).length;

          console.log("🔍 Debug - Booking counts:", {
            totalBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            completedBookingsCount,
          });

          // Revenue from confirmed bookings
          const confirmedRevenue = bookings
            .filter((b) => b.status === "confirmed")
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

          // Revenue from completed bookings
          const completedRevenue = bookings
            .filter((b) => b.status === "completed")
            .reduce((sum, b) => sum + (b.total_amount || 0), 0);

          // Total revenue = confirmed + completed
          const totalRevenue = confirmedRevenue + completedRevenue;

          const averageBookingValue =
            (confirmedBookings + completedBookingsCount) > 0 
              ? totalRevenue / (confirmedBookings + completedBookingsCount) 
              : 0;

          setStats({
            totalBookings,
            confirmedBookings,
            pendingBookings,
            cancelledBookings,
            completedBookings: completedBookingsCount,
            totalRevenue,
            confirmedRevenue,
            completedRevenue,
            averageBookingValue,
          });

          // 📊 Generate REAL chart data for the last 12 months (extended for more data)
          const monthlyData = new Map<
            string,
            {
              revenue: number;
              confirmed: number;
              cancelled: number;
              pending: number;
              completed: number;
            }
          >();
          const now = new Date();

          // Initialize last 12 months to capture more data
          for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            });
            monthlyData.set(monthKey, {
              revenue: 0,
              confirmed: 0,
              cancelled: 0,
              pending: 0,
              completed: 0,
            });
          }

          // Aggregate ALL bookings by month and status
          bookings.forEach((booking) => {
            // Use created_at first, fallback to check_in_date if created_at is null
            const dateToUse = booking.created_at || booking.check_in_date;

            if (dateToUse) {
              const bookingDate = new Date(dateToUse);
              const monthKey = bookingDate.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });

              // Allow any month, not just the initialized ones, in case data is older
              if (!monthlyData.has(monthKey)) {
                monthlyData.set(monthKey, {
                  revenue: 0,
                  confirmed: 0,
                  cancelled: 0,
                  pending: 0,
                  completed: 0,
                });
              }

              const current = monthlyData.get(monthKey)!;

              if (booking.status === "confirmed") {
                current.confirmed += 1;
                current.revenue += booking.total_amount || 0;
              } else if (booking.status === "cancelled") {
                current.cancelled += 1;
              } else if (booking.status === "pending") {
                current.pending += 1;
              } else if (booking.status === "completed") {
                current.completed += 1;
                current.revenue += booking.total_amount || 0;
              }
            }
          });

          // Convert to chart format with REAL data
          const monthlyRevenue = Array.from(monthlyData.entries()).map(
            ([name, data]) => ({
              name,
              revenue: data.revenue,
              bookings: data.confirmed + data.cancelled + data.pending + data.completed, // Total bookings
              confirmed: data.confirmed,
              cancelled: data.cancelled,
              pending: data.pending,
              completed: data.completed,
            })
          );

          // Count completed bookings
          const completedBookings = bookings.filter(
            (b) => b.status === "completed"
          ).length;

          // Status distribution for pie chart
          const statusDistribution = [
            { name: "Confirmed", value: confirmedBookings, color: "#10b981" },
            { name: "Pending", value: pendingBookings, color: "#f59e0b" },
            { name: "Cancelled", value: cancelledBookings, color: "#ef4444" },
            { name: "Completed", value: completedBookings, color: "#3b82f6" },
          ].filter((item) => item.value > 0);

          setChartData({
            monthlyRevenue,
            statusDistribution,
          });

          console.log("📊 Dashboard stats updated:", {
            totalBookings,
            confirmedBookings,
            totalRevenue,
            averageBookingValue,
            chartData: { monthlyRevenue, statusDistribution },
          });

          console.log(
            "🔍 Debug - Raw bookings data:",
            bookings.slice(0, 5).map((b) => ({
              status: b.status,
              total_amount: b.total_amount,
              created_at: b.created_at,
              monthKey: b.created_at
                ? new Date(b.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })
                : "No created_at",
            }))
          );

          console.log(
            "🔍 Debug - Monthly data map:",
            Array.from(monthlyData.entries())
          );
          console.log("🔍 Debug - Final monthlyRevenue:", monthlyRevenue);
        } else {
          console.log("⚠️ No bookings found in database");
          // Set empty state but still initialize chart structure
          setStats({
            totalBookings: 0,
            confirmedBookings: 0,
            pendingBookings: 0,
            cancelledBookings: 0,
            completedBookings: 0,
            totalRevenue: 0,
            confirmedRevenue: 0,
            completedRevenue: 0,
            averageBookingValue: 0,
          });
          setChartData({
            monthlyRevenue: [],
            statusDistribution: [],
          });
        }
      } catch (err) {
        console.error("❌ Error fetching dashboard stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        console.log("✅ Dashboard stats fetch completed");
        setLoading(false);
      }
    };

    // ✅ LIVE UPDATES: Initial fetch + auto-refresh every 30 seconds
    const timer = setTimeout(() => {
      console.log("🔄 Fetching dashboard stats...");
      fetchStats();
    }, 500);

    // Set up live refresh interval
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing dashboard stats...");
      fetchStats();
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Admin Dashboard
        </h1>
        <div className="text-sm sm:text-base text-gray-600">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span>
              Loading statistics...
            </span>
          ) : error ? (
            <span className="text-red-600">Error loading data</span>
          ) : (
            "Resort management overview and key metrics"
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error Loading Statistics</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Bookings
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {loading ? (
                  <span className="w-16 h-8 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stats.totalBookings.toLocaleString()
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">
                Confirmed Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-green-600 truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.confirmedRevenue)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.confirmedBookings} bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">
                Completed Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.completedRevenue)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.completedBookings} bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm font-medium">
                Total Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-600 truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.totalRevenue)
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Confirmed + Completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm">
                Confirmed
              </h3>
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stats.confirmedBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm">
                Pending
              </h3>
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stats.pendingBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm">
                Cancelled
              </h3>
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stats.cancelledBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-gray-500 text-xs sm:text-sm">
                Completed
              </h3>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {loading ? (
                  <span className="w-12 h-6 bg-gray-200 animate-pulse rounded inline-block"></span>
                ) : (
                  stats.completedBookings
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏖️ KAMPO IBAYO RESORT DASHBOARD */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            Monthly Revenue Trend
          </h3>
          {loading ? (
            <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : chartData.monthlyRevenue.length > 0 ? (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "revenue"
                        ? formatCurrency(value as number)
                        : value,
                      name === "revenue" ? "Revenue" : "Bookings",
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue (PHP)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <PhilippinePeso className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No revenue data available</p>
              </div>
            </div>
          )}
        </div>

        {/* Booking Status Overview */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="hidden sm:inline">
              Monthly Booking & Cancellation Trends
            </span>
            <span className="sm:hidden">Booking Trends</span>
          </h3>
          {loading ? (
            <div className="h-48 sm:h-64 bg-gray-100 animate-pulse rounded-lg"></div>
          ) : chartData.monthlyRevenue.length > 0 ? (
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                  <Bar dataKey="completed" fill="#3b82f6" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 sm:h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">No booking data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a
            href="/admin/bookings"
            className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left block"
          >
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-blue-800 text-sm sm:text-base">
              Manage Bookings
            </h4>
            <p className="text-xs sm:text-sm text-blue-600 hidden sm:block">
              View and manage reservations
            </p>
          </a>

          <a
            href="/admin/users"
            className="p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left block"
          >
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-green-800 text-sm sm:text-base">
              User Management
            </h4>
            <p className="text-xs sm:text-sm text-green-600 hidden sm:block">
              Manage user accounts
            </p>
          </a>

          <a
            href="/admin/reviews"
            className="p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left block"
          >
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-purple-800 text-sm sm:text-base">
              Reviews
            </h4>
            <p className="text-xs sm:text-sm text-purple-600 hidden sm:block">
              Approve customer reviews
            </p>
          </a>

          <a
            href="/admin/settings"
            className="p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left block"
          >
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 mb-2" />
            <h4 className="font-medium text-gray-800 text-sm sm:text-base">
              Settings
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              System configuration
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
