/**
 * Receipt Service for Kampo Ibayo Resort
 * Handles beautiful PDF receipt generation with modern design
 */

import jsPDF from 'jspdf';
import { Tables } from '../../database.types';

type Booking = Tables<'bookings'>;
type PaymentProof = Tables<'payment_proofs'>;

export interface ReceiptData {
  booking: Booking;
  paymentProof: PaymentProof;
  userEmail: string;
  userName: string;
  receiptNumber: string;
  generatedAt: string;
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export class ReceiptService {
  private static readonly COMPANY_DETAILS = {
    name: 'Kampo Ibayo Resort',
    address: 'Brgy. Tapia, General Trias, Cavite',
    phone: '+63 966 281 5123',
    email: 'kampoibayo@gmail.com',
    facebook: 'Kampo Ibayo (Facebook)',
    hours: '8:00 AM - 8:00 PM (Daily)',
    checkIn: '3:00 PM',
    checkOut: '1:00 PM'
  };

  /**
   * Load logo image and convert to base64
   */
  private static async loadLogo(): Promise<string | null> {
    try {
      const response = await fetch('/logo.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Could not load logo:', error);
      return null;
    }
  }

  /**
   * Generate receipt number based on booking ID and timestamp
   * Updates for rescheduled bookings to reflect current dates
   */
  static generateReceiptNumber(bookingId: number, isRescheduled: boolean = false): string {
    const timestamp = Date.now().toString().slice(-6);
    const prefix = isRescheduled ? 'KIR-R' : 'KIR';
    return `${prefix}-${bookingId.toString().padStart(4, '0')}-${timestamp}`;
  }

  /**
   * Generate beautiful PDF receipt with modern resort design
   */
  static generatePDFReceipt(receiptData: ReceiptData): jsPDF {
    const doc = new jsPDF('p', 'mm', 'a4');
    const { booking, paymentProof, userEmail, userName, receiptNumber, generatedAt } = receiptData;
    
    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm 
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Modern Resort Color Palette
    const colors = {
      primary: [34, 139, 34] as [number, number, number],      // Forest Green
      secondary: [255, 140, 0] as [number, number, number],    // Sunset Orange
      accent: [70, 130, 180] as [number, number, number],      // Ocean Blue
      text: [33, 37, 41] as [number, number, number],          // Dark charcoal
      lightBg: [248, 249, 250] as [number, number, number],    // Light gray background
      white: [255, 255, 255] as [number, number, number],      // Pure white
      success: [40, 167, 69] as [number, number, number],      // Success green
      warning: [255, 193, 7] as [number, number, number],      // Golden yellow
      gold: [218, 165, 32] as [number, number, number]         // Elegant gold
    };
    
    let yPos = 15;
    
    // ===== BEAUTIFUL HEADER WITH RESORT BRANDING =====
    // Main header background - gradient effect with two rectangles
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 55, 'F');
    
    // Secondary color accent
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 50, pageWidth, 8, 'F');
    
