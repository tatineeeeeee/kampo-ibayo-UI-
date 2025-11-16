import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
    
interface PaymentProof {
  id: number;
  booking_id: number;
  user_id: string;
  reference_number: string | null;
  payment_method: string;
  amount: number;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
  verified_at: string | null;
}

export async function GET(    
  request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { bookingId: bookingIdParam } = await params;
    const bookingId = parseInt(bookingIdParam);
    
    if (isNaN(bookingId)) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    // Get the user ID from the request headers (passed from client)
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Fetch all payment proofs for this booking by this user, ordered by upload date (newest first)
    const { data: paymentHistory, error } = await supabase
      .from('payment_proofs')
      .select(`
        id,
        booking_id,
        user_id,
        reference_number,
        payment_method,
        amount,
        status,
        admin_notes,
        uploaded_at,
        verified_at
      `)
      .eq('booking_id', bookingId)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching user payment history:', error);
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    // Calculate payment summary
    const totalPaid = (paymentHistory as PaymentProof[] || [])
      .filter((proof: PaymentProof) => proof.status === 'verified')
      .reduce((sum: number, proof: PaymentProof) => sum + proof.amount, 0);
    
    const pendingAmount = (paymentHistory as PaymentProof[] || [])
      .filter((proof: PaymentProof) => proof.status === 'pending')
      .reduce((sum: number, proof: PaymentProof) => sum + proof.amount, 0);

    // Format the payment history data for user display
    const formattedHistory = (paymentHistory as PaymentProof[] || []).map((proof: PaymentProof, index: number) => ({
      id: proof.id,
      attemptNumber: paymentHistory!.length - index, // Show Attempt #1, #2, #3... for chronological order
      amount: proof.amount,
      paymentMethod: proof.payment_method,
      referenceNumber: proof.reference_number,
      status: proof.status,
      uploadedAt: proof.uploaded_at,
      verifiedAt: proof.verified_at,
      adminNotes: proof.admin_notes,
      isLatest: index === 0 // Mark the most recent submission
    }));

    return NextResponse.json({ 
      success: true,
      bookingId,
      paymentSummary: {
        totalPaid,
        pendingAmount,
        totalSubmissions: formattedHistory.length
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