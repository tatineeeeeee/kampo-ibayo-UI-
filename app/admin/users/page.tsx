"use client";

import UserFilters from "../../components/admin/users/UserFilters";
import UserTable from "../../components/admin/users/UserTable";
import {
  DeleteConfirmModal,
  UserBookingsModal,
  AddUserModal,
  PasswordRevealModal,
} from "../../components/admin/users/UserDetailModal";
import { useUserManagement } from "../../hooks/useUserManagement";

export default function UsersPage() {
  const {
    users,
    filteredUsers,
    paginatedUsers,
    loading,
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
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
    showEditModal,
    setShowEditModal,
    selectedUser,
    setSelectedUser,
    editRole,
    setEditRole,
    updateUserRole,
    showBookingsModal,
    setShowBookingsModal,
    selectedUserBookings,
    setSelectedUserBookings,
    showDeleteModal,
    userToDelete,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    showAddUserModal,
    setShowAddUserModal,
    isCurrentUserSuperAdmin,
    handleAddUserSuccess,
    showPasswordReveal,
    createdUserInfo,
    handlePasswordRevealClose,
    canDeleteUser,
    canEditUserRole,
    canCreateUser,
    fetchUsers,
    formatDate,
    getRoleDisplay,
    success,
    showError,
  } = useUserManagement();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-card p-4 sm:p-6 rounded-xl shadow-md">
        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          users={users}
          filteredUsers={filteredUsers}
          loading={loading}
          canCreateUser={canCreateUser()}
          onAddUser={() => setShowAddUserModal(true)}
          onRefresh={fetchUsers}
          onExportSuccess={success}
          onExportError={showError}
        />

        <UserTable
          paginatedUsers={paginatedUsers}
          filteredUsers={filteredUsers}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          setItemsPerPage={setItemsPerPage}
          goToPage={goToPage}
          goToFirstPage={goToFirstPage}
          goToLastPage={goToLastPage}
          goToPreviousPage={goToPreviousPage}
          goToNextPage={goToNextPage}
          onViewBookings={(user) => {
            setSelectedUserBookings(user);
            setShowBookingsModal(true);
          }}
          onEditRole={(user) => {
            setSelectedUser(user);
            setEditRole(user.role || "user");
            setShowEditModal(true);
          }}
          onDeleteUser={handleDeleteClick}
          canEditUserRole={canEditUserRole}
          canDeleteUser={canDeleteUser}
          formatDate={formatDate}
          getRoleDisplay={getRoleDisplay}
        />
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Edit User Role
            </h2>
            <p className="text-foreground mb-4">
              Change role for:{" "}
              <span className="font-medium text-foreground">
                {selectedUser.full_name}
              </span>
            </p>

            <div className="space-y-3">
              {[
                {
                  value: "user",
                  label: "User",
                  description: "Regular customer access",
                },
                {
                  value: "staff",
                  label: "Staff",
                  description: "Admin panel access + user management",
                },
                {
                  value: "admin",
                  label: "Admin",
                  description: "Full system access + all permissions",
                },
              ].map((role) => (
                <label
                  key={role.value}
                  className="flex items-start p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={editRole === role.value}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mt-1 mr-3 text-primary focus:ring-ring"
                  />
                  <div>
                    <span className="font-medium text-foreground">
                      {role.label}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  setEditRole("");
                }}
                className="px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, editRole)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                disabled={!editRole}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Bookings Modal */}
      {showBookingsModal && selectedUserBookings && (
        <UserBookingsModal
          user={selectedUserBookings}
          onClose={() => {
            setShowBookingsModal(false);
            setSelectedUserBookings(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSuccess={handleAddUserSuccess}
          canCreateAdmin={isCurrentUserSuperAdmin}
        />
      )}

      {/* Password Reveal Modal */}
      {showPasswordReveal && createdUserInfo && (
        <PasswordRevealModal
          userName={createdUserInfo.name}
          userEmail={createdUserInfo.email}
          tempPassword={createdUserInfo.tempPassword}
          onClose={handlePasswordRevealClose}
        />
      )}
    </div>
  );
}
