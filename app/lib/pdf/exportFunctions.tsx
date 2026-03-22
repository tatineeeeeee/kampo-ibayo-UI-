import React from "react";
import { pdf } from "@react-pdf/renderer";
import { PDFExportable, downloadPDF } from "./helpers";
import { BookingsPDFDocument } from "./BookingsPDF";
import { UsersPDFDocument } from "./UsersPDF";
import { PaymentsPDFDocument } from "./PaymentsPDF";
import { ReportsPDFDocument } from "./ReportsPDF";

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
    />,
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
    />,
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
    />,
  ).toBlob();

  downloadPDF(blob, "kampo_ibayo_payments");
};

// Export Reports to PDF
export const exportReportsPDF = async (
  data: PDFExportable[],
  reportType: string,
  dateRange?: { start: string; end: string },
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
    />,
  ).toBlob();

  const filename = `kampo_ibayo_${reportType
    .toLowerCase()
    .replace(/\s+/g, "_")}`;
  downloadPDF(blob, filename);
};
