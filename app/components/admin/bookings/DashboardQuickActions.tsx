"use client";

import {
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function DashboardQuickActions() {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <a
          href="/admin/bookings"
          className="p-3 sm:p-4 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors text-left block"
        >
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary mb-2" />
          <h4 className="font-medium text-primary text-sm sm:text-base">
            Manage Bookings
          </h4>
          <p className="text-xs sm:text-sm text-primary hidden sm:block">
            View and manage reservations
          </p>
        </a>

        <a
          href="/admin/users"
          className="p-3 sm:p-4 bg-success/10 rounded-lg hover:bg-success/20 transition-colors text-left block"
        >
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success mb-2" />
          <h4 className="font-medium text-success text-sm sm:text-base">
            User Management
          </h4>
          <p className="text-xs sm:text-sm text-success hidden sm:block">
            Manage user accounts
          </p>
        </a>

        <a
          href="/admin/reviews"
          className="p-3 sm:p-4 bg-chart-4/10 rounded-lg hover:bg-chart-4/20 transition-colors text-left block"
        >
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-chart-4 mb-2" />
          <h4 className="font-medium text-chart-4 text-sm sm:text-base">
            Reviews
          </h4>
          <p className="text-xs sm:text-sm text-chart-4 hidden sm:block">
            Approve customer reviews
          </p>
        </a>

        <a
          href="/admin/settings"
          className="p-3 sm:p-4 bg-muted rounded-lg hover:bg-muted transition-colors text-left block"
        >
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground mb-2" />
          <h4 className="font-medium text-foreground text-sm sm:text-base">
            Settings
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
            System configuration
          </p>
        </a>
      </div>
    </div>
  );
}
