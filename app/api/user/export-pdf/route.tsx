/**
 * User Data Export PDF API
 * Professional PDF generation matching admin report styling
 * Uses @react-pdf/renderer with Kampo Ibayo branding
 */

import { NextRequest, NextResponse } from "next/server";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

// Logo URL for PDF
const LOGO_URL = "https://kampo-ibayo-resort.vercel.app/logo.png";

// Professional styles matching admin reports
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

  // Two Column Layout
  twoColumnLayout: {
    flexDirection: "row",
    marginBottom: 15,
    gap: 15,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },

  // Profile Card
  profileCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    padding: 12,
    border: "1 solid #bbf7d0",
  },
  profileTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1 solid #bbf7d0",
  },
  profileRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  profileLabel: {
    fontSize: 9,
    color: "#6b7280",
    width: "35%",
  },
  profileValue: {
    fontSize: 9,
    color: "#1f2937",
    fontWeight: "bold",
    width: "65%",
  },

  // Statistics Summary
  summarySection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    border: "1 solid #bbf7d0",
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#166534",
    width: "100%",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1 solid #bbf7d0",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  summaryItem: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },

  // Section Headers
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1 solid #16a34a",
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
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
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

  // Column widths for booking table
  colBookingId: { width: "10%" },
  colDates: { width: "22%" },
  colGuests: { width: "8%" },
  colAmount: { width: "15%" },
  colStatus: { width: "12%" },
  colPayment: { width: "18%" },
  colCreated: { width: "15%" },

  // Status Badges
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

  // Financial Summary Box
  financialBox: {
    backgroundColor: "#166534",
    borderRadius: 6,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  financialLabel: {
    fontSize: 10,
    color: "#bbf7d0",
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
  },

  // No Data Message
  noDataMessage: {
    padding: 20,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 10,
    fontStyle: "italic",
  },

  // More rows indicator
  moreRows: {
    padding: 8,
    backgroundColor: "#f9fafb",
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
    fontStyle: "italic",
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
  footerRight: {
    alignItems: "flex-end",
  },

  // Watermark for account status
  watermark: {
    position: "absolute",
    top: "40%",
    left: "25%",
    fontSize: 60,
    color: "#16a34a",
    opacity: 0.08,
    transform: "rotate(-35deg)",
    fontWeight: "bold",
  },
});

