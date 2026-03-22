"use client";
import {
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { Check, X } from "lucide-react";

interface PasswordSectionProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  saving: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  passwordsMatch: boolean | null;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
  setShowConfirmPassword: (value: boolean) => void;
  setPasswordData: React.Dispatch<React.SetStateAction<{
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>>;
  handleNewPasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  validatePasswordStrength: (password: string) => {
    isValid: boolean;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      number: boolean;
      special: boolean;
    };
    score: number;
  };
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function PasswordSection({
  passwordData,
  saving,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  passwordsMatch,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  setPasswordData,
  handleNewPasswordChange,
  handleConfirmPasswordChange,
  validatePasswordStrength,
  onSubmit,
}: PasswordSectionProps) {
  return (
    <section
      id="security"
      className="bg-card rounded-xl shadow-2xl p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <FaLock className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">
          Security & Password
        </h2>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="current-password-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              id="current-password-input"
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-3 pr-12 "
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="new-password-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password-input"
              type={showNewPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-3 pr-12 "
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password Requirements & Strength */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Use 8+ characters with letters, numbers and symbols
            </span>
            {passwordData.newPassword && (
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Strength:</span>
                <div className="flex space-x-0.5">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                        level <=
                        validatePasswordStrength(passwordData.newPassword)
                          .score
                          ? level <= 1
                            ? "bg-red-400"
                            : level <= 2
                            ? "bg-yellow-400"
                            : level <= 3
                            ? "bg-primary/70"
                            : level <= 4
                            ? "bg-green-400"
                            : "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="confirm-password-input"
            className="block text-sm font-medium text-muted-foreground mb-2"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirm-password-input"
              type={showConfirmPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                handleConfirmPasswordChange(e.target.value)
              }
              className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-3 pr-12 "
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Password Match Validation */}
          {passwordData.confirmPassword && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Password confirmation</span>
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Match:</span>
                {passwordsMatch ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <X className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
        >
          <FaLock className="w-4 h-4" />
          {saving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </section>
  );
}
