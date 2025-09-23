"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowUp, 
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
  HomeIcon,
  Gamepad2,
  UtensilsCrossed,
  Wifi,
  Car,
  Heart,
  Waves,
  Facebook,
  Instagram
} from "lucide-react";
import { FaHome, FaGamepad, FaUtensils, FaMapMarkedAlt } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import { useAuth } from "./contexts/AuthContext";
import { TrustBadges, EnhancedGallery } from "./components/EnhancedComponents";

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
        <Link href="#home" className="flex items-center space-x-1">
          <span className="text-lg sm:text-xl font-bold text-red-500">Kampo</span>
          <span className="text-lg sm:text-xl font-bold text-white">Ibayo</span>
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
  return (
    <div>
      <Navbar />

      {/* Enhanced Hero Section */}
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

      {/* About Section */}
      <section id="about" className="bg-gray-800 text-white py-8 sm:py-12 lg:py-16 xl:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center">
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
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-4 sm:space-y-6">
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-center lg:text-left leading-tight">
              About Our Resort
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-sm xs:text-base sm:text-lg leading-relaxed">
                Nestled in the lush landscapes of Barangay Tapia, General Trias,
                Cavite, Kampo Ibayo offers a serene retreat from the hustle and
                bustle of city life. Our nature-based camping resort provides the
                perfect setting to reconnect with nature, unwind and create lasting
                memories.
              </p>
              <p className="text-gray-300 text-sm xs:text-base sm:text-lg leading-relaxed">
                With carefully designed spaces that blend seamlessly with the
                natural environment, we offer a unique camping experience that
                combines comfort with adventure.
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap justify-center lg:justify-start pt-2 sm:pt-4">
              <span className="bg-red-600 hover:bg-red-700 transition-colors px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs xs:text-sm font-medium">
                🌱 Eco-friendly
              </span>
              <span className="bg-red-600 hover:bg-red-700 transition-colors px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs xs:text-sm font-medium">
                🌄 Scenic Views
              </span>
              <span className="bg-red-600 hover:bg-red-700 transition-colors px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs xs:text-sm font-medium">
                👨‍👩‍👧 Family-friendly
              </span>
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

      {/* Enhanced Gallery Section */}
      <section id="gallery">
        <EnhancedGallery />
      </section>
      {/* Testimonials Section */}
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

              {/* Enhanced Important Booking Terms - Perfect Compact Size */}
              <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 border border-red-600/30 rounded-xl mt-6 overflow-hidden">
                {/* Compact Header */}
                <div className="px-4 py-2 border-b border-red-600/20">
                  <h4 className="text-red-400 font-semibold text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-red-400" />
                    Important Booking Terms
                    <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">Required</span>
                  </h4>
                </div>

                {/* Compact Content with Numbers and Hover Effects */}
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

      {/* Single Unified Footer */}
      <footer className="bg-gray-900 border-t border-gray-700 pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-0">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-0 pb-4">
              
              {/* Company Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl font-bold text-red-500">Kampo</span>
                  <span className="text-2xl font-bold text-white">Ibayo</span>
                </div>
                <p className="text-gray-400 text-base leading-relaxed mb-4 max-w-md">
                  Your premier eco-friendly camping resort in General Trias, Cavite. 
                  Experience nature&apos;s tranquility with modern comfort and adventure.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-gray-300 text-sm">132 Ibayo, Brgy Tapia, General Trias, Cavite</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <a href="tel:+639452779541" className="text-gray-300 text-sm hover:text-green-400 transition-colors">
                      +63 945 277 9541
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <a href="mailto:kampoibayo@gmail.com" className="text-gray-300 text-sm hover:text-blue-400 transition-colors">
                      kampoibayo@gmail.com
                    </a>
                  </div>
                </div>

<div>
      <h4 className="text-white font-semibold mb-4 text-lg">Follow Us</h4>
      <div className="flex gap-4 mb-4">
        <a
          href="#"
          className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Facebook className="w-5 h-5 text-white" />
        </a>
        <a
          href="#"
          className="w-10 h-10 bg-pink-600 rounded-lg flex items-center justify-center hover:bg-pink-700 transition-colors"
        >
          <Instagram className="w-5 h-5 text-white" />
        </a>
        <a
          href="#"
          className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors"
        >
          <MessageCircleHeart className="w-5 h-5 text-white" />
        </a>
      </div>
    </div>

                {/* Copyright - moved under company info */}
                <div className="text-center lg:text-left">
                  <p className="text-gray-400 text-sm">
                    © 2025 Kampo Ibayo Resort. All rights reserved.
                  </p>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs mt-2">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Cancellation Policy</a>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-lg">Quick Links</h4>
                <ul className="space-y-2">
                  <li><a href="#home" className="text-gray-400 hover:text-red-400 transition-colors text-sm">Home</a></li>
                  <li><a href="#about" className="text-gray-400 hover:text-red-400 transition-colors text-sm">About Us</a></li>
                  <li><a href="#amenities" className="text-gray-400 hover:text-red-400 transition-colors text-sm">Amenities</a></li>
                  <li><a href="#gallery" className="text-gray-400 hover:text-red-400 transition-colors text-sm">Gallery</a></li>
                  <li><a href="#reviews" className="text-gray-400 hover:text-red-400 transition-colors text-sm">Reviews</a></li>
                  <li><a href="#contact" className="text-gray-400 hover:text-red-400 transition-colors text-sm">Contact</a></li>
                  <li><Link href="/book" className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium">Book Now</Link></li>
                </ul>
              </div>

              {/* Services */}
<div>
      <h4 className="text-white font-semibold mb-4 text-lg">Our Services</h4>
      <ul className="space-y-2 text-gray-400 text-sm">
        <li className="flex items-center gap-2">
          <HomeIcon size={16} /> Poolside Family Rooms
        </li>
        <li className="flex items-center gap-2">
          <Gamepad2 size={16} /> Videoke & Arcade
        </li>
        <li className="flex items-center gap-2">
          <UtensilsCrossed size={16} /> Fully-Equipped Kitchen
        </li>
        <li className="flex items-center gap-2">
          <Waves size={16} /> Pool & Lounge Area
        </li>
        <li className="flex items-center gap-2">
          <Heart size={16} /> Pet-Friendly Facility
        </li>
        <li className="flex items-center gap-2">
          <Car size={16} /> 8-Vehicle Parking
        </li>
        <li className="flex items-center gap-2">
          <Wifi size={16} /> WiFi Access
        </li>
      </ul>
    </div>
            </div>
          </div>
        </footer>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-red-600 text-white h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center rounded-full shadow-lg hover:bg-red-700 transition-colors duration-300 z-40"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}

// Export without auth guard - home page should be public
export default Home;
