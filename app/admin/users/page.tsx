"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";
import { Tables } from "../../../database.types";
import { Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { exportUsersCSV } from "../../utils/csvExport";

type User = Tables<'users'>;
type Booking = Tables<'bookings'>;

interface UserBookingsModalProps {
  user: User;
  onClose: () => void;
}

function UserBookingsModal({ user, onClose }: UserBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant modal

  // Toast helpers for modal
  const { error: showError } = useToastHelpers();

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user.auth_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.auth_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching user bookings:', error);
          showError('Error loading user bookings');
        } else {
          setBookings(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
        showError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    // ✅ OPTIMIZED: Delayed fetch for modal - UI opens instantly, data loads after
    const timer = setTimeout(fetchUserBookings, 150);
    return () => clearTimeout(timer);
  }, [user.auth_id, showError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800', 
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bookings for {user.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading bookings...</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No bookings found for this user.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Booking #{booking.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                    </p>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(booking.status || 'pending')}`}>
                    {booking.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Guests:</span> {booking.number_of_guests}
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span> ₱{booking.total_amount?.toLocaleString()}
                  </div>
                </div>
                {booking.special_requests && (
                  <div className="mt-2">
                    <span className="text-gray-500 text-sm">Special Requests:</span>
                    <p className="text-sm text-gray-700">{booking.special_requests}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false); // ✅ Start false for instant UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState<User | null>(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  // Standardized toast helpers
  const { success, error: showError, warning } = useToastHelpers();

  const fetchUsers = useCallback(async () => {
    try {
      console.log('🔍 Fetching users...');
      
      // Get current user role first
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: currentUserData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', session.user.id)
          .single();
        
        setIsCurrentUserAdmin(currentUserData?.role === 'admin');
      }
      
      // Then fetch all users
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching users:', error);
        showError('Failed to fetch users');
      } else {
        console.log('✅ Successfully fetched users:', data?.length || 0);
        setUsers(data || []);
      }
    } catch (error) {
      console.error('❌ Error in fetchUsers:', error);
      showError('An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove showError dependency to prevent infinite loop - showError is stable from useToastHelpers

  // ✅ OPTIMIZED: Delayed fetch to not block navigation
  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 100);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;
    
    // First filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Then filter by search term (removed role search)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => 
        // Search by name
        user.name?.toLowerCase().includes(searchLower) ||
        // Search by email
        user.email?.toLowerCase().includes(searchLower) ||
        // Search by ID
        user.id?.toString().includes(searchTerm.trim())
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  // Pagination logic
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredUsers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  
  // Pagination functions
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) {
      warning('Invalid user data');
      return;
    }

    if (selectedUser?.role === newRole) {
      warning('User already has this role');
      return;
    }

    try {
      const updateData = { role: newRole };
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      success(`User role updated to ${newRole}!`);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditRole("");
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Failed to update user role');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!userId) {
      warning('Invalid user data');
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      success('User deleted successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'moderator':
        return 'bg-blue-100 text-blue-800';
      case 'guest':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-1">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* Role Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'all'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'admin'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Admin ({users.filter(u => u.role === 'admin').length})
            </button>
            <button
              onClick={() => setRoleFilter('staff')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'staff'
                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              Staff ({users.filter(u => u.role === 'staff').length})
            </button>
            <button
              onClick={() => setRoleFilter('user')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === 'user'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              User ({users.filter(u => u.role === 'user').length})
            </button>
          </div>
          {(roleFilter !== 'all' || searchTerm) && (
            <p className="text-sm text-gray-600 mt-2">
              Showing {filteredUsers.length} of {users.length} users
              {roleFilter !== 'all' && ` with role "${roleFilter}"`}
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          )}
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-1">
              {loading ? 'Loading users...' : `Manage user accounts and roles (${filteredUsers.length}${searchTerm ? ` of ${users.length}` : ''} users)`}
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Export CSV Button */}
            <button
              onClick={() => {
                try {
                  exportUsersCSV(filteredUsers as unknown as { [key: string]: string | number | boolean | null | undefined | object }[]);
                  success(`${filteredUsers.length} users exported to CSV successfully!`);
                } catch (error) {
                  console.error('Export error:', error);
                  showError('Failed to export CSV');
                }
              }}
              disabled={filteredUsers.length === 0}
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${
                filteredUsers.length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              title="Export filtered users to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Users
            </button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            {searchTerm ? (
              <div>
                <p className="text-gray-500">No users found matching &quot;{searchTerm}&quot;</p>
                <button 
                  onClick={() => setSearchTerm('')}
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
          <div className="overflow-x-auto">
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
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {user.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(user.role || 'guest')}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? formatDate(user.created_at) : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUserBookings(user);
                          setShowBookingsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Bookings
                      </button>
                      {isCurrentUserAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditRole(user.role || 'guest');
                              setShowEditModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 px-4 py-3 rounded-lg">
              {/* Items per page and info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-800 font-medium">Show:</label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 font-medium bg-white"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                  <span className="text-sm text-gray-800 font-medium">
                    Showing {Math.min(startIndex + 1, filteredUsers.length)} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </span>
                </div>

                {/* Page info and controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-800 font-medium mr-4">
                      Page {currentPage} of {totalPages}
                    </span>                  {/* Navigation buttons */}
                  <div className="flex items-center gap-1">
                      <button
                        onClick={goToFirstPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`px-3 py-2 text-sm font-medium rounded border ${
                              currentPage === pageNumber
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                      );
                    })}

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User Role</h2>
            <p className="text-gray-600 mb-4">
              Change role for: <span className="font-medium">{selectedUser.name}</span>
            </p>
            
            <div className="space-y-3">
              {['guest', 'moderator', 'admin'].map((role) => (
                <label key={role} className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={editRole === role}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mr-2"
                  />
                  <span className="capitalize">{role}</span>
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
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateUserRole(selectedUser.id, editRole)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
    </div>
  );
}