// Helper functions
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "PHP 0.00";
  return `PHP ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
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

const formatShortDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
};

const formatBookingId = (id: number | string | null | undefined): string => {
  if (!id) return "N/A";
  return `KB-${String(id).padStart(4, "0")}`;
};

const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "Not provided";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("63") && cleaned.length === 12) {
    cleaned = "0" + cleaned.substring(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return String(phone);
};

// Interfaces
interface UserProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  created_at: string;
  last_sign_in?: string;
}

interface UserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

interface Booking {
  id: number;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  amount_paid?: number;
  payment_type?: string;
  payment_status?: string;
  status: string;
  created_at: string;
  special_requests?: string;
}

interface Statistics {
  total_bookings: number;
  cancelled_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  completed_bookings: number;
  total_amount_spent: number;
}

interface ExportData {
  userId: string;
  userProfile: UserProfile;
  userData: UserData | null;
  bookings: Booking[];
  statistics: Statistics;
}

// PDF Document Component
const UserDataExportPDF = ({ data }: { data: ExportData }) => {
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const memberSince = formatDate(data.userProfile.created_at);
  const daysSinceMember = Math.floor(
    (new Date().getTime() - new Date(data.userProfile.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return styles.statusConfirmed;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  // Calculate additional stats
  const averageBookingValue =
    data.statistics.total_bookings > 0
      ? data.statistics.total_amount_spent / data.statistics.total_bookings
      : 0;

  const successRate =
    data.statistics.total_bookings > 0
      ? Math.round(
          ((data.statistics.confirmed_bookings +
            data.statistics.completed_bookings) /
            data.statistics.total_bookings) *
            100
        )
      : 0;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>KAMPO IBAYO</Text>

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
            <Text style={styles.reportTitle}>My Account Data Export</Text>
            <Text style={styles.reportMeta}>Generated: {generatedAt}</Text>
            <Text style={styles.reportMeta}>
              Account ID: {data.userId.slice(0, 8)}...
            </Text>
          </View>
        </View>

        {/* Two Column Layout - Profile & Stats */}
        <View style={styles.twoColumnLayout}>
          {/* Left Column - Profile Information */}
          <View style={styles.leftColumn}>
            <View style={styles.profileCard}>
              <Text style={styles.profileTitle}>Account Information</Text>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Full Name:</Text>
                <Text style={styles.profileValue}>
                  {data.userProfile.name || data.userData?.name || "Not set"}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Email Address:</Text>
                <Text style={styles.profileValue}>
                  {data.userProfile.email || "Not set"}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Phone Number:</Text>
                <Text style={styles.profileValue}>
                  {formatPhoneNumber(
                    data.userProfile.phone || data.userData?.phone
                  )}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Member Since:</Text>
                <Text style={styles.profileValue}>
                  {memberSince} ({daysSinceMember} days)
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Last Sign In:</Text>
                <Text style={styles.profileValue}>
                  {data.userProfile.last_sign_in
                    ? formatDate(data.userProfile.last_sign_in)
                    : "Never"}
                </Text>
              </View>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Account Role:</Text>
                <Text style={styles.profileValue}>
                  {data.userData?.role
                    ? data.userData.role.charAt(0).toUpperCase() +
                      data.userData.role.slice(1)
                    : "Guest"}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Column - Statistics */}
          <View style={styles.rightColumn}>
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {data.statistics.total_bookings}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Bookings</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {data.statistics.confirmed_bookings}
                  </Text>
                  <Text style={styles.summaryLabel}>Confirmed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {data.statistics.completed_bookings}
                  </Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{successRate}%</Text>
                  <Text style={styles.summaryLabel}>Success Rate</Text>
                </View>
              </View>
              <View style={styles.financialBox}>
                <Text style={styles.financialLabel}>Total Amount Spent</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(data.statistics.total_amount_spent)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking History Table */}
        <Text style={styles.sectionHeader}>Booking History</Text>

        {data.bookings.length === 0 ? (
          <View style={styles.table}>
            <Text style={styles.noDataMessage}>
              No bookings found. Start planning your first getaway at Kampo
              Ibayo Resort!
            </Text>
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colBookingId]}>
                Booking ID
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colDates]}>
                Check-in / Check-out
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colGuests]}>
                Guests
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>
                Total Amount
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>
                Status
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colPayment]}>
                Payment
              </Text>
              <Text style={[styles.tableHeaderCell, styles.colCreated]}>
                Booked On
              </Text>
            </View>

            {/* Table Rows - Show up to 12 for landscape */}
            {data.bookings.slice(0, 12).map((booking, index) => (
              <View
                key={booking.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                ]}
              >
                <Text style={[styles.tableCell, styles.colBookingId]}>
                  {formatBookingId(booking.id)}
                </Text>
                <Text style={[styles.tableCell, styles.colDates]}>
                  {formatShortDate(booking.check_in_date)} -{" "}
                  {formatShortDate(booking.check_out_date)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.colGuests,
                    { textAlign: "center" },
                  ]}
                >
                  {booking.number_of_guests}
                </Text>
                <Text style={[styles.tableCell, styles.colAmount]}>
                  {formatCurrency(booking.total_amount)}
                </Text>
                <View style={[styles.colStatus, { paddingHorizontal: 4 }]}>
                  <Text
                    style={[styles.statusBadge, getStatusStyle(booking.status)]}
                  >
                    {(booking.status || "pending").toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.tableCell, styles.colPayment]}>
                  {booking.payment_type === "full" ? "Full" : "50% Down"} •{" "}
                  {(booking.payment_status || "pending")
                    .charAt(0)
                    .toUpperCase() +
                    (booking.payment_status || "pending").slice(1)}
                </Text>
                <Text style={[styles.tableCell, styles.colCreated]}>
                  {formatShortDate(booking.created_at)}
                </Text>
              </View>
            ))}

            {/* More rows indicator */}
            {data.bookings.length > 12 && (
              <View style={styles.tableRow}>
                <Text
                  style={[styles.moreRows, { width: "100%", borderBottom: 0 }]}
                >
                  + {data.bookings.length - 12} more bookings (export as CSV or
                  JSON for complete list)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>
              Kampo Ibayo Resort • Brgy. Tapia, General Trias, Cavite
            </Text>
            <Text style={styles.footerText}>
              Contact: 0917-123-4567 • info@kampoibayo.com
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerText}>
              Official Data Export • For Personal Use Only
            </Text>
            <Text style={styles.footerText}>
              Average Booking Value: {formatCurrency(averageBookingValue)}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json();

    if (!data.userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("📄 Generating PDF export for user:", data.userId.slice(0, 8));

    // Generate PDF
    const pdfDocument = <UserDataExportPDF data={data} />;
    const pdfBlob = await pdf(pdfDocument).toBlob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log(
      "✅ PDF export generated successfully, size:",
      pdfBuffer.length,
      "bytes"
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="kampo-ibayo-my-data-${
          new Date().toISOString().split("T")[0]
        }.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("❌ PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF export" },
      { status: 500 }
    );
  }
}
