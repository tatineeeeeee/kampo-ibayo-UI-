/**
 * Modern HTML/CSS-based Receipt Service for Kampo Ibayo Resort
 * Uses Puppeteer for professional PDF generation with luxury design
 */
import puppeteer, { Browser } from 'puppeteer';
import { jsPDF } from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';
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

export class ModernReceiptService {
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
   * Get base64 encoded logo from public folder
   */
  private static getLogoBase64(): string {
    try {
      // Try to load icon.png first (user's preference)
      let logoPath = path.join(process.cwd(), 'public', 'icon.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }

      // Fallback to logo.png
      logoPath = path.join(process.cwd(), 'public', 'logo.png');
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${logoBuffer.toString('base64')}`;
      }

      // Fallback to a simple placeholder
      return '';
    } catch (error) {
      console.warn('Logo loading failed:', error);
      return '';
    }
  }

  /**
   * Generate luxury HTML receipt with world-class design
   */
  private static generateReceiptHTML(data: ReceiptData): string {
    const logoBase64 = this.getLogoBase64();
    const logoHtml = logoBase64 ?
      `<img src="${logoBase64}" alt="Kampo Ibayo Resort" class="logo">` :
      `<div class="logo-placeholder">KAMPO<br>IBAYO</div>`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${data.receiptNumber}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', Arial, sans-serif;
            line-height: 1.4;
            color: #2c3e50;
            background: white;
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100vh;
        }
        
        .receipt-container {
            width: 100%;
            height: 100%;
            margin: 0;
            background: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px 40px;
            position: relative;
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4af37' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
            z-index: 1;
        }
        
        .header-content {
            position: relative;
            z-index: 2;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .logo-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid rgba(212, 175, 55, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 10px;
            text-align: center;
            line-height: 1.1;
            background: rgba(212, 175, 55, 0.1);
            color: #d4af37;
        }
        
        .company-info {
            text-align: right;
            flex: 1;
            margin-left: 20px;
        }
        
        .company-name {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #d4af37;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .company-tagline {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.9);
            font-style: italic;
            margin-bottom: 8px;
        }
        
        .company-details {
            font-size: 11px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.3;
        }
        
        .main-content {
            padding: 30px 40px;
            flex: 1;
        }
        
        .receipt-title {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .receipt-title h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
        }
        
        .receipt-number {
            font-size: 14px;
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 25px;
            margin-bottom: 25px;
        }
        
        .info-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-top: 3px solid #d4af37;
        }
        
        .info-section h3 {
            font-family: 'Playfair Display', serif;
            font-size: 16px;
            color: #2c3e50;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 6px;
            padding: 1px 0;
        }
        
        .info-label {
            color: #7f8c8d;
            font-weight: 500;
            font-size: 12px;
        }
        
        .info-value {
            color: #2c3e50;
            font-weight: 600;
            text-align: right;
            font-size: 12px;
        }
        
        .payment-summary {
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 2px solid #d4af37;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .summary-title {
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            color: #2c3e50;
            text-align: center;
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #ecf0f1;
            font-size: 14px;
        }
        
        .amount-row:last-child {
            border-bottom: none;
            margin-top: 8px;
            padding-top: 15px;
            border-top: 2px solid #d4af37;
        }
        
        .amount-label {
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .amount-value {
            font-weight: 600;
            color: #2c3e50;
        }
        
        .total-amount {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            font-weight: 700;
            color: #d4af37;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            border-top: 1px solid #ecf0f1;
            width: 100%;
            box-sizing: border-box;
        }
        
        .thank-you {
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 10px;
            font-weight: 600;
        }
        
        .footer-note {
            color: #7f8c8d;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .contact-info {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #ecf0f1;
            color: #95a5a6;
            font-size: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-confirmed {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffeaa7;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .receipt-container {
                box-shadow: none;
                border: none;
                border-radius: 0;
            }
            
            .header::before {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="header-content">
                ${logoHtml}
                <div class="company-info">
                    <div class="company-name">Kampo Ibayo Resort</div>
                    <div class="company-tagline">Luxury • Tranquility • Excellence</div>
                    <div class="company-details">
                        ${this.COMPANY_DETAILS.address}<br>
                        ${this.COMPANY_DETAILS.phone} • ${this.COMPANY_DETAILS.email}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="main-content">
            <div class="receipt-title">
                <h1>Payment Receipt</h1>
                <div class="receipt-number">Receipt #${data.receiptNumber}</div>
            </div>
            
            <div class="info-grid">
                <div class="info-section">
                    <h3>Booking Details</h3>
                    <div class="info-row">
                        <span class="info-label">Booking ID:</span>
                        <span class="info-value">#${data.booking.id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Guest Name:</span>
                        <span class="info-value">${data.userName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${data.userEmail}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Check-in:</span>
                        <span class="info-value">${new Date(data.booking.check_in_date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Check-out:</span>
                        <span class="info-value">${new Date(data.booking.check_out_date).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Guests:</span>
                        <span class="info-value">${data.booking.number_of_guests} guest${data.booking.number_of_guests !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="status-badge ${data.booking.status === 'confirmed' ? 'status-confirmed' : 'status-pending'}">
                                ${data.booking.status}
                            </span>
                        </span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Payment Information</h3>
                    <div class="info-row">
                        <span class="info-label">Payment Method:</span>
                        <span class="info-value">${data.paymentProof.payment_method}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Reference Number:</span>
                        <span class="info-value">${data.paymentProof.reference_number || 'N/A'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment Date:</span>
                        <span class="info-value">${new Date(data.paymentProof.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Receipt Generated:</span>
                        <span class="info-value">${data.generatedAt}</span>
                    </div>
                </div>
            </div>
            
            <div class="payment-summary">
                <div class="summary-title">Payment Summary</div>
                <div class="amount-row">
                    <span class="amount-label">Accommodation:</span>
                    <span class="amount-value">₱${data.booking.total_amount.toLocaleString()}</span>
                </div>
                <div class="amount-row">
                    <span class="amount-label">Service Fee:</span>
                    <span class="amount-value">₱0.00</span>
                </div>
                <div class="amount-row">
                    <span class="amount-label total-amount">Total Paid:</span>
                    <span class="amount-value total-amount">₱${data.booking.total_amount.toLocaleString()}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <div class="thank-you">Thank You for Choosing Kampo Ibayo Resort!</div>
            <div class="footer-note">
                We appreciate your trust in our services. This receipt serves as confirmation of your payment.<br>
                For any inquiries, please contact us during business hours.
            </div>
            <div class="contact-info">
                Hours: ${this.COMPANY_DETAILS.hours} | Check-in: ${this.COMPANY_DETAILS.checkIn} | Check-out: ${this.COMPANY_DETAILS.checkOut}<br>
                Follow us: ${this.COMPANY_DETAILS.facebook}
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate luxury PDF using jsPDF as fallback
   */
  private static generateLuxuryFallbackPDF(data: ReceiptData): Buffer {
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    // Set luxury colors
    const goldColor: [number, number, number] = [212, 175, 55];
    const darkBlue: [number, number, number] = [44, 62, 80];
    const lightGray: [number, number, number] = [248, 249, 250];

    // Header background - full width
    pdf.setFillColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    pdf.rect(0, 0, 210, 55, 'F');

    // Gold accent line - full width
    pdf.setFillColor(...goldColor);
    pdf.rect(0, 53, 210, 2, 'F');

    // Company name (luxury font style)
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(26);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KAMPO IBAYO RESORT', 25, 24);

    // Tagline
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text('Luxury • Tranquility • Excellence', 25, 34);

    // Company details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(this.COMPANY_DETAILS.address, 25, 42);
    pdf.text(`${this.COMPANY_DETAILS.phone} • ${this.COMPANY_DETAILS.email}`, 25, 48);

    // Receipt title
    pdf.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Receipt', 25, 70);

    // Receipt number
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Receipt #${data.receiptNumber}`, 25, 78);

    // Booking details box - full width
    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.rect(10, 85, 190, 75, 'F');
    pdf.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(10, 85, 190, 75);

    // Section titles
    pdf.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Booking Information', 25, 97);
    pdf.text('Payment Information', 115, 97);

    // Booking details
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const bookingInfo = [
      [`Booking ID:`, `#${data.booking.id}`],
      [`Guest Name:`, data.userName],
      [`Email:`, data.userEmail],
      [`Check-in:`, new Date(data.booking.check_in_date).toLocaleDateString()],
      [`Check-out:`, new Date(data.booking.check_out_date).toLocaleDateString()],
      [`Guests:`, `${data.booking.number_of_guests} guest${data.booking.number_of_guests !== 1 ? 's' : ''}`],
      [`Status:`, (data.booking.status || 'pending').toUpperCase()]
    ];

    bookingInfo.forEach(([label, value], index) => {
      pdf.setTextColor(127, 140, 141);
      pdf.text(label, 25, 105 + (index * 7));
      pdf.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
      pdf.text(value, 70, 105 + (index * 7));
    });

    // Payment details
    const paymentInfo = [
      [`Payment Method:`, data.paymentProof.payment_method],
      [`Reference:`, data.paymentProof.reference_number || 'N/A'],
      [`Payment Date:`, new Date(data.paymentProof.created_at).toLocaleDateString()],
      [`Generated:`, data.generatedAt]
    ];

    paymentInfo.forEach(([label, value], index) => {
      pdf.setTextColor(127, 140, 141);
      pdf.text(label, 115, 105 + (index * 7));
      pdf.setTextColor(...darkBlue);
      pdf.text(value, 160, 105 + (index * 7));
    });

    // Payment summary box - full width
    pdf.setFillColor(...goldColor);
    pdf.rect(10, 170, 190, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payment Summary', 25, 185);

    // Amount details
    pdf.setFontSize(12);
    pdf.text(`Accommodation: ₱${data.booking.total_amount.toLocaleString()}`, 25, 193);
    pdf.text(`Service Fee: ₱0.00`, 25, 199);
    
    // Total
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`TOTAL PAID: ₱${data.booking.total_amount.toLocaleString()}`, 25, 207);

    // Footer
    pdf.setTextColor(...darkBlue);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Thank You for Choosing Kampo Ibayo Resort!', 25, 225);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This receipt serves as confirmation of your payment.', 25, 233);
    pdf.text('For inquiries, contact us during business hours.', 25, 239);

    // Contact info
    pdf.setFontSize(8);
    pdf.setTextColor(127, 140, 141);
    pdf.text(`Hours: ${this.COMPANY_DETAILS.hours} | Check-in: ${this.COMPANY_DETAILS.checkIn} | Check-out: ${this.COMPANY_DETAILS.checkOut}`, 25, 250);
    pdf.text(`Follow us: ${this.COMPANY_DETAILS.facebook}`, 25, 255);    return Buffer.from(pdf.output('arraybuffer'));
  }

