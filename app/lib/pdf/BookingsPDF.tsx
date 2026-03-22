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
// BOOKINGS PDF DOCUMENT
// =====================
interface BookingsPDFProps {
  data: PDFExportable[];
  title: string;
  generatedAt: string;
}

export const BookingsPDFDocument: React.FC<BookingsPDFProps> = ({
  data,
  title,
  generatedAt,
}) => {
  // Calculate summary statistics
  const totalBookings = data.length;
  const totalRevenue = data.reduce(
    (sum, b) => sum + ((b.total_amount as number) || 0),
    0,
  );
  const confirmedCount = data.filter((b) => b.status === "confirmed").length;
  const pendingCount = data.filter((b) => b.status === "pending").length;
  const walkInCount = data.filter((b) =>
    String(b.special_requests || "").startsWith("[WALK-IN]"),
  ).length;

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
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Walk-ins</Text>
            <Text style={styles.summaryValue}>{walkInCount}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader} minPresenceAhead={40}>
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
                { width: columnWidths.bookings.type },
              ]}
            >
              Type
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
          {data.map((booking, index) => (
            <View
              key={index}
              wrap={false}
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
                  { width: columnWidths.bookings.type, fontSize: 7 },
                ]}
              >
                {String(booking.special_requests || "").startsWith("[WALK-IN]")
                  ? "Walk-in"
                  : "Online"}
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
