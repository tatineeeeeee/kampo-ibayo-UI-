"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";
import LegalNavigation from "../../components/LegalNavigation";

export default function CancellationPage() {
  const refundTiers = [
    {
      period: "7+ days before check-in",
      refundPercentage: "100%",
      description: "Full down payment refunded after admin processing",
      color: "green",
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      period: "3-7 days before check-in",
      refundPercentage: "50%",
      description: "Half of down payment refunded due to short notice",
      color: "yellow",
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      period: "Less than 3 days before check-in",
      refundPercentage: "0%",
      description: "No refund - Cancellation and reschedule not allowed via system",
      color: "blue",
      icon: <RefreshCw className="w-5 h-5" />,
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: "bg-success/10 border-success/20 text-success",
      blue: "bg-primary/10 border-primary/30 text-primary",
      yellow: "bg-warning/10 border-warning/20 text-warning",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Link>
              <div className="text-foreground">
                <h1 className="text-lg sm:text-xl font-bold">
                  Cancellation Policy
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Refund and cancellation terms
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-right">
              <span className="inline-block bg-warning text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                Policy
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Policy Overview */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h2 className="text-2xl font-bold mb-4 text-primary">
            Cancellation Policy Overview
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            We understand that plans can change. Our cancellation policy is
            designed to be fair to both guests and the resort. With our new down
            payment system, you only pay 50% upfront when booking, and refunds
            are calculated based on this down payment amount depending on when
            you cancel. Refunds are processed manually by our admin team.
          </p>

          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
            <h3 className="text-primary/80 font-semibold mb-2">
              Payment Structure
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded bg-primary/10/10">
                <p className="font-medium text-primary">
                  Down Payment (At Booking)
                </p>
                <p className="text-lg font-bold text-primary/80">50% of Total</p>
              </div>
              <div className="p-2 rounded bg-muted/10">
                <p className="font-medium text-foreground">Pay on Arrival</p>
                <p className="text-lg font-bold text-muted-foreground">50% of Total</p>
              </div>
            </div>
          </div>

          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <p className="text-warning text-sm">
              <strong>Important:</strong> Only the down payment (50% of total
              booking cost) is refundable. Refunds are processed by the admin
              after cancellation. The remaining 50% is paid upon arrival at the resort.
            </p>
          </div>
        </div>

        {/* Refund Timeline */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-primary">
            Refund Schedule
          </h2>

          <div className="space-y-4">
            {refundTiers.map((tier, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getColorClasses(
                  tier.color
                )}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {tier.icon}
                    <h3 className="font-semibold">{tier.period}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {tier.refundPercentage}
                    </div>
                    <div className="text-xs opacity-75">refund</div>
                  </div>
                </div>
                <p className="text-sm opacity-90">{tier.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">
              Refund Processing
            </h4>
            <ul className="text-muted-foreground text-sm space-y-1">
              <li>
                • <strong>Cancellation:</strong> Cancel through your bookings
                page, refund will be processed by the admin
              </li>
              <li>
                • <strong>Processing time:</strong> 5-10 business days after
                admin approval
              </li>
              <li>
                • <strong>Refund amount:</strong> Based only on down payment
                (50% of total booking)
              </li>
              <li>
                • <strong>3-day rule:</strong> No cancellations or reschedules allowed within
                3 days of check-in
              </li>
              <li>
                • <strong>Emergency assistance:</strong> Contact resort directly
                for special circumstances
              </li>
            </ul>
          </div>
        </div>

        {/* Special Circumstances */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-primary">
            Special Circumstances
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Weather-Related Cancellations
              </h3>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <ul className="text-warning text-sm space-y-2">
                  <li>
                    • <strong>Typhoon/Storm Warnings:</strong> Full refund if
                    Signal No. 2 or higher is declared for our area
                  </li>
                  <li>
                    • <strong>Flooding:</strong> Full refund if local government
                    declares area inaccessible
                  </li>
                  <li>
                    • <strong>Heavy Rain:</strong> Rescheduling offered;
                    cancellation follows standard policy
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Medical Emergencies
              </h3>
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <ul className="text-primary text-sm space-y-2">
                  <li>
                    • <strong>Guest Medical Emergency:</strong> Full refund with
                    medical certificate
                  </li>
                  <li>
                    • <strong>Family Emergency:</strong> Case-by-case evaluation
                    with documentation
                  </li>
                  <li>
                    • <strong>COVID-19:</strong> Full refund with positive test
                    result or quarantine order
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Resort-Initiated Cancellations
              </h3>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <ul className="text-success text-sm space-y-2">
                  <li>
                    • <strong>Facility Issues:</strong> Full refund plus
                    compensation
                  </li>
                  <li>
                    • <strong>Overbooking:</strong> Full refund plus priority
                    rebooking
                  </li>
                  <li>
                    • <strong>Safety Concerns:</strong> Full refund with
                    alternative dates offered
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How to Cancel */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-primary">
            How to Cancel Your Reservation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Online Cancellation (Recommended)
              </h3>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                    1
                  </div>
                  <span className="text-success font-medium">
                    Visit your bookings page
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                    2
                  </div>
                  <span className="text-success font-medium">
                    Click &quot;Cancel&quot; on your booking
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                    3
                  </div>
                  <span className="text-success font-medium">
                    Review refund amount and policy
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-foreground text-xs font-bold">
                    4
                  </div>
                  <span className="text-success font-medium">
                    Confirm cancellation
                  </span>
                </div>
              </div>
              <p className="text-success text-sm">
                ✅ <strong>Easy process</strong> - Cancel from your bookings page,
                admin will process the refund
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">
                Emergency Contact Methods
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                For urgent matters or if you cannot access your account:
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:kampoibayo@gmail.com"
                  className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted/80 rounded-lg min-h-[56px] touch-manipulation transition-colors"
                >
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Email</div>
                    <div className="text-muted-foreground text-sm">
                      kampoibayo@gmail.com
                    </div>
                  </div>
                </a>

                <a
                  href="tel:+639662815123"
                  className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted/80 rounded-lg min-h-[56px] touch-manipulation transition-colors"
                >
                  <Phone className="w-5 h-5 text-success flex-shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Phone</div>
                    <div className="text-muted-foreground text-sm">
                      +63 966 281 5123
                    </div>
                  </div>
                </a>
              </div>
              <p className="text-muted-foreground text-xs mt-3">
                Include your booking ID and reason for cancellation
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
            <h4 className="font-semibold text-primary mb-2">
              Automatic Processing Benefits
            </h4>
            <ul className="text-primary text-sm space-y-1">
              <li>
                • <strong>24/7 availability:</strong> Cancel anytime through
                your account
              </li>
              <li>
                • <strong>Instant confirmation:</strong> Immediate email
                notification sent
              </li>
              <li>
                • <strong>Transparent refunds:</strong> See exact refund amount
                before confirming
              </li>
              <li>
                • <strong>No waiting:</strong> No need to contact staff during
                business hours
              </li>
            </ul>
          </div>
        </div>

        {/* Modification vs Cancellation */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-primary">
            Modification vs Cancellation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-primary">
                Date Modifications (Reschedule)
              </h3>
              <ul className="text-primary text-sm space-y-2">
                <li>
                  • <strong>Limit:</strong> Maximum 2 reschedules per booking
                </li>
                <li>
                  • <strong>Timing:</strong> Must be at least 3 days before check-in
                </li>
                <li>
                  • <strong>Rate differences:</strong> Pay difference if new
                  dates cost more
                </li>
                <li>
                  • <strong>Availability:</strong> Subject to resort
                  availability
                </li>
              </ul>
            </div>

            <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-chart-4">
                Guest Count Changes
              </h3>
              <ul className="text-chart-4 text-sm space-y-2">
                <li>
                  • <strong>Reduction:</strong> Partial refund of difference
                </li>
                <li>
                  • <strong>Increase:</strong> Pay additional amount (max 15
                  guests)
                </li>
                <li>
                  • <strong>Last minute:</strong> Subject to availability
                </li>
                <li>
                  • <strong>Children:</strong> Count towards total capacity
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Need to Cancel Section */}
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 sm:p-6 text-center">
          <h3 className="text-xl font-semibold mb-3 text-primary">
            Need to Cancel?
          </h3>
          <p className="text-muted-foreground mb-4">
            We&apos;re here to help make the cancellation process as smooth as
            possible. Contact us using the methods detailed in the &quot;How to
            Cancel&quot; section above.
          </p>
          <p className="text-muted-foreground text-sm">
            Refer to the cancellation procedures and contact information
            provided in the previous sections for complete details.
          </p>
        </div>
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
