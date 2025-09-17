"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: "",
    checkIn: "",
    checkOut: "",
    pet: false,
    request: "",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check authentication and get pre-selected date
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Get date from URL params (from calendar click)
    const selectedDate = searchParams.get('date');
    if (selectedDate) {
      setFormData(prev => ({ ...prev, checkIn: selectedDate }));
    }

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, type, value } = e.target;
    let fieldValue: string | boolean = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      fieldValue = e.target.checked;
    }
    setFormData({ ...formData, [name]: fieldValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert("Please login to make a booking");
      router.push("/auth");
      return;
    }

    setLoading(true);

    try {
      console.log("Auth user:", user);
      console.log("Auth user ID:", user.id);
      
      // We'll create the booking directly with the auth user ID
      // No need to check/create in users table for booking functionality
      
      // Calculate total amount
      const nights = new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime();
      const numberOfNights = Math.ceil(nights / (1000 * 3600 * 24));
      const pricePerNight = 1500; // ₱1,500 per night
      const totalAmount = numberOfNights * pricePerNight;

      console.log("Booking details:", {
        user_id: user.id,
        guest_name: formData.name,
        guest_email: formData.email || user.email,
        numberOfNights,
        totalAmount
      });

      // Insert booking directly
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id, // Use auth user ID directly
          guest_name: formData.name,
          guest_email: formData.email || user.email || '', // Ensure fallback to empty string
          guest_phone: formData.phone,
          check_in_date: formData.checkIn,
          check_out_date: formData.checkOut,
          number_of_guests: parseInt(formData.guests),
          total_amount: totalAmount,
          special_requests: formData.request,
          brings_pet: formData.pet,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
        throw bookingError;
      }

      console.log("Booking created:", bookingData);

      console.log("Booking created:", bookingData);

      alert(`Booking successful! Total: ₱${totalAmount.toLocaleString()} for ${numberOfNights} night(s)`);
      router.push("/bookings");
      
    } catch (error: unknown) {
      console.error('Detailed booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Booking failed: ${errorMessage}. Please check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6"
      style={{
        backgroundImage:
          "url('/pool.jpg')", // replace with your background image
      }}
    >
      <div className="bg-gray-900 bg-opacity-90 text-white rounded-lg shadow-2xl w-full max-w-2xl p-8">
        {/* Title */}
        <h1 className="text-2xl font-bold text-center mb-6">Book your Stay</h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-red-500"
              required
               placeholder="e.g. John Doe"
            />
          </div>

          {/* Email + Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-red-500"
                required
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2"
                placeholder="e.g. +63 912 345 6789"              
              />
            </div>
          </div>

          {/* Guests */}
{/* Guests */}
<div>
  <label className="block text-sm font-medium mb-1">
    Number of Guest
  </label>
  <div className="relative">
    <select
      name="guests"
      value={formData.guests}
      onChange={handleChange}
      className="w-full appearance-none rounded-md bg-gray-800 border border-gray-700 px-4 py-2 text-white"
    >
      <option value="">Select number of Guest</option>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
        <option key={num} value={num}>
          {num}
        </option>
      ))}
    </select>

    {/* Custom dropdown icon */}
    <FaChevronDown
      className="pointer-events-none absolute inset-y-0 right-3 my-auto text-gray-400"
    />
  </div>
</div>


          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Check-in Date
              </label>
              <input
                type="date"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Check-out Date
              </label>
              <input
                type="date"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Pet info */}
          <div>
            <label className="flex items-start space-x-2">
              <input
                type="checkbox"
                name="pet"
                checked={formData.pet}
                onChange={handleChange}
                className="mt-1 h-4 w-4 text-red-500 focus:ring-red-500 border-gray-700 rounded"
              />
              <span>
                <span className="block">I will be bringing a pet</span>
                <span className="text-sm text-gray-400">
                  Pets are welcome at no additional cost. Please notify us in
                  advance.
                </span>
              </span>
            </label>
          </div>

          {/* Special Request */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Special Request
            </label>
            <textarea
              name="request"
              value={formData.request}
              onChange={handleChange}
              rows={3}
              placeholder="Any special accommodations or request..."
              className="w-full rounded-md bg-gray-800 border border-gray-700 px-4 py-2 focus:ring-2 focus:ring-red-500"
              
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white font-semibold py-3 rounded-md hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Reserve Now"}
          </button>
        </form>
      </div>
    </main>
  );
}
