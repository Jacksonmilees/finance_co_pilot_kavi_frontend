import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Building2,
  Shield,
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle,
  Edit,
  Save,
  X,
  RefreshCw,
  ArrowRight,
  Activity,
  BarChart3,
  Settings,
  Clock,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState("");

  const { data: adminStats, isLoading: loadingStats, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      try {
        const response = await apiClient.getAdminStats();
        console.log('Admin stats response:', response);
        return response;
      } catch (error) {
        console.error('Failed to load admin stats:', error);
        toast.error('Failed to load dashboard statistics');
        // Return default stats instead of null to prevent infinite loading
        return {
          total_users: 0,
          active_users: 0,
          inactive_users: 0,
          total_businesses: 0,
          admin_users: 0,
          data_entry_users: 0,
          owner_users: 0,
          recent_users: []
        };
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Admin stats query error:', error);
      toast.error('Failed to load dashboard statistics');
    }
  });

  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        return await apiClient.getAllUsers();
      } catch (error) {
        console.error('Failed to load users:', error);
        return [];
      }
    },
    enabled: !!user,
    retry: false
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      return await apiClient.adminUpdateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setEditingUser(null);
      setNewRole("");
      setShowSuccess(true);
      toast.success('User role updated successfully!');
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      const errorMessage = error.message || "Failed to update user role";
      setShowError(errorMessage);
      toast.error(errorMessage);
      setTimeout(() => setShowError(""), 5000);
    }
  });

  const handleRoleUpdate = (userId) => {
    if (!newRole) {
      setShowError("Please select a role");
      toast.error("Please select a role");
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const startEditing = (userItem) => {
    setEditingUser(userItem.id);
    setNewRole(userItem.role || 'owner');
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setNewRole("");
  };

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
    toast.success('Data refreshed');
  };

  // Handle loading states - show spinner but don't block the entire page
  // This allows sidebar to remain clickable

  const stats = adminStats || {
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    total_businesses: 0,
    admin_users: 0,
    data_entry_users: 0,
    owner_users: 0,
    recent_users: []
  };

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      path: '#users',
      color: 'blue'
    },
    {
      title: 'Business Management',
      description: 'View and manage registered businesses',
      icon: Building2,
      path: '#businesses',
      color: 'green'
    },
    {
      title: 'Settings',
      description: 'Configure system settings',
      icon: Settings,
      path: '#settings',
      color: 'purple'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">System Overview and Management Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            disabled={loadingStats || loadingUsers}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loadingStats || loadingUsers) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            System Operational
          </Badge>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            User role updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {showError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {showError}
          </AlertDescription>
        </Alert>
      )}

      {statsError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load dashboard statistics: {statsError.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Loading indicator - only shows on cards, doesn't block sidebar */}
        {(loadingStats || loadingUsers) && (
          <div className="col-span-full flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <LoadingSpinner />
              <p className="text-sm text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        )}
        
        {/* Total Users Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => document.getElementById('users')?.scrollIntoView({ behavior: 'smooth' })}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_users || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats.active_users || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Businesses Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Businesses</CardTitle>
            <Building2 className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.total_businesses || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Total registered
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Admin Users Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Admin Users</CardTitle>
            <Shield className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.admin_users || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                System administrators
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Data Entry Users Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Data Entry Users</CardTitle>
            <UserCheck className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.data_entry_users || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Data entry staff
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
              green: 'bg-green-50 text-green-600 hover:bg-green-100',
              amber: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
              purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
              indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
              red: 'bg-red-50 text-red-600 hover:bg-red-100'
            };

            return (
              <Card 
                key={action.path}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => {
                  if (action.path === '#users') {
                    document.getElementById('users')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[action.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full group-hover:bg-gray-100"
                  >
                    Go to {action.title}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              User Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Admin Users</span>
              <span className="font-semibold text-gray-900">{stats.admin_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Data Entry Users</span>
              <span className="font-semibold text-gray-900">{stats.data_entry_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Owner Users</span>
              <span className="font-semibold text-gray-900">{stats.owner_users || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              User Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-semibold text-green-600">{stats.active_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Inactive Users</span>
              <span className="font-semibold text-gray-900">{stats.inactive_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Businesses</span>
              <span className="font-semibold text-gray-900">{stats.total_businesses || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="font-semibold text-green-600">{stats.active_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total Users</span>
              <span className="font-semibold text-gray-900">{stats.total_users || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">System Status</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Operational
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Management */}
      <Card id="users">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Businesses</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((userItem) => (
                      <tr key={userItem.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{userItem.full_name || userItem.username}</p>
                            <p className="text-xs text-gray-500">{userItem.username}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{userItem.email || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {editingUser === userItem.id ? (
                            <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="data_entry">Data Entry</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userItem.role === 'admin' ? 'bg-red-100 text-red-800' :
                              userItem.role === 'data_entry' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {userItem.role === 'admin' ? 'Admin' :
                               userItem.role === 'data_entry' ? 'Data Entry' :
                               'Owner'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{userItem.businesses_count || 0}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {editingUser === userItem.id ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRoleUpdate(userItem.id)}
                                disabled={updateRoleMutation.isPending}
                                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="h-8 px-3"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditing(userItem)}
                              className="h-8 px-3 border-blue-600 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Users */}
      {stats.recent_users && stats.recent_users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              Recent Registrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.recent_users.slice(0, 5).map((recentUser) => {
              const fullUser = users.find(u => u.id === recentUser.id);
              return (
                <div
                  key={recentUser.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fullUser?.full_name || recentUser.username}</p>
                    <p className="text-xs text-gray-500">{recentUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(recentUser.date_joined).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
