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
        payment_amount,
        payment_type,
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

    // Step 3: Get ALL payment proofs (don't limit to latest)
    const allProofsByBookingId = new Map<number, Tables<'payment_proofs'>[]>();
    paymentProofs.forEach((proof) => {
      if (!allProofsByBookingId.has(proof.booking_id)) {
        allProofsByBookingId.set(proof.booking_id, []);
      }
      allProofsByBookingId.get(proof.booking_id)!.push(proof);
    });

    // Step 4: Transform bookings with consolidated payment data (ONE ROW PER BOOKING)
    const payments: any[] = [];
    
    bookings.forEach((booking) => {
      const proofs = allProofsByBookingId.get(booking.id) || [];
      
      // Debug logging for payment type issues
      if (!booking.payment_type) {
        console.log(`⚠️ Missing payment_type for booking ${booking.id}:`, {
          id: booking.id,
          payment_type: booking.payment_type,
          payment_amount: booking.payment_amount,
          total_amount: booking.total_amount
        });
      }
      
      // Separate payment types
      const originalProof = proofs.find(p => p.payment_method !== 'cash_on_arrival') || null;
      const balanceProof = proofs.find(p => p.payment_method === 'cash_on_arrival') || null;
      const allProofs = proofs.map((proof, index) => ({
        id: proof.id,
        amount: proof.amount,
        reference_number: proof.reference_number,
        payment_method: proof.payment_method,
        status: proof.status,
        uploaded_at: proof.uploaded_at,
        verified_at: proof.verified_at,
        admin_notes: proof.admin_notes,
        sequence: index + 1
      }));
      
      // Calculate consolidated amounts and status
      const totalPaidAmount = proofs
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0);
      const hasPendingProofs = proofs.some(p => p.status === 'pending');
      const hasRejectedProofs = proofs.some(p => p.status === 'rejected');
      
      // Determine overall booking status
      let consolidatedStatus = 'pending';
      if (totalPaidAmount >= (booking.total_amount || 0)) {
        consolidatedStatus = 'paid';
      } else if (originalProof && originalProof.status === 'verified') {
        consolidatedStatus = 'partially_paid';
      } else if (hasPendingProofs) {
        consolidatedStatus = 'pending';
      } else if (hasRejectedProofs) {
        consolidatedStatus = 'needs_resubmission';
      }
      
      // Create single consolidated entry per booking
      payments.push({
        id: booking.id,
        user: booking.guest_name || booking.guest_email || 'Unknown User',
        email: booking.guest_email,
        amount: totalPaidAmount || booking.payment_amount || booking.total_amount || 0,
        date: booking.created_at ? new Date(booking.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : 'N/A',
        status: consolidatedStatus,
        payment_intent_id: booking.payment_intent_id,
        booking_status: booking.status,
        payment_status: booking.payment_status,
        
        // Original payment reference
        original_reference: originalProof?.reference_number || null,
        original_method: originalProof?.payment_method || null,
        original_amount: originalProof?.amount || null,
        original_status: originalProof?.status || null,
        
        // Balance payment reference  
        balance_reference: balanceProof?.reference_number || null,
        balance_method: balanceProof?.payment_method || null,
        balance_amount: balanceProof?.amount || null,
        balance_status: balanceProof?.status || null,
        
        booking_id: booking.id,
        verified_at: originalProof?.verified_at || balanceProof?.verified_at || null,
        verified_by: originalProof?.verified_by || balanceProof?.verified_by || null,
        admin_notes: originalProof?.admin_notes || balanceProof?.admin_notes || null,
        has_payment_proof: proofs.length > 0,
        payment_type: booking.payment_type || 'full',
        total_amount: booking.total_amount,
        updated_at: booking.updated_at,
        total_proofs: proofs.length,
        all_payment_proofs: allProofs, // Include all proofs for modal display
        payment_proof_id: originalProof?.id || proofs[0]?.id || null
      });
    });

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
      bookings_count: bookings.length,
      payment_proofs_count: paymentProofs.length
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Helper function to determine display status for bookings
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

