import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    // Get review details with user email
    const { data: review, error: reviewError } = await supabase
      .from('guest_reviews')
      .select(`
        id, 
        guest_name, 
        rating, 
        review_text, 
        stay_dates,
        user_id,
        users!inner(email)
      `)
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    // Update review status to approved
    const { error: updateError } = await supabase
      .from('guest_reviews')
      .update({ 
        approved: true,
        rejection_reason: null // Clear any previous rejection reason
      })
      .eq('id', reviewId);

    if (updateError) {
      throw new Error(`Failed to approve review: ${updateError.message}`);
    }

    // Send email notification to guest
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/review-approved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guestName: review.guest_name,
        guestEmail: review.users.email,
        rating: review.rating,
        reviewText: review.review_text,
        stayDates: review.stay_dates,
        reviewId: review.id
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      console.warn('Review approved but email notification failed:', emailResult.error);
      // Don't fail the whole operation if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Review approved successfully',
      emailSent: emailResult.success 
    });

  } catch (error) {
    console.error('Error approving review:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}