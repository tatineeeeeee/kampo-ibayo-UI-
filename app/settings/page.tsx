"use client";

import Link from "next/link";
import { useAccountSettings } from "../hooks/useAccountSettings";
import { FaHome, FaUser, FaLock, FaShieldAlt } from "react-icons/fa";
import ProfileSection from "../components/settings/ProfileSection";
import PasswordSection from "../components/settings/PasswordSection";
import DataExportSection from "../components/settings/DataExportSection";
import DeleteAccountSection from "../components/settings/DeleteAccountSection";

export default function SettingsPage() {
  const {
    user,
    loading,
    saving,
    exporting,
    showExportDropdown,
    activeSection,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    profileData,
    passwordData,
    passwordsMatch,
    setShowExportDropdown,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setProfileData,
    setPasswordData,
    formatPhoneNumber,
    validatePasswordStrength,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    handleProfileUpdate,
    handlePasswordUpdate,
    scrollToSection,
    handleDeleteAccount,
    handleExportData,
  } = useAccountSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-lg">Loading settings...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="text-muted-foreground hover:text-foreground transition"
            >
              <FaHome className="w-6 h-6" />
            </Link>
            <div className="text-foreground">
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">
                Manage your account preferences
              </p>
            </div>
          </div>
          <Link href="/profile">
            <button className="bg-muted text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-muted transition">
              Back to Profile
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl shadow-2xl p-6 sticky top-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Settings</h3>
            <nav className="space-y-2">
              <button
                onClick={() => scrollToSection("profile")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "profile"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
                }`}
              >
                <FaUser className="w-4 h-4" />
                Profile Information
              </button>
              <button
                onClick={() => scrollToSection("security")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "security"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
                }`}
              >
                <FaLock className="w-4 h-4" />
                Security & Password
              </button>
              <button
                onClick={() => scrollToSection("privacy")}
                className={`w-full flex items-center gap-3 p-3 rounded-lg font-semibold transition-colors ${
                  activeSection === "privacy"
                    ? "bg-primary text-foreground"
                    : "text-muted-foreground hover:bg-primary hover:text-foreground"
                }`}
              >
                <FaShieldAlt className="w-4 h-4" />
                Privacy & Data
              </button>
            </nav>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <ProfileSection
            profileData={profileData}
            setProfileData={setProfileData}
            saving={saving}
            formatPhoneNumber={formatPhoneNumber}
            onSubmit={handleProfileUpdate}
          />

          <PasswordSection
            passwordData={passwordData}
            saving={saving}
            showCurrentPassword={showCurrentPassword}
            showNewPassword={showNewPassword}
            showConfirmPassword={showConfirmPassword}
            passwordsMatch={passwordsMatch}
            setShowCurrentPassword={setShowCurrentPassword}
            setShowNewPassword={setShowNewPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            setPasswordData={setPasswordData}
            handleNewPasswordChange={handleNewPasswordChange}
            handleConfirmPasswordChange={handleConfirmPasswordChange}
            validatePasswordStrength={validatePasswordStrength}
            onSubmit={handlePasswordUpdate}
          />

          <section id="privacy" className="bg-card rounded-xl shadow-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaShieldAlt className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">
                Privacy & Data
              </h2>
            </div>

            <div className="space-y-6">
              <DataExportSection
                exporting={exporting}
                showExportDropdown={showExportDropdown}
                setShowExportDropdown={setShowExportDropdown}
                handleExportData={handleExportData}
              />

              <DeleteAccountSection onDeleteAccount={handleDeleteAccount} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
