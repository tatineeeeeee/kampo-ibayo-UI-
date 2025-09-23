"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  // Sample Chart Data
  const revenueData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₱)",
        data: [12000, 15000, 18000, 20000, 17000, 22000],
        backgroundColor: "#10b981",
      },
    ],
  };

  const revenueOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Generate Reports
        </h3>
        <p className="text-gray-600 mb-4">
          Download booking and revenue reports for analysis.
        </p>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <label htmlFor="report-type" className="block text-xs text-gray-600 mb-1">
              Report Type
            </label>
            <select id="report-type" className="border rounded-md px-3 py-2 text-sm text-gray-700">
              <option>Booking Report</option>
              <option>Revenue Report</option>
              <option>User Report</option>
            </select>
          </div>
          <div>
            <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              className="border rounded-md px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              className="border rounded-md px-3 py-2 text-sm text-gray-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-x-3">
          <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm">
            Download PDF
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm">
            Download Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Total Bookings</h3>
          <p className="text-3xl font-bold text-blue-600">124</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">₱95,000</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-gray-500 text-sm">Cancellations</h3>
          <p className="text-3xl font-bold text-red-600">12</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Monthly Revenue
        </h3>
        <Bar data={revenueData} options={revenueOptions} />
      </div>
    </div>
  );
}
