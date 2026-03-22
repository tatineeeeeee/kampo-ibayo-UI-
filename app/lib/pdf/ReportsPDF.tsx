import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { styles } from "./pdfStyles";
import {
  PDFExportable,
  LOGO_URL,
  formatDate,
  formatCurrency,
  formatBookingId,
  formatPhoneNumber,
} from "./helpers";

// =====================
// REPORTS PDF DOCUMENT (Different layouts for different report types)
// =====================
interface ReportsPDFProps {
  data: PDFExportable[];
  title: string;
  reportType: string;
  generatedAt: string;
  dateRange?: { start: string; end: string };
}

export const ReportsPDFDocument: React.FC<ReportsPDFProps> = ({
  data,
  title,
  reportType,
  generatedAt,
  dateRange,
}) => {
  // Determine report type from title
  const isDailyOps =
    reportType.toLowerCase().includes("daily") ||
    reportType.toLowerCase().includes("operation");
  const isUserDb =
    reportType.toLowerCase().includes("user") ||
    reportType.toLowerCase().includes("database");
  const isBookingStatus =
    reportType.toLowerCase().includes("booking") ||
    reportType.toLowerCase().includes("status");

  // Calculate summaries based on report type
  const totalRecords = data.length;

  // Daily Operations specific calculations - Filter for TODAY only
  const todayStr = new Date().toISOString().split("T")[0];
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Filter bookings for today's check-ins (excluding cancelled)
  const todayCheckIns = data.filter((b) => {
    const checkin = (b.check_in_date as string)?.split("T")[0];
    const status = (b.status as string)?.toLowerCase();
    return checkin === todayStr && status !== "cancelled";
  });

  // Filter bookings for today's check-outs (excluding cancelled)
  const todayCheckOuts = data.filter((b) => {
    const checkout = (b.check_out_date as string)?.split("T")[0];
    const status = (b.status as string)?.toLowerCase();
    return checkout === todayStr && status !== "cancelled";
  });

  // Current guests (checked in but not checked out yet)
  const currentGuestsData = data.filter((b) => {
    const checkin = (b.check_in_date as string)?.split("T")[0];
    const checkout = (b.check_out_date as string)?.split("T")[0];
    const status = (b.status as string)?.toLowerCase();
    return (
      checkin <= todayStr &&
      checkout > todayStr &&
      (status === "confirmed" || status === "checked_in")
    );
  });

  const totalGuestsToday = todayCheckIns.reduce(
    (sum, b) => sum + ((b.number_of_guests as number) || 0),
    0,
  );
  const totalGuestsCheckingOut = todayCheckOuts.reduce(
    (sum, b) => sum + ((b.number_of_guests as number) || 0),
    0,
  );
  const currentGuestsCount = currentGuestsData.reduce(
    (sum, b) => sum + ((b.number_of_guests as number) || 0),
    0,
  );

  // ========== USER REPORT CALCULATIONS ==========
  // Group data by unique customers (by email)
  const customerMap = new Map<
    string,
    {
      name: string;
      email: string;
      phone: string;
      bookings: number;
      totalSpent: number;
      lastVisit: string;
      firstVisit: string;
    }
  >();

  data.forEach((booking) => {
    const email =
      (booking.guest_email as string) || (booking.email as string) || "";
    const name =
      (booking.guest_name as string) || (booking.name as string) || "";
    const phone =
      (booking.guest_phone as string) || (booking.phone as string) || "";
    const amount = (booking.total_amount as number) || 0;
    const checkIn =
      (booking.check_in_date as string) || (booking.created_at as string) || "";
    const status = (booking.status as string)?.toLowerCase();

    if (email && status !== "cancelled") {
      const existing = customerMap.get(email);
      if (existing) {
        existing.bookings += 1;
        existing.totalSpent += amount;
        if (checkIn > existing.lastVisit) existing.lastVisit = checkIn;
        if (checkIn < existing.firstVisit) existing.firstVisit = checkIn;
      } else {
        customerMap.set(email, {
          name,
          email,
          phone,
          bookings: 1,
          totalSpent: amount,
          lastVisit: checkIn,
          firstVisit: checkIn,
        });
      }
    }
  });

  const uniqueCustomers = Array.from(customerMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent,
  );
  const totalCustomers = uniqueCustomers.length;
  const totalCustomerSpending = uniqueCustomers.reduce(
    (sum, c) => sum + c.totalSpent,
    0,
  );
  const avgCustomerSpending =
    totalCustomers > 0 ? totalCustomerSpending / totalCustomers : 0;
  const repeatCustomers = uniqueCustomers.filter((c) => c.bookings > 1).length;
  const vipCustomers = uniqueCustomers.filter(
    (c) => c.totalSpent >= 50000 || c.bookings >= 3,
  ).length;
  const newCustomers = uniqueCustomers.filter((c) => c.bookings === 1).length;

  // ========== BOOKING STATUS CALCULATIONS ==========
  const confirmedBookings = data.filter((b) => {
    const status = (b.status as string)?.toLowerCase();
    return (
      status === "confirmed" ||
      status === "completed" ||
      status === "checked_in"
    );
  });
  const pendingBookings = data.filter(
    (b) => (b.status as string)?.toLowerCase() === "pending",
  );
  const cancelledBookings = data.filter(
    (b) => (b.status as string)?.toLowerCase() === "cancelled",
  );

  // Revenue calculations
  const confirmedRevenue = confirmedBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0,
  );
  const pendingRevenue = pendingBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0,
  );
  const lostRevenue = cancelledBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0,
  );

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "checked_in":
      case "paid":
      case "completed":
        return styles.statusConfirmed;
      case "pending":
      case "partially_paid":
        return styles.statusPending;
      case "cancelled":
      case "rejected":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.logo} src={LOGO_URL} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Kampo Ibayo Resort</Text>
              <Text style={styles.companyTagline}>
                {isDailyOps
                  ? "Daily Operations Report"
                  : isUserDb
                    ? "User Report"
                    : "Booking Status Report"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            {isDailyOps ? (
              <Text style={styles.reportMeta}>Date: {todayFormatted}</Text>
            ) : (
              dateRange && (
                <Text style={styles.reportMeta}>
                  Period: {dateRange.start} to {dateRange.end}
                </Text>
              )
            )}
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
          </View>
        </View>

        {/* Summary Section - Different for each report type */}
        <View style={styles.summarySection}>
          {isDailyOps && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Check-ins Today</Text>
                <Text style={styles.summaryValue}>{todayCheckIns.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Guests Arriving</Text>
                <Text style={styles.summaryValue}>{totalGuestsToday}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Check-outs Today</Text>
                <Text style={styles.summaryValue}>{todayCheckOuts.length}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Guests Departing</Text>
                <Text style={styles.summaryValue}>
                  {totalGuestsCheckingOut}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Occupancy</Text>
                <Text style={styles.summaryValue}>{currentGuestsCount}</Text>
              </View>
            </>
          )}
          {isUserDb && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Customers</Text>
                <Text style={styles.summaryValue}>{totalCustomers}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Revenue</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalCustomerSpending)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg. per Customer</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(avgCustomerSpending)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Repeat Customers</Text>
                <Text style={styles.summaryValue}>{repeatCustomers}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>VIP Customers</Text>
                <Text style={styles.summaryValue}>{vipCustomers}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>New Customers</Text>
                <Text style={styles.summaryValue}>{newCustomers}</Text>
              </View>
            </>
          )}
          {isBookingStatus && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Bookings</Text>
                <Text style={styles.summaryValue}>{totalRecords}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Confirmed</Text>
                <Text style={styles.summaryValue}>
                  {confirmedBookings.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={styles.summaryValue}>
                  {pendingBookings.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Cancelled</Text>
                <Text style={styles.summaryValue}>
                  {cancelledBookings.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Confirmed Revenue</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(confirmedRevenue)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Lost Revenue</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(lostRevenue)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Table - Different columns for each report type */}
        <View style={styles.table}>
          {/* DAILY OPERATIONS - Today's Check-ins and Check-outs */}
          {isDailyOps && (
            <>
              {/* CHECK-INS TODAY Section */}
              <View style={{ marginBottom: 15 }} minPresenceAhead={80}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#16a34a",
                    marginBottom: 8,
                  }}
                >
                  ARRIVALS TODAY ({todayCheckIns.length} booking
                  {todayCheckIns.length !== 1 ? "s" : ""})
                </Text>
                {todayCheckIns.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                        Booking ID
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                        Guest Name
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                        Contact
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                        Guests
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Check-out
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                        Payment
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Amount
                      </Text>
                    </View>
                    {todayCheckIns.map((booking, index) => (
                      <View
                        key={`checkin-${index}`}
                        style={[
                          styles.tableRow,
                          index % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd,
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "12%" }]}>
                          {formatBookingId(booking.id as number)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "22%" }]}>
                          {String(booking.guest_name || "")}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "18%", fontSize: 7 },
                          ]}
                        >
                          {formatPhoneNumber(booking.guest_phone as string)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "10%", textAlign: "center" },
                          ]}
                        >
                          {String(booking.number_of_guests || 0)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatDate(booking.check_out_date as string)}
                        </Text>
                        <View style={[styles.tableCell, { width: "12%" }]}>
                          <Text
                            style={[
                              styles.statusBadge,
                              getStatusStyle(booking.payment_status as string),
                            ]}
                          >
                            {String(
                              booking.payment_status || "pending",
                            ).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatCurrency(booking.total_amount as number)}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#6b7280",
                      fontStyle: "italic",
                      padding: 10,
                    }}
                  >
                    No arrivals scheduled for today
                  </Text>
                )}
              </View>

              {/* CHECK-OUTS TODAY Section */}
              <View style={{ marginBottom: 15 }} minPresenceAhead={80}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#2563eb",
                    marginBottom: 8,
                  }}
                >
                  DEPARTURES TODAY ({todayCheckOuts.length} booking
                  {todayCheckOuts.length !== 1 ? "s" : ""})
                </Text>
                {todayCheckOuts.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                        Booking ID
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                        Guest Name
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                        Contact
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                        Guests
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Checked-in
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                        Payment
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Amount
                      </Text>
                    </View>
                    {todayCheckOuts.map((booking, index) => (
                      <View
                        key={`checkout-${index}`}
                        style={[
                          styles.tableRow,
                          index % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd,
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "12%" }]}>
                          {formatBookingId(booking.id as number)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "22%" }]}>
                          {String(booking.guest_name || "")}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "18%", fontSize: 7 },
                          ]}
                        >
                          {formatPhoneNumber(booking.guest_phone as string)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "10%", textAlign: "center" },
                          ]}
                        >
                          {String(booking.number_of_guests || 0)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatDate(booking.check_in_date as string)}
                        </Text>
                        <View style={[styles.tableCell, { width: "12%" }]}>
                          <Text
                            style={[
                              styles.statusBadge,
                              getStatusStyle(booking.payment_status as string),
                            ]}
                          >
                            {String(
                              booking.payment_status || "pending",
                            ).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatCurrency(booking.total_amount as number)}
                        </Text>
                      </View>
                    ))}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#6b7280",
                      fontStyle: "italic",
                      padding: 10,
                    }}
                  >
                    No departures scheduled for today
                  </Text>
                )}
              </View>

              {/* CURRENTLY STAYING Section */}
              {currentGuestsData.length > 0 && (
                <View minPresenceAhead={80}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      color: "#2563eb",
                      marginBottom: 8,
                    }}
                  >
                    CURRENTLY STAYING ({currentGuestsData.length} booking
                    {currentGuestsData.length !== 1 ? "s" : ""},{" "}
                    {currentGuestsCount} guests)
                  </Text>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                      Booking ID
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                      Guest Name
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                      Contact
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                      Guests
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                      Checked-in
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                      Check-out
                    </Text>
                    <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                      Days Left
                    </Text>
                  </View>
                  {currentGuestsData.map((booking, index) => {
                    const checkout = new Date(booking.check_out_date as string);
                    const today = new Date();
                    const daysLeft = Math.ceil(
                      (checkout.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );

                    return (
                      <View
                        key={`current-${index}`}
                        wrap={false}
                        style={[
                          styles.tableRow,
                          index % 2 === 0
                            ? styles.tableRowEven
                            : styles.tableRowOdd,
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "12%" }]}>
                          {formatBookingId(booking.id as number)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "22%" }]}>
                          {String(booking.guest_name || "")}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "18%", fontSize: 7 },
                          ]}
                        >
                          {formatPhoneNumber(booking.guest_phone as string)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "10%", textAlign: "center" },
                          ]}
                        >
                          {String(booking.number_of_guests || 0)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatDate(booking.check_in_date as string)}
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                          {formatDate(booking.check_out_date as string)}
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: "12%", textAlign: "center" },
                          ]}
                        >
                          {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* USER REPORT TABLE - Unique Customers sorted by spending */}
          {isUserDb && (
            <View minPresenceAhead={80}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "bold",
                  color: "#7c3aed",
                  marginBottom: 8,
                }}
              >
                CUSTOMER DATABASE ({totalCustomers} unique customer
                {totalCustomers !== 1 ? "s" : ""})
              </Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                  Customer Name
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                  Email
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Phone
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                  Bookings
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Total Spent
                </Text>
                <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                  Customer Type
                </Text>
              </View>
              {uniqueCustomers.map((customer, index) => {
                // Determine customer type
                let customerType = "New";
                if (customer.totalSpent >= 50000 || customer.bookings >= 3) {
                  customerType = "VIP";
                } else if (customer.bookings > 1) {
                  customerType = "Returning";
                }

                return (
                  <View
                    key={index}
                    wrap={false}
                    style={[
                      styles.tableRow,
                      index % 2 === 0
                        ? styles.tableRowEven
                        : styles.tableRowOdd,
                    ]}
                  >
                    <Text style={[styles.tableCell, { width: "20%" }]}>
                      {customer.name}
                    </Text>
                    <Text
                      style={[styles.tableCell, { width: "25%", fontSize: 7 }]}
                    >
                      {customer.email}
                    </Text>
                    <Text
                      style={[styles.tableCell, { width: "15%", fontSize: 7 }]}
                    >
                      {formatPhoneNumber(customer.phone)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: "10%", textAlign: "center" },
                      ]}
                    >
                      {customer.bookings}
                    </Text>
                    <Text style={[styles.tableCell, { width: "15%" }]}>
                      {formatCurrency(customer.totalSpent)}
                    </Text>
                    <View style={[styles.tableCell, { width: "15%" }]}>
                      <Text
                        style={[
                          styles.statusBadge,
                          customerType === "VIP"
                            ? styles.statusConfirmed
                            : customerType === "Returning"
                              ? styles.statusPending
                              : {
                                  backgroundColor: "#e5e7eb",
                                  color: "#374151",
                                },
                        ]}
                      >
                        {customerType.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* BOOKING STATUS TABLE - Grouped by Status */}
          {isBookingStatus && (
            <>
              {/* CONFIRMED BOOKINGS Section */}
              <View style={{ marginBottom: 15 }} minPresenceAhead={80}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#16a34a",
                    marginBottom: 8,
                  }}
                >
                  CONFIRMED BOOKINGS ({confirmedBookings.length}) - Revenue:{" "}
                  {formatCurrency(confirmedRevenue)}
                </Text>
                {confirmedBookings.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                        Booking ID
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                        Guest Name
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Check-in / Check-out
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Total
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Paid
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Balance
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Payment
                      </Text>
                    </View>
                    {confirmedBookings.map((booking, index) => {
                      const total = (booking.total_amount as number) || 0;
                      const paid = (booking.payment_amount as number) || 0;
                      const balance = Math.max(0, total - paid);

                      // Determine actual payment completion status
                      let paymentCompletionStatus = "UNPAID";
                      let paymentStyle = styles.statusCancelled;
                      if (balance === 0 && paid > 0) {
                        paymentCompletionStatus = "FULLY PAID";
                        paymentStyle = styles.statusConfirmed;
                      } else if (paid > 0 && balance > 0) {
                        paymentCompletionStatus = "PARTIAL";
                        paymentStyle = styles.statusPending;
                      } else if (paid === 0) {
                        paymentCompletionStatus = "UNPAID";
                        paymentStyle = styles.statusCancelled;
                      }

                      return (
                        <View
                          key={`confirmed-${index}`}
                          wrap={false}
                          style={[
                            styles.tableRow,
                            index % 2 === 0
                              ? styles.tableRowEven
                              : styles.tableRowOdd,
                          ]}
                        >
                          <Text style={[styles.tableCell, { width: "10%" }]}>
                            {formatBookingId(booking.id as number)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "18%" }]}>
                            {String(booking.guest_name || "")}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              { width: "20%", fontSize: 7 },
                            ]}
                          >
                            {formatDate(booking.check_in_date as string)} -{" "}
                            {formatDate(booking.check_out_date as string)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(total)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(paid)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(balance)}
                          </Text>
                          <View style={[styles.tableCell, { width: "13%" }]}>
                            <Text style={[styles.statusBadge, paymentStyle]}>
                              {paymentCompletionStatus}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#6b7280",
                      fontStyle: "italic",
                      padding: 5,
                    }}
                  >
                    No confirmed bookings
                  </Text>
                )}
              </View>

              {/* PENDING BOOKINGS Section */}
              <View style={{ marginBottom: 15 }} minPresenceAhead={80}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#ca8a04",
                    marginBottom: 8,
                  }}
                >
                  PENDING BOOKINGS ({pendingBookings.length}) - Potential
                  Revenue: {formatCurrency(pendingRevenue)}
                </Text>
                {pendingBookings.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                        Booking ID
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "18%" }]}>
                        Guest Name
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                        Check-in / Check-out
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Total
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Paid
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Balance
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "13%" }]}>
                        Payment
                      </Text>
                    </View>
                    {pendingBookings.map((booking, index) => {
                      const total = (booking.total_amount as number) || 0;
                      const paid = (booking.payment_amount as number) || 0;
                      const balance = Math.max(0, total - paid);

                      // Determine actual payment completion status
                      let paymentCompletionStatus = "UNPAID";
                      let paymentStyle = styles.statusCancelled;
                      if (balance === 0 && paid > 0) {
                        paymentCompletionStatus = "FULLY PAID";
                        paymentStyle = styles.statusConfirmed;
                      } else if (paid > 0 && balance > 0) {
                        paymentCompletionStatus = "PARTIAL";
                        paymentStyle = styles.statusPending;
                      } else if (paid === 0) {
                        paymentCompletionStatus = "UNPAID";
                        paymentStyle = styles.statusCancelled;
                      }

                      return (
                        <View
                          key={`pending-${index}`}
                          wrap={false}
                          style={[
                            styles.tableRow,
                            index % 2 === 0
                              ? styles.tableRowEven
                              : styles.tableRowOdd,
                          ]}
                        >
                          <Text style={[styles.tableCell, { width: "10%" }]}>
                            {formatBookingId(booking.id as number)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "18%" }]}>
                            {String(booking.guest_name || "")}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              { width: "20%", fontSize: 7 },
                            ]}
                          >
                            {formatDate(booking.check_in_date as string)} -{" "}
                            {formatDate(booking.check_out_date as string)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(total)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(paid)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "13%" }]}>
                            {formatCurrency(balance)}
                          </Text>
                          <View style={[styles.tableCell, { width: "13%" }]}>
                            <Text style={[styles.statusBadge, paymentStyle]}>
                              {paymentCompletionStatus}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#6b7280",
                      fontStyle: "italic",
                      padding: 5,
                    }}
                  >
                    No pending bookings
                  </Text>
                )}
              </View>

              {/* CANCELLED BOOKINGS Section */}
              <View minPresenceAhead={80}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#dc2626",
                    marginBottom: 8,
                  }}
                >
                  CANCELLED BOOKINGS ({cancelledBookings.length}) - Lost
                  Revenue: {formatCurrency(lostRevenue)}
                </Text>
                {cancelledBookings.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                        Booking ID
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                        Guest Name
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "22%" }]}>
                        Check-in / Check-out
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                        Amount
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "15%" }]}>
                        Was Paid
                      </Text>
                      <Text style={[styles.tableHeaderCell, { width: "14%" }]}>
                        Refund Due
                      </Text>
                    </View>
                    {cancelledBookings.map((booking, index) => {
                      const total = (booking.total_amount as number) || 0;
                      const paid = (booking.payment_amount as number) || 0;
                      return (
                        <View
                          key={`cancelled-${index}`}
                          wrap={false}
                          style={[
                            styles.tableRow,
                            index % 2 === 0
                              ? styles.tableRowEven
                              : styles.tableRowOdd,
                          ]}
                        >
                          <Text style={[styles.tableCell, { width: "12%" }]}>
                            {formatBookingId(booking.id as number)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "22%" }]}>
                            {String(booking.guest_name || "")}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              { width: "22%", fontSize: 7 },
                            ]}
                          >
                            {formatDate(booking.check_in_date as string)} -{" "}
                            {formatDate(booking.check_out_date as string)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "15%" }]}>
                            {formatCurrency(total)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "15%" }]}>
                            {formatCurrency(paid)}
                          </Text>
                          <Text style={[styles.tableCell, { width: "14%" }]}>
                            {paid > 0 ? formatCurrency(paid) : "-"}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text
                    style={{
                      fontSize: 9,
                      color: "#6b7280",
                      fontStyle: "italic",
                      padding: 5,
                    }}
                  >
                    No cancelled bookings
                  </Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Kampo Ibayo Resort -{" "}
            {isDailyOps
              ? "Daily Operations"
              : isUserDb
                ? "User Report"
                : "Booking Status"}{" "}
            Report
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};
