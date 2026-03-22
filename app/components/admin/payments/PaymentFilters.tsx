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
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
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
          <p className="text-sm text-gray-600 mt-1">
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
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
                ? "bg-amber-100 text-amber-700 border border-amber-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
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
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Showing {filteredPayments.length} of {payments.length} payments
            {statusFilter !== "all" && ` with status "${statusFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>{" "}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <PhilippinePeso className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">
                Total Revenue{searchTerm && " (filtered)"}
              </p>
              <p className="text-xl font-bold text-gray-900">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Down Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {
                  filteredPayments.filter((p) => p.payment_type === "half")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Full Payments{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {
                  filteredPayments.filter((p) => p.payment_type === "full")
                    .length
                }
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div className="ml-2 sm:ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Pending{searchTerm && " (filtered)"}
              </p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
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
