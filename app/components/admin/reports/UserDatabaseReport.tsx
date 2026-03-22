"use client";

import {
  Users,
  TrendingUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
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

interface UserDatabaseReportProps {
  filteredBookings: BookingRow[];
  allUsers: { email: string; full_name: string; phone: string | null; created_at: string | null; role: string | null }[];
  isLoading: boolean;
  customerPage: number;
  setCustomerPage: (page: number | ((prev: number) => number)) => void;
}

export default function UserDatabaseReport({
  filteredBookings,
  allUsers,
  isLoading,
  customerPage,
  setCustomerPage,
}: UserDatabaseReportProps) {
  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Guest Visit Frequency
          </h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
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
                          ? "#3b82f6"
                          : name.includes("Returning")
                            ? "#f59e0b"
                            : name.includes("Frequent")
                              ? "#10b981"
                              : "#8b5cf6",
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

        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Customer Growth Over Time
          </h3>
          {isLoading ? (
            <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
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
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Total Customers"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-700">Loading customers...</span>
          </div>
        ) : (
          (() => {
            // Aggregate bookings per customer email
            const customerMap = new Map<string, {
              name: string;
              email: string;
              phone: string | null;
              confirmedBookings: number;
              totalSpent: number;
              lastVisit: string | null;
              firstVisit: string | null;
              role: string | null;
            }>();

            // First: add all registered users so they appear even without bookings
            allUsers.forEach((u) => {
              if (!customerMap.has(u.email)) {
                customerMap.set(u.email, {
                  name: u.full_name,
                  email: u.email,
                  phone: u.phone,
                  confirmedBookings: 0,
                  totalSpent: 0,
                  lastVisit: null,
                  firstVisit: null,
                  role: u.role,
                });
              }
            });

            // Then: layer booking data on top
            filteredBookings.forEach((b) => {
              const email = b.guest_email || "Unknown";
              const existing = customerMap.get(email);
              const isConfirmedOrCompleted = b.status === "confirmed" || b.status === "completed";

              if (!existing) {
                customerMap.set(email, {
                  name: b.guest_name || "Unknown",
                  email,
                  phone: b.guest_phone,
                  confirmedBookings: isConfirmedOrCompleted ? 1 : 0,
                  totalSpent: isConfirmedOrCompleted ? (b.total_amount || 0) : 0,
                  lastVisit: b.check_in_date,
                  firstVisit: b.check_in_date,
                  role: null,
                });
              } else {
                if (isConfirmedOrCompleted) {
                  existing.confirmedBookings++;
                  existing.totalSpent += b.total_amount || 0;
                }
                if (!existing.phone && b.guest_phone) existing.phone = b.guest_phone;
                if (!existing.lastVisit || b.check_in_date > existing.lastVisit) existing.lastVisit = b.check_in_date;
                if (!existing.firstVisit || b.check_in_date < existing.firstVisit) existing.firstVisit = b.check_in_date;
              }
            });

            // Role priority: user (0) → staff (1) → admin (2)
            const rolePriority = (role: string | null) => {
              if (role === "admin") return 2;
              if (role === "staff") return 1;
              return 0; // "user" or null
            };

            // Sort: users first (by spending), then staff, then admin at bottom
            const customers = Array.from(customerMap.values()).sort((a, b) => {
              const roleA = rolePriority(a.role);
              const roleB = rolePriority(b.role);
              if (roleA !== roleB) return roleA - roleB;
              // Within same role: bookers first, then by spending
              if (a.confirmedBookings > 0 && b.confirmedBookings === 0) return -1;
              if (a.confirmedBookings === 0 && b.confirmedBookings > 0) return 1;
              return b.totalSpent - a.totalSpent;
            });

            const getRoleBadge = (role: string | null) => {
              if (role === "admin") return { label: "Admin", color: "bg-red-100 text-red-700" };
              if (role === "staff") return { label: "Staff", color: "bg-indigo-100 text-indigo-700" };
              return null;
            };

            const getCategory = (visits: number) => {
              if (visits === 0) return { label: "No Bookings", color: "bg-gray-100 text-gray-600" };
              if (visits >= 7) return { label: "VIP", color: "bg-purple-100 text-purple-800" };
              if (visits >= 4) return { label: "Frequent", color: "bg-green-100 text-green-800" };
              if (visits >= 2) return { label: "Returning", color: "bg-yellow-100 text-yellow-800" };
              return { label: "New", color: "bg-blue-100 text-blue-800" };
            };

            const formatDate = (d: string | null) =>
              d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

            // Pagination
            const custPerPage = 10;
            const custTotalPages = Math.ceil(customers.length / custPerPage);
            const custStart = (customerPage - 1) * custPerPage;
            const custEnd = custStart + custPerPage;
            const paginatedCustomers = customers.slice(custStart, custEnd);
            const bookersCount = customers.filter((c) => c.confirmedBookings > 0).length;
            const noBookingsCount = customers.length - bookersCount;

            if (customers.length === 0) {
              return (
                <div className="text-center py-12 text-gray-700">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-60" />
                  <p>No customers found</p>
                </div>
              );
            }

            return (
              <>
                {/* Header with stats */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700">
                    Customer List
                  </h3>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
                    <span>{customers.length} total</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-green-600 font-medium">{bookersCount} booked</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-500">{noBookingsCount} never booked</span>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {paginatedCustomers.map((customer) => {
                    const cat = getCategory(customer.confirmedBookings);
                    return (
                      <div
                        key={customer.email}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm flex items-center gap-1.5">
                              {customer.name}
                              {getRoleBadge(customer.role) && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getRoleBadge(customer.role)!.color}`}>
                                  {getRoleBadge(customer.role)!.label}
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-gray-600 truncate max-w-[180px]">
                              {customer.email}
                            </p>
                            {customer.phone && (
                              <p className="text-xs text-gray-500">{customer.phone}</p>
                            )}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.color}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="text-gray-400">Visits</span>
                            <p className="font-medium text-gray-900">{customer.confirmedBookings}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Spent</span>
                            <p className="font-medium text-gray-900">₱{customer.totalSpent.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Last Visit</span>
                            <p className="font-medium text-gray-900">{formatDate(customer.lastVisit)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-3 font-medium">Customer</th>
                        <th className="py-3 px-3 font-medium">Contact</th>
                        <th className="py-3 px-3 font-medium text-center">Visits</th>
                        <th className="py-3 px-3 font-medium text-center">Category</th>
                        <th className="py-3 px-3 font-medium text-right">Total Spent</th>
                        <th className="py-3 px-3 font-medium">Last Visit</th>
                        <th className="py-3 px-3 font-medium">First Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedCustomers.map((customer) => {
                        const cat = getCategory(customer.confirmedBookings);
                        return (
                          <tr key={customer.email} className={`hover:bg-gray-50 ${customer.confirmedBookings === 0 ? "opacity-60" : ""}`}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${customer.confirmedBookings > 0 ? "bg-blue-100" : "bg-gray-100"}`}>
                                  <span className={`text-xs font-semibold ${customer.confirmedBookings > 0 ? "text-blue-700" : "text-gray-500"}`}>
                                    {customer.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">{customer.name}</span>
                                {getRoleBadge(customer.role) && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadge(customer.role)!.color}`}>
                                    {getRoleBadge(customer.role)!.label}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-gray-700">{customer.email}</p>
                              {customer.phone && (
                                <p className="text-xs text-gray-500">{customer.phone}</p>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-medium text-gray-900">
                              {customer.confirmedBookings}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                                {cat.label}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-medium text-gray-900">
                              {customer.totalSpent > 0 ? `₱${customer.totalSpent.toLocaleString()}` : "—"}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              {formatDate(customer.lastVisit)}
                            </td>
                            <td className="py-3 px-3 text-gray-700">
                              {formatDate(customer.firstVisit)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {custTotalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-3">
                    <div className="text-xs sm:text-sm text-gray-900 font-medium">
                      Showing {custStart + 1} to {Math.min(custEnd, customers.length)} of {customers.length} customers
                    </div>

                    {/* Mobile Pagination */}
                    <div className="flex sm:hidden w-full justify-between items-center">
                      <button
                        onClick={() => setCustomerPage((prev: number) => Math.max(prev - 1, 1))}
                        disabled={customerPage === 1}
                        className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-gray-700">
                        Page {customerPage}/{custTotalPages}
                      </span>
                      <button
                        onClick={() => setCustomerPage((prev: number) => Math.min(prev + 1, custTotalPages))}
                        disabled={customerPage === custTotalPages}
                        className="px-3 py-2 text-xs text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>

                    {/* Desktop Pagination */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={() => setCustomerPage((prev: number) => Math.max(prev - 1, 1))}
                        disabled={customerPage === 1}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: custTotalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCustomerPage(page)}
                            className={`px-3 py-2 text-sm rounded-lg font-medium ${
                              customerPage === page
                                ? "bg-green-600 text-white"
                                : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCustomerPage((prev: number) => Math.min(prev + 1, custTotalPages))}
                        disabled={customerPage === custTotalPages}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>
    </>
  );
}
