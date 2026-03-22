"use client";
import {
  FaUser,
  FaSave,
} from "react-icons/fa";

interface ProfileSectionProps {
  profileData: {
    name: string;
    email: string;
    phone: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    phone: string;
  }>>;
  saving: boolean;
  formatPhoneNumber: (value: string) => string;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function ProfileSection({
  profileData,
  setProfileData,
  saving,
  formatPhoneNumber,
  onSubmit,
}: ProfileSectionProps) {
  return (
    <section
      id="profile"
      className="bg-card rounded-xl shadow-2xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <FaUser className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          Profile Information
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="full-name-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Full Name
          </label>
          <input
            id="full-name-input"
            type="text"
            value={profileData.name}
            onChange={(e) =>
              setProfileData({ ...profileData, name: e.target.value })
            }
            className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-3 "
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label
            htmlFor="email-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Email Address
          </label>
          <input
            id="email-input"
            type="email"
            value={profileData.email}
            disabled
            className="w-full bg-gray-600 border border-border text-muted-foreground rounded-lg px-4 py-3 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label
            htmlFor="phone-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Phone Number
          </label>
          <input
            id="phone-input"
            type="tel"
            value={profileData.phone}
            onChange={(e) => {
              const formatted = formatPhoneNumber(e.target.value);
              setProfileData({ ...profileData, phone: formatted });
            }}
            className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-3 "
            placeholder="09XX-XXX-XXXX (11 digits)"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          <FaSave className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </section>
  );
}
