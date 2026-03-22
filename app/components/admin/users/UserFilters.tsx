"use client";

import { Tables } from "../../../../database.types";
import {
  Download,
  FileText,
  UserPlus,
} from "lucide-react";
import { exportUsersCSV } from "../../../utils/csvExport";
import { exportUsersPDF } from "../../../utils/pdfExport";

type User = Tables<"users">;

interface UserFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (filter: string) => void;
  users: User[];
  filteredUsers: User[];
  loading: boolean;
  canCreateUser: boolean;
  onAddUser: () => void;
  onRefresh: () => void;
  onExportSuccess: (message: string) => void;
  onExportError: (message: string) => void;
}

export default function UserFilters({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  users,
  filteredUsers,
  loading,
  canCreateUser,
  onAddUser,
  onRefresh,
  onExportSuccess,
  onExportError,
}: UserFiltersProps) {
  return (
    <>
      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, email, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 sm:px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        {searchTerm && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Found {filteredUsers.length} user
            {filteredUsers.length !== 1 ? "s" : ""} matching &quot;
            {searchTerm}&quot;
          </p>
        )}
      </div>

      {/* Role Filter Buttons */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "all"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "admin"
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            Admin ({users.filter((u) => u.role === "admin").length})
          </button>
          <button
            onClick={() => setRoleFilter("staff")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "staff"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            Staff ({users.filter((u) => u.role === "staff").length})
          </button>
          <button
            onClick={() => setRoleFilter("user")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "user"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            Users ({users.filter((u) => u.role === "user").length})
          </button>
        </div>
        {(roleFilter !== "all" || searchTerm) && (
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Showing {filteredUsers.length} of {users.length} users
            {roleFilter !== "all" && ` with role "${roleFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {loading
              ? "Loading users..."
              : `Manage user accounts and roles (${filteredUsers.length}${
                  searchTerm ? ` of ${users.length}` : ""
                } users)`}
          </p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Add User Button */}
          {canCreateUser && (
            <button
              onClick={onAddUser}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm"
              title="Add a new staff or admin user"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add User</span>
            </button>
          )}

          {/* Export CSV Button */}
          <button
            onClick={() => {
              try {
                exportUsersCSV(
                  filteredUsers as unknown as {
                    [key: string]:
                      | string
                      | number
                      | boolean
                      | null
                      | undefined
                      | object;
                  }[]
                );
                onExportSuccess(
                  `${filteredUsers.length} users exported to CSV successfully!`
                );
              } catch (error) {
                console.error("Export error:", error);
                onExportError("Failed to export CSV");
              }
            }}
            disabled={filteredUsers.length === 0}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
              filteredUsers.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            }`}
            title="Export filtered users to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={async () => {
              try {
                await exportUsersPDF(
                  filteredUsers as unknown as {
                    [key: string]:
                      | string
                      | number
                      | boolean
                      | null
                      | undefined
                      | object;
                  }[]
                );
                onExportSuccess(
                  `${filteredUsers.length} users exported to PDF successfully!`
                );
              } catch (error) {
                console.error("Export error:", error);
                onExportError("Failed to export PDF");
              }
            }}
            disabled={filteredUsers.length === 0}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
              filteredUsers.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title="Export filtered users to PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <span className="hidden sm:inline">Refresh Users</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>
    </>
  );
}
