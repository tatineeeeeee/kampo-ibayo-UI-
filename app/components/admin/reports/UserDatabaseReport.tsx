"use client";

import { Tables } from "@/database.types";
import UserReportCharts from "./UserReportCharts";
import UserReportTable from "./UserReportTable";

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
      <UserReportCharts
        filteredBookings={filteredBookings}
        isLoading={isLoading}
      />

      {/* Customer List Table */}
      <UserReportTable
        filteredBookings={filteredBookings}
        allUsers={allUsers}
        isLoading={isLoading}
        customerPage={customerPage}
        setCustomerPage={setCustomerPage}
      />
    </>
  );
}
