"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";

interface User {
  id: number;
  auth_id: string | null;
  email: string;
  name: string;
  phone: string | null;
  role: string | null;
  created_at: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRole, setEditRole] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
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
        alert('Error loading users. Please check console for details.');
      } else {
        console.log('✅ Successfully fetched users');
        setUsers(data as User[] || []);
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error);
      alert('Unexpected error occurred while loading users.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    if (!userId || !newRole) {
      alert('Invalid user data');
      return;
    }

    if (selectedUser?.role === newRole) {
      alert('User already has this role');
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
        alert(`Error updating user role: ${error.message}`);
      } else {
        alert('User role updated successfully');
        fetchUsers(); // Refresh the list
        closeModal();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Unexpected error while updating user role');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!userId) {
      alert('Invalid user ID');
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) {
      alert('User not found');
      return;
    }

    if (userToDelete.role === 'admin') {
      alert('Cannot delete admin users');
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
        alert(`Failed to delete user: ${result.error}`);
        return;
      }

      console.log('✅', result.message);
      alert('User deleted successfully!');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    if (!user) {
      alert('Invalid user data');
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
    </div>
  );
}