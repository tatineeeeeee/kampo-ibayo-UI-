import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReactPdfReceiptService } from '../../../utils/reactPdfReceiptService';

export async function POST(request: NextRequest) {
  console.log('🚀 PDF Download API - Starting receipt generation with React-PDF...');
  console.log('📊 Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL,
    REACT_PDF_MIGRATION: 'v2.0',
    timestamp: new Date().toISOString()
  });

  try {
    const { bookingId, userEmail, userName } = await request.json();

    // Validate required fields
    if (!bookingId || !userEmail || !userName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId, userEmail, userName'
      }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return NextResponse.json({
        success: false,
        error: 'Booking not found or access denied'
      }, { status: 404 });
    }

    // Security: Verify booking belongs to requesting user or is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json({
        success: false,
        error: 'Receipt only available for confirmed bookings'
      }, { status: 403 });
    }

    // Fetch verified payment proof
    const { data: paymentProofs, error: paymentError } = await supabase
      .from('payment_proofs')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('status', 'verified')
      .order('verified_at', { ascending: false })
      .limit(1);

    if (paymentError) {
      console.error('Payment proof fetch error:', paymentError);
      return NextResponse.json({
        success: false,
        error: 'Error fetching payment proof'
      }, { status: 500 });
    }

    if (!paymentProofs || paymentProofs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No verified payment found for this booking'
      }, { status: 404 });
    }

    const paymentProof = paymentProofs[0];

    // Check if booking has been rescheduled by comparing created_at with updated_at
    const isRescheduled = booking.updated_at &&
      new Date(booking.updated_at).getTime() > new Date(booking.created_at).getTime() + (5 * 60 * 1000); // 5 min buffer

    // Generate receipt data with reschedule detection
    const receiptNumber = ReactPdfReceiptService.generateReceiptNumber(bookingId, isRescheduled);
    const receiptData = {
      booking,
      paymentProof,
      userEmail,
      userName,
      receiptNumber,
      generatedAt: new Date().toISOString(),
      companyDetails: {
        name: 'Kampo Ibayo Resort',
        address: 'Brgy. Tapia, General Trias, Cavite',
        phone: '+63 966 281 5123',
        email: 'kampoibayo@gmail.com'
      }
    };

    // Validate receipt data
    if (!ReactPdfReceiptService.validateReceiptData(receiptData)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid receipt data'
      }, { status: 400 });
    }

    console.log('📄 Starting PDF generation process...');
    console.log('🔍 Receipt data validation passed');
    console.log('🛠️ Calling ReactPdfReceiptService.generatePDFReceipt...');

    // Generate PDF with React-PDF (Vercel optimized)
    const pdfBuffer = await ReactPdfReceiptService.generatePDFReceipt(receiptData);

    console.log('✅ PDF generation completed successfully!');
    console.log('📊 PDF buffer size:', pdfBuffer.length, 'bytes');
    console.log('🔍 PDF buffer type:', typeof pdfBuffer);

    // Check if we got the fallback PDF (jsPDF is typically smaller)
    if (pdfBuffer.length < 50000) {
      console.log('⚠️ WARNING: Unusually small PDF size from React-PDF');
    } else {
      console.log('🎉 SUCCESS: React-PDF generated successfully (high quality)');
    }

    // Return PDF as downloadable response  
    const uint8Array = new Uint8Array(pdfBuffer);
    const response = new NextResponse(uint8Array);
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set('Content-Disposition', `attachment; filename="Kampo-Ibayo-Receipt-${receiptNumber}.pdf"`);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;

  } catch (error) {
    console.error('Error downloading receipt:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate receipt for download'
    }, { status: 500 });
  }
}