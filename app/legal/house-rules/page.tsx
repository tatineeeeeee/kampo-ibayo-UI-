"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Users,
  Shield,
  Volume2,
  Trash2,
  Home,
  AlertTriangle,
  Heart,
} from "lucide-react";
import LegalNavigation from "../../components/LegalNavigation";

export default function HouseRulesPage() {
  const ruleCategories = [
    {
      title: "Check-in & Check-out",
      icon: <Clock className="w-6 h-6" />,
      color: "blue",
      rules: [
        {
          rule: "Check-in Time: 3:00 PM",
          details:
            "Early check-in available upon request, subject to availability and room readiness. Please call ahead to confirm.",
        },
        {
          rule: "Check-out Time: 1:00 PM",
          details:
            "Late check-out may be available for an additional fee. Must be arranged in advance with management.",
        },
        {
          rule: "Valid ID Required",
          details:
            "All guests must present valid government-issued identification upon check-in. Photocopies not accepted.",
        },
        {
          rule: "Full Payment Due",
          details:
            "Remaining balance must be settled upon arrival. Cash, GCash, or Maya accepted.",
        },
      ],
    },
    {
      title: "Occupancy & Guests",
      icon: <Users className="w-6 h-6" />,
      color: "green",
      rules: [
        {
          rule: "Maximum 15 Guests",
          details:
            "Strictly enforced for safety and facility capacity. Additional guests may incur extra charges and require approval.",
        },
        {
          rule: "Guest Registration",
          details:
            "All overnight guests must be registered upon check-in. Day visitors require prior notification and approval.",
        },
        {
          rule: "Child Supervision",
          details:
            "Children under 12 must be supervised by adults at all times, especially around pool and adventure areas.",
        },
        {
          rule: "Visitor Policy",
          details:
            "Day visitors welcome with advance notice. Visitor fees may apply beyond registered guest count.",
        },
      ],
    },
    {
      title: "Quiet Hours & Noise",
      icon: <Volume2 className="w-6 h-6" />,
      color: "purple",
      rules: [
        {
          rule: "Quiet Hours: 10:00 PM - 7:00 AM",
          details:
            "Strictly enforced to respect neighboring properties and ensure all guests can rest comfortably.",
        },
        {
          rule: "Videoke Curfew",
          details:
            "Videoke and music systems must be turned off by 10:00 PM. No exceptions, including special occasions.",
        },
        {
          rule: "Pool Noise Limits",
          details:
            "Keep conversations and activities at reasonable volumes during quiet hours. Pool may be used but quietly.",
        },
        {
          rule: "Respect Neighbors",
          details:
            "We maintain good relationships with surrounding properties. Excessive noise may result in early termination of stay.",
        },
      ],
    },
    {
      title: "Safety & Security",
      icon: <Shield className="w-6 h-6" />,
      color: "red",
      rules: [
        {
          rule: "Swimming Pool Safety",
          details:
            "No lifeguard on duty - swim at your own risk. Children must be supervised. No diving in shallow areas. No running around pool.",
        },
        {
          rule: "Adventure Area Guidelines",
          details:
            "Hanging bridge has weight/capacity limits. Proper footwear required. Report damaged equipment immediately.",
        },
        {
          rule: "Emergency Procedures",
          details:
            "Emergency contact: 0917-654-3210. First aid kit available. Nearest hospital 20 minutes away. Know evacuation routes.",
        },
        {
          rule: "Security Measures",
          details:
            "Secure valuables - resort not liable for theft. Lock rooms when away. Report suspicious activity immediately.",
        },
      ],
    },
    {
      title: "Property Care",
      icon: <Home className="w-6 h-6" />,
      color: "orange",
      rules: [
        {
          rule: "Cleanliness Standards",
          details:
            "Keep common areas tidy. Clean up after cooking/dining. Dispose of trash properly. Leave facilities as you found them.",
        },
        {
          rule: "Damage Responsibility",
          details:
            "Guests liable for any damages. Report issues immediately. Damage assessment conducted during checkout. Repair costs charged to guest.",
        },
        {
          rule: "Kitchen Usage",
          details:
            "Clean all utensils after use. Turn off appliances when finished. No cooking in room areas. Store food properly to prevent pests.",
        },
        {
          rule: "Facility Respect",
          details:
            "Use furniture/equipment as intended. No alterations to property. Follow posted capacity limits. Respect posted signs.",
        },
      ],
    },
    {
      title: "Prohibited Items & Activities",
      icon: <AlertTriangle className="w-6 h-6" />,
      color: "yellow",
      rules: [
        {
          rule: "Strictly Prohibited",
          details:
            "Illegal drugs, weapons, fireworks, excessive alcohol, unauthorized parties, commercial photography without permission.",
        },
        {
          rule: "Smoking Policy",
          details:
            "No smoking in enclosed areas. Designated outdoor smoking areas available. Dispose of cigarette butts properly.",
        },
        {
          rule: "Alcohol Guidelines",
          details:
            "Moderate consumption allowed. No excessive drinking leading to disturbance. Management reserves right to intervene.",
        },
        {
          rule: "Event Restrictions",
          details:
            "Large events require prior approval. Additional fees may apply. Sound equipment restrictions during quiet hours.",
        },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-900/20 border-blue-700/50",
      green: "bg-green-900/20 border-green-700/50",
      purple: "bg-purple-900/20 border-purple-700/50",
      red: "bg-red-900/20 border-red-700/50",
      orange: "bg-orange-900/20 border-orange-700/50",
      yellow: "bg-yellow-900/20 border-yellow-700/50",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: "text-blue-400",
      green: "text-green-400",
      purple: "text-purple-400",
      red: "text-red-400",
      orange: "text-orange-400",
      yellow: "text-yellow-400",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
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
                className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              </Link>
              <div className="text-white">
                <h1 className="text-lg sm:text-xl font-bold">House Rules</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Guidelines for your stay
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              <span className="inline-block bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Rules
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Welcome Message */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <Heart className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-green-400">
                Welcome to Kampo Ibayo Resort!
              </h2>
              <p className="text-gray-300 leading-relaxed">
                These house rules ensure everyone has a safe, enjoyable, and
                memorable stay. By following these guidelines, you help us
                maintain a peaceful environment for all guests while protecting
                our beautiful natural setting. Thank you for being a responsible
                guest!
              </p>
            </div>
          </div>
        </div>

        {/* House Rules Categories */}
        <div className="space-y-6">
          {ruleCategories.map((category, categoryIndex) => (
            <div
              key={categoryIndex}
              className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50"
            >
              <h2
                className={`text-2xl font-bold mb-6 ${getIconColor(
                  category.color
                )} flex items-center gap-3`}
              >
                {category.icon}
                {category.title}
              </h2>

              <div className="space-y-4">
                {category.rules.map((ruleItem, ruleIndex) => (
                  <div
                    key={ruleIndex}
                    className={`border rounded-lg p-4 ${getColorClasses(
                      category.color
                    )}`}
                  >
                    <h3 className="font-semibold text-white mb-2">
                      {ruleItem.rule}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {ruleItem.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pet Policy */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <Heart className="w-6 h-6" />
            Pet-Friendly Policy
          </h2>

          <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-green-400">
              We Welcome Your Furry Friends!
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• All pets must be well-behaved and house-trained</li>
                <li>• Keep pets leashed in common areas</li>
                <li>• Clean up after your pets immediately</li>
                <li>• Pets not allowed in swimming pool</li>
              </ul>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Prevent excessive barking or noise</li>
                <li>• Supervise pets around other guests</li>
                <li>• Additional cleaning fee may apply</li>
                <li>• Report any pet incidents to management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Environmental Responsibility */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <Trash2 className="w-6 h-6" />
            Environmental Responsibility
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-green-400">
                Waste Management
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Separate recyclables from general waste</li>
                <li>• Use designated trash bins throughout property</li>
                <li>• No littering in natural areas</li>
                <li>• Composting available for food scraps</li>
              </ul>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-400">
                Conservation
              </h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Turn off lights and appliances when not in use</li>
                <li>• Conserve water during showers and activities</li>
                <li>• Respect local wildlife and plants</li>
                <li>• Report any environmental concerns</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enforcement & Violations */}
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 sm:p-6">
          <h3 className="text-xl font-semibold mb-3 text-red-400">
            Rule Enforcement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">
                Violation Consequences
              </h4>
              <ul className="text-red-200 text-sm space-y-2">
                <li>
                  • <strong>First Warning:</strong> Verbal reminder of policies
                </li>
                <li>
                  • <strong>Second Warning:</strong> Written notice and
                  documentation
                </li>
                <li>
                  • <strong>Serious Violations:</strong> Immediate termination
                  without refund
                </li>
                <li>
                  • <strong>Damage/Cleanup:</strong> Additional charges apply
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-2">
                Contact Management
              </h4>
              <ul className="text-red-200 text-sm space-y-2">
                <li>
                  • <strong>Questions:</strong> Ask staff for clarification
                </li>
                <li>
                  • <strong>Issues:</strong> Report problems immediately
                </li>
                <li>
                  • <strong>Emergency:</strong> Call 0917-654-3210
                </li>
                <li>
                  • <strong>Feedback:</strong> We value your input
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Agreement & Contact */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50 text-center">
          <h3 className="text-xl font-semibold mb-3 text-red-400">
            Agreement to House Rules
          </h3>
          <p className="text-gray-300 mb-4">
            By staying at Kampo Ibayo Resort, you acknowledge that you have
            read, understood, and agree to follow these house rules. Violations
            may result in additional charges or termination of stay without
            refund.
          </p>
        </div>
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
