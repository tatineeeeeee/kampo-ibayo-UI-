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
        <Bell className="w-6 h-6 text-muted-foreground group-hover:text-primary transition" />
        {hasNotifications && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full ring-2 ring-white bg-primary text-foreground text-xs flex items-center justify-center font-bold">
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
          <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-xl border border-border z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated: {formatTime(notifications.lastChecked)}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : !hasNotifications ? (
                <div className="p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {/* Pending Bookings */}
                  {notifications.pendingBookings > 0 && (
                    <div className="p-4 hover:bg-muted cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Calendar className="w-5 h-5 text-warning mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notifications.pendingBookings} Pending Booking{notifications.pendingBookings > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notifications.pendingBookings > 1 
                              ? `${notifications.pendingBookings} bookings need your review`
                              : '1 booking needs your review'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-warning/10 text-warning text-xs rounded-full font-medium">
                          {notifications.pendingBookings}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* New Users */}
                  {notifications.newUsers > 0 && (
                    <div className="p-4 hover:bg-muted cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <Users className="w-5 h-5 text-primary mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notifications.newUsers} New User{notifications.newUsers > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notifications.newUsers > 1 
                              ? `${notifications.newUsers} users registered in the last 24 hours`
                              : '1 user registered in the last 24 hours'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          {notifications.newUsers}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Recent Cancellations */}
                  {notifications.recentCancellations > 0 && (
                    <div className="p-4 hover:bg-muted cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <X className="w-5 h-5 text-destructive mt-0.5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {notifications.recentCancellations} Recent Cancellation{notifications.recentCancellations > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notifications.recentCancellations > 1 
                              ? `${notifications.recentCancellations} bookings cancelled this week`
                              : '1 booking cancelled this week'
                            }
                          </p>
                        </div>
                        <span className="flex-shrink-0 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full font-medium">
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
              <div className="p-4 border-t border-border bg-muted">
                <button
                  onClick={() => {
                    refreshNotifications();
                    setIsOpen(false);
                  }}
                  className="w-full text-center text-sm text-primary hover:text-primary font-medium"
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