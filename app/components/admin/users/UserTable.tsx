"use client";

import { Tables } from "../../../../database.types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Crown,
} from "lucide-react";

type User = Tables<"users">;

interface UserTableProps {
  paginatedUsers: User[];
  filteredUsers: User[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // Pagination
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  setItemsPerPage: (n: number) => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
  // Actions
  onViewBookings: (user: User) => void;
  onEditRole: (user: User) => void;
  onDeleteUser: (user: User) => void;
  canEditUserRole: (user: User) => boolean;
  canDeleteUser: (user: User) => boolean;
  // Helpers
  formatDate: (dateString: string) => string;
  getRoleDisplay: (user: User) => React.ReactNode;
}

export default function UserTable({
  paginatedUsers,
  filteredUsers,
  loading,
  searchTerm,
  setSearchTerm,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  setItemsPerPage,
  goToPage,
  goToFirstPage,
  goToLastPage,
  goToPreviousPage,
  goToNextPage,
  onViewBookings,
  onEditRole,
  onDeleteUser,
  canEditUserRole,
  canDeleteUser,
  formatDate,
  getRoleDisplay,
}: UserTableProps) {
  const users = filteredUsers;

  return (
    <>
      {loading && users.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm sm:text-base">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm ? (
            <div>
              <p className="text-gray-500 text-sm sm:text-base">
                No users found matching &quot;{searchTerm}&quot;
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-blue-600 hover:text-blue-700 text-sm mt-2"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No users found.</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-gray-50 rounded-lg p-4 border ${
                  user.is_super_admin
                    ? "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50"
                    : "border-gray-200"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {user.full_name}
                      {user.is_super_admin && (
                        <Crown className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">ID: {user.id}</div>
                  </div>
                  {getRoleDisplay(user)}
                </div>
                <div className="text-sm text-gray-700 mb-1">{user.email}</div>
                <div className="text-xs text-gray-500 mb-3">
                  {user.phone || "No phone"}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Joined:{" "}
                  {user.created_at ? formatDate(user.created_at) : "N/A"}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => onViewBookings(user)}
                    className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    View Bookings
                  </button>
                  {canEditUserRole(user) && (
                    <button
                      onClick={() => onEditRole(user)}
                      className="text-xs px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200"
                    >
                      Edit Role
                    </button>
                  )}
                  {canDeleteUser(user) && (
                    <button
                      onClick={() => onDeleteUser(user)}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete
                    </button>
                  )}
                  {/* Show protected badge for super admin */}
                  {user.is_super_admin && (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-md border border-amber-200 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Protected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                        {user.is_super_admin && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getRoleDisplay(user)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? formatDate(user.created_at) : "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => onViewBookings(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Bookings
                      </button>
                      {canEditUserRole(user) && (
                        <button
                          onClick={() => onEditRole(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit Role
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                      {/* Show protected badge for super admin */}
                      {user.is_super_admin && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-md border border-amber-200">
                          <ShieldCheck className="w-3 h-3" />
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {users.length > 0 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-gray-50 px-3 sm:px-4 py-3 rounded-lg">
          {/* Items per page and info */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <label
                htmlFor="itemsPerPage"
                className="text-xs sm:text-sm text-gray-800 font-medium"
              >
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm text-gray-800 font-medium bg-white"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="text-xs sm:text-sm text-gray-800 font-medium">
              {Math.min(startIndex + 1, users.length)}-
              {Math.min(startIndex + itemsPerPage, users.length)} of{" "}
              {users.length}
            </span>
          </div>

          {/* Page info and controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline text-xs sm:text-sm text-gray-800 font-medium mr-2 sm:mr-4">
                Page {currentPage} of {totalPages}
              </span>
              {/* Navigation buttons */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                {/* Page numbers - hide on very small screens */}
                <div className="hidden xs:flex items-center gap-0.5 sm:gap-1">
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 2) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNumber = totalPages - 2 + i;
                    } else {
                      pageNumber = currentPage - 1 + i;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded border ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                {/* Mobile page indicator */}
                <span className="xs:hidden px-2 py-1.5 text-xs text-gray-700">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                >
                  <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
