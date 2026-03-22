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
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
      <h3 className="text-base sm:text-lg font-semibold text-black mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        {startDate === new Date().toISOString().split("T")[0]
          ? "Today's Operations"
          : `Operations for ${new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
      </h3>
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
          <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />
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
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">
                    {todayCheckOuts.length}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">Departing</p>
                  <p className="text-xs text-gray-500">{departingGuests} guest{departingGuests !== 1 ? "s" : ""}</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {todayCheckIns.length}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">Arriving</p>
                  <p className="text-xs text-gray-500">{arrivingGuests} guest{arrivingGuests !== 1 ? "s" : ""}</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {totalGuestsToday}
                  </p>
                  <p className="text-sm font-medium text-gray-700 mt-1">Total Guests</p>
                  <p className="text-xs text-gray-500">overnight</p>
                </div>
              </div>

              {/* Departing Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  Departing — Check-out by 1:00 PM
                </h4>
                {todayCheckOuts.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">No departures {startDate === new Date().toISOString().split("T")[0] ? "today" : "on this date"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayCheckOuts.map((b) => (
                      <div key={b.id} className="bg-orange-50/50 border border-orange-100 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-orange-700">
                                {b.guest_name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{b.guest_name}</p>
                              <p className="text-xs text-gray-500">{b.guest_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 sm:text-right pl-12 sm:pl-0">
                            <span>{b.number_of_guests} guest{b.number_of_guests !== 1 ? "s" : ""}</span>
                            <span>{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</span>
                            <span className="font-medium text-gray-900">₱{b.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Arriving Details */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Arriving — Check-in at 3:00 PM
                </h4>
                {todayCheckIns.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-500">No arrivals {startDate === new Date().toISOString().split("T")[0] ? "today" : "on this date"}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayCheckIns.map((b) => (
                      <div key={b.id} className="bg-green-50/50 border border-green-100 rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-green-700">
                                {b.guest_name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{b.guest_name}</p>
                              <p className="text-xs text-gray-500">{b.guest_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600 sm:text-right pl-12 sm:pl-0">
                            <span>{b.number_of_guests} guest{b.number_of_guests !== 1 ? "s" : ""}</span>
                            <span>{formatDate(b.check_in_date)} → {formatDate(b.check_out_date)}</span>
                            <span className="font-medium text-gray-900">₱{b.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                        {b.special_requests && (
                          <div className="mt-2 ml-12 bg-yellow-50 border border-yellow-100 rounded px-3 py-1.5">
                            <p className="text-xs text-yellow-800"><span className="font-medium">Note:</span> {b.special_requests}</p>
                          </div>
                        )}
                        {b.brings_pet && (
                          <div className="mt-1 ml-12">
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Bringing pet</span>
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
