"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useAdminBookingStats } from "../hooks/useAdminBookingStats";
import { Calendar, TrendingUp, DollarSign, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function DashboardPage() {
  const { stats, loading: statsLoading, error } = useAdminBookingStats();

  // Chart configurations
  const bookingTrendsData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [
      {
        label: "Total Bookings",
        data: stats.monthlyData.map(d => d.bookings),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      },
      {
        label: "Cancellations",
        data: stats.monthlyData.map(d => d.cancellations),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const revenueData = {
    labels: stats.monthlyData.map(d => d.month),
    datasets: [
      {
        label: "Revenue (₱)",
        data: stats.monthlyData.map(d => d.revenue),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "#22c55e",
        borderWidth: 1,
      },
    ],
  };

  const statusDistributionData = {
    labels: stats.statusDistribution.map(s => s.status),
    datasets: [
      {
        data: stats.statusDistribution.map(s => s.count),
        backgroundColor: [
          "#22c55e", // Confirmed - Green
          "#f59e0b", // Pending - Yellow
          "#ef4444", // Cancelled - Red
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error Loading Statistics</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Bookings</h3>
              <p className="text-3xl font-bold text-blue-600">
                {statsLoading ? "..." : stats.totalBookings.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statsLoading ? "" : `${stats.growthMetrics.bookingsGrowth > 0 ? '+' : ''}${stats.growthMetrics.bookingsGrowth.toFixed(1)}% vs last month`}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
              <p className="text-3xl font-bold text-green-600">
                {statsLoading ? "..." : formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {statsLoading ? "" : `${stats.growthMetrics.revenueGrowth > 0 ? '+' : ''}${stats.growthMetrics.revenueGrowth.toFixed(1)}% vs last month`}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Pending Bookings</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {statsLoading ? "..." : stats.pendingBookings}
              </p>
              <p className="text-xs text-gray-500 mt-1">Need admin approval</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Occupancy Rate</h3>
              <p className="text-3xl font-bold text-purple-600">
                {statsLoading ? "..." : `${stats.occupancyRate.toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Nights booked vs available nights this month
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Booking Trends (Last 6 Months)
          </h3>
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <Line data={bookingTrendsData} options={chartOptions} />
          )}
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Monthly Revenue
          </h3>
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <Bar data={revenueData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Status Distribution and Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Booking Status Distribution
          </h3>
          {statsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">Loading chart...</div>
            </div>
          ) : (
            <>
              <Doughnut data={statusDistributionData} options={doughnutOptions} />
              <div className="mt-4 space-y-2">
                {stats.statusDistribution.map((item, index) => (
                  <div key={item.status} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ 
                          backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"][index] 
                        }}
                      />
                      <span className="font-medium">{item.status}</span>
                    </span>
                    <span className="font-semibold text-gray-800">{item.count} ({item.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Recent Bookings
          </h3>
          {statsLoading ? (
            <div className="text-gray-500">Loading recent bookings...</div>
          ) : stats.recentBookings.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No recent bookings found</div>
          ) : (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-500' :
                      booking.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{booking.guest_name}</p>
                      <p className="text-sm text-gray-500">
                        Check-in: {formatDate(booking.check_in_date)} • 
                        Check-out: {formatDate(booking.check_out_date)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Booked: {formatDate(booking.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(booking.total_amount)}</p>
                    <p className={`text-xs capitalize ${
                      booking.status === 'confirmed' ? 'text-green-600' :
                      booking.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-gray-500 text-sm">Confirmed Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats.confirmedBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="text-gray-500 text-sm">Average Booking Value</h3>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : formatCurrency(stats.averageBookingValue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="text-gray-500 text-sm">Cancelled Bookings</h3>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? "..." : stats.cancelledBookings}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}