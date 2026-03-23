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
            className="w-full px-3 sm:px-4 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-primary text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-muted-foreground"
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
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
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
                ? "bg-info/10 text-primary border border-info/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "admin"
                ? "bg-chart-4/10 text-chart-4 border border-chart-4/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            Admin ({users.filter((u) => u.role === "admin").length})
          </button>
          <button
            onClick={() => setRoleFilter("staff")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "staff"
                ? "bg-info/10 text-primary border border-info/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            Staff ({users.filter((u) => u.role === "staff").length})
          </button>
          <button
            onClick={() => setRoleFilter("user")}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              roleFilter === "user"
                ? "bg-success/10 text-success border border-success/20"
                : "bg-muted text-foreground hover:bg-muted border border-border"
            }`}
          >
            Users ({users.filter((u) => u.role === "user").length})
          </button>
        </div>
        {(roleFilter !== "all" || searchTerm) && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Showing {filteredUsers.length} of {users.length} users
            {roleFilter !== "all" && ` with role "${roleFilter}"`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
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
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors flex items-center justify-center gap-2 text-sm"
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
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-success hover:bg-success/90"
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
                ? "bg-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90"
            }`}
            title="Export filtered users to PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            <span className="hidden sm:inline">Refresh Users</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>
    </>
  );
}
