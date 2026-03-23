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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-sm sm:text-base">Loading users...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm ? (
            <div>
              <p className="text-muted-foreground text-sm sm:text-base">
                No users found matching &quot;{searchTerm}&quot;
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-primary hover:text-primary text-sm mt-2"
              >
                Clear search
              </button>
            </div>
          ) : (
            <p className="text-muted-foreground">No users found.</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block lg:hidden space-y-3">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className={`bg-muted rounded-lg p-4 border ${
                  user.is_super_admin
                    ? "border-warning/20 bg-gradient-to-r from-warning/10 to-warning/5"
                    : "border-border"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {user.full_name}
                      {user.is_super_admin && (
                        <Crown className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                  </div>
                  {getRoleDisplay(user)}
                </div>
                <div className="text-sm text-foreground mb-1">{user.email}</div>
                <div className="text-xs text-muted-foreground mb-3">
                  {user.phone || "No phone"}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Joined:{" "}
                  {user.created_at ? formatDate(user.created_at) : "N/A"}
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => onViewBookings(user)}
                    className="text-xs px-3 py-1.5 bg-info/10 text-primary rounded-md hover:bg-info/10"
                  >
                    View Bookings
                  </button>
                  {canEditUserRole(user) && (
                    <button
                      onClick={() => onEditRole(user)}
                      className="text-xs px-3 py-1.5 bg-info/10 text-info rounded-md hover:bg-info/10"
                    >
                      Edit Role
                    </button>
                  )}
                  {canDeleteUser(user) && (
                    <button
                      onClick={() => onDeleteUser(user)}
                      className="text-xs px-3 py-1.5 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/10"
                    >
                      Delete
                    </button>
                  )}
                  {/* Show protected badge for super admin */}
                  {user.is_super_admin && (
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-warning/20 to-warning/10 text-warning rounded-md border border-warning/20 shadow-sm">
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
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-foreground">
                          {user.full_name}
                        </div>
                        {user.is_super_admin && (
                          <Crown className="w-4 h-4 text-warning" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">
                        {user.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.phone}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getRoleDisplay(user)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {user.created_at ? formatDate(user.created_at) : "N/A"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => onViewBookings(user)}
                        className="text-primary hover:text-primary"
                      >
                        View Bookings
                      </button>
                      {canEditUserRole(user) && (
                        <button
                          onClick={() => onEditRole(user)}
                          className="text-info hover:text-info"
                        >
                          Edit Role
                        </button>
                      )}
                      {canDeleteUser(user) && (
                        <button
                          onClick={() => onDeleteUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </button>
                      )}
                      {/* Show protected badge for super admin */}
                      {user.is_super_admin && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gradient-to-r from-warning/20 to-warning/10 text-warning rounded-md border border-warning/20">
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
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-muted px-3 sm:px-4 py-3 rounded-lg">
          {/* Items per page and info */}
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <label
                htmlFor="itemsPerPage"
                className="text-xs sm:text-sm text-foreground font-medium"
              >
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-border rounded px-2 py-1 text-xs sm:text-sm text-foreground font-medium bg-card"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span className="text-xs sm:text-sm text-foreground font-medium">
              {Math.min(startIndex + 1, users.length)}-
              {Math.min(startIndex + itemsPerPage, users.length)} of{" "}
              {users.length}
            </span>
          </div>

          {/* Page info and controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline text-xs sm:text-sm text-foreground font-medium mr-2 sm:mr-4">
                Page {currentPage} of {totalPages}
              </span>
              {/* Navigation buttons */}
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                >
                  <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
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
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:bg-muted"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                {/* Mobile page indicator */}
                <span className="xs:hidden px-2 py-1.5 text-xs text-foreground">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
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
