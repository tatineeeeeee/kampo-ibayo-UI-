"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { FaHome, FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPlus, FaPhone } from "react-icons/fa";

interface Booking {
  id: number;
  user_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  special_requests: string | null;
  brings_pet: boolean | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (!data.session?.user) {
        router.push("/auth");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          router.push("/auth");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    async function loadBookings() {
      if (!user) return;
      
      console.log("Loading bookings for user:", user.id);
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      console.log("Bookings query result:", { data, error });
      
      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        console.log("Found bookings:", data?.length || 0);
        setBookings(data as Booking[] || []);
      }
      setLoading(false);
    }
    
    if (user) {
      loadBookings();
    }
  }, [user]);

  const refreshBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log("Refreshing bookings for user:", user.id);
    
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    console.log("Refresh query result:", { data, error });
    
    if (error) {
      console.error("Error loading bookings:", error);
    } else {
      console.log("Refreshed bookings:", data?.length || 0);
      setBookings(data as Booking[] || []);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return <FaCheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <FaHourglassHalf className="w-5 h-5 text-yellow-500" />;
      case "cancelled":
        return <FaTimesCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FaClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-600";
      case "pending":
        return "bg-yellow-600";
      case "cancelled":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading your bookings...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition">
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-white">
              <h1 className="text-3xl font-bold">My Bookings</h1>
              <p className="text-gray-400">Manage your reservations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshBookings}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              <FaClock className="w-4 h-4" />
              Refresh
            </button>
            <Link href="/book">
              <button className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                <FaPlus className="w-4 h-4" />
                New Booking
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {bookings.length === 0 ? (
          // Empty State
          <div className="bg-gray-800 rounded-xl shadow-2xl p-12 text-center">
            <div className="bg-gray-700 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FaCalendarAlt className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">No bookings yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven&apos;t made any reservations yet. Start planning your perfect getaway at Kampo Ibayo!
            </p>
            <div className="space-y-4">
              <Link href="/book">
                <button className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
                  Make Your First Booking
                </button>
              </Link>
              <div className="text-center">
                <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Bookings List
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Your Reservations ({bookings.length})
                </h2>
                <div className="text-sm text-gray-400">
                  Showing all bookings
                </div>
              </div>

              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <div 
                    key={booking.id} 
                    className="bg-gray-700 rounded-lg p-6 hover:bg-gray-650 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-full">
                          <FaCalendarAlt className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            Booking #{booking.id}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {booking.guest_name} • {booking.guest_email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(booking.status || 'pending')}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(booking.status || 'pending')}`}>
                          {(booking.status || 'pending').charAt(0).toUpperCase() + (booking.status || 'pending').slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <div className="flex items-center gap-3 text-gray-300">
                        <FaCalendarAlt className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Check-in</p>
                          <p className="font-semibold">
                            {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <FaCalendarAlt className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Check-out</p>
                          <p className="font-semibold">
                            {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <FaUsers className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Guests</p>
                          <p className="font-semibold">{booking.number_of_guests} guest(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <FaClock className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Total Amount</p>
                          <p className="font-semibold">₱{booking.total_amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-300">
                        <FaPhone className="w-4 h-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-400">Contact</p>
                          {booking.guest_phone ? (
                            <a 
                              href={`tel:${booking.guest_phone}`}
                              className="font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {booking.guest_phone}
                            </a>
                          ) : (
                            <p className="font-semibold text-gray-500">No phone</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="bg-gray-600 p-3 rounded-lg mb-4">
                        <p className="text-xs text-gray-400 mb-1">Special Request:</p>
                        <p className="text-gray-200 text-sm">{booking.special_requests}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                      <p className="text-gray-400 text-sm">
                        Booking Date: {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}
                      </p>
                      <div className="flex gap-2">
                        <button className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition">
                          View Details
                        </button>
                        {(booking.status || 'pending').toLowerCase() === "pending" && (
                          <button className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
