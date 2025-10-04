"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  ChevronUp,
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  BookOpen,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircleHeart,
  ArrowRight,
  CreditCard,
  Facebook,
  Instagram,
  Youtube,
  Leaf,
  Mountain,
  Star,
  Shield,
  Users,
  Award,
  CalendarDays
} from "lucide-react";
import { FaHome, FaGamepad, FaUtensils, FaMapMarkedAlt } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useAuth } from "./contexts/AuthContext";
import { TrustBadges, EnhancedGallery } from "./components/EnhancedComponents";
import Chatbot from "./components/Chatbot";
import ReviewSystem from "./components/ReviewSystem";

// ----------------- Navbar -----------------
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [profileMenu, setProfileMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Use global auth context instead of local state
  const { user, userRole, loading: isLoadingAuth } = useAuth();

  const menuItems = useMemo(
    () => [
      { name: "Home", href: "#home" },
      { name: "About", href: "#about" },
      { name: "Amenities", href: "#amenities" },
      { name: "Gallery", href: "#gallery" },
      { name: "Reviews", href: "#reviews" },
      { name: "Contact", href: "#contact" }
    ],
    []
  );

  // Ensure component is mounted before showing auth-dependent UI
  useEffect(() => {
    // Small delay to ensure proper hydration
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map((item) =>
        document.getElementById(item.href.substring(1))
      );
      const scrollPos = window.scrollY + 200;
      for (const section of sections) {
        if (section) {
          if (
            scrollPos >= section.offsetTop &&
            scrollPos < section.offsetTop + section.offsetHeight
          ) {
            setActiveSection(section.id);
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuItems]);

  return (
    <nav className="bg-gray-900/90 backdrop-blur text-white shadow-md w-full fixed top-0 left-0 z-50 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 sm:h-16 items-center">
        {/* Logo */}
        <Link href="#home" className="flex items-center space-x-2">
          <div className="w-8 h-8 relative">
            <Image
              src="/logo.png"
              alt="Kampo Ibayo Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-lg sm:text-xl font-bold text-red-500">Kampo</span>
            <span className="text-lg sm:text-xl font-bold text-white">Ibayo</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={`hover:text-red-500 transition-colors text-sm lg:text-base ${
                activeSection === item.href.substring(1) ? "text-red-500" : ""
              }`}
            >
              {item.name}
            </a>
          ))}

          {/* Auth Buttons */}
          {!isMounted ? (
            <div className="px-3 lg:px-4 py-1 bg-red-500 rounded opacity-50 text-sm lg:text-base">
              Login
            </div>
          ) : isLoadingAuth ? (
            <div className="px-3 py-1 bg-gray-700 rounded animate-pulse">
              <div className="w-12 h-4 bg-gray-600 rounded"></div>
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm lg:text-base transition-colors"
              >
                {userRole === "admin" ? "👑 Admin" : "☰"}
              </button>

              {profileMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow-lg overflow-hidden">
                  {userRole === "admin" ? (
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      👑 Admin Panel
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        <UserIcon className="w-4 h-4 mr-2" /> Profile
                      </Link>
                      <Link
                        href="/bookings"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        <BookOpen className="w-4 h-4 mr-2" /> My Bookings
                      </Link>
                      <Link
                        href="/review"
                        className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        <MessageCircleHeart className="w-4 h-4 mr-2" /> Leave Review
                      </Link>
                    </>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        // Check if there's a session first
                        const { data: { session } } = await supabase.auth.getSession();
                        
                        if (session) {
                          // Only try to sign out if there's a session
                          const { error } = await supabase.auth.signOut();
                          
                          if (error) {
                            console.error('Sign out error:', error);
                            // Don't return on error, continue with cleanup
                          }
                        }
                        
                        // Clear local storage and session storage
                        if (typeof window !== 'undefined') {
                          localStorage.clear();
                          sessionStorage.clear();
                        }
                        
                        setProfileMenu(false);
                      } catch (error) {
                        console.error('Logout error:', error);
                        setProfileMenu(false);
                        // Still clear storage even on error
                        if (typeof window !== 'undefined') {
                          localStorage.clear();
                          sessionStorage.clear();
                        }
                      }
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <button className="px-3 lg:px-4 py-1 bg-red-500 rounded hover:bg-red-600 text-sm lg:text-base transition-colors">
                Login
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white text-xl focus:outline-none p-1"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 px-4 pb-3 space-y-1 border-t border-gray-700">
          {/* Main Navigation */}
          <div className="py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">Navigation</p>
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`block py-2 px-2 hover:text-red-500 transition-colors text-sm rounded ${
                  activeSection === item.href.substring(1) ? "text-red-500 bg-gray-800" : ""
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* User Account Section */}
          {!isMounted ? (
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">Account</p>
              <Link href="/auth" onClick={() => setIsOpen(false)}>
                <button className="w-full text-left px-2 py-2 bg-red-500 rounded hover:bg-red-600 text-sm opacity-50">
                  Sign In / Register
                </button>
              </Link>
            </div>
          ) : isLoadingAuth ? (
            <div className="border-t border-gray-700 pt-2">
              <div className="px-2 py-2 bg-gray-700 rounded animate-pulse">
                <div className="w-20 h-4 bg-gray-600 rounded"></div>
              </div>
            </div>
          ) : user ? (
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">Account</p>
              <div className="space-y-1">
                {userRole === "admin" ? (
                  <Link
                    href="/admin"
                    className="flex items-center px-2 py-2 hover:text-red-500 hover:bg-gray-800 rounded text-sm transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-2">👑</span> Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center px-2 py-2 hover:text-red-500 hover:bg-gray-800 rounded text-sm transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserIcon className="w-4 h-4 mr-2" /> My Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="flex items-center px-2 py-2 hover:text-red-500 hover:bg-gray-800 rounded text-sm transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" /> My Bookings
                    </Link>
                  </>
                )}
                <button
                  onClick={async () => {
                    try {
                      // Check if there's a session first
                      const { data: { session } } = await supabase.auth.getSession();
                      
                      if (session) {
                        // Only try to sign out if there's a session
                        const { error } = await supabase.auth.signOut();
                        
                        if (error) {
                          console.error('Sign out error:', error);
                          // Don't return on error, continue with cleanup
                        }
                      }
                      
                      // Clear local storage and session storage
                      if (typeof window !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                      }
                      
                      setIsOpen(false);
                    } catch (error) {
                      console.error('Logout error:', error);
                      setIsOpen(false);
                      // Still clear storage even on error
                      if (typeof window !== 'undefined') {
                        localStorage.clear();
                        sessionStorage.clear();
                      }
                    }
                  }}
                  className="flex items-center w-full text-left px-2 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-2">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-2">Account</p>
              <Link href="/auth" onClick={() => setIsOpen(false)}>
                <button className="w-full text-left px-2 py-2 bg-red-500 rounded hover:bg-red-600 text-sm transition-colors">
                  Sign In / Register
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

// ----------------- Home Page -----------------
function Home() {
  const router = useRouter();
  const { user, loading: isLoadingAuth } = useAuth();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityGuideOpen, setAvailabilityGuideOpen] = useState(true); // Open by default on desktop
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    console.log('🗓️ Initializing currentMonth to:', now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    return now;
  });
  const [loading, setLoading] = useState(false);
  // Store actual booking data for proper date type determination
  const [existingBookings, setExistingBookings] = useState<{
    check_in_date: string;
    check_out_date: string;
    status: string | null;
  }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [monthCache, setMonthCache] = useState<{[key: string]: string[]}>({});

  // Fetch booked dates from database with caching
  const fetchBookedDates = useCallback(async (month: Date) => {
    const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
    
    // Always fetch fresh data - remove cache for now to debug
    // if (monthCache[monthKey]) {
    //   setBookedDates(monthCache[monthKey]);
    //   return;
    // }

    setLoading(true);
    try {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        // Helper to format local date as YYYY-MM-DD (avoid timezone shifts)
        const toYMD = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const da = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${da}`;
        };
      
      console.log(`🔍 Fetching bookings for month: ${month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
      console.log(`📅 Date range: ${toYMD(startOfMonth)} to ${toYMD(endOfMonth)}`);

      // HOMEPAGE: Show BOTH confirmed AND pending bookings for availability display
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('check_in_date, check_out_date, status')
        .in('status', ['confirmed', 'pending']) // Show both confirmed and pending bookings
        .or(`and(check_in_date.gte.${toYMD(startOfMonth)},check_in_date.lte.${toYMD(endOfMonth)}),and(check_out_date.gte.${toYMD(startOfMonth)},check_out_date.lte.${toYMD(endOfMonth)}),and(check_in_date.lte.${toYMD(startOfMonth)},check_out_date.gte.${toYMD(endOfMonth)})`)
        .limit(50); // Reasonable limit

      if (error) {
        console.error('Error fetching bookings:', error);
        setExistingBookings([]);
        return;
      }

      console.log('📅 Fetched bookings:', bookings);

      // Store the actual booking data for date type determination
      setExistingBookings(bookings || []);

      // NEW LOGIC: Count check-ins AND checkouts for same-day turnover capacity
      const checkInCounts = new Map<string, number>();
      const checkOutCounts = new Map<string, number>();

      bookings?.forEach((booking, bookingIndex) => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        
        const checkInDate = toYMD(checkIn);
        const checkOutDate = toYMD(checkOut);

        console.log(`🔒 Processing booking ${bookingIndex + 1}: check-in ${checkInDate}, check-out ${checkOutDate}`);

        // Count check-ins for the displayed month
        if (checkIn.getMonth() === month.getMonth() && checkIn.getFullYear() === month.getFullYear()) {
          const prev = checkInCounts.get(checkInDate) || 0;
          checkInCounts.set(checkInDate, prev + 1);
          console.log(`� Check-in ${checkInDate}: ${prev + 1} arrivals (from booking ${bookingIndex + 1})`);
        }
        
        // Count check-outs for the displayed month (same-day turnover availability)
        if (checkOut.getMonth() === month.getMonth() && checkOut.getFullYear() === month.getFullYear()) {
          const prevCheckOuts = checkOutCounts.get(checkOutDate) || 0;
          checkOutCounts.set(checkOutDate, prevCheckOuts + 1);
          console.log(`📤 Check-out ${checkOutDate}: ${prevCheckOuts + 1} departures (from booking ${bookingIndex + 1})`);
        }
      });

      // Save per-day counts for UI indicators (combine check-ins and check-outs for same-day turnover display)
      const countsObj: Record<string, number> = {};
      
      // Count check-ins (guests arriving - takes up capacity)
      for (const [k, v] of checkInCounts.entries()) {
        countsObj[k] = (countsObj[k] || 0) + v;
      }
      
      // Count check-outs (guests leaving - shows turnover activity and enables same-day bookings)
      // When there's both check-in and check-out on same date, it shows full capacity utilization
      for (const [k, v] of checkOutCounts.entries()) {
        countsObj[k] = (countsObj[k] || 0) + v; // Add check-outs to show total daily activity
      }
      
      console.log('📊 Check-in counts for month (for UI display):', countsObj);
      console.log('� Check-out counts for month (for same-day turnover):', Object.fromEntries(checkOutCounts));
      // setDayCounts(countsObj); // Removed since we're using React DatePicker

      // Only mark dates as unavailable when check-in capacity (2) is reached or exceeded
      const bookedArray = Array.from(checkInCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([date]) => date);

      console.log('🚫 Fully booked (check-in capacity reached) dates:', bookedArray);
      
      // Cache the result (we can keep for future optimization)
      setMonthCache(prev => ({ ...prev, [monthKey]: bookedArray }));
    } catch (error) {
      console.error('Error fetching booked dates:', error);
      // Fallback to empty on error
      // setDayCounts({}); // Removed since we're using React DatePicker
    } finally {
      setLoading(false);
    }
  }, []); // Remove monthCache dependency for now

  // Fetch booked dates when modal opens or month changes
  useEffect(() => {
    if (showAvailabilityModal) {
      console.log('🚀 Modal opened or month changed, fetching data for:', currentMonth);
      fetchBookedDates(currentMonth);
    }
  }, [showAvailabilityModal, currentMonth, fetchBookedDates]);

  // Navigation functions
  // const goToPreviousMonth = () => {
  //   const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  //   if (!isMonthOutOfRange(prevMonth)) {
  //     setCurrentMonth(prevMonth);
  //   }
  // };

  // const goToNextMonth = () => {
  //   const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  //   if (!isMonthOutOfRange(nextMonth)) {
  //     setCurrentMonth(nextMonth);
  //   }
  // };

  // Generate calendar days for current month (dynamic rows for better appearance)
  /*
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add previous month's trailing days to fill the first week
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false
      });
    }

    // Days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day: day,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false
      });
    }

    // Add next month's leading days to complete the last week
    const remainingCells = 7 - (days.length % 7);
    if (remainingCells < 7) {
      for (let day = 1; day <= remainingCells; day++) {
        days.push({
          day: day,
          isCurrentMonth: false,
          isPrevMonth: false,
          isNextMonth: true
        });
      }
    }

    return days;
  };
  */

  // Calculate date capacity and type for visual indicators (EXACT same as booking page)
  const getDateCapacity = (date: Date) => {
    // Don't show capacity indicators for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return ''; // Past dates should appear normal
    }
    
    const activeBookings = existingBookings.filter(booking => 
      booking.status === 'confirmed' || booking.status === 'pending'
    );
    
    // Normalize date for comparison (remove time component)
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    let isCheckIn = false;
    let isCheckOut = false;
    let isOccupied = false;
    
    activeBookings.forEach(booking => {
      const checkIn = new Date(booking.check_in_date);
      checkIn.setHours(0, 0, 0, 0);
      
      const checkOut = new Date(booking.check_out_date);
      checkOut.setHours(0, 0, 0, 0);
      
      // Check if this date is a check-in date
      if (targetDate.getTime() === checkIn.getTime()) {
        isCheckIn = true;
      }
      
      // Check if this date is a check-out date
      if (targetDate.getTime() === checkOut.getTime()) {
        isCheckOut = true;
      }
      
      // Check if this date is between check-in and check-out (occupied)
      if (targetDate > checkIn && targetDate < checkOut) {
        isOccupied = true;
      }
    });
    
    // Determine the appropriate indicator (same logic as booking page)
    if (isCheckIn && isCheckOut) {
      return 'same-day'; // Same day check-in and check-out (1-day stay)
    } else if (isCheckIn) {
      return 'checkin';
    } else if (isCheckOut) {
      return 'checkout';
    } else if (isOccupied) {
      return 'occupied';
    }
    
    return '';
  };

  /*
  // Check if a date is in the past
  const isDatePast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if a date is today
  const isDateToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if a date is beyond reasonable booking window (2 years)
  const isDateTooFar = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const maxBookingDate = new Date();
    maxBookingDate.setFullYear(maxBookingDate.getFullYear() + 2); // 2 years from now
    return date > maxBookingDate;
  };

  // Check if month/year is beyond booking limits
  const isMonthOutOfRange = (month: Date) => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    return monthEnd < today || monthStart > maxDate;
  };
  */

  // Get booking policy message
  const getBookingPolicyMessage = () => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 2;
    return `Bookings are available from today through ${maxYear}. For longer-term reservations, please contact us directly.`;
  };

  // Check for admin role and redirect
  useEffect(() => {
    const checkAdminAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("auth_id", session.user.id);

        const user = userData?.[0];
        if (user?.role === "admin") {
          console.log("Admin detected, redirecting to admin dashboard...");
          router.push("/admin");
          return;
        }
      }
    };

    checkAdminAndRedirect();
  }, [router]);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleBackToTopScroll = () => {
      setShowBackToTop(window.scrollY > 200); // Reduced threshold from 300 to 200px
    };
    window.addEventListener("scroll", handleBackToTopScroll);
    return () => window.removeEventListener("scroll", handleBackToTopScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        .react-datepicker {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
          border: 2px solid #374151 !important;
          color: white !important;
          font-family: inherit !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2) !important;
          min-height: 300px !important;
          max-height: 420px !important;
          height: auto !important;
          overflow: hidden !important;
          width: 100% !important;
        }
        
        /* Ultra-small screens (320px phones) optimizations */
        @media (max-width: 374px) {
          .react-datepicker {
            min-height: 280px !important;
            border-radius: 0.375rem !important;
          }
          
          .react-datepicker__month-container {
            min-height: 220px !important;
          }
          
          .react-datepicker__month {
            min-height: 180px !important;
          }
          
          .react-datepicker__week {
            height: 2rem !important;
          }
          
          .react-datepicker__day,
          .react-datepicker__day-name {
            width: 2rem !important;
            height: 2rem !important;
            line-height: 2rem !important;
            font-size: 0.625rem !important;
            margin: 0.0625rem !important;
          }
          
          .react-datepicker__current-month {
            font-size: 0.875rem !important;
            margin-bottom: 0.375rem !important;
          }
          
          .react-datepicker__header {
            padding: 0.5rem 0 !important;
          }
          
          .react-datepicker__navigation {
            top: 0.5rem !important;
            border-width: 5px !important;
          }
          
          .react-datepicker__navigation--previous {
            left: 0.5rem !important;
          }
          
          .react-datepicker__navigation--next {
            right: 0.5rem !important;
          }
        }
        
        @media (min-width: 480px) {
          .react-datepicker {
            min-height: 350px !important;
            border-radius: 0.75rem !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker {
            min-height: 380px !important;
            border-radius: 1rem !important;
          }
        }
        
        @media (min-width: 768px) {
          .react-datepicker {
            min-height: 420px !important;
          }
        }
        .react-datepicker__month-container {
          min-height: 240px !important;
          max-height: 360px !important;
          height: auto !important;
          width: 100% !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__month-container {
            min-height: 290px !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__month-container {
            min-height: 320px !important;
          }
        }
        
        @media (min-width: 768px) {
          .react-datepicker__month-container {
            min-height: 360px !important;
          }
        }
        
        .react-datepicker__month {
          min-height: 200px !important;
          max-height: 300px !important;
          height: auto !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__month {
            min-height: 250px !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__month {
            min-height: 280px !important;
          }
        }
        
        @media (min-width: 768px) {
          .react-datepicker__month {
            min-height: 300px !important;
          }
        }
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
          align-items: center !important;
          height: 2.5rem !important;
          width: 100% !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__week {
            height: 3rem !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__week {
            height: 3.5rem !important;
          }
        }
        .react-datepicker__header {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          border-bottom: none !important;
          border-radius: 0.5rem 0.5rem 0 0 !important;
          padding: 0.75rem 0 !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__header {
            padding: 1rem 0 !important;
            border-radius: 0.75rem 0.75rem 0 0 !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__header {
            padding: 1.25rem 0 !important;
            border-radius: 1rem 1rem 0 0 !important;
          }
        }
        
        .react-datepicker__current-month {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1rem !important;
          margin-bottom: 0.5rem !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__current-month {
            font-size: 1.1rem !important;
            margin-bottom: 0.75rem !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__current-month {
            font-size: 1.2rem !important;
            margin-bottom: 1rem !important;
          }
        }
        
        @media (min-width: 768px) {
          .react-datepicker__current-month {
            font-size: 1.3rem !important;
          }
        }
        .react-datepicker__day-name {
          color: rgba(255, 255, 255, 0.9) !important;
          font-weight: 600 !important;
          font-size: 0.75rem !important;
          width: 2.25rem !important;
          height: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0.125rem !important;
          display: inline-block !important;
          text-align: center !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day-name {
            font-size: 0.875rem !important;
            width: 2.5rem !important;
            height: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 0.1875rem !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__day-name {
            font-size: 1rem !important;
            width: 3rem !important;
            height: 3rem !important;
            line-height: 3rem !important;
            margin: 0.25rem !important;
          }
        }
        
        .react-datepicker__day {
          color: white !important;
          border-radius: 0.375rem !important;
          margin: 0.125rem !important;
          border: none !important;
          width: 2.25rem !important;
          height: 2.25rem !important;
          line-height: 2.25rem !important;
          font-size: 0.75rem !important;
          transition: all 0.2s ease !important;
          display: inline-block !important;
          text-align: center !important;
          touch-action: manipulation !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day {
            width: 2.5rem !important;
            height: 2.5rem !important;
            line-height: 2.5rem !important;
            font-size: 0.875rem !important;
            margin: 0.1875rem !important;
            border-radius: 0.5rem !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__day {
            width: 3rem !important;
            height: 3rem !important;
            line-height: 3rem !important;
            font-size: 1rem !important;
            margin: 0.25rem !important;
            border-radius: 0.5rem !important;
          }
        }
        .react-datepicker__day:hover {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3) !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          color: white !important;
          font-weight: 700 !important;
          box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.5) !important;
        }
        .react-datepicker__day--in-range {
          background: rgba(220, 38, 38, 0.3) !important;
          color: white !important;
        }
        .react-datepicker__day--excluded {
          color: #6b7280 !important;
          text-decoration: line-through !important;
          background-color: #1f2937 !important;
          opacity: 0.5 !important;
        }
        .react-datepicker__day--excluded:hover {
          background-color: #1f2937 !important;
          cursor: not-allowed !important;
          transform: none !important;
        }
        
        /* Override today styling to look normal */
        .react-datepicker__day--today {
          background: transparent !important;
          color: white !important;
          font-weight: normal !important;
          border: none !important;
        }
        .react-datepicker__day--today:hover {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%) !important;
          transform: scale(1.05) !important;
          box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3) !important;
        }
        .react-datepicker__day--disabled {
          color: #4b5563 !important;
          background-color: transparent !important;
          opacity: 0.3 !important;
        }
        
        /* Selected dates override all other states */
        .react-datepicker__day--selected {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
          border: 2px solid #1e40af !important;
        }
        .react-datepicker__day--selected:hover {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--selected::after {
          content: 'SELECTED' !important;
          position: absolute !important;
          bottom: 2px !important;
          right: 2px !important;
          font-size: 6px !important;
          background: rgba(0,0,0,0.7) !important;
          color: white !important;
          padding: 1px 2px !important;
          border-radius: 2px !important;
          line-height: 1 !important;
        }
        
        .react-datepicker__day--same-day {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--same-day:hover {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--same-day::after {
          content: 'FULL DAY' !important;
          position: absolute !important;
          bottom: 1px !important;
          right: 1px !important;
          font-size: 8px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
          line-height: 1.2 !important;
          font-weight: 600 !important;
        }
        
        /* Custom capacity indicator classes */
        .react-datepicker__day--checkin {
          background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--checkin:hover {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--checkin::after {
          content: 'CHECK-IN' !important;
          position: absolute !important;
          bottom: 1px !important;
          right: 1px !important;
          font-size: 8px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
          line-height: 1.2 !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--checkout {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--checkout:hover {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--checkout::after {
          content: 'CHECK-OUT' !important;
          position: absolute !important;
          bottom: 1px !important;
          right: 1px !important;
          font-size: 7px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
          line-height: 1.2 !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--occupied {
          background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%) !important;
          color: white !important;
          font-weight: 600 !important;
          position: relative !important;
        }
        .react-datepicker__day--occupied:hover {
          background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%) !important;
          transform: scale(1.05) !important;
        }
        .react-datepicker__day--occupied::after {
          content: 'OCCUPIED' !important;
          position: absolute !important;
          bottom: 1px !important;
          right: 1px !important;
          font-size: 8px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 1px 3px !important;
          border-radius: 3px !important;
          line-height: 1.2 !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--same-day::after,
        .react-datepicker__day--checkin::after,
        .react-datepicker__day--checkout::after,
        .react-datepicker__day--occupied::after {
          position: absolute !important;
          bottom: 0px !important;
          right: 0px !important;
          font-size: 4px !important;
          background: rgba(0,0,0,0.8) !important;
          color: white !important;
          padding: 0.5px 1px !important;
          border-radius: 1px !important;
          line-height: 1 !important;
          font-weight: 600 !important;
          max-width: 100% !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
        }
        
        /* Mobile responsive text sizing */
        @media (max-width: 479px) {
          .react-datepicker__day--same-day::after,
          .react-datepicker__day--checkin::after,
          .react-datepicker__day--checkout::after,
          .react-datepicker__day--occupied::after {
            font-size: 4px !important;
            padding: 0.5px 1px !important;
            border-radius: 1px !important;
          }
        }
        
        @media (min-width: 480px) and (max-width: 639px) {
          .react-datepicker__day--same-day::after,
          .react-datepicker__day--checkin::after,
          .react-datepicker__day--checkout::after,
          .react-datepicker__day--occupied::after {
            font-size: 5px !important;
            padding: 1px 1.5px !important;
            border-radius: 1.5px !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 767px) {
          .react-datepicker__day--same-day::after,
          .react-datepicker__day--checkin::after,
          .react-datepicker__day--checkout::after,
          .react-datepicker__day--occupied::after {
            font-size: 6px !important;
            padding: 1px 2px !important;
            border-radius: 2px !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .react-datepicker__day--same-day::after,
          .react-datepicker__day--checkin::after,
          .react-datepicker__day--checkout::after,
          .react-datepicker__day--occupied::after {
            font-size: 7px !important;
            padding: 1px 3px !important;
            border-radius: 2px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .react-datepicker__day--same-day::after,
          .react-datepicker__day--checkin::after,
          .react-datepicker__day--occupied::after {
            font-size: 8px !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
          }
          .react-datepicker__day--checkout::after {
            font-size: 7px !important;
            padding: 2px 3px !important;
            border-radius: 3px !important;
          }
        }
        
        /* Specific content for each status */
        .react-datepicker__day--same-day::after {
          content: 'FULL' !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day--same-day::after {
            content: 'FULL DAY' !important;
          }
        }
        
        .react-datepicker__day--checkin::after {
          content: 'IN' !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day--checkin::after {
            content: 'CHECK-IN' !important;
          }
        }
        
        .react-datepicker__day--checkout::after {
          content: 'OUT' !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day--checkout::after {
            content: 'CHECK-OUT' !important;
          }
        }
        
        .react-datepicker__day--occupied::after {
          content: 'BUSY' !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__day--occupied::after {
            content: 'OCCUPIED' !important;
          }
        }
        
        .react-datepicker__navigation {
          top: 0.75rem !important;
          border-width: 6px !important;
        }
        
        @media (min-width: 480px) {
          .react-datepicker__navigation {
            top: 1rem !important;
            border-width: 7px !important;
          }
        }
        
        @media (min-width: 640px) {
          .react-datepicker__navigation {
            top: 1.2rem !important;
            border-width: 8px !important;
          }
        }
        
        .react-datepicker__navigation--previous {
          border-right-color: white !important;
          left: 0.75rem !important;
        }
        
        @media (min-width: 640px) {
          .react-datepicker__navigation--previous {
            left: 1rem !important;
          }
        }
        
        .react-datepicker__navigation--next {
          border-left-color: white !important;
          right: 0.75rem !important;
        }
        
        @media (min-width: 640px) {
          .react-datepicker__navigation--next {
            right: 1rem !important;
          }
        }
        
        /* Make calendar read-only for availability display with enhanced touch responsiveness */
        .react-datepicker__day:not(.react-datepicker__day--checkin):not(.react-datepicker__day--checkout):not(.react-datepicker__day--occupied):not(.react-datepicker__day--same-day) {
          cursor: default !important;
          pointer-events: none !important;
        }
        
        .react-datepicker__day--checkin,
        .react-datepicker__day--checkout,
        .react-datepicker__day--occupied,
        .react-datepicker__day--same-day {
          cursor: default !important;
          pointer-events: none !important;
        }
        
        .react-datepicker__day--checkin:hover,
        .react-datepicker__day--checkout:hover,
        .react-datepicker__day--occupied:hover,
        .react-datepicker__day--same-day:hover {
          transform: none !important;
        }
        
        /* Enhanced touch targets for mobile */
        @media (max-width: 479px) {
          .react-datepicker__navigation {
            width: 36px !important;
            height: 36px !important;
            border-width: 8px !important;
          }
          
          .react-datepicker__day,
          .react-datepicker__day-name {
            min-width: 36px !important;
            min-height: 36px !important;
            touch-action: manipulation !important;
          }
        }
        
        /* Extra large screen optimizations */
        @media (min-width: 1536px) {
          .react-datepicker {
            min-height: 480px !important;
          }
          
          .react-datepicker__month-container {
            min-height: 420px !important;
          }
          
          .react-datepicker__month {
            min-height: 360px !important;
          }
          
          .react-datepicker__week {
            height: 4rem !important;
          }
          
          .react-datepicker__day,
          .react-datepicker__day-name {
            width: 3.5rem !important;
            height: 3.5rem !important;
            line-height: 3.5rem !important;
            font-size: 1.125rem !important;
            margin: 0.3rem !important;
          }
          
          .react-datepicker__current-month {
            font-size: 1.5rem !important;
          }
          
          .react-datepicker__header {
            padding: 1.5rem 0 !important;
          }
        }
      `}</style>
    <div>
      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        className="relative h-screen w-full flex items-center justify-center overflow-hidden"
      >
        <Image
          src="/pool.jpg"
          alt="Kampo Ibayo"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/20"></div>
        
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fadeInUp">
            <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent block sm:inline">
                Kampo Ibayo
              </span>
            </h1>
            <p className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-200 max-w-3xl mx-auto">
              Your Peaceful Escape in{" "}
              <span className="text-red-400 block xs:inline">General Trias, Cavite</span>
            </p>
            <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
              Experience nature&apos;s tranquility at our eco-friendly camping resort. 
              Perfect for families, couples, and adventure seekers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8 lg:mt-10 px-4 sm:px-0">
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="group w-full sm:w-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-green-600 rounded-full font-bold text-xs sm:text-sm lg:text-base hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-1 sm:gap-2 min-h-[44px] touch-manipulation"
              >
                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <span className="whitespace-nowrap">Check Availability</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="/book"
                className="group w-full sm:w-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 bg-red-600 rounded-full font-bold text-xs sm:text-sm lg:text-base hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-1 sm:gap-2 min-h-[44px] touch-manipulation"
              >
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <span className="whitespace-nowrap">Book Your Stay</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Premium Hospitality Design */}
      <section id="about" className="bg-gray-800 text-white py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Simple Section Header */}
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              About <span className="text-red-400">Kampo Ibayo</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Where comfort meets adventure in the heart of Cavite&apos;s natural beauty
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-xl shadow-2xl">
                <Image
                  src="/pool.jpg"
                  alt="Resort Pool and Nature View"
                  width={600}
                  height={400}
                  className="w-full h-48 xs:h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96 object-cover transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                
                {/* Trust Badge Overlay */}
                <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safe & Secure
                </div>
                
                {/* Rating Badge */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-gray-800 px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>4.9 Guest Rating</span>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              {/* Main Content */}
              <div className="space-y-4">
                <p className="text-gray-300 text-lg leading-relaxed">
                  Located in the peaceful farmlands of Barangay Tapia, General Trias, Cavite, 
                  <span className="text-white font-medium"> Kampo Ibayo</span> is a family-friendly camping resort that 
                  accommodates up to 15 guests in modern comfort.
                </p>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Featuring two air-conditioned poolside family rooms, a refreshing swimming pool, 
                  and complete amenities including a fully-equipped kitchen, videoke, and adventure hanging bridge, 
                  we offer the perfect blend of <span className="text-red-400 font-medium">relaxation and adventure</span>.
                </p>
              </div>

              {/* Key Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-green-500/50 transition-colors">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Eco-Friendly</h4>
                    <p className="text-gray-400 text-sm">Sustainable practices</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-blue-500/50 transition-colors">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Mountain className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Scenic Views</h4>
                    <p className="text-gray-400 text-sm">Nature&apos;s panorama</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-orange-500/50 transition-colors">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Family-Friendly</h4>
                    <p className="text-gray-400 text-sm">Perfect for all ages</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-yellow-500/50 transition-colors">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Premium Quality</h4>
                    <p className="text-gray-400 text-sm">Exceptional service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="bg-gray-900 text-white py-6 px-4 sm:py-8 sm:px-6 lg:py-12 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Our Amenities</h2>
            <p className="text-gray-400 text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
              Complete resort facilities for up to 15 guests with modern comforts in a natural setting
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            {/* Summer Promo */}
            <div className="bg-gradient-to-br from-red-700 via-red-800 to-red-900 p-5 rounded-2xl relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group border border-red-600/30 hover:border-red-500/50">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                SAVE ₱3K
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">Summer Special</h3>
                  <p className="text-2xl font-extrabold mb-1">₱9,000</p>
                  <p className="text-red-100 text-sm">22hrs • Up to 15 pax • Mon-Thu</p>
                </div>
                <div className="text-right">
                  <Link href="/book" className="bg-white/90 backdrop-blur text-red-800 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>

            {/* Weekend Rate */}
            <div className="bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 p-5 rounded-2xl relative overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group border border-gray-600">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-yellow-400">Weekend & Holidays</h3>
                  <p className="text-2xl font-extrabold mb-1 text-yellow-400">₱12,000</p>
                  <p className="text-gray-300 text-sm">22hrs • Up to 15 pax • Fri-Sun</p>
                </div>
                <div className="text-right">
                  <Link href="/book" className="bg-yellow-400/90 backdrop-blur text-gray-800 px-4 py-2 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Amenities Grid */}
          <div className="grid gap-4 mb-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:mb-8">
            {/* Accommodation */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
              <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                  <FaHome className="text-red-400" />
                </div>
                <h4 className="text-base font-bold text-red-400 sm:text-lg">Accommodation</h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  2 poolside AC family rooms (8 pax each)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Private bathrooms with bidet & hot/cold shower
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Camping area with full-sized campfire
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Treehouse with electricity & extra space
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Open shower area near pool with comfort room
                </li>
              </ul>
            </div>

            {/* Entertainment & Facilities */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
              <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                  <FaGamepad className="text-red-400" />
                </div>
                <h4 className="text-base font-bold text-red-400 sm:text-lg">Entertainment & Fun</h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Swimming pool & poolside lounge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Videoke & arcade machine
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Board games & gazebo dining area
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Function hall/stage for events
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Adventure hanging bridge access
                </li>
              </ul>
            </div>

            {/* Kitchen & Amenities */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
              <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                  <FaUtensils className="text-red-400" />
                </div>
                <h4 className="text-base font-bold text-red-400 sm:text-lg">Kitchen & More</h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Fully-equipped kitchen with appliances
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Grill area & complete cooking utensils
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Hot/cold water dispenser (1st gallon FREE)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  8-vehicle parking & WiFi access
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Pet-friendly facility - all furbabies welcome
                </li>
              </ul>
            </div>

            {/* Special Location Features */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700 hover:border-red-500/50 transition-all duration-300 group hover:shadow-xl sm:p-6 sm:rounded-2xl">
              <div className="flex items-center gap-2 mb-3 sm:gap-3 sm:mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform sm:w-12 sm:h-12 sm:rounded-xl sm:text-2xl">
                  <FaMapMarkedAlt className="text-red-400" />
                </div>
                <h4 className="text-base font-bold text-red-400 sm:text-lg">Special Features</h4>
              </div>
              <ul className="text-gray-300 text-xs space-y-1.5 sm:text-sm sm:space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Adventure hanging bridge (safe & secure)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Nestled in peaceful farmlands
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Caretaker assistance & guided walk
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Easy landmark access (Dali Grocery)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">•</span>
                  Exclusive countryside experience
                </li>
              </ul>
            </div>
          </div>

          {/* Quick Note */}
          <div className="bg-gradient-to-r from-red-900/30 to-red-800/30 border border-red-700/50 p-3 rounded-xl mb-6 sm:p-4 sm:mb-8">
            <p className="text-red-100 text-xs text-center sm:text-sm">
              <span className="text-red-400 font-semibold">All-inclusive experience</span> • No hidden fees • Pet-friendly • 
              <span className="text-red-400 font-semibold">Bring:</span> Food, drinks & personal items
            </p>
          </div>

          {/* Trust Badges inside Amenities */}
          <TrustBadges />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery">
        <EnhancedGallery />
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              What Our Guests Say
            </h2>
          </div>
          <ReviewSystem 
            limit={4} 
            showPagination={false} 
            className="" 
          />
          <div className="text-center mt-8">
            <Link
              href="/review"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <MessageCircleHeart className="w-5 h-5 mr-2" />
              Share Your Experience
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Contact Us</h2>
            <p className="text-gray-400 text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
              Get in touch to book your stay or ask any questions about our resort
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
            <div className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-xl shadow-2xl h-64 sm:h-80 lg:h-96 xl:h-[500px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3865.1028711673293!2d120.87771827498175!3d14.363458286095279!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33962b004deb807d%3A0xeca498f7c0532508!2sKampo%20Ibayo!5e0!3m2!1sen!2sph!4v1757564277392!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-xl"
                  title="Kampo Ibayo Location Map"
                ></iframe>
              </div>

              {/* Enhanced Important Booking Terms */}
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-600/30 rounded-xl overflow-hidden mt-6">
                <div className="px-4 py-2 border-b border-red-600/20">
                  <h4 className="text-red-400 font-semibold text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-400" />
                    Important Booking Terms
                    <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">Required</span>
                  </h4>
                </div>
                <div className="p-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 hover:bg-red-500/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                        <span className="text-red-400 text-xs font-bold">1</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">50% downpayment required to secure booking</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-red-500/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                        <span className="text-red-400 text-xs font-bold">2</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">No same-day cancellations allowed</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-red-500/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                        <span className="text-red-400 text-xs font-bold">3</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">Remaining balance due at check-in</span>
                    </div>
                    <div className="flex items-center gap-2 hover:bg-red-500/5 px-2 py-1 rounded-md transition-colors duration-150 group">
                      <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/30 transition-colors">
                        <span className="text-red-400 text-xs font-bold">4</span>
                      </div>
                      <span className="text-gray-300 group-hover:text-white transition-colors">48-hour advance notice required for changes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-6 sm:space-y-8">
              <div className="bg-gray-800 p-4 sm:p-6 rounded-xl">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
                  Location
                </h3>
                <p className="text-gray-300 text-sm xs:text-base sm:text-lg leading-relaxed">
                  132 Ibayo Brgy Tapia 4107 General Trias, Philippines
                </p>
              </div>

              <div className="bg-gray-800 p-4 sm:p-6 rounded-xl">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
                  Contact Details
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  <a 
                    href="tel:+639452779541"
                    className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg hover:text-green-400 transition-colors group"
                  >
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    +63 945 277 9541
                  </a>
                  <a 
                    href="mailto:kampoibayo@gmail.com"
                    className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg hover:text-blue-400 transition-colors group"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    kampoibayo@gmail.com
                  </a>
                  <div className="flex items-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg">
                    <MessageCircleHeart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    Kampo Ibayo (Facebook)
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 sm:p-6 rounded-xl">
                <h3 className="text-lg xs:text-xl sm:text-2xl font-bold mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 flex-shrink-0" />
                  Operating Hours
                </h3>
                <div className="space-y-1 sm:space-y-2 text-gray-300 text-sm xs:text-base sm:text-lg">
                  <p className="flex justify-between">
                    <span>Daily Operations</span>
                    <span className="text-green-400 font-semibold">8:00 AM - 8:00 PM</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Check-in</span>
                    <span className="text-blue-400 font-semibold">2:00 PM</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Check-out</span>
                    <span className="text-orange-400 font-semibold">12:00 NN</span>
                  </p>
                </div>
              </div>

              <a 
                href="#" 
                className="w-full mt-4 sm:mt-6 px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 sm:gap-3 text-sm xs:text-base sm:text-lg shadow-lg hover:shadow-xl"
              >
                <MessageCircleHeart className="w-4 h-4 sm:w-5 sm:h-5" />
                Message us on Facebook
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Booking Site Footer */}
      <footer className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <div className="flex items-center justify-center lg:justify-start space-x-3 mb-3 sm:mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-xl lg:text-2xl font-bold text-red-500">Kampo</span>
                  <span className="text-xl lg:text-2xl font-bold text-white">Ibayo</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm lg:text-base text-center lg:text-left max-w-md mx-auto lg:mx-0 mb-6 lg:mb-0">
                Your premier eco-friendly camping resort in General Trias, Cavite. Experience nature&apos;s tranquility with modern comfort.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div className="text-center sm:text-left">
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wide">Resort</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    <li><a href="#about" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">About</a></li>
                    <li><a href="#amenities" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Amenities</a></li>
                    <li><a href="#gallery" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Gallery</a></li>
                    <li><a href="#reviews" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Reviews</a></li>
                    <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Contact</a></li>
                  </ul>
                </div>

                <div className="text-center sm:text-left">
                  {user && !isLoadingAuth ? (
                    <>
                      <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wide">Account</h4>
                      <ul className="space-y-2 sm:space-y-3">
                        <li><a href="/bookings" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">My Bookings</a></li>
                        <li><a href="/profile" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Profile</a></li>
                        <li><a href="/settings" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Settings</a></li>
                        <li><a href="/legal" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Legal</a></li>
                        <li>
                          <button 
                            onClick={async () => {
                              try {
                                // Check if there's a session first
                                const { data: { session } } = await supabase.auth.getSession();
                                
                                if (session) {
                                  // Only try to sign out if there's a session
                                  const { error } = await supabase.auth.signOut();
                                  
                                  if (error) {
                                    console.error('Sign out error:', error);
                                    // Don't return on error, continue with cleanup
                                  }
                                }
                                
                                // Clear local storage and session storage
                                if (typeof window !== 'undefined') {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                }
                              } catch (error) {
                                console.error('Logout error:', error);
                                // Still clear storage even on error
                                if (typeof window !== 'undefined') {
                                  localStorage.clear();
                                  sessionStorage.clear();
                                }
                              }
                            }}
                            className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1 text-left w-full"
                          >
                            Logout
                          </button>
                        </li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wide">Get Started</h4>
                      <ul className="space-y-2 sm:space-y-3">
                        <li><a href="/auth" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Login / Sign Up</a></li>
                      </ul>
                    </>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <h4 className="text-white font-semibold mb-3 sm:mb-4 text-xs sm:text-sm uppercase tracking-wide">Policies</h4>
                  <ul className="space-y-2 sm:space-y-3">
                    <li><a href="/legal/faq" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">FAQ</a></li>
                    <li><a href="/legal/terms" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Terms & Privacy</a></li>
                    <li><a href="/legal/cancellation" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Cancellation Policy</a></li>
                    <li><a href="/legal/house-rules" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">House Rules</a></li>
                    <li><a href="/legal/help" className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm block py-1">Help Center</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-center sm:text-left order-2 sm:order-1">
                <p className="text-gray-400 text-sm">
                  © 2025 Kampo Ibayo Resort. All rights reserved.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Eco-friendly camping resort in General Trias, Cavite
                </p>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 order-1 sm:order-2">
                <span className="text-gray-500 text-xs hidden sm:block">Follow us:</span>
                <div className="flex items-center gap-3">
                  <a href="#" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 group">
                    <Facebook className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all duration-300 group">
                    <Instagram className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </a>
                  <a href="#" className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 group">
                    <Youtube className="w-4 h-4 text-gray-400 group-hover:text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Action Buttons - Properly matched sizing and positioning */}
      {/* Chatbot - Independent positioning */}
      <Chatbot onOpenStateChange={setChatbotOpen} />
      
      {/* Back to Top Button - Hide when chatbot is open to prevent overlap */}
      {showBackToTop && !chatbotOpen && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 bg-red-600 hover:bg-red-700 text-white h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-150 transform hover:scale-110 border border-red-500 hover:border-red-400 backdrop-blur-sm"
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 xs:p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="bg-gray-900 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl w-full max-w-[98vw] xs:max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl border border-gray-700 max-h-[95vh] xs:max-h-[90vh] sm:max-h-[85vh] md:max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 lg:p-6 border-b border-gray-700 bg-gray-900">
              <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white flex items-center gap-1 sm:gap-2 md:gap-3">
                <CalendarDays className="w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-green-400 flex-shrink-0" />
                <span className="hidden xs:inline">Check Availability</span>
                <span className="xs:hidden">Availability</span>
              </h2>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2 md:p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-50px)] xs:max-h-[calc(90vh-60px)] sm:max-h-[calc(85vh-80px)] md:max-h-[calc(90vh-100px)] lg:max-h-[calc(90vh-120px)]">
              <div className="p-2 xs:p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                {/* Calendar View - React DatePicker (Read-only for availability display) */}
                <div className="bg-gray-800/50 rounded-md sm:rounded-lg md:rounded-xl p-1 xs:p-2 sm:p-3 md:p-4 lg:p-5 border border-gray-600">
                  <DatePicker
                    selected={null}
                    onChange={() => {}} // Read-only - no interaction needed
                    onMonthChange={(date) => setCurrentMonth(date)}
                    dayClassName={(date) => {
                      // Show booking status using exact same logic as booking page
                      const capacity = getDateCapacity(date);
                      if (capacity === 'same-day') return 'react-datepicker__day--same-day';
                      if (capacity === 'checkin') return 'react-datepicker__day--checkin';
                      if (capacity === 'checkout') return 'react-datepicker__day--checkout';
                      if (capacity === 'occupied') return 'react-datepicker__day--occupied';
                      return '';
                    }}
                    inline
                    monthsShown={1}
                    calendarClassName="inline-calendar"
                    minDate={new Date()}
                    maxDate={(() => {
                      const maxDate = new Date();
                      maxDate.setFullYear(maxDate.getFullYear() + 2);
                      return maxDate;
                    })()}
                    readOnly
                    disabled={false}
                  />
                  
                  {/* Legend - EXACT same as booking page */}
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-green-600"></span>
                      <span className="text-gray-300">Check-in</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-red-600"></span>
                      <span className="text-gray-300">Check-out</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-yellow-600"></span>
                      <span className="text-gray-300">Occupied</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-purple-600"></span>
                      <span className="text-gray-300">Full Day</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded bg-gray-700 border border-gray-600"></span>
                      <span className="text-gray-300">Available</span>
                    </span>
                  </div>
                </div>

                {/* Mobile-Responsive Availability Guide */}
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-md sm:rounded-lg md:rounded-xl overflow-hidden">
                  {/* Collapsible Header - Only on Mobile/Small Tablet */}
                  <button 
                    onClick={() => setAvailabilityGuideOpen(!availabilityGuideOpen)}
                    className="w-full p-2 xs:p-2.5 sm:p-3 md:hidden flex items-center justify-between hover:bg-blue-800/10 transition-colors touch-manipulation"
                  >
                    <div className="flex items-center gap-1.5 xs:gap-2">
                      <div className="w-4 h-4 xs:w-5 xs:h-5 text-blue-400 text-sm xs:text-base">ℹ️</div>
                      <h4 className="text-blue-200 text-xs xs:text-sm sm:text-base font-semibold">How to Read Availability</h4>
                    </div>
                    <div 
                      className="w-4 h-4 xs:w-5 xs:h-5 text-blue-300 transition-transform duration-200 text-xs xs:text-sm"
                      style={{ transform: availabilityGuideOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </div>
                  </button>

                  {/* Desktop Header - Always Visible */}
                  <div className="hidden md:flex items-center gap-2 md:gap-3 p-3 md:p-4 lg:p-5 border-b border-blue-600/20">
                    <div className="w-5 h-5 md:w-6 md:h-6 text-blue-400 text-base md:text-lg">ℹ️</div>
                    <h4 className="text-blue-200 text-base md:text-lg lg:text-xl font-semibold">How to Read Availability</h4>
                  </div>

                  {/* Content - Collapsible on mobile/tablet, always visible on desktop */}
                  <div className={`${availabilityGuideOpen ? 'block' : 'hidden'} md:block`}>
                    <div className="px-2 pb-2 xs:px-2.5 xs:pb-2.5 sm:px-3 sm:pb-3 md:px-4 md:pb-4 lg:px-5 lg:pb-5">
                      {/* Responsive Grid Layout */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-1.5 xs:gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 mt-2 xs:mt-2.5 sm:mt-3 md:mt-4">
                        {/* Check-in */}
                        <div className="flex items-start gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-green-900/20 border border-green-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg">
                          <span className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-green-600 flex-shrink-0 mt-0.5"></span>
                          <div className="min-w-0">
                            <div className="text-green-200 text-xs xs:text-xs sm:text-sm md:text-base font-medium">Check-in Day</div>
                            <div className="text-green-100/80 text-xs sm:text-xs md:text-sm leading-tight">You can check-out here (guests arrive 2 PM)</div>
                          </div>
                        </div>

                        {/* Check-out */}
                        <div className="flex items-start gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-red-900/20 border border-red-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg">
                          <span className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-red-600 flex-shrink-0 mt-0.5"></span>
                          <div className="min-w-0">
                            <div className="text-red-200 text-xs xs:text-xs sm:text-sm md:text-base font-medium">Check-out Day</div>
                            <div className="text-red-100/80 text-xs sm:text-xs md:text-sm leading-tight">You can check-in here (guests leave 12 PM)</div>
                          </div>
                        </div>

                        {/* Occupied */}
                        <div className="flex items-start gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg">
                          <span className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-yellow-600 flex-shrink-0 mt-0.5"></span>
                          <div className="min-w-0">
                            <div className="text-yellow-200 text-xs xs:text-xs sm:text-sm md:text-base font-medium">Occupied</div>
                            <div className="text-yellow-100/80 text-xs sm:text-xs md:text-sm leading-tight">Resort fully occupied (no availability)</div>
                          </div>
                        </div>

                        {/* Full Day */}
                        <div className="flex items-start gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-purple-900/20 border border-purple-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg">
                          <span className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded bg-purple-600 flex-shrink-0 mt-0.5"></span>
                          <div className="min-w-0">
                            <div className="text-purple-200 text-xs xs:text-xs sm:text-sm md:text-base font-medium">Full Day</div>
                            <div className="text-purple-100/80 text-xs sm:text-xs md:text-sm leading-tight">Same-day check-in & check-out</div>
                          </div>
                        </div>

                        {/* Available - Full width on smaller screens */}
                        <div className="flex items-start gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 md:p-3 bg-gray-800/20 border border-gray-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg xs:col-span-2 lg:col-span-4 xl:col-span-2">
                          <span className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded border border-green-500/50 bg-gray-700 flex-shrink-0 mt-0.5"></span>
                          <div className="min-w-0">
                            <div className="text-gray-200 text-xs xs:text-xs sm:text-sm md:text-base font-medium">Available</div>
                            <div className="text-gray-100/80 text-xs sm:text-xs md:text-sm leading-tight">Free for both check-in and check-out</div>
                          </div>
                        </div>
                      </div>

                      {/* Pro Tip - Enhanced Responsiveness */}
                      <div className="mt-2 xs:mt-2.5 sm:mt-3 md:mt-4 p-1.5 xs:p-2 sm:p-2.5 md:p-3 lg:p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-600/30 rounded-sm xs:rounded sm:rounded-md md:rounded-lg">
                        <div className="flex items-start gap-1.5 xs:gap-2">
                          <div className="text-green-400 text-sm xs:text-base sm:text-lg md:text-xl flex-shrink-0">💡</div>
                          <div>
                            <div className="text-green-200 text-xs xs:text-sm sm:text-base md:text-lg font-medium mb-0.5 xs:mb-1">Same-Day Turnover Available!</div>
                            <div className="text-green-100/90 text-xs xs:text-sm sm:text-base md:text-base leading-relaxed">
                              You can check-in on red (check-out) days since guests leave at 12 PM and new arrivals start at 2 PM.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Policy Notice */}
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-2 sm:p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mt-0.5 text-sm sm:text-base">ℹ️</div>
                    <div>
                      <p className="text-amber-200 text-xs sm:text-sm font-medium mb-1">Booking Policy</p>
                      <p className="text-amber-100/80 text-xs leading-relaxed">
                        {getBookingPolicyMessage()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time Status */}
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-2 sm:p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-blue-400 font-semibold text-xs sm:text-sm">
                      {loading ? 'Loading availability...' : 'Live Availability Data'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    {loading 
                      ? 'Fetching real-time booking information from database...'
                      : 'Showing current availability based on active bookings (pending + confirmed). Navigate months to see more dates.'
                    }
                  </p>
                </div>

                {/* Pricing Info */}
                <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 lg:p-4 border border-gray-600">
                  <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Resort Rates</h3>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Weekdays (Mon-Thu)</span>
                      <span className="text-green-400 font-semibold">₱9,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Weekends (Fri-Sun)</span>
                      <span className="text-yellow-400 font-semibold">₱12,000</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 sm:mt-2">
                      22-hour stay • Up to 15 guests • All amenities included
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-center pt-1.5 xs:pt-2 sm:pt-2.5 md:pt-3">
                  <button
                    onClick={() => setShowAvailabilityModal(false)}
                    className="w-full xs:w-auto xs:px-6 sm:px-8 md:px-10 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 xs:py-2.5 sm:py-3 md:py-3.5 rounded-md sm:rounded-lg md:rounded-xl font-semibold text-xs xs:text-sm sm:text-base md:text-lg transition-colors min-h-[44px] touch-manipulation"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default Home;
             
