import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Users, Search, Filter, Download, UserPlus, Eye, Edit, Trash2,
  MoreVertical, Mail, Phone, Building2, Calendar, Shield, Lock,
  CheckCircle, XCircle, RefreshCw, ArrowUpDown
} from 'lucide-react';
import LoadingSpinner, { LoadingTable } from '../../components/LoadingSpinner';
import { InlineError } from '../../components/ErrorFallback';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [viewingUser, setViewingUser] = useState(null);
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users-list', filterRole, filterStatus, sortBy, sortOrder],
    queryFn: async () => {
      const response = await apiClient.request('/users/admin/users/', {
        params: {
          role: filterRole !== 'all' ? filterRole : undefined,
          is_active: filterStatus !== 'all' ? filterStatus === 'active' : undefined,
          sort_by: sortBy,
          order: sortOrder
        }
      });
      return response;
    },
    staleTime: 60000, // 1 minute
    cacheTime: 300000 // 5 minutes
  });

  // Password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, newPassword }) => 
      apiClient.adminResetPassword(userId, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reset password');
    }
  });

  // Toggle user status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }) =>
      apiClient.request(`/users/admin/users/${userId}/toggle-status/`, {
        method: 'POST',
        data: { is_active: !isActive }
      }),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user status');
    }
  });

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery || 
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Handle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }
    
    switch (action) {
      case 'activate':
        toast('Bulk activation coming soon');
        break;
      case 'deactivate':
        toast('Bulk deactivation coming soon');
        break;
      case 'export':
        handleExport();
        break;
      default:
        break;
    }
  };

  // Export to CSV
  const handleExport = () => {
    const usersToExport = selectedUsers.length > 0 
      ? filteredUsers.filter(u => selectedUsers.includes(u.id))
      : filteredUsers;
    
    const csv = [
      ['Username', 'Email', 'Full Name', 'Role', 'Status', 'Businesses', 'Created'],
      ...usersToExport.map(u => [
        u.username,
        u.email,
        u.full_name || '',
        u.role || 'owner',
        u.is_active ? 'Active' : 'Inactive',
        u.businesses_count || 0,
        new Date(u.date_joined).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Users exported successfully');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <LoadingTable rows={10} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <InlineError error={error} retry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage all users, roles, and permissions
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="border-gray-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => toast('User creation coming soon')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-gray-600">
                  {users.filter(u => !u.is_active).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.is_superuser || u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by username, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="business_admin">Business Admin</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Export Button */}
            <Button
              variant="outline"
              onClick={handleExport}
              className="border-gray-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-800 font-medium">
                {selectedUsers.length} user(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('deactivate')}
                  className="border-gray-600 text-gray-600 hover:bg-gray-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedUsers([])}
                  className="border-gray-300"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('username')}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase hover:text-gray-900"
                    >
                      User
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('is_active')}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase hover:text-gray-900"
                    >
                      Status
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase">
                    Businesses
                  </th>
                  <th className="px-6 py-4 text-left">
                    <button
                      onClick={() => handleSort('date_joined')}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 uppercase hover:text-gray-900"
                    >
                      Joined
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.username}</div>
                            {user.full_name && (
                              <div className="text-sm text-gray-500">{user.full_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${
                          user.is_superuser ? 'bg-purple-100 text-purple-700' :
                          user.role === 'business_admin' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'staff' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.is_superuser ? 'Super Admin' : user.role || 'User'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${
                          user.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building2 className="w-4 h-4" />
                          {user.businesses_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingUser(user)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleStatusMutation.mutate({ 
                              userId: user.id, 
                              isActive: user.is_active 
                            })}
                            className={`${
                              user.is_active
                                ? 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            }`}
                          >
                            {user.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onPasswordReset={(newPassword) => {
            resetPasswordMutation.mutate({ 
              userId: viewingUser.id, 
              newPassword 
            });
          }}
        />
      )}
    </div>
  );
}

// User Detail Modal Component
function UserDetailModal({ user, onClose, onPasswordReset }) {
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">User Details</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
              {user.full_name && (
                <p className="text-gray-600">{user.full_name}</p>
              )}
              <div className="flex gap-2 mt-2">
                <Badge className={user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge className="bg-blue-100 text-blue-700">
                  {user.is_superuser ? 'Super Admin' : user.role || 'User'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.date_joined).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Businesses</p>
                <p className="font-medium text-gray-900">{user.businesses_count || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium text-gray-900">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="border-t pt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Password Management</h4>
            {!showPasswordReset ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordReset(true)}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <Lock className="w-4 h-4 mr-2" />
                Reset Password
              </Button>
            ) : (
              <div className="space-y-3">
                <Input
                  type="password"
                  placeholder="New password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (newPassword.length >= 8) {
                        onPasswordReset(newPassword);
                        setNewPassword('');
                        setShowPasswordReset(false);
                      } else {
                        toast.error('Password must be at least 8 characters');
                      }
                    }}
                    disabled={newPassword.length < 8}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Confirm Reset
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
