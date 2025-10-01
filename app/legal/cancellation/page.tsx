"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, Clock, AlertTriangle, Phone, Mail, RefreshCw } from "lucide-react";
import LegalNavigation from "../../components/LegalNavigation";

export default function CancellationPage() {
  const refundTiers = [
    {
      period: "60+ days before arrival",
      refundPercentage: "90%",
      description: "Full refund minus processing fee",
      color: "green",
      icon: <Calendar className="w-5 h-5" />
    },
    {
      period: "30-59 days before arrival", 
      refundPercentage: "75%",
      description: "Partial refund to accommodate rebooking efforts",
      color: "blue",
      icon: <Clock className="w-5 h-5" />
    },
    {
      period: "7-29 days before arrival",
      refundPercentage: "50%", 
      description: "Limited refund due to short notice",
      color: "yellow",
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      period: "Less than 7 days before arrival",
      refundPercentage: "25%",
      description: "Minimal refund due to immediate booking loss",
      color: "red",
      icon: <RefreshCw className="w-5 h-5" />
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: "bg-green-900/20 border-green-700/50 text-green-400",
      blue: "bg-blue-900/20 border-blue-700/50 text-blue-400", 
      yellow: "bg-yellow-900/20 border-yellow-700/50 text-yellow-400",
      red: "bg-red-900/20 border-red-700/50 text-red-400"
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.red;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/" 
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">Cancellation Policy</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Refund and cancellation terms</p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              <span className="inline-block bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Policy
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Policy Overview */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-4 text-red-400">Cancellation Policy Overview</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            We understand that plans can change. Our cancellation policy is designed to be fair to both guests and the resort, balancing flexibility with operational needs. Refund amounts depend on how far in advance you cancel your reservation.
          </p>
          
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              <strong>Important:</strong> All cancellations must be requested in writing (email or formal written notice). Verbal cancellations are not accepted. Cancellation timing is based on your original check-in date.
            </p>
          </div>
        </div>

        {/* Refund Timeline */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Refund Schedule</h2>
          
          <div className="space-y-4">
            {refundTiers.map((tier, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getColorClasses(tier.color)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {tier.icon}
                    <h3 className="font-semibold">{tier.period}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{tier.refundPercentage}</div>
                    <div className="text-xs opacity-75">refund</div>
                  </div>
                </div>
                <p className="text-sm opacity-90">{tier.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Refund Processing</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Refunds processed within 7-10 business days</li>
              <li>• Refunds issued to original payment method</li>
              <li>• Processing fees (₱500) deducted from all refunds</li>
              <li>• Bank transfer fees (if applicable) deducted from refund amount</li>
            </ul>
          </div>
        </div>

        {/* Special Circumstances */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Special Circumstances</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Weather-Related Cancellations</h3>
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <ul className="text-yellow-200 text-sm space-y-2">
                  <li>• <strong>Typhoon/Storm Warnings:</strong> Full refund if Signal No. 2 or higher is declared for our area</li>
                  <li>• <strong>Flooding:</strong> Full refund if local government declares area inaccessible</li>
                  <li>• <strong>Heavy Rain:</strong> Rescheduling offered; cancellation follows standard policy</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Medical Emergencies</h3>
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
                <ul className="text-red-200 text-sm space-y-2">
                  <li>• <strong>Guest Medical Emergency:</strong> Full refund with medical certificate</li>
                  <li>• <strong>Family Emergency:</strong> Case-by-case evaluation with documentation</li>
                  <li>• <strong>COVID-19:</strong> Full refund with positive test result or quarantine order</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Resort-Initiated Cancellations</h3>
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                <ul className="text-green-200 text-sm space-y-2">
                  <li>• <strong>Facility Issues:</strong> Full refund plus compensation</li>
                  <li>• <strong>Overbooking:</strong> Full refund plus priority rebooking</li>
                  <li>• <strong>Safety Concerns:</strong> Full refund with alternative dates offered</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* How to Cancel */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">How to Cancel Your Reservation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Required Information</h3>
              <ul className="text-gray-300 text-sm space-y-2 list-disc list-inside">
                <li>Booking confirmation number</li>
                <li>Primary guest name and contact information</li>
                <li>Original check-in and check-out dates</li>
                <li>Reason for cancellation (for our records)</li>
                <li>Preferred refund method</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">Cancellation Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">Email</div>
                    <div className="text-gray-400 text-sm">kampoibayo@gmail.com</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium text-white">Phone</div>
                    <div className="text-gray-400 text-sm">0917-654-3210</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
            <h4 className="font-semibold text-orange-400 mb-2">Important Notes</h4>
            <ul className="text-orange-200 text-sm space-y-1">
              <li>• Cancellations are processed in order received</li>
              <li>• Business hours: Monday-Friday, 9 AM - 6 PM</li>
              <li>• Weekend cancellations processed next business day</li>
              <li>• Written confirmation will be sent within 24 hours</li>
            </ul>
          </div>
        </div>

        {/* Modification vs Cancellation */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">Modification vs Cancellation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Date Modifications</h3>
              <ul className="text-blue-200 text-sm space-y-2">
                <li>• <strong>Within 30 days:</strong> No additional fees</li>
                <li>• <strong>Rate differences:</strong> Pay difference if new dates cost more</li>
                <li>• <strong>Availability:</strong> Subject to resort availability</li>
                <li>• <strong>Limit:</strong> One free modification per booking</li>
              </ul>
            </div>

            <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Guest Count Changes</h3>
              <ul className="text-purple-200 text-sm space-y-2">
                <li>• <strong>Reduction:</strong> Partial refund of difference</li>
                <li>• <strong>Increase:</strong> Pay additional amount (max 15 guests)</li>
                <li>• <strong>Last minute:</strong> Subject to availability</li>
                <li>• <strong>Children:</strong> Count towards total capacity</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Need to Cancel Section */}
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 sm:p-6 text-center">
          <h3 className="text-xl font-semibold mb-3 text-red-400">Need to Cancel?</h3>
          <p className="text-gray-300 mb-4">
            We&apos;re here to help make the cancellation process as smooth as possible. Contact us using the methods detailed in the &quot;How to Cancel&quot; section above.
          </p>
          <p className="text-gray-400 text-sm">
            Refer to the cancellation procedures and contact information provided in the previous sections for complete details.
          </p>
        </div>
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
