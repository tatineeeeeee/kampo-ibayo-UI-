// Type definitions
export interface PDFExportable {
  [key: string]: string | number | boolean | null | undefined | object;
}

// Logo URL - use absolute path for PDF rendering
export const LOGO_URL = "/logo.png";

// Helper to format date
export const formatDate = (dateStr: string | null | undefined): string => {
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
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return "PHP 0";
  return `PHP ${amount.toLocaleString()}`;
};

// Helper to format Philippine phone number
export const formatPhoneNumber = (phone: string | null | undefined): string => {
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
export const formatBookingId = (id: number | string | null | undefined): string => {
  if (!id) return "";
  return `KB-${String(id).padStart(4, "0")}`;
};

// Helper function to download PDF
export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
