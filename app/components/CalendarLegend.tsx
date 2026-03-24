"use client";
import React from "react";
import {
  LogIn,
  LogOut,
  Users,
  Ban,
  Lock,
  Info,
  Moon,
  ChevronRight,
} from "lucide-react";

interface CalendarLegendProps {
  isLight: boolean;
  newCheckIn: string;
  newCheckOut: string;
  formatDateSafe: (dateString: string) => string;
}

export default function CalendarLegend({
  isLight,
  newCheckIn,
  newCheckOut,
  formatDateSafe,
}: CalendarLegendProps) {
  return (
    <div className={`border-t p-3 sm:p-4 ${isLight ? "border-border bg-gradient-to-b from-muted to-primary/5" : "border-border bg-card/90"}`}>
      {/* Status Legend - Compact Grid */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-6">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm"></div>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? "text-slate-600" : "text-muted-foreground"}`}>
            Available
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-primary to-primary/90 shadow-sm"></div>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? "text-slate-600" : "text-muted-foreground"}`}>
            Check-in
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-rose-400 to-rose-500 shadow-sm"></div>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? "text-slate-600" : "text-muted-foreground"}`}>
            Check-out
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-amber-400 to-amber-500 shadow-sm"></div>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? "text-slate-600" : "text-muted-foreground"}`}>
            Occupied
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-br from-orange-500 to-orange-600 shadow-sm ring-1 ring-orange-400"></div>
          <span className={`text-[11px] sm:text-xs font-medium ${isLight ? "text-slate-600" : "text-muted-foreground"}`}>
            Selected
          </span>
        </div>
      </div>

      {/* Selection Status - Only show when dates selected */}
      {(newCheckIn || newCheckOut) && (
        <div className={`mt-3 pt-3 border-t ${isLight ? "border-border" : "border-border/50"}`}>
          <div className={`rounded-xl p-3 border ${isLight ? "bg-card border-border shadow-sm" : "bg-background/50 border-border/50"}`}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? "text-slate-400" : "text-muted-foreground"}`}>
                  Check-in
                </p>
                <div className={`rounded-lg px-3 py-2 ${isLight ? "bg-primary/5 border border-border" : "bg-primary/10 border border-primary/30"}`}>
                  <p className={`text-sm font-semibold ${isLight ? "text-primary" : "text-blue-300"}`}>
                    {formatDateSafe(newCheckIn)}
                  </p>
                </div>
              </div>
              <div className={`text-lg ${isLight ? "text-slate-300" : "text-muted-foreground"}`}>→</div>
              <div className="flex-1">
                <p className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? "text-slate-400" : "text-muted-foreground"}`}>
                  Check-out
                </p>
                <div className={`rounded-lg px-3 py-2 ${isLight ? "bg-primary/5 border border-border" : "bg-primary/10 border border-primary/30"}`}>
                  <p className={`text-sm font-semibold ${isLight ? "text-primary" : "text-blue-300"}`}>
                    {formatDateSafe(newCheckOut)}
                  </p>
                </div>
              </div>
            </div>
            {newCheckIn && newCheckOut && (
              <div className={`mt-2 flex items-center justify-center gap-1.5 ${isLight ? "text-slate-500" : "text-muted-foreground"}`}>
                <Moon className="w-3 h-3" />
                <span className="text-xs">
                  {(() => {
                    const checkInDate = new Date(newCheckIn + "T00:00:00");
                    const checkOutDate = new Date(newCheckOut + "T00:00:00");
                    const nights = Math.ceil(
                      (checkOutDate.getTime() - checkInDate.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return `${nights} night${nights !== 1 ? "s" : ""}`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Guide - Collapsible on Mobile */}
      <details className="mt-3 group">
        <summary className={`flex items-center gap-2 cursor-pointer transition-colors ${isLight ? "text-slate-500 hover:text-slate-700" : "text-muted-foreground hover:text-muted-foreground"}`}>
          <Info className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            How to read the calendar
          </span>
          <ChevronRight className="w-3 h-3 ml-auto group-open:rotate-90 transition-transform" />
        </summary>
        <div className={`mt-2 rounded-lg p-3 text-xs space-y-1.5 ${isLight ? "bg-card border border-border text-slate-500" : "bg-background/40 text-muted-foreground"}`}>
          <div className="flex items-start gap-2">
            <LogIn className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              <strong className={isLight ? "text-primary" : "text-blue-300"}>Check-in</strong> — Guest
              arrives (3:00 PM)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <LogOut className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>
              <strong className={isLight ? "text-primary" : "text-blue-300"}>Check-out</strong> — Guest
              leaves (1:00 PM)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong className={isLight ? "text-amber-600" : "text-amber-300"}>Occupied</strong> — Resort is
              in use
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Ban className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
            <span>
              <strong className={isLight ? "text-purple-600" : "text-purple-300"}>Full</strong> — Same-day
              check-in &amp; out
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isLight ? "text-slate-400" : "text-muted-foreground"}`} />
            <span>
              <strong className={isLight ? "text-slate-600" : "text-muted-foreground"}>Blocked</strong> — Your
              current booking
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}
