"use client";

import {
  PhilippinePeso,
  BarChart3,
  Clock,
} from "lucide-react";

interface Payment {
  id: number;
  status: string;
  amount: number;
  payment_type: string | null;
  is_walk_in?: boolean;
  booking_status: string | null;
  total_amount: number | null;
}

interface PaymentFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  payments: Payment[];
  filteredPayments: Payment[];
}

export default function PaymentFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  payments,
  filteredPayments,
}: PaymentFiltersProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by guest name, email, reference number, or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <p className="text-sm text-muted-foreground mt-1">
            Found {filteredPayments.length} payment
            {filteredPayments.length !== 1 ? "s" : ""} matching &quot;
            {searchTerm}&quot;
          </p>
        )}
      </div>
      {/* Status Filter Buttons */}
      <div className="mb-4 sm:mb-6">
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-info/10 text-primary border border-info/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">All</span>
            <span className="hidden sm:inline">All</span>
            <span className="ml-1">({payments.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter("paid")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "paid"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Paid</span>
            <span className="hidden sm:inline">Paid</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() !== "cancelled" &&
                    (p.status?.toLowerCase() === "paid" ||
                      p.status?.toLowerCase() === "verified"),
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "pending"
                ? "bg-warning/10 text-warning border border-warning/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Pend</span>
            <span className="hidden sm:inline">Pending</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() !== "cancelled" &&
                    (p.status?.toLowerCase() === "pending" ||
                      p.status?.toLowerCase() === "pending_verification"),
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("cancelled")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "cancelled"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Canc</span>
            <span className="hidden sm:inline">Cancelled</span>
            <span className="ml-1">
              (
              {
                payments.filter(
                  (p) =>
                    p.booking_status?.toLowerCase() === "cancelled" ||
                    p.status?.toLowerCase() === "cancelled" ||
                    p.status?.toLowerCase() === "rejected",
                ).length
              }
              )
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("half")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "half"
                ? "bg-info/10 text-primary border border-info/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">50%</span>
            <span className="hidden sm:inline">Down Payments</span>
            <span className="ml-1">
              ({payments.filter((p) => p.payment_type === "half").length})
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("full")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "full"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Full</span>
            <span className="hidden sm:inline">Full Payments</span>
            <span className="ml-1">
              ({payments.filter((p) => p.payment_type === "full").length})
            </span>
          </button>
          <button
            onClick={() => setStatusFilter("walk_in")}
            className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-colors ${
              statusFilter === "walk_in"
                ? "bg-warning/10 text-warning border border-warning/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            <span className="sm:hidden">Walk-in</span>
            <span className="hidden sm:inline">Walk-in</span>
            <span className="ml-1">
              ({payments.filter((p) => p.is_walk_in).length})
            </span>
          </button>
        </div>
        {(statusFilter !== "all" || searchTerm) && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Showing {filteredPayments.length} of {payments.length} payments
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center">
            <div className="p-2 bg-success/10 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-success" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue{searchTerm && " (filtered)"}
              </p>
              <p className="text-xl font-bold text-foreground">
                {filteredPayments
                  .filter(
                    (p) =>
                      p.status?.toLowerCase() === "paid" ||
                      p.status?.toLowerCase() === "verified",
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-info/10 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Down Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {
                  filteredPayments.filter((p) => p.payment_type === "half")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                ₱
                {filteredPayments
                  .filter(
                    (p) =>
                      p.payment_type === "half" &&
                      (p.status?.toLowerCase() === "paid" ||
                        p.status?.toLowerCase() === "verified"),
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                paid
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-chart-4/10 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-chart-4" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Full Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {
                  filteredPayments.filter((p) => p.payment_type === "full")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                ₱
                {filteredPayments
                  .filter(
                    (p) =>
                      p.payment_type === "full" &&
                      (p.status?.toLowerCase() === "paid" ||
                        p.status?.toLowerCase() === "verified"),
                  )
                  .reduce((sum, p) => sum + p.amount, 0)
                  .toLocaleString()}{" "}
                paid
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-warning/10 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                Pending{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {
                  filteredPayments.filter(
                    (p) =>
                      p.status?.toLowerCase() === "pending" ||
                      p.status?.toLowerCase() === "pending_verification",
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
