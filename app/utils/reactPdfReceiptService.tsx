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
import QRCode from "qrcode";

// Professional Receipt Data Interfaces
export interface Booking {
  id: string;
  guest_name: string; // Guest name from booking form
  guest_email: string; // Guest email from booking
  guest_phone?: string; // Guest phone number
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  payment_amount?: number;
  payment_type?: "full" | "partial"; // Simple: full or 50% down payment
  // Small resort essentials only
  booking_status?: "confirmed" | "pending" | "cancelled";
  special_requests?: string;
  created_at: string;
}

export interface PaymentProof {
  payment_method: string; // 'GCash', 'Maya', 'Bank Transfer', 'Cash'
  reference_number: string;
  payment_date: string;
  amount_paid: number;
  verification_status?: "verified" | "pending" | "rejected";
}

export interface CompanyDetails {
  name: string; // 'Kampo Ibayo Resort'
  address: string;
  phone: string;
  email: string;
  website?: string;
  facebook?: string;
}

export interface ReceiptData {
  booking: Booking;
  paymentProof: PaymentProof;
  userEmail: string; // User's account email (for system reference)
  userPhone?: string; // For SMS notifications
  receiptNumber: string;
  generatedAt: string;
  companyDetails: CompanyDetails;
  receiptType: "payment" | "refund"; // Simple: payment or refund only
  notes?: string; // Admin notes if needed
}

