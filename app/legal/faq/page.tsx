"use client";

import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, Phone, Search, Clock, Users, MapPin } from "lucide-react";
import { useState } from "react";
import LegalNavigation from "../../components/LegalNavigation";

export default function FAQPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqData = [
    {
      category: "Booking & Reservations",
      icon: <Clock className="w-5 h-5" />,
      color: "blue",
      faqs: [
        {
          question: "How do I make a reservation?",
          answer: "You can book through our website, call us at 0917-654-3210, or message us on Facebook. We require a 50% deposit to secure your booking, with the remaining balance due upon check-in."
        },
        {
          question: "How far in advance should I book?",
          answer: "We recommend booking at least 2-3 weeks in advance, especially for weekends and holidays. Peak season (December-May) books up quickly, so early reservation is advised."
        },
        {
          question: "What are your rates and what's included?",
          answer: "Weekday rates: ₱8,000 (Mon-Thu) | Weekend/Holiday rates: ₱12,000 (Fri-Sun). Includes 22-hour stay for up to 15 guests, all amenities, parking, WiFi, and utilities. Food and personal items not included."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept cash, GCash, bank transfers, and major credit cards. A 50% deposit is required upon booking confirmation, with the balance payable upon arrival."
        },
        {
          question: "Can I modify or cancel my reservation?",
          answer: "Modifications are subject to availability. Cancellation policy varies by timing: 60+ days (90% refund), 30-59 days (75% refund), 7-29 days (50% refund), under 7 days (25% refund)."
        }
      ]
    },
    {
      category: "Accommodation & Facilities",
      icon: <Users className="w-5 h-5" />,
      color: "green",
      faqs: [
        {
          question: "What accommodation options are available?",
          answer: "We offer 2 air-conditioned family rooms (8 guests each), camping area with treehouse access, and additional open spaces. All rooms have private bathrooms with hot/cold showers."
        },
        {
          question: "What amenities are included?",
          answer: "Swimming pool, videoke system, arcade machine, fully equipped kitchen, gazebo dining area, hanging bridge adventure area, free WiFi, parking, and 24/7 electricity and water."
        },
        {
          question: "Is there a kitchen for cooking?",
          answer: "Yes, we provide a fully equipped kitchen with gas stove, refrigerator, cooking utensils, and dining area. You're welcome to bring your own food or arrange catering services through us."
        },
        {
          question: "Do you provide bedding and towels?",
          answer: "Basic bedding is provided in family rooms. We recommend bringing personal towels, though limited towels are available upon request for guests who forget them."
        },
        {
          question: "Is WiFi available throughout the resort?",
          answer: "Yes, complimentary WiFi is available in all areas. Cell signal strength varies by provider but is generally reliable throughout the property."
        }
      ]
    },
    {
      category: "Policies & Guidelines",
      icon: <MapPin className="w-5 h-5" />,
      color: "purple",
      faqs: [
        {
          question: "What are your check-in and check-out times?",
          answer: "Check-in: 3:00 PM | Check-out: 1:00 PM. Early check-in and late check-out may be available upon request, subject to availability and potential additional charges."
        },
        {
          question: "Are pets allowed at the resort?",
          answer: "Yes! We're pet-friendly and welcome well-behaved pets. They must be supervised at all times, kept leashed in common areas, and owners are responsible for cleanup. Additional cleaning fees may apply."
        },
        {
          question: "What are your quiet hours?",
          answer: "Quiet hours are 10:00 PM to 7:00 AM. During this time, please minimize noise, turn off videoke/music systems, and respect other guests and neighboring properties."
        },
        {
          question: "What items are prohibited?",
          answer: "Prohibited: illegal substances, weapons, fireworks, excessive alcohol, and any items that may disturb other guests or damage property. Complete list available in house rules."
        },
        {
          question: "What happens if property is damaged?",
          answer: "Guests are responsible for any damages during their stay. Damage costs will be assessed and charged accordingly. We conduct property inspections during check-out."
        }
      ]
    },
    {
      category: "Location & Transportation",
      icon: <MapPin className="w-5 h-5" />,
      color: "orange",
      faqs: [
        {
          question: "Where exactly is the resort located?",
          answer: "We're located in General Trias, Cavite, approximately 1.5 hours from Manila. Exact address and detailed directions are provided upon booking confirmation for security reasons."
        },
        {
          question: "Is parking available?",
          answer: "Yes, free on-site parking is available for all guests. The parking area accommodates cars, vans, and small buses with 24/7 security monitoring."
        },
        {
          question: "How do I get to the resort?",
          answer: "The resort is accessible by private vehicle. We provide detailed directions, GPS coordinates, and landmark references with your booking confirmation. Public transport options available upon request."
        },
        {
          question: "Are there nearby conveniences?",
          answer: "Grocery stores, restaurants, gas stations, and ATMs are within a 10-15 minute drive. We can provide directions to local establishments and recommendations upon request."
        }
      ]
    },
    {
      category: "Support & Assistance",
      icon: <Phone className="w-5 h-5" />,
      color: "red",
      faqs: [
        {
          question: "How can I contact the resort during my stay?",
          answer: "For emergencies: 0917-654-3210. For general inquiries: kampoibayo@gmail.com or Facebook message. On-site staff are available during business hours for immediate assistance."
        },
        {
          question: "What if I have special dietary requirements?",
          answer: "Please inform us of any dietary restrictions when booking. While we don't provide meals, we can recommend local catering services that accommodate special dietary needs."
        },
        {
          question: "Is the resort suitable for elderly guests or those with mobility issues?",
          answer: "The main facilities are accessible, though some areas like the hanging bridge may not be suitable for guests with mobility limitations. Please discuss specific needs when booking."
        },
        {
          question: "What should I do in case of an emergency?",
          answer: "Call our emergency number immediately: 0917-654-3210. For medical emergencies, call 911. The nearest hospital is 20 minutes away. We maintain first aid supplies on-site."
        }
      ]
    }
  ];

  const filteredFAQs = faqData.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

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
                <h1 className="text-lg sm:text-xl font-bold">Frequently Asked Questions</h1>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">Find answers to common questions</p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-right">
              <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                FAQ
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        {/* Search Bar */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredFAQs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50">
              <h2 className={`text-2xl font-bold mb-6 text-${category.color}-400 flex items-center gap-3`}>
                {category.icon}
                {category.category}
              </h2>
              
              <div className="space-y-3">
                {category.faqs.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openFAQ === globalIndex;
                  
                  return (
                    <div key={faqIndex} className="border border-gray-700 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleFAQ(globalIndex)}
                        className="w-full px-4 py-4 text-left bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-white pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-red-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-4 py-4 bg-gray-800/50 border-t border-gray-700">
                          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {searchQuery && filteredFAQs.length === 0 && (
          <div className="bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-gray-700/50 text-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-300">No results found</h3>
            <p className="text-gray-400">Try different keywords or contact us directly for assistance.</p>
          </div>
        )}
      </div>

      {/* Legal Navigation Widget */}
      <LegalNavigation />
    </div>
  );
}
