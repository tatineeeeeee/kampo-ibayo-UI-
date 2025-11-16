import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../utils/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId: bookingIdParam } = await params;
    const bookingId = parseInt(bookingIdParam);
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Fetch booking details to get total amount
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('total_amount')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('Error fetching booking details:', bookingError);
      return NextResponse.json({ error: 'Failed to fetch booking details' }, { status: 500 });
    }

    // Fetch all payment proofs for this booking, ordered by upload date (newest first)
    const { data: paymentHistory, error } = await supabaseAdmin
      .from('payment_proofs')
      .select(`
        id,
        booking_id,
        user_id,
        proof_image_url,
        reference_number,
        payment_method,
        amount,
        status,
        admin_notes,
        uploaded_at,
        verified_at
      `)
      .eq('booking_id', bookingId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    // Calculate payment summary
    const totalPaid = (paymentHistory || [])
      .filter(proof => proof.status === 'verified')
      .reduce((sum, proof) => sum + proof.amount, 0);
    
    const pendingAmount = (paymentHistory || [])
      .filter(proof => proof.status === 'pending')
      .reduce((sum, proof) => sum + proof.amount, 0);
    
    const totalAmount = booking?.total_amount || 0;
    const remainingBalance = totalAmount - totalPaid - pendingAmount;

    // Format the payment history data for display
    const formattedHistory = (paymentHistory || []).map((proof, index) => ({
      id: proof.id,
      sequenceNumber: paymentHistory!.length - index, // Show 1, 2, 3... for chronological order
      amount: proof.amount,
      paymentMethod: proof.payment_method,
      referenceNumber: proof.reference_number,
      status: proof.status,
      uploadedAt: proof.uploaded_at,
      verifiedAt: proof.verified_at,
      adminNotes: proof.admin_notes,
      proofImageUrl: proof.proof_image_url,
      isLatest: index === 0 // Mark the most recent submission
    }));

    return NextResponse.json({ 
      success: true,
      bookingId,
      totalSubmissions: formattedHistory.length,
      paymentSummary: {
        totalAmount,
        totalPaid,
        pendingAmount,
        remainingBalance: Math.max(0, remainingBalance) // Ensure no negative balance
      },
      paymentHistory: formattedHistory
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}