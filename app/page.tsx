"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { FaHome, FaGamepad, FaUtensils, FaMapMarkedAlt } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useAuth } from "./contexts/AuthContext";
import { TrustBadges, EnhancedGallery } from "./components/EnhancedComponents";
import Chatbot from "./components/Chatbot";

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
                    </>
                  )}
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setProfileMenu(false);
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
                    await supabase.auth.signOut();
                    setIsOpen(false);
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
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    console.log('🗓️ Initializing currentMonth to:', now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    return now;
  });
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // Track per-day counts for the displayed month to render capacity indicators
  const [dayCounts, setDayCounts] = useState<Record<string, number>>({});
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
        setBookedDates([]);
        setDayCounts({});
        return;
      }

      console.log('📅 Fetched bookings:', bookings);

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
      setDayCounts(countsObj);

      // Only mark dates as unavailable when check-in capacity (2) is reached or exceeded
      const bookedArray = Array.from(checkInCounts.entries())
        .filter(([, count]) => count >= 2)
        .map(([date]) => date);

      console.log('🚫 Fully booked (check-in capacity reached) dates:', bookedArray);
      
      // Cache the result
      setMonthCache(prev => ({ ...prev, [monthKey]: bookedArray }));
      setBookedDates(bookedArray);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
      // Fallback to empty array on error
      setBookedDates([]);
      setDayCounts({});
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
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (!isMonthOutOfRange(prevMonth)) {
      setCurrentMonth(prevMonth);
    }
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (!isMonthOutOfRange(nextMonth)) {
      setCurrentMonth(nextMonth);
    }
  };

  // Generate calendar days for current month (always 42 days for consistency)
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    // Fill remaining cells to make exactly 42 days (6 weeks) for consistent height
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  };

  // Check if a date is booked (bookedDates now means capacity reached for the day)
  const isDateBooked = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const toYMD = (d2: Date) => {
      const y = d2.getFullYear();
      const m = String(d2.getMonth() + 1).padStart(2, '0');
      const da = String(d2.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };
    const dateString = toYMD(d);
    const isBooked = bookedDates.includes(dateString);
    if (isBooked) {
      console.log(`🔴 Date ${dateString} is booked`);
    }
    return isBooked;
  };

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
          .eq("auth_id", session.user.id)
          .single();

        if (userData?.role === "admin") {
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
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleBackToTopScroll);
    return () => window.removeEventListener("scroll", handleBackToTopScroll);
  }, []);

  return (
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
                className="group w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-3 sm:py-4 bg-green-600 rounded-full font-bold text-sm xs:text-base lg:text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Check Availability</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                href="/book"
                className="group w-full sm:w-auto px-4 xs:px-6 sm:px-8 py-3 sm:py-4 bg-red-600 rounded-full font-bold text-sm xs:text-base lg:text-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="whitespace-nowrap">Book Your Stay</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
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
          <div className="text-center mb-8 sm:mb-12 lg:mb-1">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              What Our Guests Say
            </h2>
            <p className="text-gray-400 text-sm xs:text-base sm:text-lg max-w-2xl mx-auto">
              Read authentic reviews from families and adventurers who experienced Kampo Ibayo
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                name: "Maria Santos",
                location: "Manila",
                text: "Peaceful and relaxing stay. Perfect for family bonding! The kids loved the river and we enjoyed the bonfire nights.",
                rating: 5,
              },
              {
                name: "John Rivera",
                location: "Quezon City",
                text: "Loved the bonfire nights and the natural surroundings. Will definitely come back with friends for another adventure.",
                rating: 5,
              },
              {
                name: "Anna Cruz",
                location: "Cavite",
                text: "The staff was very friendly and helpful. Clean facilities and beautiful nature views. Highly recommended!",
                rating: 5,
              },
            ].map((review, i) => (
              <div
                key={i}
                className="group bg-gray-800 p-4 xs:p-5 sm:p-6 lg:p-8 rounded-xl shadow-lg hover:bg-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="flex text-yellow-400 text-sm xs:text-base">
                    {[...Array(review.rating)].map((_, index) => (
                      <span key={index}>⭐</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 italic text-xs xs:text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="border-t border-gray-600 pt-3 sm:pt-4">
                  <p className="font-bold text-red-400 text-sm xs:text-base">
                    - {review.name}
                  </p>
                  <p className="text-gray-500 text-xs xs:text-sm mt-1">
                    {review.location}
                  </p>
                </div>
              </div>
            ))}
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
                              await supabase.auth.signOut();
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse gap-3 items-end">
        <Chatbot />
        
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="bg-red-600 hover:bg-red-700 text-white h-12 w-12 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-red-500 hover:border-red-400"
            aria-label="Back to top"
          >
            <ChevronUp className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-green-400" />
                Check Availability
              </h2>
              <button
                onClick={() => setShowAvailabilityModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="p-6 space-y-6">
                {/* Calendar View */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={goToPreviousMonth}
                      className={`text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors ${
                        loading || isMonthOutOfRange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
                          ? 'opacity-30 cursor-not-allowed' 
                          : ''
                      }`}
                      disabled={loading || isMonthOutOfRange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h4 className="text-white font-semibold text-lg">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button 
                      onClick={goToNextMonth}
                      className={`text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors ${
                        loading || isMonthOutOfRange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
                          ? 'opacity-30 cursor-not-allowed' 
                          : ''
                      }`}
                      disabled={loading || isMonthOutOfRange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-gray-400 text-sm font-semibold text-center py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {loading ? (
                      Array.from({length: 42}).map((_, i) => (
                        <div key={i} className="aspect-square flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-600 rounded animate-pulse"></div>
                        </div>
                      ))
                    ) : (
                      generateCalendarDays().map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} className="aspect-square bg-transparent"></div>;
                        }

                        const isPast = isDatePast(day);
                        const isToday = isDateToday(day);
                        const isBooked = isDateBooked(day);
                        const isTooFar = isDateTooFar(day);
                        
                        // Lookup per-day count for capacity indicator
                        const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const countForDay = dayCounts[key] || 0;
                        
                        return (
                          <div 
                            key={day}
                            className={`
                              aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all
                              ${isPast 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : isToday
                                  ? 'bg-blue-600 text-white font-bold cursor-pointer'
                                  : isBooked
                                    ? 'bg-red-900/30 text-red-300 border border-red-500/30 cursor-not-allowed'
                                    : isTooFar
                                      ? 'text-orange-400 border border-orange-500/30 cursor-not-allowed opacity-60'
                                      : 'text-white hover:bg-green-600/20 border border-green-500/30 hover:border-green-400 cursor-pointer'
                              }
                            `}
                            title={
                              isPast 
                                ? 'Past date - cannot book'
                                : isBooked 
                                  ? 'Date already booked'
                                  : isTooFar
                                    ? 'Beyond booking window - contact us for long-term stays'
                                    : countForDay === 1 
                                      ? 'One booking already - 1/2 capacity' 
                                      : countForDay === 2
                                        ? 'Full capacity - 2/2 capacity with same-day turnover'
                                        : 'Available for booking'
                            }
                          >
                            <div className="relative w-full h-full flex items-center justify-center">
                              <span>{day}</span>
                              {!isPast && !isBooked && !isTooFar && countForDay > 0 && (
                                <span className={`absolute bottom-1 right-1 text-[10px] px-1 py-0.5 rounded border ${
                                  countForDay === 1 
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                                    : countForDay === 2
                                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                                }`}>
                                  {countForDay}/2
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-5 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-green-500/30 rounded bg-green-600/10"></div>
                    <span className="text-gray-300">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-900/30 border border-red-500/30 rounded"></div>
                    <span className="text-gray-300">Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-yellow-500/40 rounded bg-yellow-500/20"></div>
                    <span className="text-gray-300">1/2 Capacity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-gray-300">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-orange-500/30 rounded bg-orange-600/10 opacity-60"></div>
                    <span className="text-gray-300">Too Far</span>
                  </div>
                </div>

                {/* Booking Policy Notice */}
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 text-amber-400 mt-0.5">ℹ️</div>
                    <div>
                      <p className="text-amber-200 text-sm font-medium mb-1">Booking Policy</p>
                      <p className="text-amber-100/80 text-xs leading-relaxed">
                        {getBookingPolicyMessage()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time Status */}
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                    <span className="text-blue-400 font-semibold text-sm">
                      {loading ? 'Loading availability...' : 'Live Availability Data'}
                    </span>
                  </div>
                  <p className="text-gray-300 text-xs">
                    {loading 
                      ? 'Fetching real-time booking information from database...'
                      : 'Showing current availability based on active bookings (pending + confirmed). Navigate months to see more dates.'
                    }
                  </p>
                </div>

                {/* Pricing Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
                  <h3 className="text-white font-semibold mb-3">Resort Rates</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Weekdays (Mon-Thu)</span>
                      <span className="text-green-400 font-semibold">₱9,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Weekends (Fri-Sun)</span>
                      <span className="text-yellow-400 font-semibold">₱12,000</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      22-hour stay • Up to 15 guests • All amenities included
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAvailabilityModal(false)}
                    className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
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
  );
}

export default Home;
             
