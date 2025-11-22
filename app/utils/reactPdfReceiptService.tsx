import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

// Receipt data interface
export interface Booking {
  id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  payment_amount?: number;
  payment_type?: string;
}

export interface PaymentProof {
  payment_method: string;
  reference_number: string;
  payment_date: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  facebook?: string;
}

export interface ReceiptData {
  booking: Booking;
  paymentProof: PaymentProof;
  userEmail: string;
  userName: string;
  receiptNumber: string;
  generatedAt: string;
  companyDetails: CompanyDetails;
}

// Create luxury receipt styles matching the premium design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  
  // Luxury header with dark blue/black background
  header: {
    backgroundColor: '#1e293b', // Dark slate background
    color: '#ffffff',
    padding: 25,
    textAlign: 'center',
    position: 'relative',
  },
  
  // Logo placeholder (using text for now since React-PDF has image limitations)
  logoSection: {
    marginBottom: 15,
    alignItems: 'center',
  },
  
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f59e0b', // Gold color
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  companyName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f59e0b', // Gold color matching your design
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  
  tagline: {
    fontSize: 12,
    color: '#cbd5e1', // Light gray
    marginBottom: 8,
    fontStyle: 'italic',
  },
  
  headerAddress: {
    fontSize: 10,
    color: '#94a3b8', // Muted gray
    lineHeight: 1.3,
  },
  
  // Main content area
  content: {
    padding: 30,
  },
  
  // Receipt title section
  titleSection: {
    textAlign: 'center',
    marginBottom: 25,
    paddingBottom: 15,
    borderBottom: '1 solid #e2e8f0',
  },
  
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  
  receiptNumber: {
    fontSize: 11,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '6 12',
    borderRadius: 4,
  },
  
  // Two-column layout for booking and payment info
  columnsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  
  column: {
    width: '48%',
    marginRight: '4%',
  },
  
  columnLast: {
    width: '48%',
    marginRight: 0,
  },
  
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: '2 solid #f59e0b', // Gold underline
  },
  
  // Data rows
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'flex-start',
  },
  
  label: {
    width: '45%',
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.4,
  },
  
  value: {
    width: '55%',
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
    lineHeight: 1.4,
  },
  
  // Status badge
  statusContainer: {
    alignItems: 'flex-start',
    width: '55%',
  },
  
  statusBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  // Payment summary section with golden border
  summarySection: {
    backgroundColor: '#fffbeb', // Light gold background
    border: '2 solid #f59e0b', // Gold border
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottom: '1 solid #f59e0b',
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottom: '1 solid #fef3c7',
  },
  
  summaryLabel: {
    fontSize: 12,
    color: '#92400e', // Dark gold
    fontWeight: 'normal',
  },
  
  summaryValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  
  // Total amount - highlighted
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingTop: 15,
    borderTop: '3 solid #f59e0b',
    marginTop: 10,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 15,
    marginHorizontal: -15,
    borderRadius: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  totalValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Footer styles
  footer: {
    marginTop: 40,
    textAlign: 'center',
    borderTop: '1 solid #e2e8f0',
    paddingTop: 20,
  },
  
  thankYou: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
  },
  
  disclaimer: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 15,
    lineHeight: 1.4,
    textAlign: 'center',
  },
  
  contact: {
    fontSize: 9,
    color: '#94a3b8',
    lineHeight: 1.3,
    textAlign: 'center',
  },
});

