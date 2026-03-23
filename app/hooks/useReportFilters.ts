"use client";

import { useState, useEffect, useMemo } from "react";
import { Tables } from "@/database.types";

type BookingRow = Tables<"bookings">;

export function useReportFilters() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const itemsPerPage = 10;

  const resetFilters = () => {
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setPaymentMethodFilter("all");
  };

  return {
    statusFilter,
    setStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    paymentMethodFilter,
    setPaymentMethodFilter,
    currentPage,
    setCurrentPage,
    customerPage,
    setCustomerPage,
    itemsPerPage,
    resetFilters,
  };
}

/** Derive pagination values from filtered bookings and current filter/page state. */
export function usePaginatedBookings(
  filteredBookings: BookingRow[],
  currentPage: number,
  setCurrentPage: (page: number) => void,
  itemsPerPage: number,
  startDate: string,
  endDate: string,
  statusFilter: string,
) {
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = useMemo(
    () => filteredBookings.slice(startIndex, endIndex),
    [filteredBookings, startIndex, endIndex],
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter, setCurrentPage]);

  return {
    totalPages,
    startIndex,
    endIndex,
    currentBookings,
  };
}
