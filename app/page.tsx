"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { ArrowUp, Menu, X, User as UserIcon, LogOut, BookOpen } from "lucide-react";
import { supabase } from "./supabaseClient";
import type { User } from "@supabase/supabase-js";

// ----------------- Navbar -----------------
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [user, setUser] = useState<User | null>(null);
  const [profileMenu, setProfileMenu] = useState(false);

  const menuItems = useMemo(
    () => ["Home", "About", "Amenities", "Gallery", "Contact"],
    []
  );

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map((item) =>
        document.getElementById(item.toLowerCase())
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

  // Track Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <nav className="bg-gray-900/90 backdrop-blur text-white shadow-md w-full fixed top-0 left-0 z-50 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        {/* Logo */}
        <Link href="#home" className="flex items-center space-x-1">
          <span className="text-xl font-bold text-red-500">Kampo</span>
          <span className="text-xl font-bold text-white">Ibayo</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {menuItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`hover:text-red-500 ${
                activeSection === item.toLowerCase() ? "text-red-500" : ""
              }`}
            >
              {item}
            </a>
          ))}

          {/* Auth Buttons */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileMenu(!profileMenu)}
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                ☰
              </button>

              {profileMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-gray-900 rounded shadow-lg overflow-hidden">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                  >
                    <UserIcon className="w-4 h-4 mr-2" /> Profile
                  </Link>
                  <Link
                    href="/bookings"
                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                  >
                    <BookOpen className="w-4 h-4 mr-2" /> My Bookings
                  </Link>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                      setProfileMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <button className="px-4 py-1 bg-red-500 rounded hover:bg-red-600">
                Login
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white text-2xl focus:outline-none"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-gray-900 px-4 pb-3 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className={`block hover:text-red-500 ${
                activeSection === item.toLowerCase() ? "text-red-500" : ""
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}

          {user ? (
            <div className="space-y-2">
              <Link
                href="/profile"
                className="block px-2 py-1 hover:text-red-500"
                onClick={() => setIsOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/bookings"
                className="block px-2 py-1 hover:text-red-500"
                onClick={() => setIsOpen(false)}
              >
                My Bookings
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  setIsOpen(false);
                }}
                className="block w-full text-left px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/auth" onClick={() => setIsOpen(false)}>
              <button className="block w-full text-left px-2 py-1 bg-red-500 rounded hover:bg-red-600">
                Login
              </button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

// ----------------- Home Page -----------------
export default function Home() {
  return (
    <div>
      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        className="relative h-[100vh] w-full flex items-center justify-center"
      >
        <Image
          src="/pool.jpg"
          alt="Kampo Ibayo"
          fill
          priority
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10"></div>
        <div className="relative z-10 text-center text-white px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold">
            Welcome to Kampo Ibayo
          </h1>
          <p className="mt-4 text-lg md:text-xl font-bold">
            Your Peaceful Escape in Gentri Cavite
          </p>
          <Link
            href="/book"
            className="mt-6 px-6 py-3 bg-red-600 rounded-full font-semibold hover:bg-red-700 transition inline-block text-center"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-800 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Image
            src="/pool.jpg"
            alt="Resort"
            width={600}
            height={400}
            className="rounded-xl shadow-lg"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4 text-center md:text-left">
              About Our Resort
            </h2>
            <p className="mb-4 text-gray-300">
              Nested in the lush landscapes of Barangay Tapia, General Trias,
              Cavite, Kampo Ibayo offers a serene retreat from the hustle and
              bustle of city life. Our nature-based camping resort provides the
              perfect setting to reconnect with nature, unwind and create lasting
              memories.
            </p>
            <p className="mb-4 text-gray-300">
              With carefully designed spaces that blend seamlessly with the
              natural environment, we offer a unique camping experience that
              combines comfort with adventure.
            </p>
            <div className="flex gap-3 flex-wrap">
              <span className="bg-red-600 px-3 py-1 rounded-full text-sm">
                🌱 Eco-friendly
              </span>
              <span className="bg-red-600 px-3 py-1 rounded-full text-sm">
                🌄 Scenic Views
              </span>
              <span className="bg-red-600 px-3 py-1 rounded-full text-sm">
                👨‍👩‍👧 Family-friendly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section id="amenities" className="bg-gray-900 text-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">Our Amenities</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Tent Camping",
              desc: "Comfortable and spacious tents with ventilation and flooring.",
              icon: "⛺",
            },
            {
              title: "Bonfire Area",
              desc: "Safe bonfire spots for storytelling, roasting, and stargazing.",
              icon: "🔥",
            },
            {
              title: "Clean Restroom",
              desc: "Well-maintained restroom and shower facilities with hot water.",
              icon: "🚻",
            },
            {
              title: "River Access",
              desc: "Direct access to a clear river for swimming and relaxing.",
              icon: "🌊",
            },
            {
              title: "Outdoor Kitchen",
              desc: "Equipped cooking area with grills, stoves, and tables.",
              icon: "🍴",
            },
            {
              title: "Picnic Areas",
              desc: "Shaded picnic spots with tables and benches.",
              icon: "🌲",
            },
          ].map((a) => (
            <div
              key={a.title}
              className="bg-gray-800 p-6 rounded-xl shadow hover:bg-gray-700 transition"
            >
              <div className="text-4xl mb-4">{a.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{a.title}</h3>
              <p className="text-gray-300 text-sm">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="bg-gray-800 text-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">Galleries</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            "/gallery1.jpg",
            "/gallery2.jpg",
            "/gallery3.jpg",
            "/gallery4.jpg",
            "/gallery5.jpg",
            "/gallery6.jpg",
          ].map((src, i) => (
            <Image
              key={i}
              src={src}
              alt={`Gallery ${i + 1}`}
              width={400}
              height={250}
              className="rounded-xl shadow-lg object-cover h-60 w-full"
            />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="bg-gray-900 text-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">
          What Our Guests Say
        </h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Maria",
              text: "Peaceful and relaxing stay. Perfect for family bonding!",
            },
            {
              name: "John",
              text: "Loved the bonfire nights. Will definitely come back.",
            },
            {
              name: "Anna",
              text: "The staff was very friendly and helpful.",
            },
          ].map((r, i) => (
            <div
              key={i}
              className="bg-gray-800 p-6 rounded-xl shadow hover:bg-gray-700 transition"
            >
              <p className="text-gray-300 italic">“{r.text}”</p>
              <p className="mt-4 font-bold text-red-500">- {r.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className=" bg-gray-900 text-white py-16 px-6">
        <h2 className="text-3xl font-bold text-center mb-10">Contact Us</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3865.1028711673293!2d120.87771827498175!3d14.363458286095279!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33962b004deb807d%3A0xeca498f7c0532508!2sKampo%20Ibayo!5e0!3m2!1sen!2sph!4v1757564277392!5m2!1sen!2sph"
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="rounded-xl shadow-lg"
          ></iframe>

          <div>
            <h3 className="text-xl font-bold mb-4">Location</h3>
            <p className="mb-4">
              132 Ibayo Brgy Tapia 4107 General Trias, Philippines
            </p>

            <h3 className="text-xl font-bold mb-2">Contact Details</h3>
            <p>📞 +63945 277 9541</p>
            <p>📧 kampoibayo@gmail.com</p>
            <p>🌐 Kampo Ibayo</p>

            <h3 className="text-xl font-bold mt-4 mb-2">Operating Hours</h3>
            <p>Open daily from 8:00 AM to 8:00 PM</p>
            <p>Check-in: 2:00 PM | Check-out: 12:00 NN</p>

            <button className="mt-6 px-6 py-3 bg-blue-600 rounded-full font-semibold hover:bg-blue-700 transition">
              Message us on Facebook
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          <p>© 2025 Kampo Ibayo. All rights reserved.</p>
          <p className="mt-2">Pet-friendly stays | Nature-inspired comfort</p>
        </footer>
      </section>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 bg-red-600 text-white h-10 w-10 flex items-center justify-center rounded-full shadow-lg hover:bg-red-700 transition"
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </div>
  );
}
