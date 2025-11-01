"use client";

import { useState, useEffect, useCallback } from 'react';
import { AdminOnly } from "../../hooks/useRoleAccess";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Clock,
  Phone,
  Building,
  Users
} from 'lucide-react';
import { supabase } from '@/app/supabaseClient';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';

interface SimpleBooking {
  id: number;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  number_of_guests: number;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
}

const REPORT_TYPES = [
  {
    id: 'daily-checklist',
    name: 'Daily Checklist',
    description: 'Today\'s arrivals, departures & housekeeping tasks',
    icon: Clock,
    color: 'blue'
  },
  {
    id: 'guest-registry',
    name: 'Guest Registry', 
    description: 'Complete guest contact database for communication',
    icon: Phone,
    color: 'green'
  },
  {
    id: 'revenue-summary',
    name: 'Revenue Report',
    description: 'Earnings summary for accounting & tax purposes',
    icon: DollarSign,
    color: 'purple'
  },
  {
    id: 'booking-calendar',
    name: 'Booking Calendar',
    description: 'Upcoming reservations & guest schedule',
    icon: Building,
    color: 'orange'
  }
];

export default function ReportsPage() {
  const [bookings, setBookings] = useState<SimpleBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]);
  const itemsPerPage = 10;

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select('id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, total_amount, status, created_at, number_of_guests, cancelled_by, cancelled_at, cancellation_reason')
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setBookings(data || []);
      console.log(`📊 Filtered bookings: ${data?.length || 0} bookings from ${startDate} to ${endDate}`);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [startDate, endDate, statusFilter, fetchBookings]);

  // 🎯 FILTERED BOOKINGS FOR CHARTS (respects date filters)
  const filteredBookings = bookings.filter(booking => {
    if (!booking.created_at) return false;
    
    const bookingDate = booking.created_at.split('T')[0];
    const isInDateRange = bookingDate >= startDate && bookingDate <= endDate;
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return isInDateRange && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);

  // Pagination calculations using filtered bookings
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, statusFilter]);

  const exportReport = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    switch (selectedReport.id) {
      case 'daily-checklist':
        // Today's operational checklist
        const today = new Date().toISOString().split('T')[0];
        const todaysActivity = filteredBookings.filter(
          b => b.check_in_date === today || b.check_out_date === today
        );
        headers = ['Time', 'Guest Name', 'Phone', 'Action Needed', 'Status', 'Notes'];
        rows = todaysActivity.map(booking => [
          booking.check_in_date === today ? '15:00 (Arrival)' : '11:00 (Departure)',
          booking.guest_name,
          booking.guest_phone || 'No phone provided',
          booking.check_in_date === today ? 'PREPARE RESORT' : 'CLEAN & RESET',
          booking.status || 'pending',
          `${booking.number_of_guests} guests`
        ]);
        filename = `daily-checklist-${startDate}-to-${endDate}.csv`;
        break;

      case 'guest-registry':
        // Complete guest database for marketing/communication
        headers = ['Guest Name', 'Email', 'Phone', 'Last Visit', 'Total Stays', 'Total Spent'];
        const guestMap = new Map();
        filteredBookings.forEach(booking => {
          const email = booking.guest_email || 'No email';
          if (!guestMap.has(email)) {
            guestMap.set(email, {
              name: booking.guest_name,
              email: booking.guest_email || 'No email',
              phone: booking.guest_phone || 'No phone',
              lastVisit: booking.check_out_date,
              totalStays: 0,
              totalSpent: 0
            });
          }
          const guest = guestMap.get(email);
          guest.totalStays += 1;
          if (booking.status === 'confirmed') {
            guest.totalSpent += booking.total_amount;
          }
          if (booking.check_out_date > guest.lastVisit) {
            guest.lastVisit = booking.check_out_date;
          }
        });
        rows = Array.from(guestMap.values()).map(guest => [
          guest.name,
          guest.email,
          guest.phone,
          guest.lastVisit,
          guest.totalStays.toString(),
          guest.totalSpent.toFixed(2)
        ]);
        filename = `guest-registry-${startDate}-to-${endDate}.csv`;
        break;

      case 'revenue-summary':
        // Revenue report for accounting/taxes
        const confirmedBookings = filteredBookings.filter(b => b.status === 'confirmed');
        headers = ['Booking Date', 'Guest Name', 'Check-in', 'Check-out', 'Nights', 'Amount', 'Payment Status'];
        rows = confirmedBookings.map(booking => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          
          return [
            booking.created_at?.split('T')[0] || '',
            booking.guest_name,
            booking.check_in_date,
            booking.check_out_date,
            nights.toString(),
            booking.total_amount.toFixed(2),
            'Paid' // Assuming confirmed means paid
          ];
        });
        
        // Add summary totals at the end
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.total_amount, 0);
        const totalNights = confirmedBookings.reduce((sum, b) => {
          const checkIn = new Date(b.check_in_date);
          const checkOut = new Date(b.check_out_date);
          return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        
        rows.push(['', '', '', 'TOTALS:', totalNights.toString(), totalRevenue.toFixed(2), '']);
        rows.push(['', '', '', 'Average/Night:', '', (totalRevenue / Math.max(totalNights, 1)).toFixed(2), '']);
        
        filename = `revenue-summary-${startDate}-to-${endDate}.csv`;
        break;

      case 'booking-calendar':
        // Upcoming reservations calendar
        const futureBookings = filteredBookings.filter(b => new Date(b.check_in_date) >= new Date());
        headers = ['Check-in Date', 'Check-out Date', 'Guest Name', 'Phone', 'Guests', 'Status'];
        rows = futureBookings
          .sort((a, b) => new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime())
          .map(booking => [
            booking.check_in_date,
            booking.check_out_date,
            booking.guest_name,
            booking.guest_phone || 'No phone',
            booking.number_of_guests.toString(),
            booking.status || 'pending'
          ]);
        filename = `booking-calendar-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        headers = ['Error'];
        rows = [['Unknown report type']];
        filename = 'error.csv';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Handle null/undefined
        if (cell === null || cell === undefined) return '""';
        
        let value = String(cell);
        
        // For numeric values that might show asterisks in Excel
        if (!isNaN(Number(cell)) && cell !== '') {
          const num = Number(cell);
          // Format currency/decimal values with proper precision
          if (headers.some(h => 
            h.toLowerCase().includes('amount') || 
            h.toLowerCase().includes('revenue') || 
            h.toLowerCase().includes('value') ||
            h.toLowerCase().includes('spent')
          )) {
            value = num.toFixed(2);
          } else {
            value = num.toString();
          }
        }
        
        // Escape quotes and wrap in quotes if contains special characters
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        
        return `"${value}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Reports</h1>
            <p className="text-gray-800 mt-1">Real-world reports for resort operations</p>
            <p className="text-sm text-gray-600 mt-1">📅 Filtering by booking creation date (when guests made their reservations)</p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh Data
          </button>
        </div>

        {/* Report Type Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Your Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORT_TYPES.map((report) => {
              const IconComponent = report.icon;
              const isSelected = selectedReport.id === report.id;
              
              // Define specific colors for each type
              const getCardStyles = () => {
                if (!isSelected) {
                  return {
                    card: 'border-gray-200 hover:border-gray-300 bg-white',
                    icon: 'text-gray-600',
                    title: 'text-gray-900'
                  };
                }
                
                switch (report.color) {
                  case 'blue':
                    return {
                      card: 'border-blue-500 bg-blue-50',
                      icon: 'text-blue-600',
                      title: 'text-blue-900'
                    };
                  case 'green':
                    return {
                      card: 'border-green-500 bg-green-50',
                      icon: 'text-green-600',
                      title: 'text-green-900'
                    };
                  case 'purple':
                    return {
                      card: 'border-purple-500 bg-purple-50',
                      icon: 'text-purple-600',
                      title: 'text-purple-900'
                    };
                  case 'orange':
                    return {
                      card: 'border-orange-500 bg-orange-50',
                      icon: 'text-orange-600',
                      title: 'text-orange-900'
                    };
                  case 'red':
                    return {
                      card: 'border-red-500 bg-red-50',
                      icon: 'text-red-600',
                      title: 'text-red-900'
                    };
                  default:
                    return {
                      card: 'border-gray-500 bg-gray-50',
                      icon: 'text-gray-600',
                      title: 'text-gray-900'
                    };
                }
              };
              
              const styles = getCardStyles();
              
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${styles.card}`}
                >
                  <IconComponent className={`w-6 h-6 mb-2 ${styles.icon}`} />
                  <h4 className={`font-semibold text-sm ${styles.title}`}>
                    {report.name}
                  </h4>
                  <p className="text-xs text-gray-800 mt-1">{report.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Simple Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Export</label>
            <button
              onClick={exportReport}
              disabled={isLoading || bookings.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export {selectedReport.name}
            </button>
          </div>
        </div>
      </div>

      {/* 📊 DYNAMIC CHARTS BASED ON REPORT TYPE */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          {selectedReport.name} Analytics
        </h2>
        
        {/* 📊 EXPLANATION PANEL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Chart Data Explanation</h3>
          </div>
          <div className="text-sm text-blue-700">
            <p><strong>📅 Date Range:</strong> All charts show data from <strong>{startDate}</strong> to <strong>{endDate}</strong></p>
            <p><strong>🎯 Status Filter:</strong> {statusFilter === 'all' ? 'All booking statuses included' : `Only ${statusFilter} bookings shown`}</p>
            <p><strong>📊 Total Filtered Bookings:</strong> {filteredBookings.length} bookings match your criteria</p>
            {selectedReport.id === 'daily-checklist' && (
              <p><strong>🏖️ Daily Check-in/out:</strong> Shows actual guest arrivals and departures within your selected date range</p>
            )}
          </div>
        </div>

        {/* Daily Checklist Charts */}
        {selectedReport.id === 'daily-checklist' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Daily Check-ins vs Check-outs
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    // 📅 REAL CHECK-IN/OUT DATA from filtered date range
                    const dailyData = [];
                    
                    // Create date range from startDate to endDate
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                    
                    // Show up to 14 days to keep chart readable
                    const daysToShow = Math.min(daysDiff, 14);
                    
                    for (let i = 0; i < daysToShow; i++) {
                      const date = new Date(start);
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      const checkIns = filteredBookings.filter(b => b.check_in_date === dateStr).length;
                      const checkOuts = filteredBookings.filter(b => b.check_out_date === dateStr).length;
                      
                      dailyData.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                        checkIns,
                        checkOuts
                      });
                    }
                    return dailyData;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="checkIns" fill="#10b981" name="Check-ins" />
                    <Bar dataKey="checkOuts" fill="#f59e0b" name="Check-outs" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Guest Count by Day
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={(() => {
                    const dailyData = [];
                    for (let i = 0; i < 7; i++) {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      const totalGuests = filteredBookings
                        .filter(b => b.check_in_date === dateStr)
                        .reduce((sum, b) => sum + (b.number_of_guests || 0), 0);
                      
                      dailyData.push({
                        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        guests: totalGuests
                      });
                    }
                    return dailyData;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="guests" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Total Guests" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Guest Registry Charts */}
        {selectedReport.id === 'guest-registry' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Guest Group Sizes
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const guestSizes = filteredBookings.reduce((acc, booking) => {
                          const size = booking.number_of_guests || 1;
                          const category = size <= 2 ? '1-2 People' : 
                                         size <= 5 ? '3-5 People' :
                                         size <= 10 ? '6-10 People' : '11+ People';
                          acc[category] = (acc[category] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                        return Object.entries(guestSizes).map(([name, value], index) => ({
                          name,
                          value,
                          color: colors[index % colors.length]
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredBookings.length > 0 && Object.entries(filteredBookings.reduce((acc, booking) => {
                        const size = booking.number_of_guests || 1;
                        const category = size <= 2 ? '1-2 People' : 
                                       size <= 5 ? '3-5 People' :
                                       size <= 10 ? '6-10 People' : '11+ People';
                        acc[category] = (acc[category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map((_, index) => {
                        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Monthly Guest Registrations
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthlyGuests = new Map();
                    
                    months.forEach(month => monthlyGuests.set(month, 0));
                    
                    filteredBookings.forEach(booking => {
                      if (booking.created_at) {
                        const month = months[new Date(booking.created_at).getMonth()];
                        monthlyGuests.set(month, monthlyGuests.get(month) + (booking.number_of_guests || 1));
                      }
                    });
                    
                    return months.map(month => ({
                      month,
                      guests: monthlyGuests.get(month)
                    }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="guests" fill="#10b981" name="Total Guests" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Revenue Summary Charts */}
        {selectedReport.id === 'revenue-summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Monthly Revenue Breakdown
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const monthlyRevenue = new Map();
                    
                    months.forEach(month => monthlyRevenue.set(month, { confirmed: 0, pending: 0 }));
                    
                    filteredBookings.forEach(booking => {
                      if (booking.created_at) {
                        const month = months[new Date(booking.created_at).getMonth()];
                        const current = monthlyRevenue.get(month);
                        const amount = booking.total_amount || 0;
                        
                        if (booking.status === 'confirmed') current.confirmed += amount;
                        else if (booking.status === 'pending') current.pending += amount;
                      }
                    });
                    
                    return months.map(month => ({
                      month,
                      confirmed: monthlyRevenue.get(month).confirmed,
                      pending: monthlyRevenue.get(month).pending
                    }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                    <Legend />
                    <Bar dataKey="confirmed" fill="#10b981" name="Confirmed Revenue" />
                    <Bar dataKey="pending" fill="#f59e0b" name="Pending Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Revenue Trend Analysis
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={(() => {
                    const last12Months = [];
                    for (let i = 11; i >= 0; i--) {
                      const date = new Date();
                      date.setMonth(date.getMonth() - i);
                      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                      
                      const monthRevenue = bookings
                        .filter(b => {
                          if (!b.created_at || b.status !== 'confirmed') return false;
                          const bookingMonth = new Date(b.created_at).getMonth();
                          return bookingMonth === date.getMonth();
                        })
                        .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                      
                      last12Months.push({ month: monthKey, revenue: monthRevenue });
                    }
                    return last12Months;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Monthly Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Booking Calendar Charts */}
        {selectedReport.id === 'booking-calendar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Upcoming Bookings Timeline
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={(() => {
                    const next30Days = [];
                    for (let i = 0; i < 30; i += 5) { // Show every 5 days
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      
                      const dayBookings = filteredBookings.filter(b => 
                        b.check_in_date >= dateStr && 
                        b.check_in_date < new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                      ).length;
                      
                      next30Days.push({
                        period: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        bookings: dayBookings
                      });
                    }
                    return next30Days;
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Booking Status Distribution
              </h3>
              {isLoading ? (
                <div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const statusCounts = filteredBookings.reduce((acc, booking) => {
                          const status = booking.status || 'unknown';
                          acc[status] = (acc[status] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>);

                        const colors = { confirmed: '#10b981', pending: '#f59e0b', cancelled: '#ef4444', unknown: '#6b7280' };
                        return Object.entries(statusCounts).map(([status, count]) => ({
                          name: status.charAt(0).toUpperCase() + status.slice(1),
                          value: count,
                          color: colors[status as keyof typeof colors] || '#6b7280'
                        }));
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {filteredBookings.length > 0 && Object.entries(filteredBookings.reduce((acc, booking) => {
                        const status = booking.status || 'unknown';
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)).map((_, index) => {
                        const colors = ['#10b981', '#f59e0b', '#ef4444', '#6b7280'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report-Specific Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {selectedReport.id === 'daily-checklist' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Today&apos;s Arrivals</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date().toISOString().split('T')[0];
                      return filteredBookings.filter(b => b.check_in_date === today).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Today&apos;s Departures</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date().toISOString().split('T')[0];
                      return filteredBookings.filter(b => b.check_out_date === today).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Resort Prep Tasks</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date().toISOString().split('T')[0];
                      return filteredBookings.filter(b => b.check_in_date === today).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Cleaning Tasks</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date().toISOString().split('T')[0];
                      return filteredBookings.filter(b => b.check_out_date === today).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </>
        )}
        
        {selectedReport.id === 'guest-registry' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Total Guests</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading ? '...' : (() => {
                      const uniqueEmails = new Set(filteredBookings.map(b => b.guest_email || 'No email'));
                      return uniqueEmails.size;
                    })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Return Guests</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? '...' : (() => {
                      const guestCounts = new Map();
                      bookings.forEach(b => {
                        guestCounts.set(b.guest_email, (guestCounts.get(b.guest_email) || 0) + 1);
                      });
                      return Array.from(guestCounts.values()).filter(count => count > 1).length;
                    })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Contact Info Available</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading ? '...' : (() => {
                      const withPhone = new Set();
                      bookings.forEach(b => {
                        if (b.guest_phone && b.guest_phone.trim()) {
                          withPhone.add(b.guest_email);
                        }
                      });
                      return withPhone.size;
                    })()}
                  </p>
                </div>
                <Phone className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">VIP Guests (3+ visits)</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading ? '...' : (() => {
                      const guestCounts = new Map();
                      bookings.forEach(b => {
                        guestCounts.set(b.guest_email, (guestCounts.get(b.guest_email) || 0) + 1);
                      });
                      return Array.from(guestCounts.values()).filter(count => count >= 3).length;
                    })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        )}
        
        {selectedReport.id === 'revenue-summary' && (
          <AdminOnly action="View financial reports">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Total Revenue</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? '...' : formatCurrency(totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Paid Bookings</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading ? '...' : confirmedBookings.length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Average/Booking</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading ? '...' : formatCurrency(confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Nights Sold</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading ? '...' : (() => {
                      return confirmedBookings.reduce((sum, b) => {
                        const checkIn = new Date(b.check_in_date);
                        const checkOut = new Date(b.check_out_date);
                        return sum + Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                      }, 0);
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </AdminOnly>
        )}
        
        {selectedReport.id === 'booking-calendar' && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Future Bookings</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date();
                      return filteredBookings.filter(b => new Date(b.check_in_date) >= today).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Next Month</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date();
                      const next30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
                      return filteredBookings.filter(b => {
                        const checkIn = new Date(b.check_in_date);
                        return checkIn >= today && checkIn <= next30;
                      }).length;
                    })()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Confirmed Guests</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date();
                      return filteredBookings.filter(b => 
                        new Date(b.check_in_date) >= today && b.status === 'confirmed'
                      ).length;
                    })()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-gray-700 text-sm font-medium">Pending Bookings</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {isLoading ? '...' : (() => {
                      const today = new Date();
                      return filteredBookings.filter(b => 
                        new Date(b.check_in_date) >= today && b.status === 'pending'
                      ).length;
                    })()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Booking Results</h3>
          <span className="text-sm text-gray-700">
            {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'} found
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-700">Loading bookings...</span>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Guest</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Check In</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Check Out</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Cancelled By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{booking.guest_name}</td>
                    <td className="px-4 py-3 text-gray-900">{booking.guest_email || 'No email'}</td>
                    <td className="px-4 py-3 text-gray-900">{new Date(booking.check_in_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900">{new Date(booking.check_out_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(booking.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {booking.status === 'cancelled' && booking.cancelled_by ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.cancelled_by === 'user' ? 'bg-orange-100 text-orange-800' :
                          booking.cancelled_by === 'admin' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.cancelled_by === 'user' ? 'Guest' : 
                           booking.cancelled_by === 'admin' ? 'Admin' : 
                           booking.cancelled_by}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-900 font-medium">
                  Showing {startIndex + 1} to {Math.min(endIndex, bookings.length)} of {bookings.length} bookings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded-lg font-medium ${
                          currentPage === page
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-300 text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-700">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-60" />
            <p>No bookings found for the selected filters</p>
            <p className="text-sm mt-1">Try adjusting your date range or status filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
