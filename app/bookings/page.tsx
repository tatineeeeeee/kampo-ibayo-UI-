"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";
import { FaHome, FaCalendarAlt, FaUsers, FaClock, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPlus } from "react-icons/fa";

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
  cancelled_by: string | null; // 'user' or 'admin'
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
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
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        setBookings(data as Booking[] || []);
      }
      setLoading(false);
    }
    
    if (user) {
      loadBookings();
    }
  }, [user]);

  const openModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBooking(null);
    setShowCancelModal(false);
    setCancellationReason("");
  };

  const canCancelBooking = (booking: Booking) => {
    if (!booking.status || booking.status.toLowerCase() === 'cancelled') {
      return false;
    }
    
    // Always allow cancellation if booking is pending
    if (booking.status.toLowerCase() === 'pending') {
      return true;
    }
    
    // For confirmed bookings, check if it's at least 24 hours before check-in
    if (booking.status.toLowerCase() === 'confirmed') {
      const checkInDate = new Date(booking.check_in_date);
      const now = new Date();
      const timeDifference = checkInDate.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 3600);
      
      return hoursDifference >= 24;
    }
    
    return false;
  };

  const getCancellationMessage = (booking: Booking) => {
    if (booking.status?.toLowerCase() === 'pending') {
      return 'Cancel this pending booking';
    }
    
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const timeDifference = checkInDate.getTime() - now.getTime();
    const hoursDifference = timeDifference / (1000 * 3600);
    
    if (hoursDifference < 24) {
      return `Cannot cancel: Less than 24 hours until check-in (${Math.floor(hoursDifference)} hours remaining)`;
    }
    
    return `Cancel booking (${Math.floor(hoursDifference)} hours until check-in)`;
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancelled_by: 'user',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason.trim()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking. Please try again.');
      } else {
        alert('Booking cancelled successfully');
        // Refresh the bookings list
        if (user) {
          const { data, error } = await supabase
            .from("bookings")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          
          if (!error) {
            setBookings(data as Booking[] || []);
          }
        }
        closeModal();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error cancelling booking. Please try again.');
    }
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
          <Link href="/book">
            <button className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition">
              <FaPlus className="w-4 h-4" />
              New Booking
            </button>
          </Link>
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

                    <div className="grid md:grid-cols-4 gap-4 mb-4">
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
                          <p className="font-semibold text-green-400">₱{booking.total_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {booking.guest_phone && (
                      <div className="mb-4">
                        <p className="text-gray-400 text-sm">
                          Contact: <a href={`tel:${booking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline">{booking.guest_phone}</a>
                        </p>
                      </div>
                    )}

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
                        <button 
                          onClick={() => openModal(booking)}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition"
                        >
                          View Details
                        </button>
                        {canCancelBooking(booking) ? (
                          <button 
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowModal(true);
                              setShowCancelModal(true);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                            title={getCancellationMessage(booking)}
                          >
                            Cancel
                          </button>
                        ) : booking.status?.toLowerCase() !== 'cancelled' && (
                          <button 
                            disabled
                            className="bg-gray-500 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                            title={getCancellationMessage(booking)}
                          >
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

      {/* Modal Overlay - Matching Your Gray & Red UI Design */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Matching Your UI Style */}
            <div className="bg-gray-700 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-full">
                    <FaCalendarAlt className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Booking Details</h2>
                    <p className="text-gray-400 text-sm">Your reservation information</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-600 transition"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Booking Info Section */}
              <div className="bg-gray-700 rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-full">
                      <FaCalendarAlt className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Booking #{selectedBooking.id}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {selectedBooking.guest_name} • {selectedBooking.guest_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedBooking.status || 'pending')}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getStatusColor(selectedBooking.status || 'pending')}`}>
                      {(selectedBooking.status || 'pending').charAt(0).toUpperCase() + (selectedBooking.status || 'pending').slice(1)}
                    </span>
                  </div>
                </div>

                {/* Dates and Guest Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <FaCalendarAlt className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-400">Check-in Date</p>
                        <p className="font-semibold">
                          {selectedBooking.check_in_date ? new Date(selectedBooking.check_in_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <FaUsers className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-400">Number of Guests</p>
                        <p className="font-semibold">{selectedBooking.number_of_guests} guest(s)</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-300">
                      <FaCalendarAlt className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-400">Check-out Date</p>
                        <p className="font-semibold">
                          {selectedBooking.check_out_date ? new Date(selectedBooking.check_out_date).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <FaClock className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-gray-400">Total Amount</p>
                        <p className="font-semibold text-green-400">₱{selectedBooking.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {selectedBooking.guest_phone && (
                  <div className="border-t border-gray-600 pt-4">
                    <p className="text-gray-400 text-sm">
                      Phone: <a href={`tel:${selectedBooking.guest_phone}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">{selectedBooking.guest_phone}</a>
                    </p>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Special Requests</h4>
                    <p className="text-gray-300 text-sm">{selectedBooking.special_requests}</p>
                  </div>
                )}

                {/* Pet Information */}
                {selectedBooking.brings_pet !== null && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Pet Policy</h4>
                    <p className="text-gray-300 text-sm">
                      {selectedBooking.brings_pet ? (
                        <span className="text-green-400">✅ Pet-friendly booking</span>
                      ) : (
                        <span className="text-gray-400">🚫 No pets for this booking</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Booking Date */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Booking Information</h4>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">
                      Created on: {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString() : "N/A"}
                    </p>
                    {selectedBooking.status?.toLowerCase() === 'cancelled' && selectedBooking.cancelled_by && (
                      <div className="border-t border-gray-600 pt-2">
                        <p className="text-red-400 text-sm font-medium">
                          ❌ Cancelled by {selectedBooking.cancelled_by === 'user' ? 'Guest' : 'Admin'}
                        </p>
                        {selectedBooking.cancelled_at && (
                          <p className="text-gray-400 text-xs">
                            Cancelled on: {new Date(selectedBooking.cancelled_at).toLocaleDateString('en-PH', {timeZone: 'Asia/Manila'})} at {new Date(selectedBooking.cancelled_at).toLocaleTimeString('en-PH', {timeZone: 'Asia/Manila', hour: '2-digit', minute:'2-digit', hour12: true})}
                          </p>
                        )}
                        {selectedBooking.cancellation_reason && (
                          <p className="text-gray-400 text-xs">
                            Reason: {selectedBooking.cancellation_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Matching Your Button Style */}
            <div className="bg-gray-700 p-6 rounded-b-xl border-t border-gray-600">
              {canCancelBooking(selectedBooking) && !showCancelModal ? (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                    title={getCancellationMessage(selectedBooking)}
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition"
                  >
                    Close
                  </button>
                </div>
              ) : showCancelModal ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Why are you cancelling this booking?</h4>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Please provide a reason for cancellation (required)"
                      className="w-full p-3 rounded-lg bg-gray-600 text-white placeholder-gray-400 border border-gray-500 focus:border-red-500 focus:outline-none resize-none"
                      rows={3}
                      maxLength={200}
                    />
                    <p className="text-gray-400 text-xs mt-1">{cancellationReason.length}/200 characters</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={!cancellationReason.trim()}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
                        cancellationReason.trim() 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      Confirm Cancellation
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelModal(false);
                        setCancellationReason("");
                      }}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-500 transition"
                    >
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {!canCancelBooking(selectedBooking) && selectedBooking.status?.toLowerCase() !== 'cancelled' && (
                    <button 
                      disabled
                      className="bg-gray-500 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                      title={getCancellationMessage(selectedBooking)}
                    >
                      Cannot Cancel
                    </button>
                  )}
                  <button
                    onClick={closeModal}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500 transition"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
