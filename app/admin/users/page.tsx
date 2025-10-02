"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { useToastHelpers } from "../../components/Toast";

interface User {
  id: number;
  auth_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  role: string | null;
  created_at: string | null;
}

interface Booking {
  id: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  total_amount: number;
  status: string | null;
  brings_pet: boolean | null;
  special_requests: string | null;
  created_at: string | null;
}

interface UserBookingsModalProps {
  user: User;
  onClose: () => void;
}

function UserBookingsModal({ user, onClose }: UserBookingsModalProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast helpers for modal
  const { error: showError } = useToastHelpers();

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user.auth_id) {
        setLoading(false);
        return;
      }

      try {
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

    fetchUserBookings();
  }, [user.auth_id, showError]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const totalSpent = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
  const completedBookings = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                User Bookings - {user.name || user.email}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View all bookings and booking history for this user
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <div className="text-gray-600 font-medium">Loading bookings...</div>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                  <div className="text-sm text-blue-600">Total Bookings</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{completedBookings}</div>
                  <div className="text-sm text-green-600">Completed Stays</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">₱{totalSpent.toLocaleString()}</div>
                  <div className="text-sm text-purple-600">Total Revenue</div>
                </div>
              </div>

              {/* Bookings List */}
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                    <div className="w-12 h-12 bg-gray-400 rounded"></div>
                  </div>
                  <p className="text-xl font-medium text-gray-600 mb-2">No bookings found</p>
                  <p className="text-sm text-gray-500">This user has not made any bookings yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">Booking History</h3>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg text-gray-900">{booking.guest_name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                              {booking.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">{booking.guest_email}</p>
                            {booking.guest_phone && (
                              <p className="text-gray-600">{booking.guest_phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            ₱{booking.total_amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Booking #{booking.id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1 font-medium">Check-in</div>
                          <div className="font-semibold text-gray-900">{formatDate(booking.check_in_date)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1 font-medium">Check-out</div>
                          <div className="font-semibold text-gray-900">{formatDate(booking.check_out_date)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1 font-medium">Guests</div>
                          <div className="font-semibold text-gray-900">{booking.number_of_guests}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1 font-medium">Pet</div>
                          <div className="font-semibold text-gray-900">{booking.brings_pet ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                      
                      {booking.special_requests && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Special Requests:</span> {booking.special_requests}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                        <span>Booked: {formatDate(booking.created_at || '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("");
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedUserBookings, setSelectedUserBookings] = useState<User | null>(null);

  // Standardized toast helpers
  const { success, error: showError, warning } = useToastHelpers();

  const fetchUsers = useCallback(async () => {
    try {
      console.log('🔍 Fetching users...');
      
      // First, let's see what columns exist in the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Raw database response:', { data, error });
      console.log('📈 Number of users found:', data?.length || 0);

      if (data && data.length > 0) {
        console.log('🔍 First user data structure:', data[0]);
      }

      if (error) {
        console.error('❌ Error fetching users:', error);
        showError('Error loading users. Please check console for details.');
      } else {
        console.log('✅ Successfully fetched users');
        setUsers(data as User[] || []);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      showError('Unexpected error occurred while loading users.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId: number, newRole: string) => {
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

      if (error) {
        console.error('Error updating user role:', error);
        showError(`Error updating user role: ${error.message}`);
      } else {
        success('User role updated successfully');
        fetchUsers(); // Refresh the list
        closeModal();
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Unexpected error while updating user role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!userId) {
      warning('Invalid user ID');
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      warning('User not found');
      return;
    }

    if (userToDelete.role === 'admin') {
      warning('Cannot delete admin users');
      return;
    }

    const userName = getUserDisplayName(userToDelete);
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Use the API route for proper deletion with service role
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userId, // database ID
          authId: userToDelete.auth_id || '' // auth ID
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Deletion error:', result.error);
        showError(`Failed to delete user: ${result.error}`);
        return;
      }

      console.log('✅', result.message);
      success('User deleted successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    if (!user) {
      warning('Invalid user data');
      return;
    }
    setSelectedUser(user);
    setEditRole(user.role || 'user');
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    setEditRole("");
  };

  const openBookingsModal = (user: User) => {
    setSelectedUserBookings(user);
    setShowBookingsModal(true);
  };

  const closeBookingsModal = () => {
    setShowBookingsModal(false);
    setSelectedUserBookings(null);
  };

  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to get user display name from various possible fields
  const getUserDisplayName = (user: User) => {
    return user.name || user.email.split('@')[0] || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            User Management ({users.length})
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                console.log('Current users data:', users);
                if (users.length > 0) {
                  console.log('Sample user structure:', users[0]);
                }
              }}
              className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
            >
              Debug
            </button>
            <button 
              onClick={fetchUsers}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No users found</p>
            <p className="text-sm mt-2">Users will appear here when they register</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-black">
                      <div className="font-medium">
                        {getUserDisplayName(user)}
                      </div>
                    </td>
                    <td className="p-3 text-black text-sm">{user.email}</td>
                    <td className="p-3 text-black text-sm">{user.phone || 'Not provided'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-black text-sm">{formatDate(user.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => openBookingsModal(user)}
                          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                        >
                          View Bookings
                        </button>
                        <button 
                          onClick={() => openEditModal(user)}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          Edit
                        </button>
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
              <p className="text-gray-600 text-sm">Update user information</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-800 font-medium">
                  {getUserDisplayName(selectedUser)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-800 font-medium">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined
                </label>
                <p className="text-gray-600 text-sm">{formatDate(selectedUser.created_at)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => updateUserRole(selectedUser.id, editRole)}
                disabled={!editRole || editRole === selectedUser.role}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${
                  !editRole || editRole === selectedUser.role
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Update Role
              </button>
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Bookings Modal */}
      {showBookingsModal && selectedUserBookings && (
        <UserBookingsModal 
          user={selectedUserBookings} 
          onClose={closeBookingsModal} 
        />
      )}
    </div>
  );
}