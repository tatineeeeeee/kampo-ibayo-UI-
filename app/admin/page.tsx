"use client";

import {
  Calendar,
  PhilippinePeso,
  Clock,
  CheckCircle,
  XCircle,
  Footprints,
} from "lucide-react";
import { useAdminDashboard } from "../hooks/useAdminDashboard";
import DashboardCharts from "../components/admin/bookings/DashboardCharts";
import DashboardQuickActions from "../components/admin/bookings/DashboardQuickActions";

export default function DashboardPage() {
  const { stats, chartData, loading, error, formatCurrency } =
    useAdminDashboard();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h1>
        <div className="text-sm sm:text-base text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
              Loading statistics...
            </span>
          ) : error ? (
            <span className="text-destructive">Error loading data</span>
          ) : (
            "Resort management overview and key metrics"
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-destructive font-medium">Error Loading Statistics</h3>
          <p className="text-destructive text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-destructive text-white rounded text-sm hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-info flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">
                Total Bookings
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {loading ? (
                  <span className="w-16 h-8 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.totalBookings.toLocaleString()
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-success flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">
                Confirmed Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-success truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.confirmedRevenue)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.confirmedBookings} bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-info flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">
                Completed Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-primary truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.completedRevenue)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedBookings} bookings
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <PhilippinePeso className="w-6 h-6 sm:w-8 sm:h-8 text-success flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm font-medium">
                Total Revenue
              </h3>
              <div className="text-2xl sm:text-3xl font-bold text-success truncate">
                {loading ? (
                  <span className="w-20 h-8 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  formatCurrency(stats.totalRevenue)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending + Confirmed + Completed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Status Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm">Confirmed</h3>
              <div className="text-xl sm:text-2xl font-bold text-success">
                {loading ? (
                  <span className="w-12 h-6 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.confirmedBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm">Pending</h3>
              <div className="text-xl sm:text-2xl font-bold text-warning">
                {loading ? (
                  <span className="w-12 h-6 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.pendingBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-destructive flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm">Cancelled</h3>
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                {loading ? (
                  <span className="w-12 h-6 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.cancelledBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-info flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm">Completed</h3>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {loading ? (
                  <span className="w-12 h-6 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.completedBookings
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
          <div className="flex items-center gap-3">
            <Footprints className="w-6 h-6 sm:w-8 sm:h-8 text-warning flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-muted-foreground text-xs sm:text-sm">Walk-ins</h3>
              <div className="text-xl sm:text-2xl font-bold text-warning">
                {loading ? (
                  <span className="w-12 h-6 bg-muted animate-pulse rounded inline-block"></span>
                ) : (
                  stats.walkInBookings
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts
        loading={loading}
        chartData={chartData}
        formatCurrency={formatCurrency}
      />

      {/* Quick Actions */}
      <DashboardQuickActions />
    </div>
  );
}
