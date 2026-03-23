"use client";

import {
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tables } from "@/database.types";

type BookingRow = Tables<"bookings">;

interface UserReportTableProps {
  filteredBookings: BookingRow[];
  allUsers: { email: string; full_name: string; phone: string | null; created_at: string | null; role: string | null }[];
  isLoading: boolean;
  customerPage: number;
  setCustomerPage: (page: number | ((prev: number) => number)) => void;
}

export default function UserReportTable({
  filteredBookings,
  allUsers,
  isLoading,
  customerPage,
  setCustomerPage,
}: UserReportTableProps) {
  return (
    <div className="bg-card rounded-xl shadow-md p-3 sm:p-6">
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-foreground">Loading customers...</span>
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

          // Role priority: user (0) -> staff (1) -> admin (2)
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
            if (role === "admin") return { label: "Admin", color: "bg-destructive/10 text-destructive" };
            if (role === "staff") return { label: "Staff", color: "bg-info/10 text-info" };
            return null;
          };

          const getCategory = (visits: number) => {
            if (visits === 0) return { label: "No Bookings", color: "bg-muted text-muted-foreground" };
            if (visits >= 7) return { label: "VIP", color: "bg-chart-4/10 text-chart-4" };
            if (visits >= 4) return { label: "Frequent", color: "bg-success/10 text-success" };
            if (visits >= 2) return { label: "Returning", color: "bg-warning/10 text-warning" };
            return { label: "New", color: "bg-info/10 text-primary" };
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
              <div className="text-center py-12 text-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-60" />
                <p>No customers found</p>
              </div>
            );
          }

          return (
            <>
              {/* Header with stats */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  Customer List
                </h3>
                <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                  <span>{customers.length} total</span>
                  <span className="text-border">|</span>
                  <span className="text-success font-medium">{bookersCount} booked</span>
                  <span className="text-border">|</span>
                  <span className="text-muted-foreground">{noBookingsCount} never booked</span>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {paginatedCustomers.map((customer) => {
                  const cat = getCategory(customer.confirmedBookings);
                  return (
                    <div
                      key={customer.email}
                      className="bg-muted border border-border rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-foreground text-sm flex items-center gap-1.5">
                            {customer.name}
                            {getRoleBadge(customer.role) && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${getRoleBadge(customer.role)!.color}`}>
                                {getRoleBadge(customer.role)!.label}
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-muted-foreground">{customer.phone}</p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.color}`}>
                          {cat.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div>
                          <span className="text-muted-foreground">Visits</span>
                          <p className="font-medium text-foreground">{customer.confirmedBookings}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Spent</span>
                          <p className="font-medium text-foreground">₱{customer.totalSpent.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Last Visit</span>
                          <p className="font-medium text-foreground">{formatDate(customer.lastVisit)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border">
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
                  <tbody className="divide-y divide-border">
                    {paginatedCustomers.map((customer) => {
                      const cat = getCategory(customer.confirmedBookings);
                      return (
                        <tr key={customer.email} className={`hover:bg-muted ${customer.confirmedBookings === 0 ? "opacity-60" : ""}`}>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${customer.confirmedBookings > 0 ? "bg-info/10" : "bg-muted"}`}>
                                <span className={`text-xs font-semibold ${customer.confirmedBookings > 0 ? "text-primary" : "text-muted-foreground"}`}>
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium text-foreground">{customer.name}</span>
                              {getRoleBadge(customer.role) && (
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getRoleBadge(customer.role)!.color}`}>
                                  {getRoleBadge(customer.role)!.label}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-foreground">{customer.email}</p>
                            {customer.phone && (
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-foreground">
                            {customer.confirmedBookings}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.color}`}>
                              {cat.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-foreground">
                            {customer.totalSpent > 0 ? `₱${customer.totalSpent.toLocaleString()}` : "—"}
                          </td>
                          <td className="py-3 px-3 text-foreground">
                            {formatDate(customer.lastVisit)}
                          </td>
                          <td className="py-3 px-3 text-foreground">
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
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-border gap-3">
                  <div className="text-xs sm:text-sm text-foreground font-medium">
                    Showing {custStart + 1} to {Math.min(custEnd, customers.length)} of {customers.length} customers
                  </div>

                  {/* Mobile Pagination */}
                  <div className="flex sm:hidden w-full justify-between items-center">
                    <button
                      onClick={() => setCustomerPage((prev: number) => Math.max(prev - 1, 1))}
                      disabled={customerPage === 1}
                      className="px-3 py-2 text-xs text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-foreground">
                      Page {customerPage}/{custTotalPages}
                    </span>
                    <button
                      onClick={() => setCustomerPage((prev: number) => Math.min(prev + 1, custTotalPages))}
                      disabled={customerPage === custTotalPages}
                      className="px-3 py-2 text-xs text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>

                  {/* Desktop Pagination */}
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      onClick={() => setCustomerPage((prev: number) => Math.max(prev - 1, 1))}
                      disabled={customerPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCustomerPage((prev: number) => Math.min(prev + 1, custTotalPages))}
                      disabled={customerPage === custTotalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}