// Premium Real-World Receipt Styles - Clean & Professional
const styles = StyleSheet.create({
  // Clean A4 page design - optimized for single page
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 12,
    fontFamily: "Times-Roman",
    fontSize: 10,
    lineHeight: 1.2,
    color: "#2d3748",
    position: "relative",
  },

  // PAID Watermark - diagonal across the page
  watermark: {
    position: "absolute",
    top: "40%",
    left: "15%",
    transform: "rotate(-35deg)",
    fontSize: 120,
    fontFamily: "Times-Bold",
    color: "#C5A572",
    opacity: 0.12,
    letterSpacing: 15,
    zIndex: 0,
  },

  // Premium header - LANDSCAPE OPTIMIZED
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FDF6F0",
    borderBottom: "2 solid #C5A572",
    marginHorizontal: -12,
    marginTop: -12,
  },

  // Left-positioned logo container - LANDSCAPE
  logoContainer: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  // Premium logo sizing - LANDSCAPE
  companyLogo: {
    width: 55,
    height: 55,
  },

  // Fallback logo - LANDSCAPE
  logoFallback: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },

  // Right-aligned premium company information
  companyInfo: {
    alignItems: "flex-end",
    textAlign: "right",
    width: "50%",
    paddingLeft: 20,
  },

  // Center-left descriptive content
  companyDescription: {
    alignItems: "flex-start",
    textAlign: "left",
    width: "50%",
  },

  companyName: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    fontWeight: "bold",
    color: "#9B2226", // Warmer burgundy
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  companyTagline: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    color: "#C5A572", // Richer gold
    marginBottom: 8,
    fontStyle: "italic",
  },

  companyAddress: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.3,
  },

  // Main content wrapper
  mainWrapper: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100%",
  },

  // Content container for header, title, and main sections
  contentContainer: {
    flexDirection: "column",
    flex: 1,
  },

  // Clean content area
  contentArea: {
    marginTop: 12,
  },

  // Clean title section - LANDSCAPE
  titleSection: {
    textAlign: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1 solid #e2e8f0",
  },

  receiptTitle: {
    fontFamily: "Times-Bold",
    fontSize: 18,
    fontWeight: "bold",
    color: "#9B2226",
    marginBottom: 2,
    letterSpacing: 1,
  },

  receiptSubtitle: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: "#C5A572",
    marginBottom: 4,
    fontStyle: "italic",
  },

  receiptNumberBadge: {
    backgroundColor: "#9B2226",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12, // Reduced padding
    alignSelf: "center",
  },

  receiptNumber: {
    fontFamily: "Times-Bold",
    fontSize: 10, // Smaller, less prominent
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: 0.3,
  },

  // Clean two-column layout with 8px grid system - LANDSCAPE OPTIMIZED
  mainContent: {
    flexDirection: "row",
    marginBottom: 6,
    flex: 1,
  },

  // Kampo Ibayo branded information cards with fixed borders - LANDSCAPE: 3 columns
  leftColumn: {
    width: "32%",
    backgroundColor: "#FDF6F0",
    border: "2 solid #C5A572",
    borderRadius: 10,
    padding: 0,
    marginRight: 10,
    overflow: "hidden",
  },

  rightColumn: {
    width: "32%",
    backgroundColor: "#FDF6F0",
    border: "2 solid #C5A572",
    borderRadius: 10,
    padding: 0,
    marginRight: 10,
    overflow: "hidden",
  },

  // Third column for Payment Summary in landscape
  thirdColumn: {
    width: "32%",
    backgroundColor: "#FDF6F0",
    border: "2 solid #C5A572",
    borderRadius: 10,
    padding: 0,
    overflow: "hidden",
  },

  // Kampo Ibayo section headers with perfect border alignment - LANDSCAPE
  sectionHeader: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "#9B2226",
    marginBottom: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    textAlign: "center",
  },

  // Content wrapper for proper spacing - LANDSCAPE
  cardContent: {
    padding: 8,
  },

  // Clean data rows
  dataRow: {
    flexDirection: "row",
    paddingVertical: 2,
    alignItems: "flex-start",
    borderBottom: "0.5 solid #F4E4BC",
    minHeight: 14,
  },

  dataLabel: {
    fontFamily: "Times-Bold", // Better typography
    width: "40%",
    fontSize: 10,
    color: "#000000",
    lineHeight: 1.3,
    paddingRight: 8,
    fontWeight: "600", // Better contrast
  },

  dataValue: {
    fontFamily: "Times-Bold",
    width: "60%",
    fontSize: 11,
    color: "#9B2226", // Warmer burgundy
    fontWeight: "bold",
    lineHeight: 1.3,
  },

  // Professional status indicator
  statusContainer: {
    alignItems: "flex-start",
    width: "60%",
  },

  statusBadge: {
    backgroundColor: "#F4E4BC", // Warm gold background
    border: "1 solid #C5A572", // Richer gold border
    color: "#9B2226", // Burgundy text
    paddingVertical: 4, // Better spacing
    paddingHorizontal: 8, // Better spacing
    borderRadius: 4,
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Kampo Ibayo payment summary with earth tone branding
  summarySection: {
    backgroundColor: "#FDF6F0",
    border: "3 solid #C5A572", // Richer gold
    borderTopLeftRadius: 12, // Only top corners rounded
    borderTopRightRadius: 12, // Only top corners rounded
    padding: 0, // No padding to let totalSection touch edges
    marginTop: 6, // Further reduced to save space
    marginBottom: 6, // Reduced to save space
    overflow: "hidden", // Ensure totalSection corners are clipped
  },

  summaryHeader: {
    fontFamily: "Times-Bold",
    fontSize: 16,
    fontWeight: "bold",
    color: "#9B2226", // Warmer burgundy
    textAlign: "center",
    marginBottom: 6, // Further reduced to save space
    letterSpacing: 0.5,
    paddingHorizontal: 14, // Add horizontal padding for header
    paddingTop: 10, // Reduced to save space
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 4, // Reduced to save space
    paddingHorizontal: 14, // Add horizontal padding for rows
    borderBottom: "0.5 solid #e2e8f0",
    minHeight: 16, // Reduced to save space
  },

  summaryLabel: {
    fontFamily: "Times-Bold", // Better typography
    fontSize: 11,
    color: "#000000",
    width: "55%",
    paddingRight: 12, // Better spacing
    lineHeight: 1.2,
    fontWeight: "600", // Better contrast
  },

  summaryValue: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: "#9B2226", // Warmer burgundy
    fontWeight: "bold",
    textAlign: "right",
    width: "45%",
    lineHeight: 1.2,
  },

  // Kampo Ibayo total section with deep earth tone
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8, // Further reduced to save space
    paddingHorizontal: 14, // Match summary section padding
    backgroundColor: "#9B2226", // Warmer burgundy
    marginTop: 6, // Reduced to save space
    // No border radius for sharp bottom corners that match container
  },

  totalLabel: {
    fontFamily: "Times-Bold",
    fontSize: 12,
    color: "#ffffff",
    fontWeight: "bold",
    width: "55%",
    letterSpacing: 0.5,
  },

  totalAmount: {
    fontFamily: "Times-Bold",
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "right",
    width: "45%",
    letterSpacing: 0.5,
  },

  // Kampo Ibayo footer with earth tone branding
  footerSection: {
    marginTop: 6, // Significantly reduced to prevent overflow
    paddingTop: 8, // Further reduced
    borderTop: "3 solid #C5A572", // Richer gold
    textAlign: "center",
    backgroundColor: "#FDF6F0",
    marginHorizontal: -12,
    marginBottom: -12,
    paddingHorizontal: 16, // Better spacing
    paddingBottom: 8, // Further reduced
  },

  // Check-in reminder box
  checkInReminder: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#9B2226",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
    marginTop: 4,
  },

  checkInReminderText: {
    fontFamily: "Times-Bold",
    fontSize: 11,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  // Cancellation policy reminder box
  cancellationReminder: {
    backgroundColor: "#FDF6F0",
    border: "1 solid #C5A572",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 6,
    marginBottom: 4,
  },

  cancellationTitle: {
    fontFamily: "Times-Bold",
    fontSize: 9,
    color: "#9B2226",
    marginBottom: 2,
    textAlign: "center",
  },

  cancellationText: {
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: "#000000",
    textAlign: "center",
    lineHeight: 1.2,
  },

  thankYouMessage: {
    fontFamily: "Times-Bold",
    fontSize: 13, // Further reduced to save space
    fontWeight: "bold",
    color: "#9B2226", // Warmer burgundy
    marginBottom: 4, // Further reduced to save space
    letterSpacing: 0.5,
  },

  disclaimerText: {
    fontFamily: "Times-Roman",
    fontSize: 9, // Slightly reduced to save space
    color: "#000000",
    marginBottom: 4, // Reduced to save space
    lineHeight: 1.15, // Slightly tighter
    textAlign: "center",
  },

  contactInfo: {
    fontFamily: "Times-Roman",
    fontSize: 10, // Minimum 10pt for accessibility
    color: "#000000",
    lineHeight: 1.2, // Better readability
    textAlign: "center",
  },

  // Clean divider
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 1,
  },

  // QR Code section
  qrSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },

  qrContainer: {
    alignItems: "center",
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    border: "1 solid #C5A572",
  },

  qrImage: {
    width: 70,
    height: 70,
  },

  qrLabel: {
    fontFamily: "Times-Roman",
    fontSize: 8,
    color: "#666666",
    marginTop: 4,
    textAlign: "center",
  },
});

