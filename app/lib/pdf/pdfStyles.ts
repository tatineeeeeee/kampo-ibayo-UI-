import { StyleSheet } from "@react-pdf/renderer";

// Professional PDF Styles
export const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 70,
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
    marginBottom: 15,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
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
    borderLeftWidth: 1,
    borderLeftColor: "#166534",
    borderRightWidth: 1,
    borderRightColor: "#166534",
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
export const columnWidths = {
  bookings: {
    id: "9%",
    type: "8%",
    name: "14%",
    dates: "14%",
    guests: "7%",
    amount: "11%",
    paymentType: "11%",
    status: "13%",
    paymentStatus: "13%",
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
