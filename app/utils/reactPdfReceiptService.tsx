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

// Create styles that match your luxury design
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 0,
    fontFamily: 'Helvetica',
  },
  header: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    padding: 30,
    textAlign: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 15,
    alignSelf: 'center',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
  },
  address: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  content: {
    padding: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1e293b',
  },
  receiptNumber: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
    color: '#64748b',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1e293b',
    borderBottom: '2 solid #e2e8f0',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: '1 solid #f1f5f9',
  },
  label: {
    width: '40%',
    fontSize: 11,
    color: '#64748b',
  },
  value: {
    width: '60%',
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 'bold',
  },
  summarySection: {
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTop: '2 solid #e2e8f0',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
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
  },
  contact: {
    fontSize: 9,
    color: '#94a3b8',
    lineHeight: 1.3,
  },
});

// React-PDF Document Component
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>KAMPO IBAYO RESORT</Text>
          <Text style={styles.tagline}>Luxury • Tranquility • Excellence</Text>
          <Text style={styles.address}>
            Brgy. Tapia, General Trias, Cavite{'\n'}
            +63 966 281 5123 • kampoibayo@gmail.com
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Payment Receipt</Text>
          <Text style={styles.receiptNumber}>Receipt #{data.receiptNumber}</Text>

          {/* Booking Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Information</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Booking ID:</Text>
              <Text style={styles.value}>#{data.booking.id}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Guest Name:</Text>
              <Text style={styles.value}>{data.userName}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{data.userEmail}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Check-in:</Text>
              <Text style={styles.value}>{formatDate(data.booking.check_in_date)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Check-out:</Text>
              <Text style={styles.value}>{formatDate(data.booking.check_out_date)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Guests:</Text>
              <Text style={styles.value}>{data.booking.number_of_guests} guest(s)</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <View style={styles.statusConfirmed}>
                <Text>CONFIRMED</Text>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            
            <View style={styles.row}>
              <Text style={styles.label}>Payment Method:</Text>
              <Text style={styles.value}>{data.paymentProof.payment_method}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Reference Number:</Text>
              <Text style={styles.value}>{data.paymentProof.reference_number}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Payment Date:</Text>
              <Text style={styles.value}>{formatDate(data.paymentProof.payment_date)}</Text>
            </View>
            
            <View style={styles.row}>
              <Text style={styles.label}>Receipt Generated:</Text>
              <Text style={styles.value}>{formatDate(data.generatedAt)}</Text>
            </View>
          </View>

          {/* Payment Summary */}
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Payment Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Accommodation:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(data.booking.total_amount)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service Fee:</Text>
              <Text style={styles.summaryValue}>₱0.00</Text>
            </View>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PAID:</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.booking.payment_amount || data.booking.total_amount)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.thankYou}>Thank You for Choosing Kampo Ibayo Resort!</Text>
            <Text style={styles.disclaimer}>
              This receipt serves as confirmation of your payment.{'\n'}
              For any inquiries, contact us during business hours.
            </Text>
            <Text style={styles.contact}>
              Hours: 8:00 AM - 9:00 PM Daily | Check-in: 3:00 PM | Check-out: 1:00 PM{'\n'}
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