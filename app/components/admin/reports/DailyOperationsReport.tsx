"use client";

import { Calendar, RefreshCw } from "lucide-react";
import { Tables } from "@/database.types";

type BookingRow = Tables<"bookings">;

interface DailyOperationsReportProps {
  startDate: string;
  bookings: BookingRow[];
  isLoading: boolean;
}

export default function DailyOperationsReport({
  startDate,
  bookings,
  isLoading,
}: DailyOperationsReportProps) {
  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
        {startDate === new Date().toISOString().split("T")[0]
          ? "Today's Operations"
          : `Operations for ${new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
      </h3>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      ) : (
        (() => {
          const dateStr = startDate;
          const todayCheckIns = bookings.filter(
            (b) => b.check_in_date === dateStr && b.status === "confirmed",
          );
          const todayCheckOuts = bookings.filter(
            (b) => b.check_out_date === dateStr && b.status === "confirmed",
          );
          const currentlyStaying = bookings.filter(
            (b) =>
              b.check_in_date <= dateStr &&
              b.check_out_date > dateStr &&
              b.status === "confirmed",
          );
          const departingGuests = todayCheckOuts.reduce((sum, b) => sum + (b.number_of_guests || 0), 0);
          const arrivingGuests = todayCheckIns.reduce((sum, b) => sum + (b.number_of_guests || 0), 0);
          const allStayingTonight = new Map<number, typeof bookings[0]>();
          for (const b of [...todayCheckIns, ...currentlyStaying]) {
            allStayingTonight.set(b.id, b);
          }
          const totalGuestsToday = Array.from(allStayingTonight.values())
            .reduce((sum, b) => sum + (b.number_of_guests || 0), 0);

          const formatDate = (d: string) =>
            new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-warning">
                    {todayCheckOuts.length}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">Departing</p>
                  <p className="text-xs text-muted-foreground">{departingGuests} guest{departingGuests !== 1 ? "s" : ""}</p>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-success">
                    {todayCheckIns.length}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">Arriving</p>
                  <p className="text-xs text-muted-foreground">{arrivingGuests} guest{arrivingGuests !== 1 ? "s" : ""}</p>
                </div>
                <div className="bg-primary/10 border border-info/20 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-info">
                    {totalGuestsToday}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1">Total Guests</p>
                  <p className="text-xs text-muted-foreground">overnight</p>
                </div>
              </div>

              {/* Departing Details */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-warning/100" />
                  Departing — Check-out by 1:00 PM
                </h4>
                {todayCheckOuts.length === 0 ? (
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">No departures {startDate === new Date().toISOString().split("T")[0] ? "today" : "on this date"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayCheckOuts.map((b) => (
                      <div key={b.id} className="bg-warning/10/50 border border-warning/20 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-warning">
                                {b.guest_name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{b.guest_name}</p>
                              <p className="text-xs text-muted-foreground">{b.guest_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right pl-12 sm:pl-0">
                            <span>{b.number_of_guests} guest{b.number_of_guests !== 1 ? "s" : ""}</span>
                            <span>{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</span>
                            <span className="font-medium text-foreground">₱{b.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arriving Details */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success/100" />
                  Arriving — Check-in at 3:00 PM
                </h4>
                {todayCheckIns.length === 0 ? (
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">No arrivals {startDate === new Date().toISOString().split("T")[0] ? "today" : "on this date"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayCheckIns.map((b) => (
                      <div key={b.id} className="bg-success/10/50 border border-success/20 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-success">
                                {b.guest_name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{b.guest_name}</p>
                              <p className="text-xs text-muted-foreground">{b.guest_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground sm:text-right pl-12 sm:pl-0">
                            <span>{b.number_of_guests} guest{b.number_of_guests !== 1 ? "s" : ""}</span>
                            <span>{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</span>
                            <span className="font-medium text-foreground">₱{b.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                        {b.special_requests && (
                          <div className="mt-2 ml-12 bg-warning/10 border border-warning/20 rounded px-3 py-1.5">
                            <p className="text-xs text-warning"><span className="font-medium">Note:</span> {b.special_requests}</p>
                          </div>
                        )}
                        {b.brings_pet && (
                          <div className="mt-1 ml-12">
                            <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">Bringing pet</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