// Professional Receipt Document Component - Now accepts QR code data URL
const ProfessionalReceiptDocument = ({
  data,
  qrCodeDataUrl,
}: {
  data: ReceiptData;
  qrCodeDataUrl?: string;
}) => {
  // Currency formatting for Philippine Peso
  const formatCurrency = (amount: number | null | undefined): string => {
    // Ensure we have a valid number
    const validAmount =
      typeof amount === "number" && !isNaN(amount) ? amount : 0;

    const formatted = validAmount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `PHP ${formatted}`;
  };

  // Short date format for compact display
  const formatShortDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate nights stayed
  const calculateNights = (): number => {
    const checkIn = new Date(data.booking.check_in_date);
    const checkOut = new Date(data.booking.check_out_date);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Determine payment type display
  const getPaymentTypeDisplay = (): string => {
    if (data.booking.payment_type === "full") {
      return "Full Payment";
    }
    return "Down Payment (50%)";
  };

  // Professional logo with absolute URL for production reliability
  const CompanyLogo = () => {
    return (
      /* eslint-disable-next-line jsx-a11y/alt-text */
      <Image
        src="https://kampo-ibayo-resort.vercel.app/logo.png"
        style={styles.companyLogo}
      />
    );
  };

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* PAID Watermark */}
        <Text style={styles.watermark}>PAID</Text>

        <View style={styles.mainWrapper}>
          <View style={styles.contentContainer}>
            {/* Professional Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <CompanyLogo />
              </View>

              <View style={styles.companyDescription}>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#9B2226",
                    fontWeight: "bold",
                    marginBottom: 4,
                  }}
                >
                  Kampo Ibayo Resort
                </Text>
                <Text
                  style={{ fontSize: 8, color: "#000000", fontStyle: "italic" }}
                >
                  Eco-friendly camping in General Trias, Cavite{"\n"}
                  Family-Friendly • Pet-Friendly • Up to 15 Guests
                </Text>
              </View>

              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  {data.companyDetails.name}
                </Text>
                <Text style={styles.companyTagline}>
                  Luxury • Tranquility • Excellence
                </Text>
                <Text
                  style={{
                    fontFamily: "Times-Roman",
                    fontSize: 9,
                    color: "#000000",
                    marginTop: 4,
                  }}
                >
                  {data.companyDetails.address}
                </Text>
                <Text
                  style={{
                    fontFamily: "Times-Roman",
                    fontSize: 9,
                    color: "#000000",
                    marginTop: 2,
                  }}
                >
                  {data.companyDetails.phone} • {data.companyDetails.email}
                </Text>
              </View>
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.receiptTitle}>Payment Receipt</Text>
              <Text
                style={{
                  fontFamily: "Times-Roman",
                  fontSize: 10,
                  color: "#C5A572",
                  fontStyle: "italic",
                  marginTop: 2,
                  marginBottom: 6,
                }}
              >
                Official payment confirmation for your reservation
              </Text>
              <View style={styles.receiptNumberBadge}>
                <Text style={styles.receiptNumber}>
                  Receipt #{data.receiptNumber}
                </Text>
              </View>
            </View>

            {/* Two-Column Layout for Better UX */}
            <View style={styles.mainContent}>
              {/* Left Column - Booking Information */}
              <View style={styles.leftColumn}>
                <Text style={styles.sectionHeader}>Reservation Details</Text>
                <View style={styles.cardContent}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Booking ID:</Text>
                    <Text style={styles.dataValue}>#{data.booking.id}</Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Guest Name:</Text>
                    <Text style={styles.dataValue}>
                      {data.booking.guest_name}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Email Address:</Text>
                    <Text style={styles.dataValue}>
                      {data.booking.guest_email}
                    </Text>
                  </View>

                  {data.booking.guest_phone && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Phone Number:</Text>
                      <Text style={styles.dataValue}>
                        {data.booking.guest_phone}
                      </Text>
                    </View>
                  )}

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Check-in Date:</Text>
                    <Text style={styles.dataValue}>
                      {formatShortDate(data.booking.check_in_date)}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Check-out Date:</Text>
                    <Text style={styles.dataValue}>
                      {formatShortDate(data.booking.check_out_date)}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Duration:</Text>
                    <Text style={styles.dataValue}>
                      {calculateNights()}{" "}
                      {calculateNights() === 1 ? "night" : "nights"}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Guests:</Text>
                    <Text style={styles.dataValue}>
                      {data.booking.number_of_guests}{" "}
                      {data.booking.number_of_guests === 1 ? "guest" : "guests"}
                    </Text>
                  </View>

                  {data.booking.special_requests && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Special Requests:</Text>
                      <Text style={styles.dataValue}>
                        {data.booking.special_requests}
                      </Text>
                    </View>
                  )}

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Status:</Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              data.booking.booking_status === "confirmed"
                                ? "#F4E4BC" // Brand gold
                                : data.booking.booking_status === "pending"
                                ? "#FDF6F0" // Light cream
                                : "#F4E4BC", // Default gold
                            color:
                              data.booking.booking_status === "confirmed"
                                ? "#9B2226" // Burgundy text
                                : data.booking.booking_status === "pending"
                                ? "#C5A572" // Gold text
                                : "#9B2226", // Default burgundy
                            border:
                              data.booking.booking_status === "confirmed"
                                ? "1 solid #C5A572" // Gold border
                                : data.booking.booking_status === "pending"
                                ? "1 solid #C5A572" // Gold border
                                : "1 solid #C5A572", // Default gold border
                          },
                        ]}
                      >
                        <Text>
                          {(
                            data.booking.booking_status || "confirmed"
                          ).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right Column - Payment Information */}
              <View style={styles.rightColumn}>
                <Text style={styles.sectionHeader}>Payment Details</Text>
                <View style={styles.cardContent}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Payment Type:</Text>
                    <Text style={styles.dataValue}>
                      {getPaymentTypeDisplay()}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Method:</Text>
                    <Text style={styles.dataValue}>
                      {data.paymentProof.payment_method}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Reference #:</Text>
                    <Text style={styles.dataValue}>
                      {data.paymentProof.reference_number}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Payment Date:</Text>
                    <Text style={styles.dataValue}>
                      {formatShortDate(data.paymentProof.payment_date)}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Processed:</Text>
                    <Text style={styles.dataValue}>
                      {formatShortDate(data.generatedAt)}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Receipt Date:</Text>
                    <Text style={styles.dataValue}>
                      {new Date().toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>

                  {data.paymentProof?.verification_status && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Verification:</Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                data.paymentProof.verification_status ===
                                "verified"
                                  ? "#F4E4BC" // Brand gold for verified
                                  : data.paymentProof.verification_status ===
                                    "pending"
                                  ? "#FDF6F0" // Light cream for pending
                                  : "#F4E4BC", // Default gold
                              color:
                                data.paymentProof.verification_status ===
                                "verified"
                                  ? "#9B2226" // Burgundy text for verified
                                  : data.paymentProof.verification_status ===
                                    "pending"
                                  ? "#C5A572" // Gold text for pending
                                  : "#9B2226", // Default burgundy
                              border:
                                data.paymentProof.verification_status ===
                                "verified"
                                  ? "1 solid #C5A572" // Gold border
                                  : data.paymentProof.verification_status ===
                                    "pending"
                                  ? "1 solid #C5A572" // Gold border
                                  : "1 solid #C5A572", // Default gold border
                              fontSize: 8, // Slightly larger for readability
                            },
                          ]}
                        >
                          <Text>
                            {(
                              data.paymentProof.verification_status ||
                              "verified"
                            ).toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Third Column - Payment Summary (LANDSCAPE LAYOUT) */}
              <View style={styles.thirdColumn}>
                <Text style={styles.sectionHeader}>Payment Summary</Text>
                <View style={styles.cardContent}>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Base Rate:</Text>
                    <Text style={styles.dataValue}>
                      {formatCurrency(
                        data.booking.number_of_guests > 15
                          ? (data.booking.total_amount ?? 0) -
                              (data.booking.number_of_guests - 15) *
                                300 *
                                calculateNights()
                          : data.booking.total_amount ?? 0
                      )}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Extra Guests:</Text>
                    <Text style={styles.dataValue}>
                      {formatCurrency(
                        data.booking.number_of_guests > 15
                          ? (data.booking.number_of_guests - 15) *
                              300 *
                              calculateNights()
                          : 0
                      )}
                    </Text>
                  </View>

                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Subtotal:</Text>
                    <Text style={styles.dataValue}>
                      {formatCurrency(data.booking.total_amount ?? 0)}
                    </Text>
                  </View>

                  {data.booking.payment_type === "partial" && (
                    <View style={styles.dataRow}>
                      <Text style={styles.dataLabel}>Payment:</Text>
                      <Text style={styles.dataValue}>50% Down Payment</Text>
                    </View>
                  )}

                  {data.booking.total_amount &&
                    data.booking.total_amount >
                      (data.paymentProof?.amount_paid ?? 0) && (
                      <View style={styles.dataRow}>
                        <Text style={styles.dataLabel}>Balance:</Text>
                        <Text style={styles.dataValue}>
                          {formatCurrency(
                            data.booking.total_amount -
                              (data.paymentProof?.amount_paid ?? 0)
                          )}
                        </Text>
                      </View>
                    )}

                  {/* Amount Paid - Clean style without background */}
                  <View
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "2 solid #9B2226",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Times-Bold",
                          fontSize: 11,
                          color: "#9B2226",
                        }}
                      >
                        Amount Paid:
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Times-Bold",
                          fontSize: 14,
                          color: "#9B2226",
                        }}
                      >
                        {formatCurrency(
                          data.paymentProof?.amount_paid ??
                            data.booking.payment_amount ??
                            data.booking.total_amount ??
                            0
                        )}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Footer Section - LANDSCAPE LAYOUT: Horizontal with QR on right */}
          <View
            style={{
              flexDirection: "row",
              marginTop: 8,
              paddingTop: 8,
              borderTop: "2 solid #C5A572",
              backgroundColor: "#FDF6F0",
              marginHorizontal: -12,
              marginBottom: -12,
              paddingHorizontal: 16,
              paddingBottom: 8,
            }}
          >
            {/* Left side - Info */}
            <View style={{ flex: 1, paddingRight: 20 }}>
              {/* Row 1: Check-in/Check-out + Thank You */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#9B2226",
                    paddingVertical: 5,
                    paddingHorizontal: 10,
                    borderRadius: 4,
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Times-Bold",
                      fontSize: 9,
                      color: "#ffffff",
                    }}
                  >
                    CHECK-IN: 3:00 PM • CHECK-OUT: 1:00 PM
                  </Text>
                </View>
                <Text
                  style={{
                    fontFamily: "Times-Bold",
                    fontSize: 11,
                    color: "#9B2226",
                  }}
                >
                  Thank You for Your Payment!
                </Text>
              </View>

              {/* Row 2: Confirmation message */}
              <Text
                style={{
                  fontFamily: "Times-Roman",
                  fontSize: 9,
                  color: "#000000",
                  marginBottom: 6,
                }}
              >
                This receipt confirms your payment has been processed
                successfully. Please keep this document for your records.
              </Text>

              {/* Row 3: Cancellation Policy inline */}
              <View style={{ flexDirection: "row", marginBottom: 6 }}>
                <Text
                  style={{
                    fontFamily: "Times-Bold",
                    fontSize: 9,
                    color: "#9B2226",
                    marginRight: 6,
                  }}
                >
                  Cancellation Policy:
                </Text>
                <Text
                  style={{
                    fontFamily: "Times-Roman",
                    fontSize: 9,
                    color: "#000000",
                    flex: 1,
                  }}
                >
                  Free cancellation 7+ days before check-in. 50% refund 3-7 days
                  before. No refund within 3 days.
                </Text>
              </View>

              {/* Row 4: Contact info */}
              <Text
                style={{
                  fontFamily: "Times-Bold",
                  fontSize: 9,
                  color: "#000000",
                }}
              >
                Business Hours: 8:00 AM - 8:00 PM • {data.companyDetails.phone}{" "}
                • {data.companyDetails.email}
              </Text>
            </View>

            {/* Right side - QR Code */}
            {qrCodeDataUrl && (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <View
                  style={{
                    backgroundColor: "#ffffff",
                    padding: 6,
                    borderRadius: 6,
                    border: "1 solid #C5A572",
                  }}
                >
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image
                    src={qrCodeDataUrl}
                    style={{ width: 60, height: 60 }}
                  />
                </View>
                <Text
                  style={{
                    fontFamily: "Times-Roman",
                    fontSize: 7,
                    color: "#666666",
                    marginTop: 3,
                  }}
                >
                  Scan to view booking
                </Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Professional Receipt Service Class
export class ReactPdfReceiptService {
  /**
   * Generate professional receipt number with proper formatting
   */
  static generateReceiptNumber(
    bookingId: string,
    receiptType: "payment" | "refund" = "payment"
  ): string {
    const prefix = receiptType === "refund" ? "KIR-REF" : "KIR";
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const time = Date.now().toString().slice(-4); // Last 4 digits for uniqueness
    const bookingShort = bookingId.toString().slice(-3); // Last 3 digits of booking ID
    return `${prefix}-${year}${month}${day}-${time}${bookingShort}`;
  }

  /**
   * Comprehensive receipt data validation
   */
  static validateReceiptData(data: ReceiptData): boolean {
    try {
      // Required field validation
      if (
        !data?.booking?.id ||
        !data?.booking?.guest_name ||
        !data?.booking?.guest_email ||
        !data?.paymentProof ||
        !data?.userEmail ||
        !data?.receiptNumber ||
        !data?.companyDetails
      ) {
        console.error("❌ Missing required receipt data fields");
        return false;
      }

      // Booking validation
      if (
        !data.booking.check_in_date ||
        !data.booking.check_out_date ||
        !data.booking.total_amount ||
        data.booking.number_of_guests < 1
      ) {
        console.error("❌ Invalid booking data");
        return false;
      }

      // Payment validation
      if (
        !data.paymentProof.payment_method ||
        !data.paymentProof.reference_number ||
        !data.paymentProof.amount_paid
      ) {
        console.error("❌ Invalid payment proof data");
        return false;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.booking.guest_email)) {
        console.error("❌ Invalid guest email format");
        return false;
      }

      if (!emailRegex.test(data.userEmail)) {
        console.error("❌ Invalid user email format");
        return false;
      }

      console.log("✅ Receipt data validation passed");
      return true;
    } catch (error) {
      console.error("❌ Receipt validation error:", error);
      return false;
    }
  }

  /**
   * Generate QR code as data URL
   */
  static async generateQRCode(bookingId: string): Promise<string> {
    try {
      // Create URL that links to booking page
      const bookingUrl = `https://kampo-ibayo-resort.vercel.app/bookings?id=${bookingId}`;

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(bookingUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: "#9B2226", // Burgundy color to match brand
          light: "#FFFFFF",
        },
      });

      console.log("✅ QR code generated successfully");
      return qrDataUrl;
    } catch (error) {
      console.error("❌ QR code generation failed:", error);
      return ""; // Return empty string if QR generation fails
    }
  }

  /**
   * Generate professional PDF receipt with error handling
   */
  static async generatePDFReceipt(data: ReceiptData): Promise<Buffer> {
    try {
      console.log("🚀 Starting professional PDF generation...");
      console.log("📊 Environment:", {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        timestamp: new Date().toISOString(),
      });

      // Validate data before generation
      if (!this.validateReceiptData(data)) {
        throw new Error("Invalid receipt data provided");
      }

      // Generate QR code
      const qrCodeDataUrl = await this.generateQRCode(data.booking.id);

      // Generate PDF with professional styling and QR code
      const receiptDocument = (
        <ProfessionalReceiptDocument
          data={data}
          qrCodeDataUrl={qrCodeDataUrl}
        />
      );

      // Create optimized PDF blob
      const pdfBlob = await pdf(receiptDocument).toBlob();
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      console.log("✅ Professional PDF generation successful!");
      console.log("📊 PDF size:", pdfBuffer.length, "bytes");

      if (pdfBuffer.length < 10000) {
        console.warn(
          "⚠️ Warning: PDF size unusually small, may indicate rendering issues"
        );
      }

      return pdfBuffer;
    } catch (error) {
      console.error("🚨 PDF Generation Error:", error);
      throw new Error(
        `PDF generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Generate receipt blob (compatibility alias)
   */
  static async generateReceiptBlob(data: ReceiptData): Promise<Buffer> {
    return await this.generatePDFReceipt(data);
  }

  /**
   * Validate booking system data integrity
   */
  static validateBookingSystemData(data: ReceiptData): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Kampo Ibayo Resort specific validations
    if (data.booking.total_amount < 2000) {
      warnings.push("Amount seems low for Kampo Ibayo Resort rates");
    }

    if (data.booking.number_of_guests > 15) {
      warnings.push("Large group - confirm accommodation capacity");
    }

    // Check if partial payment matches 50%
    if (
      data.booking.payment_type === "partial" &&
      data.paymentProof.amount_paid
    ) {
      const expectedPartial = data.booking.total_amount * 0.5;
      const difference = Math.abs(
        data.paymentProof.amount_paid - expectedPartial
      );
      if (difference > 100) {
        // Allow ₱100 variance
        warnings.push("Partial payment amount doesn't match 50% of total");
      }
    }

    const checkIn = new Date(data.booking.check_in_date);
    const checkOut = new Date(data.booking.check_out_date);
    if (checkOut <= checkIn) {
      warnings.push("Check-out date should be after check-in date");
    }

    // Provide suggestions for better data
    if (!data.companyDetails.website) {
      suggestions.push("Consider adding website URL to company details");
    }

    if (!data.booking.payment_type) {
      suggestions.push("Consider specifying payment type (full/partial)");
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }
}
