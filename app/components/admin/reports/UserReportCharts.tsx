"use client";

import {
  Users,
  TrendingUp,
} from "lucide-react";
import { Tables } from "@/database.types";
import {
  PieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type BookingRow = Tables<"bookings">;

interface UserReportChartsProps {
  filteredBookings: BookingRow[];
  isLoading: boolean;
}

export default function UserReportCharts({
  filteredBookings,
  isLoading,
}: UserReportChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-info" />
          Guest Visit Frequency
        </h3>
        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={(() => {
                  const visitCounts: { [key: string]: number } = {};

                  // Count visits per guest (by email) — only confirmed/completed
                  filteredBookings
                    .filter((b) => b.status === "confirmed" || b.status === "completed")
                    .forEach((booking) => {
                      const email = booking.guest_email || "Unknown";
                      visitCounts[email] = (visitCounts[email] || 0) + 1;
                    });

                  // Categorize by visit frequency
                  const categories = {
                    "First Time (1 visit)": 0,
                    "Returning (2-3 visits)": 0,
                    "Frequent (4-6 visits)": 0,
                    "VIP (7+ visits)": 0,
                  };

                  Object.values(visitCounts).forEach((count: number) => {
                    if (count === 1) categories["First Time (1 visit)"]++;
                    else if (count <= 3)
                      categories["Returning (2-3 visits)"]++;
                    else if (count <= 6)
                      categories["Frequent (4-6 visits)"]++;
                    else categories["VIP (7+ visits)"]++;
                  });

                  return Object.entries(categories).map(
                    ([name, value]) => ({
                      name,
                      value,
                      fill: name.includes("First")
                        ? "hsl(var(--chart-3))"
                        : name.includes("Returning")
                          ? "hsl(var(--chart-2))"
                          : name.includes("Frequent")
                            ? "hsl(var(--chart-1))"
                            : "hsl(var(--chart-4))",
                    }),
                  );
                })()}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
                labelLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  color: "#000000",
                }}
                labelStyle={{ color: "#000000" }}
              />
              <Legend wrapperStyle={{ color: "#000000" }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-card p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-success" />
          Customer Growth Over Time
        </h3>
        {isLoading ? (
          <div className="h-64 bg-muted animate-pulse rounded-lg"></div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart
              data={(() => {
                const months = [
                  "Jan",
                  "Feb",
                  "Mar",
                  "Apr",
                  "May",
                  "Jun",
                  "Jul",
                  "Aug",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dec",
                ];

                // Get unique customers by month
                const monthlyCustomers = new Map();
                const uniqueCustomers = new Set();

                // Initialize months with 0
                months.forEach((month) => monthlyCustomers.set(month, 0));

                // Count cumulative unique customers by month
                filteredBookings
                  .sort(
                    (a, b) =>
                      new Date(a.created_at || "").getTime() -
                      new Date(b.created_at || "").getTime(),
                  )
                  .forEach((booking) => {
                    if (booking.created_at && booking.guest_email) {
                      const monthIndex = new Date(
                        booking.created_at,
                      ).getMonth();
                      const monthName = months[monthIndex];

                      // Add to unique customers set
                      if (!uniqueCustomers.has(booking.guest_email)) {
                        uniqueCustomers.add(booking.guest_email);
                        monthlyCustomers.set(
                          monthName,
                          monthlyCustomers.get(monthName) + 1,
                        );
                      }
                    }
                  });

                // Convert to cumulative count
                let runningTotal = 0;
                return months
                  .map((month) => {
                    runningTotal += monthlyCustomers.get(month);
                    return {
                      month,
                      customers: runningTotal,
                      newCustomers: monthlyCustomers.get(month),
                    };
                  })
                  .filter(
                    (item) => item.customers > 0 || item.newCustomers > 0,
                  );
              })()}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#000000", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "#000000", fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  color: "#000000",
                }}
                labelStyle={{ color: "#000000" }}
              />
              <Legend wrapperStyle={{ color: "#000000" }} />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="hsl(var(--chart-3))"
                fill="hsl(var(--chart-3))"
                fillOpacity={0.3}
                name="Total Customers"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
