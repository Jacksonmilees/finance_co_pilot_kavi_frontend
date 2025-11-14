import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Building2, Clock, TrendingUp, Shield, Settings, 
  BarChart3, FileText, Activity, CheckCircle, XCircle, 
  AlertCircle, ArrowRight, Zap, Plus, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import apiClient from '../lib/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateBusiness, setShowCreateBusiness] = useState(false);
  const [showAssignBusiness, setShowAssignBusiness] = useState(false);
  const [createBusinessForm, setCreateBusinessForm] = useState({
    legal_name: '',
    dba_name: '',
    hq_city: '',
    hq_country: '',
    business_model: '',
    registration_number: '',
    website: ''
  });
  const [assignForm, setAssignForm] = useState({
    business_id: '',
    admin_id: ''
  });

  // Fetch dashboard stats with caching
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.request('/users/admin/stats/');
      return response;
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Fetch all businesses
  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ['all-businesses'],
    queryFn: () => apiClient.getAllBusinesses(),
    enabled: showAssignBusiness || showCreateBusiness,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Fetch all admins
  const { data: admins = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['all-admins'],
    queryFn: () => apiClient.getAllAdmins(),
    enabled: showAssignBusiness,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  // Create business mutation
  const createBusinessMutation = useMutation({
    mutationFn: (data) => apiClient.createBusiness(data),
    onSuccess: () => {
      toast.success('Business created successfully');
      setShowCreateBusiness(false);
      setCreateBusinessForm({
        legal_name: '',
        dba_name: '',
        hq_city: '',
        hq_country: '',
        business_model: '',
        registration_number: '',
        website: ''
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-businesses'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create business');
    }
  });

  // Assign business to admin mutation
  const assignBusinessMutation = useMutation({
    mutationFn: ({ businessId, adminId }) => apiClient.assignBusinessToAdmin(businessId, adminId),
    onSuccess: () => {
      toast.success('Business assigned to admin successfully');
      setShowAssignBusiness(false);
      setAssignForm({ business_id: '', admin_id: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-admins'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign business to admin');
    }
  });

  const handleCreateBusiness = (e) => {
    e.preventDefault();
    createBusinessMutation.mutate(createBusinessForm);
  };

  const handleAssignBusiness = (e) => {
    e.preventDefault();
    if (!assignForm.business_id || !assignForm.admin_id) {
      toast.error('Please select both business and admin');
      return;
    }
    assignBusinessMutation.mutate({
      businessId: assignForm.business_id,
      adminId: assignForm.admin_id
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      path: '/super-admin/users',
      color: 'blue'
    },
    {
      title: 'Business Management',
      description: 'View and manage registered businesses',
      icon: Building2,
      path: '/super-admin/businesses',
      color: 'green'
    },
    {
      title: 'Pending Approvals',
      description: 'Review business registration requests',
      icon: Clock,
      path: '/super-admin/approvals',
      color: 'amber',
      badge: stats?.pending_approvals || 0
    },
    {
      title: 'Analytics',
      description: 'View system analytics and insights',
      icon: BarChart3,
      path: '/super-admin/analytics',
      color: 'purple'
    },
    {
      title: 'Activity Logs',
      description: 'Monitor user activity and system logs',
      icon: FileText,
      path: '/super-admin/logs',
      color: 'indigo'
    },
    {
      title: 'Security',
      description: 'Security settings and access control',
      icon: Shield,
      path: '/super-admin/security',
      color: 'red'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">System Overview and Management Portal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreateBusiness(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Business
          </Button>
        <Button 
            onClick={() => setShowAssignBusiness(true)}
          variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Business
        </Button>
          <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
            <Activity className="w-3 h-3 mr-1" />
            System Operational
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/users')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats?.active_users || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Businesses Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/businesses')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Businesses</CardTitle>
            <Building2 className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.total_businesses || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats?.active_businesses || 0} active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/approvals')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Approvals</CardTitle>
            <Clock className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.pending_approvals || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
              Awaiting review
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* System Activity Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/super-admin/analytics')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">System Activity</CardTitle>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats?.total_transactions || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                {stats?.total_invoices || 0} invoices
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
                onClick={() => navigate(action.path)}
              >
            <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${colorClasses[action.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {action.badge !== undefined && action.badge > 0 && (
                      <Badge variant="destructive">{action.badge}</Badge>
                    )}
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
                <span className="text-sm text-gray-600">Super Admins</span>
              <span className="font-semibold text-gray-900">{stats?.super_admins || 0}</span>
              </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Business Admins</span>
              <span className="font-semibold text-gray-900">{stats?.business_admins || 0}</span>
              </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Staff Members</span>
              <span className="font-semibold text-gray-900">{stats?.staff_members || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Financial Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Invoices</span>
              <span className="font-semibold text-gray-900">{stats?.total_invoices || 0}</span>
              </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Paid Invoices</span>
              <span className="font-semibold text-green-600">{stats?.paid_invoices || 0}</span>
              </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Transactions</span>
              <span className="font-semibold text-gray-900">{stats?.total_transactions || 0}</span>
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
              <span className="font-semibold text-green-600">{stats?.active_users || 0}</span>
              </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Active Businesses</span>
              <span className="font-semibold text-green-600">{stats?.active_businesses || 0}</span>
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

      {/* Create Business Modal */}
      {showCreateBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Create New Business</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateBusiness(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="legal_name">Legal Name *</Label>
                    <Input
                      id="legal_name"
                      value={createBusinessForm.legal_name}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, legal_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dba_name">DBA Name</Label>
                    <Input
                      id="dba_name"
                      value={createBusinessForm.dba_name}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, dba_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hq_city">City</Label>
                    <Input
                      id="hq_city"
                      value={createBusinessForm.hq_city}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, hq_city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hq_country">Country</Label>
                    <Input
                      id="hq_country"
                      value={createBusinessForm.hq_country}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, hq_country: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="business_model">Business Model</Label>
                    <Select
                      value={createBusinessForm.business_model}
                      onValueChange={(value) => setCreateBusinessForm({ ...createBusinessForm, business_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select business model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2B">B2B</SelectItem>
                        <SelectItem value="B2C">B2C</SelectItem>
                        <SelectItem value="B2G">B2G</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="registration_number">Registration Number</Label>
                    <Input
                      id="registration_number"
                      value={createBusinessForm.registration_number}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, registration_number: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={createBusinessForm.website}
                      onChange={(e) => setCreateBusinessForm({ ...createBusinessForm, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateBusiness(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createBusinessMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createBusinessMutation.isPending ? 'Creating...' : 'Create Business'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Business to Admin Modal */}
      {showAssignBusiness && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Assign Business to Admin</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssignBusiness(false)}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignBusiness} className="space-y-4">
                <div>
                  <Label htmlFor="business_select">Select Business *</Label>
                  <Select
                    value={assignForm.business_id}
                    onValueChange={(value) => setAssignForm({ ...assignForm, business_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a business" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingBusinesses ? (
                        <SelectItem value="loading" disabled>Loading businesses...</SelectItem>
                      ) : businesses.length === 0 ? (
                        <SelectItem value="none" disabled>No businesses available</SelectItem>
                      ) : (
                        businesses.map((business) => (
                          <SelectItem key={business.id} value={String(business.id)}>
                            {business.legal_name} {business.dba_name && `(${business.dba_name})`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="admin_select">Select Admin *</Label>
                  <Select
                    value={assignForm.admin_id}
                    onValueChange={(value) => setAssignForm({ ...assignForm, admin_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an admin" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingAdmins ? (
                        <SelectItem value="loading" disabled>Loading admins...</SelectItem>
                      ) : admins.length === 0 ? (
                        <SelectItem value="none" disabled>No admins available</SelectItem>
                      ) : (
                        admins.map((admin) => (
                          <SelectItem key={admin.id} value={String(admin.id)}>
                            {admin.full_name} ({admin.email})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAssignBusiness(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={assignBusinessMutation.isPending || !assignForm.business_id || !assignForm.admin_id}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {assignBusinessMutation.isPending ? 'Assigning...' : 'Assign Business'}
                  </Button>
            </div>
              </form>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
