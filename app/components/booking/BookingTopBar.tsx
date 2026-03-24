"use client";

import Link from "next/link";
import Image from "next/image";
import { FaHome, FaUser } from "react-icons/fa";

interface BookingTopBarProps {
  loading: boolean;
  isSignedIn: boolean;
}

export default function BookingTopBar({
  loading,
  isSignedIn,
}: BookingTopBarProps) {
  return (
    <div className="sticky top-0 bg-background/90 backdrop-blur-sm border-b border-border z-20">
      <div className="px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-muted hover:bg-secondary rounded-lg transition-colors"
            >
              <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 relative">
                  <Image
                    src="/logo.png"
                    alt="Kampo Ibayo Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  Kampo Ibayo
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Booking Portal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-muted hover:bg-secondary rounded-lg transition-colors"
            >
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </Link>
            <div className="text-xs sm:text-sm text-right">
              {loading ? (
                <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                  ● Loading...
                </span>
              ) : isSignedIn ? (
                <span className="inline-block bg-success/20 text-success px-2 py-1 rounded-full text-xs font-semibold border border-success/30">
                  ● Signed In
                </span>
              ) : (
                <span className="inline-block bg-warning/20 text-warning px-2 py-1 rounded-full text-xs font-semibold border border-warning/30">
                  ● Guest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