    // Professional Logo Circle with resort initials
    doc.setFillColor(...colors.gold);
    doc.circle(35, 28, 15, 'F');
    doc.setFillColor(...colors.white);
    doc.circle(35, 28, 12, 'F');
    doc.setFillColor(...colors.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('KI', 35, 32, { align: 'center' });
    
    // Resort name and branding
    doc.setTextColor(...colors.white);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('KAMPO IBAYO RESORT', 60, 22);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Your Gateway to Nature & Adventure', 60, 32);
    
    doc.setFontSize(9);
    doc.text(`${this.COMPANY_DETAILS.phone} • ${this.COMPANY_DETAILS.email}`, 60, 40);
    doc.text(this.COMPANY_DETAILS.address, 60, 47);
    
    // "OFFICIAL RECEIPT" badge
    doc.setFillColor(...colors.warning);
    doc.roundedRect(pageWidth - 70, 15, 60, 25, 3, 3, 'F');
    doc.setTextColor(...colors.text);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL', pageWidth - 40, 25, { align: 'center' });
    doc.text('RECEIPT', pageWidth - 40, 32, { align: 'center' });
    
    yPos = 75;
    
    // ===== RECEIPT INFORMATION CARDS =====
    // Receipt number card with beautiful styling
    doc.setFillColor(...colors.lightBg);
    doc.roundedRect(margin, yPos, (contentWidth / 2) - 5, 25, 3, 3, 'F');
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, yPos, (contentWidth / 2) - 5, 25, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('📄 RECEIPT NUMBER', margin + 5, yPos + 10);
    doc.setFontSize(14);
    doc.text(receiptNumber, margin + 5, yPos + 18);
    
    // Date and status card
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin + (contentWidth / 2) + 5, yPos, (contentWidth / 2) - 5, 25, 3, 3, 'F');
    doc.setDrawColor(...colors.success);
    doc.roundedRect(margin + (contentWidth / 2) + 5, yPos, (contentWidth / 2) - 5, 25, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('✅ STATUS', margin + (contentWidth / 2) + 10, yPos + 10);
    doc.setTextColor(...colors.success);
    doc.setFontSize(12);
    doc.text('VERIFIED & CONFIRMED', margin + (contentWidth / 2) + 10, yPos + 18);
    
    yPos += 35;
    
    // Generated date info
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date(generatedAt).toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })}`, margin + 5, yPos);
    doc.text(`Booking ID: #${booking.id}`, pageWidth - margin - 5, yPos, { align: 'right' });
    
    yPos += 20;
    
    // ===== GUEST INFORMATION SECTION =====
    doc.setFillColor(...colors.accent);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 GUEST INFORMATION', margin + 5, yPos + 7);
    
    yPos += 18;
    
    // Guest details with alternating background
    const guestInfo = [
      { label: 'Name', value: userName },
      { label: 'Email', value: userEmail },
      { label: 'Phone', value: booking.guest_phone || 'Not provided' },
      { label: 'Total Guests', value: `${booking.number_of_guests} guest(s)` }
    ];
    
    guestInfo.forEach((info, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, yPos - 2, contentWidth, 10, 'F');
      }
      
      doc.setTextColor(...colors.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${info.label}:`, margin + 5, yPos + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(info.value, margin + 60, yPos + 4);
      yPos += 10;
    });
    
    yPos += 15;
    
    // ===== STAY DETAILS SECTION =====
    doc.setFillColor(...colors.primary);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🏨 STAY DETAILS', margin + 5, yPos + 7);
    
    yPos += 18;
    
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    const stayInfo = [
      { label: 'Check-in', value: checkIn.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })},
      { label: 'Check-out', value: checkOut.toLocaleDateString('en-US', { 
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
      })},
      { label: 'Duration', value: `${nights} night${nights !== 1 ? 's' : ''}` },
      { label: 'Package Rate', value: `₱${booking.total_amount.toLocaleString()} total` }
    ];
    
    stayInfo.forEach((info, index) => {
      if (index % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, yPos - 2, contentWidth, 10, 'F');
      }
      
      doc.setTextColor(...colors.text);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${info.label}:`, margin + 5, yPos + 4);
      doc.setFont('helvetica', 'bold');
      doc.text(info.value, margin + 60, yPos + 4);
      yPos += 10;
    });
    
    yPos += 20;
    
    // ===== PAYMENT SUMMARY - BEAUTIFUL CARD DESIGN =====
    doc.setFillColor(...colors.success);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(...colors.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('💳 PAYMENT SUMMARY', margin + 5, yPos + 7);
    
    yPos += 18;
    
    // Payment calculation
    const paymentAmount = booking.payment_amount || (booking.total_amount * 0.5);
    const isFullPayment = booking.payment_type === 'full';
    const balance = isFullPayment ? 0 : booking.total_amount - paymentAmount;
    
    // Beautiful payment card with border
    doc.setFillColor(...colors.white);
    doc.setDrawColor(...colors.accent);
    doc.setLineWidth(1);
    doc.roundedRect(margin, yPos, contentWidth, 40, 4, 4, 'FD');
    
    // Payment details inside card
    yPos += 10;
    doc.setTextColor(...colors.text);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    doc.text('Package Amount:', margin + 10, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`₱${booking.total_amount.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });
    
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Type: ${isFullPayment ? 'Full Payment (100%)' : 'Down Payment (50%)'}`, margin + 10, yPos);
    
    yPos += 8;
    doc.text('Amount Paid:', margin + 10, yPos);
    doc.setTextColor(...colors.success);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`₱${paymentAmount.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });
    
    if (balance > 0) {
      yPos += 8;
      doc.setTextColor(...colors.warning);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Remaining Balance:', margin + 10, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`₱${balance.toLocaleString()}`, pageWidth - margin - 10, yPos, { align: 'right' });
    }
    
    yPos += 25;
    
    // ===== PAYMENT METHOD VERIFICATION =====
    doc.setFillColor(255, 248, 225);
    doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
    doc.setDrawColor(...colors.warning);
    doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('🔐 PAYMENT VERIFICATION', margin + 5, yPos + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Method: ${paymentProof.payment_method?.toUpperCase() || 'Digital Payment'}`, margin + 5, yPos + 13);
    doc.text(`Reference: ${paymentProof.reference_number || 'System Generated'}`, margin + 5, yPos + 17);
    doc.text(`Verified: ${paymentProof.verified_at ? new Date(paymentProof.verified_at).toLocaleDateString() : 'Processing'}`, pageWidth - margin - 5, yPos + 13, { align: 'right' });
    
    yPos += 35;
    
    // ===== IMPORTANT REMINDERS =====
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'F');
    doc.setDrawColor(...colors.accent);
    doc.roundedRect(margin, yPos, contentWidth, 30, 3, 3, 'S');
    
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('📋 IMPORTANT REMINDERS', margin + 5, yPos + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const reminders = [
      '• Please bring this receipt during check-in for verification',
      `• Check-in: ${this.COMPANY_DETAILS.checkIn} | Check-out: ${this.COMPANY_DETAILS.checkOut}`,
      '• Contact us 24 hours prior for any changes or concerns',
      balance > 0 ? `• Balance of ₱${balance.toLocaleString()} payable upon arrival` : '• Full payment received - enjoy your stay!'
    ];
    
    reminders.forEach((reminder, index) => {
      doc.text(reminder, margin + 5, yPos + 15 + (index * 4));
    });
    
    // ===== BEAUTIFUL FOOTER =====
    const footerY = pageHeight - 30;
    
    // Footer separator line
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Thank you message
    doc.setTextColor(...colors.text);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for choosing Kampo Ibayo Resort! 🌿', pageWidth / 2, footerY + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${this.COMPANY_DETAILS.phone} • ${this.COMPANY_DETAILS.email}`, pageWidth / 2, footerY + 12, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.text);
    doc.text(`Generated on ${new Date().toLocaleString()} via Kampo Ibayo Booking System`, pageWidth / 2, footerY + 18, { align: 'center' });
    
    // Reschedule indicator if applicable
    if (receiptNumber.includes('KIR-R')) {
      doc.setFillColor(255, 165, 0);
      doc.roundedRect(pageWidth - 65, 65, 55, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('📅 RESCHEDULED', pageWidth - 37.5, 70, { align: 'center' });
    }
    
    return doc;
  }

  /**
   * Generate receipt data from booking information
   */
  static async generateReceiptData(bookingId: number, userEmail: string, userName: string): Promise<ReceiptData | null> {
    try {
      // Note: In real implementation, you would fetch from Supabase
      // For now, we're returning a structure that the calling code expects
      const receiptNumber = this.generateReceiptNumber(bookingId);
      const generatedAt = new Date().toISOString();
      
      return {
        booking: {} as Booking,
        paymentProof: {} as PaymentProof,
        userEmail,
        userName,
        receiptNumber,
        generatedAt,
        companyDetails: this.COMPANY_DETAILS
      };
    } catch (error) {
      console.error('Error generating receipt data:', error);
      return null;
    }
  }

  /**
   * Download PDF receipt
   */
  static downloadReceipt(receiptData: ReceiptData): void {
    try {
      const pdf = this.generatePDFReceipt(receiptData);
      const fileName = `Kampo-Ibayo-Receipt-${receiptData.receiptNumber}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      throw new Error('Failed to download receipt');
    }
  }

  /**
   * Generate PDF as blob for email attachment
   */
  static generateReceiptBlob(receiptData: ReceiptData): Blob {
    try {
      const pdf = this.generatePDFReceipt(receiptData);
      const pdfOutput = pdf.output('blob');
      return pdfOutput;
    } catch (error) {
      console.error('Error generating receipt blob:', error);
      throw new Error('Failed to generate receipt blob');
    }
  }

  /**
   * Validate receipt data structure
   */
  static validateReceiptData(receiptData: Partial<ReceiptData>): boolean {
    return !!(receiptData.booking && receiptData.paymentProof && receiptData.userEmail);
  }
}