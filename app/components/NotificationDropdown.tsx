"use client";
import { useState } from 'react';
import { Bell, Users, Calendar, X, CheckCircle } from 'lucide-react';
import { useAdminNotifications } from '../hooks/useAdminNotifications';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, loading, refreshNotifications } = useAdminNotifications();

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasNotifications = notifications.totalNotifications > 0;

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative group focus:outline-none"
      >
        <Bell className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition" />
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full ring-2 ring-white bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {notifications.totalNotifications > 9 ? '9+' : notifications.totalNotifications}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                <p className="text-sm text-gray-500">
                  Last updated: {formatTime(notifications.lastChecked)}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : !hasNotifications ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-500">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* Pending Bookings */}
                  {notifications.pendingBookings > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Calendar className="w-5 h-5 text-yellow-500 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notifications.pendingBookings} Pending Booking{notifications.pendingBookings > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notifications.pendingBookings > 1 
                              ? `${notifications.pendingBookings} bookings need your review`
                              : '1 booking needs your review'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full font-medium">
                          {notifications.pendingBookings}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New Users */}
                  {notifications.newUsers > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notifications.newUsers} New User{notifications.newUsers > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notifications.newUsers > 1 
                              ? `${notifications.newUsers} users registered in the last 24 hours`
                              : '1 user registered in the last 24 hours'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                          {notifications.newUsers}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recent Cancellations */}
                  {notifications.recentCancellations > 0 && (
                    <div className="p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <X className="w-5 h-5 text-red-500 mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {notifications.recentCancellations} Recent Cancellation{notifications.recentCancellations > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notifications.recentCancellations > 1 
                              ? `${notifications.recentCancellations} bookings cancelled this week`
                              : '1 booking cancelled this week'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                          {notifications.recentCancellations}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {hasNotifications && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    refreshNotifications();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}