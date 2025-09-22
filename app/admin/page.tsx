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
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useAdminNotifications } from "../hooks/useAdminNotifications";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { notifications, loading } = useAdminNotifications();
  
  // Line Chart Data (Bookings vs Cancellations)
  const bookingData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Bookings",
        data: [5, 12, 20, 25, 18, 22],
        borderColor: "#3b82f6",
        backgroundColor: "#3b82f6",
      },
      {
        label: "Cancellations",
        data: [1, 2, 3, 2, 1, 4],
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
      },
    ],
  };

  const bookingOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics - Now with Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Pending Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? "..." : notifications.pendingBookings}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">New Users (24h)</h3>
          <p className="text-3xl font-bold text-green-600">
            {loading ? "..." : notifications.newUsers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Total Notifications</h3>
          <p className="text-3xl font-bold text-purple-600">
            {loading ? "..." : notifications.totalNotifications}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Recent Cancellations</h3>
          <p className="text-3xl font-bold text-red-600">
            {loading ? "..." : notifications.recentCancellations}
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Reservation Statistics
        </h3>
        <Line data={bookingData} options={bookingOptions} />
      </div>
    </div>
  );
}