// Luxury Receipt Document Component
const ReceiptDocument = ({ data }: { data: ReceiptData }) => {
  const formatCurrency = (amount: number) => `₱${amount.toLocaleString()}`;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Luxury Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>KI</Text>
            </View>
          </View>
          
          <Text style={styles.companyName}>Kampo Ibayo Resort</Text>
          <Text style={styles.tagline}>Luxury • Tranquility • Excellence</Text>
          <Text style={styles.headerAddress}>
            Brgy. Tapia, General Trias, Cavite{'\n'}
            +63 966 281 5123 • kampoibayo@gmail.com
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Payment Receipt</Text>
            <View style={styles.receiptNumber}>
              <Text>Receipt #{data.receiptNumber}</Text>
            </View>
          </View>

          {/* Two-column layout matching your design */}
          <View style={styles.columnsContainer}>
            {/* Left Column - Booking Details */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Booking ID:</Text>
                <Text style={styles.value}>#{data.booking.id}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Guest Name:</Text>
                <Text style={styles.value}>{data.userName}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{data.userEmail}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Check-in:</Text>
                <Text style={styles.value}>{formatDate(data.booking.check_in_date)}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Check-out:</Text>
                <Text style={styles.value}>{formatDate(data.booking.check_out_date)}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Guests:</Text>
                <Text style={styles.value}>{data.booking.number_of_guests}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Status:</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusBadge}>
                    <Text>CONFIRMED</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column - Payment Information */}
            <View style={styles.columnLast}>
              <Text style={styles.sectionTitle}>Payment Information</Text>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Payment Method:</Text>
                <Text style={styles.value}>{data.paymentProof.payment_method}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Reference Number:</Text>
                <Text style={styles.value}>{data.paymentProof.reference_number}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Payment Date:</Text>
                <Text style={styles.value}>{formatDate(data.paymentProof.payment_date)}</Text>
              </View>
              
              <View style={styles.dataRow}>
                <Text style={styles.label}>Receipt Generated:</Text>
                <Text style={styles.value}>{formatDate(data.generatedAt)}</Text>
              </View>
            </View>
          </View>

          {/* Payment Summary - Golden Bordered Box */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Accommodation:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.booking.total_amount)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee:</Text>
              <Text style={styles.summaryValue}>₱0.00</Text>
            </View>
            
            {/* Highlighted Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid:</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.booking.payment_amount || data.booking.total_amount)}</Text>
            </View>
          </View>

          {/* Elegant Footer */}
          <View style={styles.footer}>
            <Text style={styles.thankYou}>Thank You for Choosing Kampo Ibayo Resort!</Text>
            <Text style={styles.disclaimer}>
              We appreciate your trust in our services. This receipt serves as confirmation of your payment.{'\n'}
              For any inquiries, please contact us during business hours.
            </Text>
            <Text style={styles.contact}>
              Hours: 8:00 AM - 8:00 PM Daily | Check-in: 3:00 PM | Check-out: 1:00 PM{'\n'}
              Follow us: Kampo Ibayo (Facebook)
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export class ReactPdfReceiptService {
  /**
   * Generate receipt number
   */
  static generateReceiptNumber(bookingId: string, isRescheduled: boolean = false): string {
    const prefix = 'KIR';
    const timestamp = Date.now();
    const rescheduleFlag = isRescheduled ? 'R' : '';
    return `${prefix}-${timestamp}-${bookingId}${rescheduleFlag}`;
  }

  /**
   * Validate receipt data
   */
  static validateReceiptData(data: ReceiptData): boolean {
    return !!(
      data &&
      data.booking &&
      data.paymentProof &&
      data.userEmail &&
      data.userName &&
      data.receiptNumber
    );
  }

  /**
   * Generate PDF receipt using React-PDF (Vercel optimized)
   */
  static async generatePDFReceipt(data: ReceiptData): Promise<Buffer> {
    try {
      console.log('🚀 Starting React-PDF generation...');
      console.log('📊 Environment check:', {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        platform: process.platform
      });

      // Generate PDF using React-PDF
      const pdfDocument = <ReceiptDocument data={data} />;
      
      // Create blob and convert to buffer
      const pdfBlob = await pdf(pdfDocument).toBlob();
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const pdfBuffer = Buffer.from(arrayBuffer);

      console.log('✅ React-PDF generation successful!');
      console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');
      
      return pdfBuffer;

    } catch (error) {
      console.error('🚨 REACT-PDF GENERATION FAILED:', error);
      throw new Error(`React-PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate receipt blob (alias for compatibility)
   */
  static async generateReceiptBlob(data: ReceiptData): Promise<Buffer> {
    return await this.generatePDFReceipt(data);
  }
}