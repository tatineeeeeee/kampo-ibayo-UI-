import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
} from "@react-pdf/renderer";
import { styles, columnWidths } from "./pdfStyles";
import {
  PDFExportable,
  LOGO_URL,
  formatDate,
  formatCurrency,
  formatBookingId,
} from "./helpers";

// =====================
// PAYMENTS PDF DOCUMENT
// =====================
interface PaymentsPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

export const PaymentsPDFDocument: React.FC<PaymentsPDFProps> = ({
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
          <View style={styles.tableHeader} minPresenceAhead={40}>
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
          {data.map((payment, index) => {
            const total = (payment.total_amount as number) || 0;
            const paid = (payment.amount as number) || 0;
            const balance = Math.max(0, total - paid);

            return (
              <View
                key={index}
                wrap={false}
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
                    payment.original_method || payment.payment_method || "",
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
                    (payment.check_in_date || payment.date) as string,
                  )}
                </Text>
              </View>
            );
          })}
        </View>

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
