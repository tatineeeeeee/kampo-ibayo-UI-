"use client";

import {
  Calendar,
  PhilippinePeso,
} from "lucide-react";
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
import type { ChartData } from "../../../hooks/useAdminDashboard";

interface DashboardChartsProps {
  loading: boolean;
  chartData: ChartData;
  formatCurrency: (amount: number) => string;
}

export default function DashboardCharts({
  loading,
  chartData,
  formatCurrency,
}: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
      {/* Monthly Revenue Trend */}
      <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
          Monthly Revenue Trend
        </h3>
        {loading ? (
          <div className="h-48 sm:h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : chartData.monthlyRevenue.length > 0 ? (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  labelStyle={{ color: "#000" }}
                  formatter={(value, name) => [
                    name === "revenue"
                      ? `₱${formatCurrency(value as number)}`
                      : value,
                    name === "revenue" ? "Revenue" : "Bookings",
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="Revenue (PHP)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <PhilippinePeso className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm">No revenue data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Status Overview */}
      <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="hidden sm:inline">
            Monthly Booking & Cancellation Trends
          </span>
          <span className="sm:hidden">Booking Trends</span>
        </h3>
        {loading ? (
          <div className="h-48 sm:h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : chartData.monthlyRevenue.length > 0 ? (
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip labelStyle={{ color: "#000" }} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="confirmed" fill="hsl(var(--chart-1))" name="Confirmed" />
                <Bar dataKey="pending" fill="hsl(var(--chart-2))" name="Pending" />
                <Bar dataKey="cancelled" fill="hsl(var(--destructive))" name="Cancelled" />
                <Bar dataKey="completed" fill="hsl(var(--chart-3))" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 sm:h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm">No booking data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
