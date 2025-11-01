import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { proofId, action, adminId, adminNotes, rejectionReason } = await request.json();

    console.log('🔧 Server: Verifying payment proof:', { proofId, action, adminId, rejectionReason });

    // Validate input
    if (!proofId || !action || !adminId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Map actions to exact database constraint values
    // Database expects: 'pending', 'verified', 'rejected'
    const statusMap = {
      'approve': 'verified',  // Changed from 'approved' to 'verified'
      'reject': 'rejected'
    };
    
    const newStatus = statusMap[action as keyof typeof statusMap];
    console.log('📝 Server: Mapping action to status:', { action, newStatus });

    // Prepare admin notes with rejection reason if applicable
    let finalAdminNotes = adminNotes || null;
    if (action === 'reject' && rejectionReason) {
      const rejectionNote = `REJECTION REASON: ${rejectionReason}`;
      finalAdminNotes = adminNotes ? `${rejectionNote}\n\nADMIN NOTES: ${adminNotes}` : rejectionNote;
    }

    // Update payment proof with service role permissions (without verified_by field)
    console.log('💾 Server: Attempting database update with status:', newStatus);
    
    const { data: paymentProof, error: updateError } = await supabase
      .from('payment_proofs')
      .update({
        status: newStatus,
        verified_at: new Date().toISOString(),
        admin_notes: finalAdminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', proofId)
      .select('*, bookings(id, user_id, guest_email, check_in_date, check_out_date, number_of_guests, total_amount)')
      .single();
      
    console.log('💾 Server: Database update result:', { paymentProof, updateError });

    if (updateError) {
      console.error('❌ Server: Payment proof update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update payment proof: ${updateError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Server: Payment proof updated successfully');

    // Update booking status based on payment proof action
    try {
      let bookingStatusUpdate = null;
      
      if (action === 'approve') {
        // When payment is approved, keep booking as 'pending' but mark payment as verified
        // Admin can then manually confirm the booking through separate action
        bookingStatusUpdate = {
          payment_status: 'verified',
          // status remains 'pending' - admin will confirm separately
          updated_at: new Date().toISOString()
        };
      } else if (action === 'reject') {
        // When payment is rejected, booking stays pending but payment status shows rejected
        bookingStatusUpdate = {
          payment_status: 'rejected',
          // status remains 'pending' so user can resubmit payment
          updated_at: new Date().toISOString()
        };
      }

      if (bookingStatusUpdate) {
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update(bookingStatusUpdate)
          .eq('id', paymentProof.booking_id);

        if (bookingUpdateError) {
          console.warn('⚠️ Server: Could not update booking status:', bookingUpdateError);
          // Don't fail the whole operation - payment proof update is more important
        } else {
          console.log('✅ Server: Booking status updated successfully:', bookingStatusUpdate);
        }
      }
    } catch (bookingError) {
      console.warn('⚠️ Server: Booking status update failed:', bookingError);
      // Continue - don't fail the main operation
    }

    // Send email notifications
    try {
      console.log('📧 Server: Sending email notification...');
      
      if (action === 'approve') {
        // Email user about approved payment
        const approveEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: paymentProof.bookings.guest_email,
            subject: '✅ Payment Verified - Kampo Ibayow Resort',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">🎉 Payment Verified!</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Your payment has been successfully verified</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <p style="color: #374151; margin-bottom: 20px;">Great news! Your payment proof has been verified by our admin team.</p>
                  
                  <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #059669; margin: 0 0 10px 0;">Booking Details</h3>
                    <p style="margin: 5px 0; color: #374151;"><strong>Check-in:</strong> ${new Date(paymentProof.bookings.check_in_date).toLocaleDateString()}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Check-out:</strong> ${new Date(paymentProof.bookings.check_out_date).toLocaleDateString()}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Guests:</strong> ${paymentProof.bookings.number_of_guests}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Total Amount:</strong> ₱${paymentProof.bookings.total_amount.toLocaleString()}</p>
                  </div>
                  
                  <p style="color: #374151; margin: 20px 0;">Your booking is now ready for final confirmation. You will receive another email once your booking is confirmed by our team.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bookings" 
                       style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                      View My Bookings
                    </a>
                  </div>
                  
                  <hr style="border: none; height: 1px; background: #e5e7eb; margin: 30px 0;">
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                    Thank you for choosing Kampo Ibayow Resort!<br>
                    For questions, contact us at info@kampoibayow.com
                  </p>
                </div>
              </div>
            `
          })
        });

        if (!approveEmailResponse.ok) {
          console.warn('⚠️ Server: Failed to send approval email, but continuing...');
        } else {
          console.log('✅ Server: Approval email sent successfully');
        }
        
      } else if (action === 'reject') {
        // Email user about rejected payment with resubmission instructions
        const rejectEmailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: paymentProof.bookings.guest_email,
            subject: '⚠️ Payment Proof Needs Correction - Kampo Ibayow Resort',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                  <h1 style="margin: 0; font-size: 24px;">⚠️ Payment Proof Needs Correction</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">Please review and resubmit your payment proof</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <p style="color: #374151; margin-bottom: 20px;">We've reviewed your payment proof but it needs some corrections before we can proceed.</p>
                  
                  <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #dc2626; margin: 0 0 10px 0;">Reason for Correction</h3>
                    <p style="margin: 0; color: #374151; font-weight: 500;">${rejectionReason || 'Please check the details and resubmit'}</p>
                  </div>
                  
                  <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                    <h3 style="color: #059669; margin: 0 0 10px 0;">Booking Details</h3>
                    <p style="margin: 5px 0; color: #374151;"><strong>Check-in:</strong> ${new Date(paymentProof.bookings.check_in_date).toLocaleDateString()}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Check-out:</strong> ${new Date(paymentProof.bookings.check_out_date).toLocaleDateString()}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Guests:</strong> ${paymentProof.bookings.number_of_guests}</p>
                    <p style="margin: 5px 0; color: #374151;"><strong>Total Amount:</strong> ₱${paymentProof.bookings.total_amount.toLocaleString()}</p>
                  </div>
                  
                  <h3 style="color: #374151; margin: 30px 0 15px 0;">What to do next:</h3>
                  <ol style="color: #374151; line-height: 1.6; padding-left: 20px;">
                    <li>Review the reason above and correct the issue</li>
                    <li>Take a new, clear photo of your payment proof</li>
                    <li>Upload the corrected payment proof using the link below</li>
                    <li>We'll review it again within 24 hours</li>
                  </ol>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/upload-payment-proof?booking_id=${paymentProof.bookings.id}" 
                       style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                      Upload New Payment Proof
                    </a>
                  </div>
                  
                  <hr style="border: none; height: 1px; background: #e5e7eb; margin: 30px 0;">
                  <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
                    Need help? Contact us at info@kampoibayow.com<br>
                    We're here to help you complete your booking!
                  </p>
                </div>
              </div>
            `
          })
        });

        if (!rejectEmailResponse.ok) {
          console.warn('⚠️ Server: Failed to send rejection email, but continuing...');
        } else {
          console.log('✅ Server: Rejection email sent successfully');
        }
      }
      
    } catch (emailError) {
      console.warn('⚠️ Server: Email notification failed:', emailError);
      // Continue execution even if email fails
    }

    // Note: Booking confirmation is now a separate manual step
    // Admin must verify payment first, then manually confirm booking

    return NextResponse.json({
      success: true,
      message: `Payment proof ${action}d successfully`,
      data: paymentProof
    });

  } catch (error) {
    console.error('💥 Server: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}