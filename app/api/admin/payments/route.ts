import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../utils/supabaseAdmin';
import { Tables } from '../../../../database.types';

export async function GET() {
  try {
    // Step 1: Get all bookings (main data source)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        total_amount,
        payment_status,
        payment_intent_id,
        created_at,
        updated_at,
        status,
        guest_name,
        guest_email
      `)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Step 2: Get all payment proofs (enhancement data)
    let paymentProofs: Tables<'payment_proofs'>[] = [];
    try {
      const { data: proofsData, error: proofsError } = await supabaseAdmin
        .from('payment_proofs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (proofsError) {
        paymentProofs = [];
      } else {
        paymentProofs = proofsData || [];
      }
    } catch {
      paymentProofs = [];
    }

    // Step 3: Create efficient lookup map (latest proof per booking)
    const proofsByBookingId = new Map<number, Tables<'payment_proofs'>>();
    paymentProofs.forEach((proof) => {
      // Only keep the first (latest) proof for each booking due to ordering
      if (!proofsByBookingId.has(proof.booking_id)) {
        proofsByBookingId.set(proof.booking_id, proof);
      }
    });

    // Step 4: Transform bookings with proof data
    const payments = bookings.map((booking) => {
      const proof = proofsByBookingId.get(booking.id);
      
      return {
        id: booking.id,
        user: booking.guest_name || booking.guest_email || 'Unknown User',
        email: booking.guest_email,
        amount: booking.total_amount || 0,
        date: new Date(booking.created_at || '').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        status: getPaymentDisplayStatus(booking.payment_status, booking.status, proof),
        payment_intent_id: booking.payment_intent_id,
        booking_status: booking.status,
        payment_status: booking.payment_status,
        reference_number: proof?.reference_number || null,
        payment_method: proof?.payment_method || (booking.payment_intent_id ? 'PayMongo' : null),
        booking_id: booking.id,
        verified_at: proof?.verified_at || null,
        verified_by: proof?.verified_by || null,
        admin_notes: proof?.admin_notes || null,
        has_payment_proof: !!proof,
        updated_at: booking.updated_at
      };
    });

    return NextResponse.json({ payments });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// SAFE Helper function to determine display status for bookings
function getPaymentDisplayStatus(paymentStatus: string | null, bookingStatus: string | null, proof?: Tables<'payment_proofs'>): string {
  // PRIORITY 1: If manual payment proof exists, use its status
  if (proof) {
    if (proof.status === 'verified') return 'paid';
    if (proof.status === 'pending') return 'pending';
    if (proof.status === 'rejected') return 'cancelled';
  }
  
  // PRIORITY 2: PayMongo payment status (legacy)
  if (paymentStatus === 'paid') return 'paid';
  if (paymentStatus === 'processing') return 'pending';
  if (paymentStatus === 'pending') return 'pending';
  if (paymentStatus === 'failed') return 'cancelled';
  if (paymentStatus === 'refunded') return 'cancelled';
  
  // PRIORITY 3: Fallback to booking status
  if (bookingStatus === 'confirmed') return 'paid';
  if (bookingStatus === 'cancelled') return 'cancelled';
  if (bookingStatus === 'pending') return 'pending';
  if (bookingStatus === 'completed') return 'paid';
  
  return 'pending';
}

