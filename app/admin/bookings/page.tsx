"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string;
  special_requests: string;
  brings_pet: boolean;
  created_at: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-600';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      case 'cancelled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking:', error);
        alert('Error updating booking status');
      } else {
        alert('Booking status updated successfully');
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating booking status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            All Bookings ({bookings.length})
          </h3>
          <button 
            onClick={fetchBookings}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
        
        {bookings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                  <th className="p-3">Guest</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Check-in</th>
                  <th className="p-3">Check-out</th>
                  <th className="p-3">Guests</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-black">
                      <div className="font-medium">{booking.guest_name}</div>
                    </td>
                    <td className="p-3 text-black text-sm">{booking.guest_email}</td>
                    <td className="p-3 text-black text-sm">
                      {booking.guest_phone ? (
                        <a 
                          href={`tel:${booking.guest_phone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {booking.guest_phone}
                        </a>
                      ) : (
                        <span className="text-gray-400">No phone</span>
                      )}
                    </td>
                    <td className="p-3 text-black">{formatDate(booking.check_in_date)}</td>
                    <td className="p-3 text-black">{formatDate(booking.check_out_date)}</td>
                    <td className="p-3 text-black">{booking.number_of_guests}</td>
                    <td className="p-3 text-black font-medium">₱{booking.total_amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                            >
                              Confirm
                            </button>
                            <button 
                              onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        <button className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
