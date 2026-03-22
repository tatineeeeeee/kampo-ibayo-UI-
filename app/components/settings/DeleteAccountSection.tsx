"use client";
import { FaTrash } from "react-icons/fa";

interface DeleteAccountSectionProps {
  onDeleteAccount: () => Promise<void>;
}

export default function DeleteAccountSection({
  onDeleteAccount,
}: DeleteAccountSectionProps) {
  return (
    <div className="bg-gradient-to-r from-red-900/20 via-red-900/10 to-red-900/20 border border-red-700/50 p-6 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-red-600/20 rounded-lg">
          <FaTrash className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="text-red-400 font-bold text-lg">
            Delete Account
          </h3>
          <p className="text-red-300/80 text-sm">
            Permanent account deletion
          </p>
        </div>
      </div>

      {/* Warning Card */}
      <div className="bg-red-950/50 border border-red-800/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-red-600/20 rounded-full mt-0.5">
            <svg
              className="w-4 h-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-red-300 font-semibold text-sm mb-2">
              This action cannot be undone
            </h4>
            <p className="text-red-200/80 text-sm leading-relaxed">
              Deleting your account will permanently remove all your
              personal data, booking history, and preferences. This
              action is irreversible and your email can be reused for
              new registrations.
            </p>
          </div>
        </div>
      </div>

      {/* Deletion Policy Info */}
      <div className="bg-amber-950/30 border border-amber-700/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-amber-600/20 rounded-full mt-0.5">
            <svg
              className="w-4 h-4 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-amber-300 font-semibold text-sm mb-2">
              Account Deletion Requirements
            </h4>
            <ul className="text-amber-200/80 text-sm space-y-1.5">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                No pending, confirmed, or paid bookings
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                No upcoming reservations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                No recent bookings completed within 30 days
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                Accounts with booking history require confirmation
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* What Happens Section */}
      <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 mb-6">
        <h4 className="text-gray-300 font-semibold text-sm mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          What happens when you delete your account:
        </h4>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="text-gray-400">
            <div className="font-medium text-gray-300 mb-1">
              ✓ Removed:
            </div>
            <ul className="space-y-1 text-xs">
              <li>• Personal profile information</li>
              <li>• Account preferences & settings</li>
              <li>• Login access to your account</li>
            </ul>
          </div>
          <div className="text-gray-400">
            <div className="font-medium text-gray-300 mb-1">
              📋 Business Records:
            </div>
            <ul className="space-y-1 text-xs">
              <li>• Booking records anonymized</li>
              <li>• Transaction history preserved</li>
              <li>• Resort compliance maintained</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <button
          onClick={onDeleteAccount}
          className="group flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-red-900/25 transform hover:-translate-y-0.5"
        >
          <FaTrash className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Delete My Account</span>
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>

        <div className="text-gray-400 text-xs sm:ml-4 sm:max-w-xs">
          <p>
            Need help?{" "}
            <span className="text-blue-400 hover:text-blue-300 cursor-pointer underline">
              Contact our support team
            </span>{" "}
            for assistance with account management.
          </p>
        </div>
      </div>
    </div>
  );
}