  /**
   * Generate PDF receipt with Puppeteer (primary method)
   */
  static async generatePDFReceipt(data: ReceiptData): Promise<Buffer> {
    let browser: Browser | null = null;

    try {
      console.log('Starting Puppeteer PDF generation...');

      // Launch browser with Windows-optimized settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection'
        ],
        timeout: 30000
      });

      const page = await browser.newPage();

      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      // Generate and set HTML content
      const html = this.generateReceiptHTML(data);
      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 20000
      });

      // Wait for fonts to load
      await page.evaluate(() => {
        return Promise.all([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 1000))
        ]);
      });

      // Generate PDF with luxury settings
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm'
        },
        printBackground: true,
        preferCSSPageSize: false,
        timeout: 30000
      });

      console.log('Puppeteer PDF generated successfully');
      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('Puppeteer PDF generation failed:', error);
      console.log('Falling back to luxury jsPDF implementation...');

      // Use luxury jsPDF fallback
      return this.generateLuxuryFallbackPDF(data);

    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
    }
  }

  /**
   * Generate unique receipt number
   */
  static generateReceiptNumber(bookingId: string, isRescheduled: boolean = false): string {
    const timestamp = Date.now();
    const prefix = isRescheduled ? 'KIRR' : 'KIR'; // KIR-Rescheduled for rescheduled bookings
    return `${prefix}-${timestamp}-${bookingId}`;
  }

  /**
   * Validate receipt data before PDF generation
   */
  static validateReceiptData(data: ReceiptData): boolean {
    try {
      return !!(
        data.booking &&
        data.paymentProof &&
        data.userEmail &&
        data.userName &&
        data.receiptNumber &&
        data.generatedAt &&
        data.companyDetails &&
        data.booking.id &&
        data.booking.total_amount &&
        data.paymentProof.payment_method
      );
    } catch (error) {
      console.error('Receipt data validation failed:', error);
      return false;
    }
  }

  /**
   * Generate receipt blob (wrapper for PDF generation for blob response)
   */
  static async generateReceiptBlob(data: ReceiptData): Promise<Buffer> {
    return await this.generatePDFReceipt(data);
  }

  /**
   * Generate receipt data from booking and payment proof
   */
  static generateReceiptData(
    booking: Booking,
    paymentProof: PaymentProof,
    userEmail: string,
    userName: string
  ): ReceiptData {
    const receiptNumber = `KIR-${Date.now()}-${booking.id}`;
    const generatedAt = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      booking,
      paymentProof,
      userEmail,
      userName,
      receiptNumber,
      generatedAt,
      companyDetails: this.COMPANY_DETAILS
    };
  }
}