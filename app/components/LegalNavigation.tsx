"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  Shield,
  CreditCard,
  FileText,
  Phone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

export default function LegalNavigation() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const legalPages = [
    {
      href: "/legal/faq",
      label: "FAQ",
      icon: <MessageCircle className="w-4 h-4" />,
      color: "text-blue-400",
    },
    {
      href: "/legal/house-rules",
      label: "House Rules",
      icon: <Shield className="w-4 h-4" />,
      color: "text-green-400",
    },
    {
      href: "/legal/cancellation",
      label: "Cancellation",
      icon: <CreditCard className="w-4 h-4" />,
      color: "text-orange-400",
    },
    {
      href: "/legal/terms",
      label: "Terms & Privacy",
      icon: <FileText className="w-4 h-4" />,
      color: "text-purple-400",
    },
    {
      href: "/legal/help",
      label: "Help Center",
      icon: <Phone className="w-4 h-4" />,
      color: "text-red-400",
    },
  ];

  const currentPageData = legalPages.find((page) => page.href === pathname);
  const otherPages = legalPages.filter((page) => page.href !== pathname);

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
      <div className="bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl overflow-hidden">
        {/* Current Page Indicator */}
        <div className="px-4 py-3 bg-gray-700/50 border-b border-gray-600/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {currentPageData && (
                <>
                  <span className={currentPageData.color}>
                    {currentPageData.icon}
                  </span>
                  <span className="text-white text-sm font-medium">
                    {currentPageData.label}
                  </span>
                </>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors p-2 min-w-[40px] min-h-[40px] flex items-center justify-center touch-manipulation rounded-lg hover:bg-gray-600/50"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        {isExpanded && (
          <div className="py-1">
            <Link
              href="/legal"
              className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors text-sm min-h-[44px] touch-manipulation"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              Legal Hub
            </Link>

            {otherPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="flex items-center gap-2 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors text-sm min-h-[44px] touch-manipulation"
              >
                <span className={page.color}>{page.icon}</span>
                {page.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
