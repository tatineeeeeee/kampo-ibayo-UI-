"use client";
import type { User } from "@supabase/supabase-js";
import {
  FaUser,
  FaEnvelope,
  FaUserTag,
  FaEdit,
  FaPhone,
  FaSpinner,
} from "react-icons/fa";

interface ProfileHeaderProps {
  user: User;
  userProfile: {
    name: string;
    email: string;
    phone: string;
    role: string;
  } | null;
  loadingProfile: boolean;
  editingName: boolean;
  newName: string;
  setNewName: (value: string) => void;
  updating: boolean;
  handleUpdateName: () => Promise<void>;
  handleCancelEdit: () => void;
  handleStartEdit: () => void;
  editingPhone: boolean;
  newPhone: string;
  setNewPhone: (value: string) => void;
  updatingPhone: boolean;
  handleUpdatePhone: () => Promise<void>;
  handleCancelPhoneEdit: () => void;
  handleStartPhoneEdit: () => void;
  formatPhoneNumber: (value: string) => string;
  bookingStats: {
    memberSince: string;
  };
}

export default function ProfileHeader({
  user,
  userProfile,
  loadingProfile,
  editingName,
  newName,
  setNewName,
  updating,
  handleUpdateName,
  handleCancelEdit,
  handleStartEdit,
  editingPhone,
  newPhone,
  setNewPhone,
  updatingPhone,
  handleUpdatePhone,
  handleCancelPhoneEdit,
  handleStartPhoneEdit,
  formatPhoneNumber,
  bookingStats,
}: ProfileHeaderProps) {
  return (
    <div className="bg-card backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-border">
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary p-3 sm:p-4 rounded-full shadow-lg ring-4 ring-blue-600/20 flex-shrink-0">
          <FaUser className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {loadingProfile
              ? "Loading..."
              : userProfile?.name || user.user_metadata?.name || "User"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Member since{" "}
            {bookingStats.memberSince ||
              new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Profile Details */}
      <div className="space-y-4">
        {/* Name */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/70 rounded-lg border border-border">
          <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              Full Name
            </label>
            {editingName ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-secondary text-foreground px-3 py-1 rounded border border-gray-500 focus:border-primary focus:outline-none flex-1 text-sm sm:text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateName();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                />
                <button
                  onClick={handleUpdateName}
                  disabled={updating || !newName.trim()}
                  className="text-green-500 hover:text-green-400 disabled:text-muted-foreground disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                >
                  {updating ? (
                    <FaSpinner className="animate-spin w-3 h-3" />
                  ) : (
                    "✓"
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="text-red-500 hover:text-red-400 min-w-[28px] h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-foreground font-semibold text-sm sm:text-base truncate">
                  {loadingProfile
                    ? "Loading..."
                    : userProfile?.name ||
                      user.user_metadata?.name ||
                      "Not provided"}
                </p>
                <button
                  onClick={handleStartEdit}
                  disabled={loadingProfile}
                  className="text-muted-foreground hover:text-blue-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/70 rounded-lg border border-border">
          <FaPhone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              Phone Number
            </label>
            {editingPhone ? (
              <div className="flex gap-2 items-center">
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewPhone(formatted);
                  }}
                  placeholder="09XX-XXX-XXXX (11 digits)"
                  className="bg-secondary text-foreground px-3 py-1 rounded border border-gray-500 focus:border-primary focus:outline-none flex-1 text-sm sm:text-base"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdatePhone();
                    if (e.key === "Escape") handleCancelPhoneEdit();
                  }}
                />
                <button
                  onClick={handleUpdatePhone}
                  disabled={updatingPhone || !newPhone.trim()}
                  className="text-green-500 hover:text-green-400 disabled:text-muted-foreground disabled:cursor-not-allowed min-w-[28px] h-7 flex items-center justify-center"
                >
                  {updatingPhone ? (
                    <FaSpinner className="animate-spin w-3 h-3" />
                  ) : (
                    "✓"
                  )}
                </button>
                <button
                  onClick={handleCancelPhoneEdit}
                  className="text-red-500 hover:text-red-400 min-w-[28px] h-7 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-foreground font-semibold text-sm sm:text-base truncate">
                  {loadingProfile
                    ? "Loading..."
                    : userProfile?.phone || "Not provided"}
                </p>
                <button
                  onClick={handleStartPhoneEdit}
                  disabled={loadingProfile}
                  className="text-muted-foreground hover:text-blue-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/70 rounded-lg border border-border">
          <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              Email Address
            </label>
            <p className="text-foreground font-semibold text-sm sm:text-base truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/70 rounded-lg border border-border">
          <FaUserTag className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1">
              Account Type
            </label>
            <span className="inline-block bg-primary text-foreground px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md">
              {loadingProfile
                ? "Loading..."
                : userProfile?.role || user.user_metadata?.role || "Guest"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
