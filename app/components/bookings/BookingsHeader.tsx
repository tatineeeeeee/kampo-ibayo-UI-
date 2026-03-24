"use client";

import Link from "next/link";
import { Home, Plus, RotateCcw } from "lucide-react";

interface BookingsHeaderProps {
  maintenanceActive: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function BookingsHeader({ maintenanceActive, isRefreshing, onRefresh }: BookingsHeaderProps) {
  return (
    <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
      <div className="px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </Link>
            <div className="text-foreground">
              <h1 className="text-lg sm:text-xl font-bold">My Bookings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Manage your reservations
              </p>
            </div>
            <button
              onClick={() => { if (!isRefreshing) onRefresh(); }}
              disabled={isRefreshing}
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors ml-2 ${
                isRefreshing ? "opacity-50" : ""
              }`}
              title="Refresh Bookings"
            >
              {isRefreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-border"></div>
              ) : (
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              )}
            </button>
          </div>
          {maintenanceActive ? (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-2 bg-muted-foreground text-muted-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold cursor-not-allowed">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New </span>Book
                <span className="text-xs">(Disabled)</span>
              </div>
            </div>
          ) : (
            <Link href="/book" className="flex-shrink-0" prefetch={true}>
              <button className="flex items-center gap-1 sm:gap-2 bg-primary text-foreground px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary/90 transition">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">New </span>Book
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
