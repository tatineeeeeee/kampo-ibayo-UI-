import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../supabaseClient';

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;

interface RefundRequest {
  bookingId: number;
  reason: string;
  refundType: 'full' | 'partial';
  refundAmount?: number; // For partial refunds
  processedBy: 'user' | 'admin';
}

export async function POST(request: NextRequest) {
  try {
    const body: RefundRequest = await request.json();
    const { bookingId, reason, refundType, refundAmount, processedBy } = body;

    if (!bookingId || !reason || !refundType) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, reason, refundType' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if payment was made and can be refunded
    if (booking.payment_status !== 'paid' || !booking.payment_intent_id) {
      return NextResponse.json(
        { error: 'No valid payment found to refund' },
        { status: 400 }
      );
    }

    // Calculate refund amount based on type and cancellation policy
    let finalRefundAmount: number;
    
    if (refundType === 'full') {
      finalRefundAmount = booking.total_amount;
    } else if (refundType === 'partial' && refundAmount) {
      finalRefundAmount = refundAmount;
    } else {
      // Apply cancellation policy based on check-in date
      finalRefundAmount = calculateRefundAmount(booking);
    }

    // PayMongo has amount limits in TEST MODE ONLY - check if refund amount is within limits
    const PAYMONGO_TEST_MAX_AMOUNT = 4500; // ₱4,500 maximum for TEST MODE ONLY
    const refundAmountInCentavos = finalRefundAmount * 100;
    
    if (refundAmountInCentavos > 450000) { // 4500 * 100
      console.log(`⚠️ Refund amount ₱${finalRefundAmount} exceeds PayMongo TEST MODE limit of ₱${PAYMONGO_TEST_MAX_AMOUNT}`);
      
      // For amounts above the TEST MODE limit, we'll handle it differently
      if (finalRefundAmount > PAYMONGO_TEST_MAX_AMOUNT) {
        return NextResponse.json({
          error: 'Refund amount exceeds payment processor TEST MODE limit',
          message: `Refund amount of ₱${finalRefundAmount.toLocaleString()} exceeds the TEST MODE limit of ₱${PAYMONGO_TEST_MAX_AMOUNT.toLocaleString()}. Switch to LIVE MODE for your ₱9K-₱12K bookings, or process this refund manually in the PayMongo dashboard.`,
          booking_id: bookingId,
          refund_amount: finalRefundAmount,
          max_amount: PAYMONGO_TEST_MAX_AMOUNT,
          requires_manual_processing: true,
          note: 'This limit only applies to PayMongo test mode. Live mode supports your full booking amounts.'
        }, { status: 400 });
      }
    }

    console.log(`💰 Processing ${refundType} refund: ₱${finalRefundAmount} (${refundAmountInCentavos} centavos) for booking #${bookingId}`);

    // First, we need to get the actual payment ID from the payment intent
    console.log('🔍 Fetching payment intent details to get payment ID...');
    
    try {
      const paymentIntentResponse = await fetch(`https://api.paymongo.com/v1/payment_intents/${booking.payment_intent_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!paymentIntentResponse.ok) {
        console.error('❌ Failed to fetch payment intent details');
        return NextResponse.json(
          { error: 'Could not retrieve payment details for refund' },
          { status: 500 }
        );
      }

      const paymentIntentData = await paymentIntentResponse.json();
      const payments = paymentIntentData.data.attributes.payments;
      
      if (!payments || payments.length === 0) {
        console.error('❌ No payments found in payment intent');
        return NextResponse.json(
          { error: 'No payments found to refund' },
          { status: 400 }
        );
      }

      // Get the first successful payment ID
      const successfulPayment = payments.find((p: { id: string; attributes: { status: string } }) => p.attributes.status === 'paid');
      if (!successfulPayment) {
        console.error('❌ No successful payment found in payment intent');
        return NextResponse.json(
          { error: 'No successful payment found to refund' },
          { status: 400 }
        );
      }

      const paymentId = successfulPayment.id;
      console.log('✅ Found payment ID for refund:', paymentId);

      // Map custom reasons to valid PayMongo reasons
      let paymongoReason = 'requested_by_customer'; // Default
      
      if (reason.toLowerCase().includes('admin') || reason.toLowerCase().includes('administrator')) {
        paymongoReason = 'others';
      } else if (reason.toLowerCase().includes('duplicate')) {
        paymongoReason = 'duplicate';
      } else if (reason.toLowerCase().includes('fraud')) {
        paymongoReason = 'fraudulent';
      }

      // Process refund with PayMongo
      const refundResponse = await fetch('https://api.paymongo.com/v1/refunds', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ':').toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: refundAmountInCentavos, // Use the validated centavos amount
              payment_id: paymentId, // Use payment_id instead of payment_intent_id
              reason: paymongoReason, // Use valid PayMongo reason
              notes: reason, // Store original reason in notes
              metadata: {
                booking_id: bookingId.toString(),
                refund_type: refundType,
                processed_by: processedBy,
                original_amount: booking.total_amount,
                original_reason: reason
              }
            }
          }
        }),
      });

      const refundData = await refundResponse.json();

      if (!refundResponse.ok) {
        console.error('❌ PayMongo refund error:', refundData);
        return NextResponse.json(
          { error: 'Failed to process refund with payment provider', details: refundData },
          { status: 500 }
        );
      }

      const refund = refundData.data;
      console.log('✅ PayMongo refund successful:', refund.id);

      // Update booking with refund information
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'refunded',
          status: 'cancelled',
          refund_id: refund.id,
          refund_amount: finalRefundAmount,
          refund_status: refund.attributes.status,
          refund_reason: reason,
          refund_processed_by: processedBy,
          refund_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('❌ Error updating booking with refund info:', updateError);
        // Refund was processed but DB update failed - this needs manual intervention
        return NextResponse.json(
          { 
            success: true, 
            refund_id: refund.id, 
            warning: 'Refund processed but database update failed. Please check manually.',
            refund_amount: finalRefundAmount
          }
        );
      }

      return NextResponse.json({
        success: true,
        refund_id: refund.id,
        refund_amount: finalRefundAmount,
        refund_status: refund.attributes.status,
        message: `Refund of ₱${finalRefundAmount.toLocaleString()} has been processed successfully. It will appear in your account within 5-10 business days.`
      });

    } catch (paymentIntentError) {
      console.error('❌ Error fetching payment intent or processing refund:', paymentIntentError);
      return NextResponse.json(
        { error: 'Could not process refund. Please try again or contact support.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Refund processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Calculate refund amount based on cancellation policy (down payment system)
function calculateRefundAmount(booking: { total_amount: number; check_in_date: string }): number {
  const checkInDate = new Date(booking.check_in_date);
  const now = new Date();
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // Down payment is 50% of total amount
  const downPayment = booking.total_amount * 0.5;
  
  // New cancellation policy:
  // - More than 48 hours: 100% down payment refund
  // - 24-48 hours: 50% down payment refund
  // - Less than 24 hours: No refund (contact resort directly)
  
  if (hoursUntilCheckIn >= 48) {
    return downPayment; // 100% of down payment
  } else if (hoursUntilCheckIn >= 24) {
    return Math.round(downPayment * 0.5); // 50% of down payment
  } else {
    return 0; // No refund - must contact resort
  }
}