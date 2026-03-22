import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/app/utils/supabaseAdmin';
import { validateAdminAuth, authErrorResponse, AuthFailure } from '@/app/utils/serverAuth';
import { BASE_RATE_WEEKDAY, BASE_RATE_WEEKEND, EXTRA_GUEST_FEE, INCLUDED_GUESTS, PHILIPPINE_HOLIDAYS, PEAK_SEASON_RANGES } from '@/lib/constants/pricing';

export async function POST(request: NextRequest) {
    try {
        const auth = await validateAdminAuth(request);
        if (!auth.success) return authErrorResponse(auth as AuthFailure);

        const { bookingId, newCheckIn, newCheckOut, adminId, reason } =
            await request.json();

        // Validate required fields
        if (!bookingId || !newCheckIn || !newCheckOut) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate dates
        const checkInDate = new Date(newCheckIn);
        const checkOutDate = new Date(newCheckOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            return NextResponse.json(
                { success: false, error: "Check-in date cannot be in the past" },
                { status: 400 }
            );
        }

        if (checkOutDate <= checkInDate) {
            return NextResponse.json(
                { success: false, error: "Check-out date must be after check-in date" },
                { status: 400 }
            );
        }

        // Fetch the booking (no user_id restriction — admin can reschedule any booking)
        const { data: booking, error: bookingError } = await supabaseAdmin
            .from("bookings")
            .select("*")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            return NextResponse.json(
                { success: false, error: "Booking not found" },
                { status: 404 }
            );
        }

        if (booking.status === "cancelled") {
            return NextResponse.json(
                { success: false, error: "Cannot reschedule a cancelled booking" },
                { status: 400 }
            );
        }

        // Check if new dates are available (excluding the current booking)
        const { data: conflictingBookings, error: conflictError } =
            await supabaseAdmin
                .from("bookings")
                .select("id, check_in_date, check_out_date, status")
                .in("status", ["confirmed", "pending"])
                .neq("id", bookingId);

        if (conflictError) {
            console.error("Error checking date conflicts:", conflictError);
            return NextResponse.json(
                { success: false, error: "Error checking date availability" },
                { status: 500 }
            );
        }

        const newCheckInTime = new Date(newCheckIn).getTime();
        const newCheckOutTime = new Date(newCheckOut).getTime();

        const hasConflict = conflictingBookings?.some((existing) => {
            const existingIn = new Date(existing.check_in_date).getTime();
            const existingOut = new Date(existing.check_out_date).getTime();
            return (
                (newCheckInTime >= existingIn && newCheckInTime < existingOut) ||
                (newCheckOutTime > existingIn && newCheckOutTime <= existingOut) ||
                (newCheckInTime <= existingIn && newCheckOutTime >= existingOut)
            );
        });

        if (hasConflict) {
            return NextResponse.json(
                { success: false, error: "Selected dates are not available — conflicts with another booking" },
                { status: 400 }
            );
        }

        // Calculate new pricing
        const calculatePrice = (
            checkIn: Date,
            checkOut: Date,
            guestCount: number = INCLUDED_GUESTS
        ) => {
            const nights: { date: Date; rate: number; isWeekend: boolean }[] = [];
            const cur = new Date(checkIn);

            while (cur < checkOut) {
                const dow = cur.getDay();
                const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
                const isHoliday = (PHILIPPINE_HOLIDAYS as readonly string[]).includes(dateStr);
                const isPeak = (PEAK_SEASON_RANGES as { start: string; end: string }[]).some((r) => dateStr >= r.start && dateStr <= r.end);
                const isWeekend = dow === 0 || dow === 5 || dow === 6;
                const isPeakRate = isWeekend || isHoliday || isPeak;
                nights.push({ date: new Date(cur), rate: isPeakRate ? BASE_RATE_WEEKEND : BASE_RATE_WEEKDAY, isWeekend: isPeakRate });
                cur.setDate(cur.getDate() + 1);
            }

            const totalBaseRate = nights.reduce((s, n) => s + n.rate, 0);
            const totalNights = nights.length;
            const excessGuestFee =
                guestCount > INCLUDED_GUESTS ? (guestCount - INCLUDED_GUESTS) * EXTRA_GUEST_FEE * totalNights : 0;

            return { totalNights, totalBaseRate, excessGuestFee, totalAmount: totalBaseRate + excessGuestFee };
        };

        const pricing = calculatePrice(checkInDate, checkOutDate, booking.number_of_guests);

        // Track reschedule count
        const currentRescheduleCount = booking.reschedule_count || 0;

        const newCheckInDateTime = `${newCheckIn}T15:00:00`;
        const newCheckOutDateTime = `${newCheckOut}T13:00:00`;

        // Determine if this is a walk-in (keep status confirmed for walk-ins)
        const isWalkIn = (booking.special_requests || "").startsWith("[WALK-IN]");

        // Auto-cancel old pending proofs — admin shouldn't have to review outdated submissions
        if (!isWalkIn) {
            await supabaseAdmin
                .from('payment_proofs')
                .update({ status: 'rejected', admin_notes: 'Auto-rejected: booking was rescheduled by admin', updated_at: new Date().toISOString() })
                .eq('booking_id', bookingId)
                .eq('status', 'pending');
        }

        // Check existing verified payments to determine if user still owes money
        const newPaymentAmount = booking.payment_type === 'half' ? Math.round(pricing.totalAmount * 0.5) : pricing.totalAmount;
        let newPaymentStatus = "pending";

        if (isWalkIn) {
            newPaymentStatus = booking.payment_status || "pending";
        } else {
            const { data: verifiedProofs } = await supabaseAdmin
                .from('payment_proofs')
                .select('amount')
                .eq('booking_id', bookingId)
                .eq('status', 'verified');

            const totalVerified = (verifiedProofs || []).reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
            newPaymentStatus = totalVerified >= newPaymentAmount ? 'verified' : 'pending';
        }

        const { data: updatedBooking, error: updateError } = await supabaseAdmin
            .from("bookings")
            .update({
                check_in_date: newCheckInDateTime,
                check_out_date: newCheckOutDateTime,
                total_amount: pricing.totalAmount,
                payment_amount: newPaymentAmount,
                reschedule_count: currentRescheduleCount + 1,
                payment_status: newPaymentStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId)
            .select()
            .single();

        if (updateError) {
            console.error("Error updating booking:", updateError);
            return NextResponse.json(
                { success: false, error: "Failed to reschedule booking" },
                { status: 500 }
            );
        }

        // Broadcast reschedule to user's client for instant real-time update
        try {
            const channel = supabaseAdmin.channel(`booking-update-${bookingId}`);
            await channel.send({
                type: 'broadcast',
                event: 'booking-changed',
                payload: { bookingId, action: 'rescheduled' }
            });
            await supabaseAdmin.removeChannel(channel);
        } catch (broadcastError) {
            console.warn('⚠️ Server: Broadcast failed (non-critical):', broadcastError);
        }

        // Send notification email (fire-and-forget)
        try {
            const emailData = {
                bookingId,
                guestName: booking.guest_name,
                guestEmail: booking.guest_email,
                phoneNumber: booking.guest_phone,
                originalCheckIn: new Date(booking.check_in_date).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                }),
                originalCheckOut: new Date(booking.check_out_date).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                }),
                newCheckIn: new Date(newCheckInDateTime).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                }),
                newCheckOut: new Date(newCheckOutDateTime).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                }),
                totalAmount: pricing.totalAmount,
                guests: booking.number_of_guests,
            };

            fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/email/booking-rescheduled`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
                    body: JSON.stringify(emailData),
                }
            ).catch((err) => console.warn("Email notification failed:", err));
        } catch {
            // Don't fail the reschedule
        }

        return NextResponse.json({
            success: true,
            message: "Booking rescheduled successfully by admin.",
            booking: updatedBooking,
            pricing: {
                originalAmount: booking.total_amount,
                newAmount: pricing.totalAmount,
                amountDifference: pricing.totalAmount - booking.total_amount,
                nightsCount: pricing.totalNights,
            },
        });
    } catch (error) {
        console.error("Admin reschedule error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
