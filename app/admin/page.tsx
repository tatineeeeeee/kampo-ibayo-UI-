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

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Recent Bookings
        </h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="p-3">Guest</th>
              <th className="p-3">Date</th>
              <th className="p-3">Guests</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">Juan Dela Cruz</td>
              <td className="p-3">Sept 16, 2025</td>
              <td className="p-3">4</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-green-100 text-green-600 rounded-md text-xs">
                  Confirmed
                </span>
              </td>
            </tr>
            <tr className="border-t">
              <td className="p-3">Maria Santos</td>
              <td className="p-3">Sept 20, 2025</td>
              <td className="p-3">2</td>
              <td className="p-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-md text-xs">
                  Pending
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}