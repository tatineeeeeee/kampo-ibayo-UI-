"use client";

import Link from "next/link";
import { ArrowLeft, Shield, FileText, AlertTriangle, Phone } from "lucide-react";
import LegalNavigation from "../../components/LegalNavigation";
import { useState } from "react";

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("terms");

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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
                <h1 className="text-lg sm:text-xl font-bold">Terms & Privacy</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Legal terms and privacy policy</p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              <span className="inline-block bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                Legal
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Quick Navigation */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-4 text-white">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button 
              onClick={() => scrollToSection('terms')}
              className={`p-3 rounded-lg transition-colors text-left ${activeSection === 'terms' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <FileText className="w-4 h-4 mb-1" />
              <div className="text-sm font-medium">Terms of Service</div>
            </button>
            <button 
              onClick={() => scrollToSection('privacy')}
              className={`p-3 rounded-lg transition-colors text-left ${activeSection === 'privacy' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <Shield className="w-4 h-4 mb-1" />
              <div className="text-sm font-medium">Privacy Policy</div>
            </button>
            <button 
              onClick={() => scrollToSection('liability')}
              className={`p-3 rounded-lg transition-colors text-left ${activeSection === 'liability' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <AlertTriangle className="w-4 h-4 mb-1" />
              <div className="text-sm font-medium">Liability</div>
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`p-3 rounded-lg transition-colors text-left ${activeSection === 'contact' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              <Phone className="w-4 h-4 mb-1" />
              <div className="text-sm font-medium">Contact</div>
            </button>
          </div>
        </div>

        {/* Last Updated Notice */}
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            <strong>Last Updated:</strong> October 1, 2025 | These terms are effective immediately and apply to all bookings.
          </p>
        </div>

        {/* Terms of Service */}
        <div id="terms" className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Terms of Service
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">1. Booking and Reservations</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>All bookings require a 50% deposit to secure reservation</li>
                <li>Remaining balance is due upon check-in</li>
                <li>Bookings are confirmed only after deposit payment and written confirmation</li>
                <li>Maximum occupancy is 15 guests; additional guests subject to approval and fees</li>
                <li>Check-in: 3:00 PM | Check-out: 1:00 PM (strictly enforced)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">2. Payment Terms</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Accepted payment methods: GCash, Maya, or Cash upon arrival</li>
                <li>All rates are in Philippine Peso (₱) and inclusive of applicable taxes</li>
                <li>Additional charges for damages, excess cleaning, or extra services apply</li>
                <li>Refunds processed according to our cancellation policy</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">3. Guest Responsibilities</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Guests must comply with all house rules and local regulations</li>
                <li>Responsible for conduct of all members in their party</li>
                <li>Must report any damages or issues immediately to management</li>
                <li>Liable for any damages to property, equipment, or facilities</li>
                <li>Must provide valid identification for all guests</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">4. Prohibited Activities</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Illegal drug use or possession of illegal substances</li>
                <li>Excessive alcohol consumption or disruptive behavior</li>
                <li>Smoking in enclosed areas (designated smoking areas available)</li>
                <li>Unauthorized parties or events beyond registered guest count</li>
                <li>Damage to property, theft, or inappropriate conduct</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">5. Force Majeure</h3>
              <p className="text-sm leading-relaxed">
                Kampo Ibayo Resort is not liable for inability to provide services due to circumstances beyond our control, including but not limited to natural disasters, government regulations, pandemics, or infrastructure failures. In such cases, we will work with guests to reschedule or provide appropriate compensation.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div id="privacy" className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <Shield className="w-6 h-6" />
            Privacy Policy
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Information We Collect</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li><strong>Personal Information:</strong> Name, email, phone number, address</li>
                <li><strong>Booking Information:</strong> Dates, guest count, special requests, payment details</li>
                <li><strong>Communication:</strong> Messages, emails, and call records for service improvement</li>
                <li><strong>Property Usage:</strong> Security footage, facility usage logs for safety purposes</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">How We Use Your Information</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Process and manage your bookings and reservations</li>
                <li>Communicate regarding your stay and provide customer support</li>
                <li>Send important updates about policies, safety, or service changes</li>
                <li>Improve our services and facilities based on guest feedback</li>
                <li>Comply with legal requirements and safety regulations</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Information Sharing</h3>
              <p className="text-sm leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to third parties. We may share information only in these circumstances:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>With trusted service providers (payment processors, cleaning services) under strict confidentiality</li>
                <li>In case of emergency situations affecting guest safety</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Data Security</h3>
              <p className="text-sm leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes secure data transmission, encrypted storage, and limited access to authorized personnel only.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Your Rights</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Access and review your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>File complaints with relevant data protection authorities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Liability and Disclaimers */}
        <div id="liability" className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            Liability and Disclaimers
          </h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Guest Safety and Responsibility</h3>
              <p className="text-sm leading-relaxed mb-3">
                Guests use all facilities at their own risk. Kampo Ibayo Resort provides facilities in good condition but is not liable for:
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>Accidents, injuries, or incidents during recreational activities</li>
                <li>Personal property loss, theft, or damage</li>
                <li>Medical emergencies or health issues</li>
                <li>Injuries resulting from failure to follow posted safety guidelines</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Property and Equipment</h3>
              <ul className="space-y-2 list-disc list-inside text-sm leading-relaxed">
                <li>All equipment and facilities provided &quot;as-is&quot; without warranty</li>
                <li>Guests must inspect and report any issues immediately upon arrival</li>
                <li>Resort not liable for equipment malfunction or service interruptions</li>
                <li>Swimming pool, adventure areas, and all activities are at guest&apos;s own risk</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 text-white">Travel and Transportation</h3>
              <p className="text-sm leading-relaxed">
                The resort is not responsible for transportation to or from the property, travel delays, or any incidents that occur outside the resort premises. Guests are advised to secure appropriate travel insurance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div id="contact" className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center gap-3">
            <Phone className="w-6 h-6" />
            Legal Contact Information
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-300 text-sm leading-relaxed">
              For questions about these terms, privacy concerns, or legal matters, please contact us:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">General Inquiries</h4>
                <p className="text-gray-300 text-sm mb-1">Email: kampoibayo@gmail.com</p>
                <p className="text-gray-300 text-sm">Phone: 0917-654-3210</p>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Legal & Privacy Officer</h4>
                <p className="text-gray-300 text-sm mb-1">Email: legal@kampoibayo.com</p>
                <p className="text-gray-300 text-sm">Response time: 48-72 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Agreement Acknowledgment */}
        {/* Agreement Section */}
        <div className="bg-green-900/20 border border-green-700/50 rounded-xl p-4 sm:p-6 text-center">
          <h3 className="text-xl font-semibold mb-3 text-red-400">Agreement Acknowledgment</h3>
          <p className="text-gray-300 mb-4">
            By making a reservation or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms and privacy policy.
          </p>
        </div>
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
