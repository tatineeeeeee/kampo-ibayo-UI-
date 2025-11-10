"use client";

import Link from "next/link";
import { ArrowLeft, MessageCircle, Shield, CreditCard, FileText, Phone, Clock, Users, AlertTriangle } from "lucide-react";

export default function LegalHub() {
  const legalPages = [
    {
      href: "/legal/faq",
      title: "Frequently Asked Questions",
      description: "Get instant answers to common questions about bookings, amenities, and policies",
      icon: <MessageCircle className="w-8 h-8" />,
      color: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20",
      iconColor: "text-blue-400"
    },
    {
      href: "/legal/house-rules",
      title: "House Rules",
      description: "Essential guidelines for a safe and enjoyable stay for all guests",
      icon: <Shield className="w-8 h-8" />,
      color: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20",
      iconColor: "text-green-400"
    },
    {
      href: "/legal/cancellation",
      title: "Cancellation Policy",
      description: "Understand our flexible cancellation terms and refund timelines",
      icon: <CreditCard className="w-8 h-8" />,
      color: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20",
      iconColor: "text-orange-400"
    },
    {
      href: "/legal/terms",
      title: "Terms & Privacy",
      description: "Our commitment to protecting your privacy and legal agreements",
      icon: <FileText className="w-8 h-8" />,
      color: "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20",
      iconColor: "text-purple-400"
    },
    {
      href: "/legal/help",
      title: "Help Center",
      description: "Contact support, emergency assistance, and comprehensive help resources",
      icon: <Phone className="w-8 h-8" />,
      color: "border-red-500/50 bg-red-500/10 hover:bg-red-500/20",
      iconColor: "text-red-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/profile"
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Legal Center</h1>
              <p className="text-gray-400 text-sm">Policies, terms, and support resources</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Introduction */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Welcome to Kampo Ibayo Legal Center</h2>
              <p className="text-gray-300 leading-relaxed">
                Here you&apos;ll find all the important information about your stay, our policies, and how to get help when you need it. 
                We&apos;ve designed this section to be clear, comprehensive, and easily accessible.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Pages Grid - Staggered 3-2 Layout */}
        <div className="space-y-6">
          {/* Top Row - 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {legalPages.slice(0, 3).map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={`block p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${page.color}`}
              >
                <div className={`mb-4 ${page.iconColor}`}>
                  {page.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {page.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
          
          {/* Bottom Row - 2 Cards Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {legalPages.slice(3, 5).map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className={`block p-6 rounded-xl border transition-all duration-200 hover:scale-105 ${page.color}`}
              >
                <div className={`mb-4 ${page.iconColor}`}>
                  {page.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {page.title}
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {page.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">24/7 Support</h4>
            <p className="text-gray-300 text-sm">Emergency assistance available around the clock</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Guest Focused</h4>
            <p className="text-gray-300 text-sm">Policies designed with your comfort in mind</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-white mb-2">Transparent</h4>
            <p className="text-gray-300 text-sm">Clear terms with no hidden surprises</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Need Immediate Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white font-medium">Emergency Hotline</p>
                <p className="text-gray-300 text-sm">+63 966 281 5123</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">Live Chat Support</p>
                <p className="text-gray-300 text-sm">Available in Help Center</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}