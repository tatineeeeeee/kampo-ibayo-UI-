"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Shield,
  Users,
  Wifi,
} from "lucide-react";
import LegalNavigation from "../../components/LegalNavigation";
import { useAuth } from "../../contexts/AuthContext";

export default function HelpPage() {
  const { user, loading } = useAuth();
  const contactMethods = [
    {
      type: "Emergency",
      icon: <Phone className="w-6 h-6" />,
      title: "Emergency Line",
      contact: "0966-281-5123",
      link: "tel:+639662815123",
      description: "24/7 emergency assistance for current guests",
      color: "red",
    },
    {
      type: "Booking",
      icon: <Mail className="w-6 h-6" />,
      title: "Reservations",
      contact: "kampoibayo@gmail.com",
      link: "mailto:kampoibayo@gmail.com",
      description: "Booking inquiries and reservation management",
      color: "blue",
    },
    {
      type: "Chat",
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Facebook Messenger",
      contact: "Kampo Ibayo Resort",
      link: "#",
      description: "Quick responses during business hours",
      color: "purple",
    },
  ];

  const supportCategories = [
    {
      title: "Before Your Visit",
      icon: <Clock className="w-6 h-6" />,
      color: "blue",
      items: [
        {
          question: "How do I confirm my booking?",
          answer:
            "You'll receive written confirmation within 24 hours of deposit payment. Check your email and contact us if you don't receive it.",
        },
        {
          question: "What should I bring?",
          answer:
            "Bring valid ID, personal toiletries, towels, swimwear, food/beverages, and any special items for activities you plan.",
        },
        {
          question: "How do I get directions?",
          answer:
            "Detailed directions with GPS coordinates are provided upon booking confirmation. We can also provide landmark references.",
        },
        {
          question: "Can I modify my reservation?",
          answer:
            "Yes, modifications are subject to availability. Contact us at least 7 days before arrival for best options.",
        },
      ],
    },
    {
      title: "During Your Stay",
      icon: <Users className="w-6 h-6" />,
      color: "green",
      items: [
        {
          question: "Who do I contact for assistance?",
          answer:
            "On-site staff are available during business hours. For emergencies, call 0966-281-5123 anytime.",
        },
        {
          question: "What if something is broken?",
          answer:
            "Report any issues immediately to management. We'll address problems quickly and document for proper resolution.",
        },
        {
          question: "Where are the nearest services?",
          answer:
            "Grocery stores, restaurants, gas stations, and ATMs are 10-15 minutes away. We can provide specific directions.",
        },
        {
          question: "How do I extend my stay?",
          answer:
            "Contact management immediately to check availability. Extensions subject to booking schedule and rate differences.",
        },
      ],
    },
    {
      title: "Technical Support",
      icon: <Wifi className="w-6 h-6" />,
      color: "purple",
      items: [
        {
          question: "WiFi not working?",
          answer:
            "Check network 'KampoIbayo_Guest' with password provided at check-in. Restart device if needed or contact staff.",
        },
        {
          question: "Kitchen appliances issues?",
          answer:
            "Ensure proper setup - gas valves open, electrical connections secure. Contact staff for assistance with any equipment.",
        },
        {
          question: "Pool or facility problems?",
          answer:
            "Report any safety concerns immediately. Non-urgent maintenance issues will be addressed as soon as possible.",
        },
        {
          question: "Videoke or entertainment systems?",
          answer:
            "Instructions provided in common area. If systems malfunction, contact staff for assistance or troubleshooting.",
        },
      ],
    },
    {
      title: "Emergency Procedures",
      icon: <Shield className="w-6 h-6" />,
      color: "red",
      items: [
        {
          question: "Medical emergency?",
          answer:
            "Call 911 immediately, then contact resort emergency line 0966-281-5123. Nearest hospital is 20 minutes away.",
        },
        {
          question: "Severe weather procedures?",
          answer:
            "Monitor weather alerts. Staff will provide safety instructions. Indoor areas available for shelter if needed.",
        },
        {
          question: "Fire emergency?",
          answer:
            "Evacuate immediately to parking area. Call 911 and resort emergency line. Fire extinguishers located throughout property.",
        },
        {
          question: "Security concerns?",
          answer:
            "Contact resort security immediately at 0966-281-5123. Do not approach suspicious individuals yourself.",
        },
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      red: "bg-red-900/20 border-red-700/50",
      blue: "bg-blue-900/20 border-blue-700/50",
      green: "bg-green-900/20 border-green-700/50",
      purple: "bg-purple-900/20 border-purple-700/50",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      red: "text-red-400",
      blue: "text-blue-400",
      green: "text-green-400",
      purple: "text-purple-400",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 z-20">
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
                <h1 className="text-lg sm:text-xl font-bold">Help Center</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                  Support and assistance
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              {loading ? (
                <span className="inline-block bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                  ● Loading...
                </span>
              ) : user ? (
                <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ● Signed In
                </span>
              ) : (
                <span className="inline-block bg-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  ● Guest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Emergency Contact Banner */}
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold mb-2 text-red-400">
                Emergency Contact
              </h2>
              <p className="text-gray-300 mb-3">
                For immediate emergencies during your stay, call our 24/7
                emergency line:
              </p>
              <a
                href="tel:+639662815123"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px] touch-manipulation"
              >
                <Phone className="w-4 h-4" />
                Emergency: 0966-281-5123
              </a>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">
            How to Reach Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.link}
                className={`border rounded-lg p-4 transition-all duration-200 hover:scale-105 active:scale-[0.98] min-h-[120px] touch-manipulation ${getColorClasses(
                  method.color
                )}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={getIconColor(method.color)}>
                    {method.icon}
                  </div>
                  <h3 className="font-semibold text-white">{method.title}</h3>
                </div>
                <p className="text-white font-medium mb-1">{method.contact}</p>
                <p className="text-gray-300 text-sm">{method.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400">
            Support Hours
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">
                On-site Support
              </h3>
              <p className="text-gray-300 text-sm">Daily: 8:00 AM - 6:00 PM</p>
              <p className="text-gray-400 text-xs mt-1">
                Available during your stay
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">
                Phone Support
              </h3>
              <p className="text-gray-300 text-sm">
                Mon-Fri: 9:00 AM - 6:00 PM
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Booking & general inquiries
              </p>
            </div>

            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-2">
                Emergency Line
              </h3>
              <p className="text-gray-300 text-sm">24/7 Available</p>
              <p className="text-gray-400 text-xs mt-1">Emergencies only</p>
            </div>
          </div>
        </div>

        {/* Support Categories */}
        <div className="space-y-6">
          {supportCategories.map((category, categoryIndex) => (
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
                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="bg-gray-700/50 rounded-lg p-4"
                  >
                    <h3 className="font-semibold text-white mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Local Information */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <MapPin className="w-6 h-6" />
            Local Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">
                Nearby Services
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  • <strong>Grocery Store:</strong> SM General Trias (15 min
                  drive)
                </li>
                <li>
                  • <strong>Hospital:</strong> De La Salle Medical Center (20
                  min)
                </li>
                <li>
                  • <strong>Gas Station:</strong> Petron General Trias (10 min)
                </li>
                <li>
                  • <strong>Restaurants:</strong> Various local options (5-15
                  min)
                </li>
                <li>
                  • <strong>ATM/Bank:</strong> BPI General Trias (12 min)
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3 text-white">
                Transportation
              </h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>
                  • <strong>Private Vehicle:</strong> Recommended (parking
                  available)
                </li>
                <li>
                  • <strong>From Manila:</strong> 1.5-2 hours depending on
                  traffic
                </li>
                <li>
                  • <strong>Public Transport:</strong> Bus to General Trias +
                  tricycle
                </li>
                <li>
                  • <strong>Taxi/Grab:</strong> Available but limited in rural
                  areas
                </li>
                <li>
                  • <strong>Airport:</strong> NAIA 1.5-2 hours, Clark 2-3 hours
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 sm:p-6 text-center">
          <h3 className="text-xl font-semibold mb-3 text-green-400">
            We Value Your Feedback
          </h3>
          <p className="text-gray-300 mb-4">
            Help us improve by sharing your experience. Your feedback helps us
            provide better service for all guests.
          </p>
        </div>
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
