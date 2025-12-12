/**
 * PDF Export Utility for Admin Tables
 * Professional PDF generation using @react-pdf/renderer
 * Matches CSV export structure for consistency
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";

// Type definitions
interface PDFExportable {
  [key: string]: string | number | boolean | null | undefined | object;
}

// Logo URL - use absolute path for PDF rendering
const LOGO_URL = "/logo.png";

// Helper to format date
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateStr);
  }
};

// Helper to format currency with proper peso sign (PHP ₱)
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "PHP 0";
  return `PHP ${amount.toLocaleString()}`;
};

// Helper to format Philippine phone number
const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    cleaned = "0" + cleaned.substring(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10 && cleaned.startsWith("9")) {
    cleaned = "0" + cleaned;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return String(phone);
};

// Helper to format booking ID
const formatBookingId = (id: number | string | null | undefined): string => {
  if (!id) return "";
  return `KB-${String(id).padStart(4, "0")}`;
};

// Professional PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 9,
  },
  // Header Section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "2 solid #16a34a",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 9,
    color: "#6b7280",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  reportMeta: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
  },
  // Summary Section
  summarySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#166534",
  },
  // Table Styles
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    minHeight: 24,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#f9fafb",
  },
  tableRowOdd: {
    backgroundColor: "#ffffff",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#166534",
    minHeight: 28,
    alignItems: "center",
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 8,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "left",
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    color: "#374151",
    textAlign: "left",
  },
  // Status badges
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 7,
    fontWeight: "bold",
  },
  statusConfirmed: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusCancelled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusCompleted: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1 solid #e5e7eb",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  pageNumber: {
    fontSize: 8,
    color: "#6b7280",
  },
});

// Column width configurations for different report types
const columnWidths = {
  bookings: {
    id: "10%",
    name: "15%",
    dates: "15%",
    guests: "8%",
    amount: "12%",
    paymentType: "12%",
    status: "14%",
    paymentStatus: "14%",
  },
  users: {
    name: "25%",
    email: "30%",
    phone: "20%",
    registered: "25%",
  },
  payments: {
    bookingId: "10%",
    name: "14%",
    total: "12%",
    paid: "12%",
    balance: "12%",
    method: "10%",
    status: "15%",
    date: "15%",
  },
};

// =====================
// BOOKINGS PDF DOCUMENT
// =====================
interface BookingsPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

const BookingsPDFDocument: React.FC<BookingsPDFProps> = ({
  data,
  title,
  generatedAt,
}) => {
  // Calculate summary statistics
  const totalBookings = data.length;
  const totalRevenue = data.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0
  );
  const confirmedCount = data.filter((b) => b.status === "confirmed").length;
  const pendingCount = data.filter((b) => b.status === "pending").length;

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return styles.statusConfirmed;
      case "pending":
        return styles.statusPending;
      case "cancelled":
        return styles.statusCancelled;
      case "completed":
        return styles.statusCompleted;
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
                Your Nature Escape in Batangas
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={styles.reportMeta}>
              Total Records: {totalBookings}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Bookings</Text>
            <Text style={styles.summaryValue}>{totalBookings}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalRevenue)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Confirmed</Text>
            <Text style={styles.summaryValue}>{confirmedCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.id },
              ]}
            >
              Booking ID
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.name },
              ]}
            >
              Guest Name
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.dates },
              ]}
            >
              Check-in / Check-out
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.guests },
              ]}
            >
              Guests
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.amount },
              ]}
            >
              Total Amount
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.paymentType },
              ]}
            >
              Payment Type
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.status },
              ]}
            >
              Booking Status
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.bookings.paymentStatus },
              ]}
            >
              Payment Status
            </Text>
          </View>

          {/* Data Rows */}
          {data.slice(0, 25).map((booking, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
              ]}
            >
              <Text
                style={[styles.tableCell, { width: columnWidths.bookings.id }]}
              >
                {formatBookingId(booking.id as number)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.name },
                ]}
              >
                {String(booking.guest_name || "")}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.dates },
                ]}
              >
                {formatDate(booking.check_in_date as string)} -{" "}
                {formatDate(booking.check_out_date as string)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.guests, textAlign: "center" },
                ]}
              >
                {String(booking.number_of_guests || 0)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.amount },
                ]}
              >
                {formatCurrency(booking.total_amount as number)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.paymentType },
                ]}
              >
                {(booking.payment_type as string) === "full"
                  ? "Full Payment"
                  : "50% Down"}
              </Text>
              <View
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.status },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadge,
                    getStatusStyle(booking.status as string),
                  ]}
                >
                  {String(booking.status || "pending").toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: columnWidths.bookings.paymentStatus },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadge,
                    getStatusStyle(booking.payment_status as string),
                  ]}
                >
                  {String(booking.payment_status || "pending").toUpperCase()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {data.length > 25 && (
          <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center" }}>
            Showing first 25 of {data.length} records. Export to CSV for
            complete data.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Kampo Ibayo Resort - Confidential Business Report
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

// =====================
// USERS PDF DOCUMENT
// =====================
interface UsersPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

const UsersPDFDocument: React.FC<UsersPDFProps> = ({
  data,
  title,
  generatedAt,
}) => {
  const totalUsers = data.length;
  const adminCount = data.filter((u) => u.role === "admin").length;
  const staffCount = data.filter((u) => u.role === "staff").length;
  const userCount = data.filter((u) => u.role === "user" || !u.role).length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image style={styles.logo} src={LOGO_URL} />
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>Kampo Ibayo Resort</Text>
              <Text style={styles.companyTagline}>User Database</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={styles.reportMeta}>Total Users: {totalUsers}</Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Users</Text>
            <Text style={styles.summaryValue}>{totalUsers}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Admins</Text>
            <Text style={styles.summaryValue}>{adminCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Staff</Text>
            <Text style={styles.summaryValue}>{staffCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Users</Text>
            <Text style={styles.summaryValue}>{userCount}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.name },
              ]}
            >
              Full Name
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.email },
              ]}
            >
              Email Address
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.phone },
              ]}
            >
              Phone Number
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.users.registered },
              ]}
            >
              Registered On
            </Text>
          </View>

          {/* Data Rows */}
          {data.slice(0, 35).map((user, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
              ]}
            >
              <Text
                style={[styles.tableCell, { width: columnWidths.users.name }]}
              >
                {String(user.name || "")}
              </Text>
              <Text
                style={[styles.tableCell, { width: columnWidths.users.email }]}
              >
                {String(user.email || "")}
              </Text>
              <Text
                style={[styles.tableCell, { width: columnWidths.users.phone }]}
              >
                {formatPhoneNumber(user.phone as string)}
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  { width: columnWidths.users.registered },
                ]}
              >
                {formatDate(user.created_at as string)}
              </Text>
            </View>
          ))}
        </View>

        {data.length > 35 && (
          <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center" }}>
            Showing first 35 of {data.length} records. Export to CSV for
            complete data.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Kampo Ibayo Resort - Confidential User Data
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

// =====================
// PAYMENTS PDF DOCUMENT
// =====================
interface PaymentsPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

const PaymentsPDFDocument: React.FC<PaymentsPDFProps> = ({
  data,
  title,
  generatedAt,
}) => {
  const totalPayments = data.length;

  // Calculate total collected (exclude cancelled bookings)
  const totalCollected = data
    .filter((p) => (p.booking_status as string)?.toLowerCase() !== "cancelled")
    .reduce((sum, p) => sum + ((p.amount as number) || 0), 0);

  // Count by actual status (considering booking_status for cancelled)
  const paidCount = data.filter((p) => {
    const bookingStatus = (p.booking_status as string)?.toLowerCase();
    const status = (p.status as string)?.toLowerCase();
    return (
      bookingStatus !== "cancelled" &&
      (status === "paid" || status === "verified")
    );
  }).length;

  const partiallyPaidCount = data.filter((p) => {
    const bookingStatus = (p.booking_status as string)?.toLowerCase();
    const status = (p.status as string)?.toLowerCase();
    return bookingStatus !== "cancelled" && status === "partially_paid";
  }).length;

  const cancelledCount = data.filter((p) => {
    const bookingStatus = (p.booking_status as string)?.toLowerCase();
    return bookingStatus === "cancelled";
  }).length;

  const pendingCount = data.filter((p) => {
    const bookingStatus = (p.booking_status as string)?.toLowerCase();
    const status = (p.status as string)?.toLowerCase();
    return (
      bookingStatus !== "cancelled" &&
      (status === "pending" || status === "needs_resubmission")
    );
  }).length;

  // Get display status - prioritize booking_status for cancelled
  const getDisplayStatus = (payment: PDFExportable): string => {
    const bookingStatus = (payment.booking_status as string)?.toLowerCase();
    if (bookingStatus === "cancelled") return "CANCELLED";
    return String(payment.status || "pending").toUpperCase();
  };

  const getStatusStyle = (payment: PDFExportable) => {
    const bookingStatus = (payment.booking_status as string)?.toLowerCase();
    if (bookingStatus === "cancelled") return styles.statusCancelled;

    const status = (payment.status as string)?.toLowerCase();
    switch (status) {
      case "paid":
      case "verified":
        return styles.statusConfirmed;
      case "partially_paid":
        return styles.statusPending;
      case "pending":
      case "needs_resubmission":
        return styles.statusPending;
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
                Payment Transactions Report
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{title}</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={styles.reportMeta}>
              Total Transactions: {totalPayments}
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{totalPayments}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Collected</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalCollected)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>{paidCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Partial</Text>
            <Text style={styles.summaryValue}>{partiallyPaidCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Cancelled</Text>
            <Text style={styles.summaryValue}>{cancelledCount}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.bookingId },
              ]}
            >
              Booking ID
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.name },
              ]}
            >
              Guest Name
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.total },
              ]}
            >
              Total Booking
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.paid },
              ]}
            >
              Amount Paid
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.balance },
              ]}
            >
              Balance
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.method },
              ]}
            >
              Method
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.status },
              ]}
            >
              Status
            </Text>
            <Text
              style={[
                styles.tableHeaderCell,
                { width: columnWidths.payments.date },
              ]}
            >
              Check-in Date
            </Text>
          </View>

          {/* Data Rows */}
          {data.slice(0, 25).map((payment, index) => {
            const total = (payment.total_amount as number) || 0;
            const paid = (payment.amount as number) || 0;
            const balance = Math.max(0, total - paid);

            return (
              <View
                key={index}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                ]}
              >
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.bookingId },
                  ]}
                >
                  {formatBookingId(payment.booking_id as number)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.name },
                  ]}
                >
                  {String(payment.guest_name || payment.user || "")}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.total },
                  ]}
                >
                  {formatCurrency(total)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.paid },
                  ]}
                >
                  {formatCurrency(paid)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.balance },
                  ]}
                >
                  {formatCurrency(balance)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.method },
                  ]}
                >
                  {String(
                    payment.original_method || payment.payment_method || ""
                  ).toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.status },
                  ]}
                >
                  <Text style={[styles.statusBadge, getStatusStyle(payment)]}>
                    {getDisplayStatus(payment)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tableCell,
                    { width: columnWidths.payments.date },
                  ]}
                >
                  {formatDate(
                    (payment.check_in_date || payment.date) as string
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        {data.length > 25 && (
          <Text style={{ fontSize: 8, color: "#6b7280", textAlign: "center" }}>
            Showing first 25 of {data.length} records. Export to CSV for
            complete data.
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Kampo Ibayo Resort - Confidential Financial Report
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

const ReportsPDFDocument: React.FC<ReportsPDFProps> = ({
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
    0
  );
  const totalGuestsCheckingOut = todayCheckOuts.reduce(
    (sum, b) => sum + ((b.number_of_guests as number) || 0),
    0
  );
  const currentGuestsCount = currentGuestsData.reduce(
    (sum, b) => sum + ((b.number_of_guests as number) || 0),
    0
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
    (a, b) => b.totalSpent - a.totalSpent
  );
  const totalCustomers = uniqueCustomers.length;
  const totalCustomerSpending = uniqueCustomers.reduce(
    (sum, c) => sum + c.totalSpent,
    0
  );
  const avgCustomerSpending =
    totalCustomers > 0 ? totalCustomerSpending / totalCustomers : 0;
  const repeatCustomers = uniqueCustomers.filter((c) => c.bookings > 1).length;
  const vipCustomers = uniqueCustomers.filter(
    (c) => c.totalSpent >= 50000 || c.bookings >= 3
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
    (b) => (b.status as string)?.toLowerCase() === "pending"
  );
  const cancelledBookings = data.filter(
    (b) => (b.status as string)?.toLowerCase() === "cancelled"
  );

  // Revenue calculations
  const confirmedRevenue = confirmedBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0
  );
  const pendingRevenue = pendingBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0
  );
  const lostRevenue = cancelledBookings.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0
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
              <View style={{ marginBottom: 15 }}>
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
                              booking.payment_status || "pending"
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
              <View style={{ marginBottom: 15 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "bold",
                    color: "#dc2626",
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
                              booking.payment_status || "pending"
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
                <View>
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
                  {currentGuestsData.slice(0, 15).map((booking, index) => {
                    const checkout = new Date(booking.check_out_date as string);
                    const today = new Date();
                    const daysLeft = Math.ceil(
                      (checkout.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );

                    return (
                      <View
                        key={`current-${index}`}
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
            <>
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
              {uniqueCustomers.slice(0, 30).map((customer, index) => {
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
                            : { backgroundColor: "#e5e7eb", color: "#374151" },
                        ]}
                      >
                        {customerType.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {/* BOOKING STATUS TABLE - Grouped by Status */}
          {isBookingStatus && (
            <>
              {/* CONFIRMED BOOKINGS Section */}
              <View style={{ marginBottom: 15 }}>
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
                    {confirmedBookings.slice(0, 15).map((booking, index) => {
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
              <View style={{ marginBottom: 15 }}>
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
                    {pendingBookings.slice(0, 10).map((booking, index) => {
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
              <View>
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
                    {cancelledBookings.slice(0, 10).map((booking, index) => {
                      const total = (booking.total_amount as number) || 0;
                      const paid = (booking.payment_amount as number) || 0;
                      return (
                        <View
                          key={`cancelled-${index}`}
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

        {data.length > 30 && (
          <Text
            style={{
              fontSize: 8,
              color: "#6b7280",
              textAlign: "center",
              marginTop: 5,
            }}
          >
            Showing first 30 of {data.length} records. Export to CSV for
            complete data.
          </Text>
        )}

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

// =====================
// EXPORT FUNCTIONS
// =====================

// Export Bookings to PDF
export const exportBookingsPDF = async (bookings: PDFExportable[]) => {
  if (!bookings || bookings.length === 0) {
    throw new Error("No data to export");
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const blob = await pdf(
    <BookingsPDFDocument
      data={bookings}
      title="Bookings Report"
      generatedAt={generatedAt}
    />
  ).toBlob();

  downloadPDF(blob, "kampo_ibayo_bookings");
};

// Export Users to PDF
export const exportUsersPDF = async (users: PDFExportable[]) => {
  if (!users || users.length === 0) {
    throw new Error("No data to export");
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const blob = await pdf(
    <UsersPDFDocument
      data={users}
      title="User Database"
      generatedAt={generatedAt}
    />
  ).toBlob();

  downloadPDF(blob, "kampo_ibayo_users");
};

// Export Payments to PDF
export const exportPaymentsPDF = async (payments: PDFExportable[]) => {
  if (!payments || payments.length === 0) {
    throw new Error("No data to export");
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const blob = await pdf(
    <PaymentsPDFDocument
      data={payments}
      title="Payment Transactions Report"
      generatedAt={generatedAt}
    />
  ).toBlob();

  downloadPDF(blob, "kampo_ibayo_payments");
};

// Export Reports to PDF
export const exportReportsPDF = async (
  data: PDFExportable[],
  reportType: string,
  dateRange?: { start: string; end: string }
) => {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const blob = await pdf(
    <ReportsPDFDocument
      data={data}
      title={reportType}
      reportType={reportType}
      generatedAt={generatedAt}
      dateRange={dateRange}
    />
  ).toBlob();

  const filename = `kampo_ibayo_${reportType
    .toLowerCase()
    .replace(/\s+/g, "_")}`;
  downloadPDF(blob, filename);
};

// Helper function to download PDF
const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
