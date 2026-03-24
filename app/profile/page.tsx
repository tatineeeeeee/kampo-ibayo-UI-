"use client";
import Link from "next/link";
import { useProfile } from "../hooks/useProfile";
import {
  FaHome,
  FaCalendarPlus,
  FaHistory,
  FaCog,
  FaSpinner,
  FaSignOutAlt,
} from "react-icons/fa";
import ProfileHeader from "../components/profile/ProfileHeader";
import StatsCards from "../components/profile/StatsCards";
import BookingHistory from "../components/profile/BookingHistory";
export default function ProfilePage() {
  const {
    user,
    loading,
    userProfile,
    loadingProfile,
    maintenanceActive,
    editingName,
    newName,
    updating,
    editingPhone,
    newPhone,
    updatingPhone,
    signingOut,
    bookingStats,
    statsLoading,
    setNewName,
    setNewPhone,
    formatPhoneNumber,
    handleSignOut,
    handleUpdateName,
    handleCancelEdit,
    handleStartEdit,
    handleUpdatePhone,
    handleCancelPhoneEdit,
    handleStartPhoneEdit,
  } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Sticky Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-card hover:bg-muted rounded-lg transition-colors"
              >
                <FaHome className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </Link>
              <div className="text-foreground">
                <h1 className="text-lg sm:text-xl font-bold">My Profile</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Manage your account
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground text-right">
              {loading ? (
                <span className="inline-block bg-muted-foreground text-muted-foreground px-2 py-1 rounded-full text-xs font-medium">
                  ● Loading...
                </span>
              ) : user ? (
                <span className="inline-block bg-success text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                  ● Signed In
                </span>
              ) : (
                <span className="inline-block bg-warning text-foreground px-2 py-1 rounded-full text-xs font-semibold">
                  ● Guest
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile First */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
        <ProfileHeader
          user={user}
          userProfile={userProfile}
          loadingProfile={loadingProfile}
          editingName={editingName}
          newName={newName}
          setNewName={setNewName}
          updating={updating}
          handleUpdateName={handleUpdateName}
          handleCancelEdit={handleCancelEdit}
          handleStartEdit={handleStartEdit}
          editingPhone={editingPhone}
          newPhone={newPhone}
          setNewPhone={setNewPhone}
          updatingPhone={updatingPhone}
          handleUpdatePhone={handleUpdatePhone}
          handleCancelPhoneEdit={handleCancelPhoneEdit}
          handleStartPhoneEdit={handleStartPhoneEdit}
          formatPhoneNumber={formatPhoneNumber}
          bookingStats={bookingStats}
        />

        <StatsCards bookingStats={bookingStats} statsLoading={statsLoading} />

        {/* Quick Actions */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {maintenanceActive ? (
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted-foreground/20 rounded-lg border border-border/30 opacity-50 cursor-not-allowed">
                <FaCalendarPlus className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-muted-foreground font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Temporarily disabled
                  </p>
                </div>
              </div>
            ) : (
              <Link
                href="/book"
                className="flex items-center gap-3 p-3 sm:p-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30 group"
              >
                <FaCalendarPlus className="w-5 h-5 text-primary group-hover:text-primary/80 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    New Booking
                  </p>
                  <p className="text-muted-foreground text-xs sm:text-sm">
                    Reserve your stay
                  </p>
                </div>
              </Link>
            )}
            <Link
              href="/bookings"
              className="flex items-center gap-3 p-3 sm:p-4 bg-primary/20 hover:bg-primary/30 rounded-lg transition-all duration-200 border border-primary/30 group"
            >
              <FaHistory className="w-5 h-5 text-primary group-hover:text-primary/80 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  Booking History
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  View all reservations
                </p>
              </div>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 p-3 sm:p-4 bg-chart-4/10 hover:bg-chart-4/20 rounded-lg transition-all duration-200 border border-chart-4/30 group"
            >
              <FaCog className="w-5 h-5 text-chart-4 group-hover:text-chart-4 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  Account Settings
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Manage preferences
                </p>
              </div>
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 p-3 sm:p-4 bg-muted-foreground/20 hover:bg-muted-foreground/30 rounded-lg transition-all duration-200 border border-border/30 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <FaSpinner className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
              ) : (
                <FaSignOutAlt className="w-5 h-5 text-muted-foreground group-hover:text-muted-foreground flex-shrink-0" />
              )}
              <div className="text-left min-w-0">
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  {signingOut ? "Signing out..." : "Sign Out"}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">
                  {signingOut ? "Please wait..." : "Secure logout"}
                </p>
              </div>
            </button>
          </div>
        </div>

        <BookingHistory recentBookings={bookingStats.recentBookings} />

        {/* Contact & Support */}
        <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border/50">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            Need Help?
          </h3>

          {/* Emergency Contact Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="tel:+639662815123"
              className="group flex items-center gap-3 p-3 bg-success/20 hover:bg-success/30 rounded-lg border border-success/30 transition-all duration-200"
            >
              <div className="bg-success p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-success font-semibold text-sm">
                  Call Resort
                </p>
                <p className="text-success text-xs">0966 281 5123</p>
              </div>
            </a>

            <a
              href="mailto:kampoibayo@gmail.com"
              className="group flex items-center gap-3 p-3 bg-primary/20 hover:bg-primary/30 rounded-lg border border-primary/30 transition-all duration-200"
            >
              <div className="bg-primary p-2 rounded-lg">
                <svg
                  className="w-4 h-4 text-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-primary font-semibold text-sm">
                  Email Support
                </p>
                <p className="text-primary/80 text-xs truncate">
                  kampoibayo@gmail.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
