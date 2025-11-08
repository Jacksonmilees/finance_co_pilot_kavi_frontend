import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Building2, Users, TrendingUp, Activity, ArrowLeft,
  Mail, Phone, MapPin, DollarSign, FileText, Calendar,
  CheckCircle, XCircle, Clock, User, Shield, Briefcase,
  Receipt, CreditCard, UserCheck, AlertCircle, TrendingDown,
  UserPlus, Search
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAssignStaff, setShowAssignStaff] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['business-detail', id],
    queryFn: () => apiClient.getBusinessDetail(id),
    enabled: !!id,
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  // Fetch available staff
  const { data: availableStaff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ['available-staff'],
    queryFn: () => apiClient.getAvailableStaff(),
    enabled: showAssignStaff,
    staleTime: 60000
  });

  // Assign staff mutation
  const assignStaffMutation = useMutation({
    mutationFn: ({ businessId, userIds }) => apiClient.assignStaffToBusiness(businessId, userIds),
    onSuccess: (response) => {
      toast.success(response.message || 'Staff members assigned successfully');
      setShowAssignStaff(false);
      setSelectedUserIds([]);
      setStaffSearchQuery('');
      queryClient.invalidateQueries(['business-detail', id]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign staff members');
    }
  });

  const handleAssignStaff = (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    assignStaffMutation.mutate({ businessId: id, userIds: selectedUserIds });
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter available staff based on search query and exclude already assigned staff
  const assignedStaffIds = (data?.staff_members || []).map(s => s.id);
  const filteredStaff = availableStaff.filter(user => {
    const matchesSearch = !staffSearchQuery || 
      user.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(staffSearchQuery.toLowerCase());
    return matchesSearch && !assignedStaffIds.includes(user.id);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error.message || 'Failed to load business details'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/super-admin/businesses')}
          variant="outline"
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Businesses
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>Business not found</AlertDescription>
        </Alert>
        <Button
          onClick={() => navigate('/super-admin/businesses')}
          variant="outline"
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Businesses
        </Button>
      </div>
    );
  }

  const { business, business_admins, staff_members, stats } = data;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/super-admin/businesses')}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              {business.legal_name}
            </h1>
            <p className="text-gray-600 mt-1">Business Details and Team Management</p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          Active
        </Badge>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Legal Name</p>
              <p className="font-semibold text-gray-900">{business.legal_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">DBA Name</p>
              <p className="font-semibold text-gray-900">{business.dba_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Business Model</p>
              <p className="font-semibold text-gray-900">{business.business_model || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Registration Number</p>
              <p className="font-semibold text-gray-900">{business.registration_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Location</p>
              <p className="font-semibold text-gray-900">
                {business.hq_city && business.hq_country 
                  ? `${business.hq_city}, ${business.hq_country}`
                  : business.hq_city || business.hq_country || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Website</p>
              <p className="font-semibold text-gray-900">
                {business.website ? (
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {business.website}
                  </a>
                ) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Year Founded</p>
              <p className="font-semibold text-gray-900">{business.year_founded || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Employee Count</p>
              <p className="font-semibold text-gray-900">{business.employee_count || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Created At</p>
              <p className="font-semibold text-gray-900">{formatDate(business.created_at)}</p>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-sm text-gray-500 mb-1">Owner</p>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <p className="font-semibold text-gray-900">{business.owner.full_name}</p>
                <span className="text-gray-500">({business.owner.email})</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Income</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              KES {stats.total_income.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              KES {stats.total_expenses.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              KES {stats.net_profit.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
            <Activity className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              KES {stats.monthly_revenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            <FileText className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total_transactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
            <Receipt className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total_invoices}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {stats.paid_invoices} paid
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {stats.pending_invoices} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Customers</CardTitle>
            <Users className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.customer_count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Members</CardTitle>
            <UserCheck className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total_members}</div>
          </CardContent>
        </Card>
      </div>

      {/* Business Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Business Admins
            <Badge variant="secondary" className="ml-2">
              {business_admins.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {business_admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No business admins assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {business_admins.map((admin) => (
                <Card key={admin.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{admin.full_name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Admin
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {admin.phone_number && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{admin.phone_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Joined {formatDate(admin.joined_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {admin.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Members (Data Entry) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              Staff Members (Data Entry)
              <Badge variant="secondary" className="ml-2">
                {staff_members.length}
              </Badge>
            </CardTitle>
            <Button
              onClick={() => setShowAssignStaff(true)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {staff_members.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No staff members assigned</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff_members.map((staff) => (
                <Card key={staff.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Briefcase className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{staff.full_name}</p>
                          <p className="text-sm text-gray-500">{staff.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Staff
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      {staff.phone_number && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{staff.phone_number}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Joined {formatDate(staff.joined_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {staff.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Staff Modal */}
      {showAssignStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Assign Staff Members</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAssignStaff(false);
                    setSelectedUserIds([]);
                    setStaffSearchQuery('');
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignStaff} className="space-y-4">
                <div>
                  <Label htmlFor="staff_search">Search Users</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="staff_search"
                      type="text"
                      placeholder="Search by name, email, or username..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {loadingStaff ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p>
                        {staffSearchQuery 
                          ? 'No users found matching your search'
                          : availableStaff.length === 0
                          ? 'No users available'
                          : 'All available users are already assigned'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredStaff.map((user) => (
                        <div
                          key={user.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedUserIds.includes(user.id)
                              ? 'bg-green-50 border-green-300'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                          onClick={() => toggleUserSelection(user.id)}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedUserIds.includes(user.id)
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedUserIds.includes(user.id) && (
                              <CheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{user.full_name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {user.role && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {user.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedUserIds.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedUserIds.length}</strong> user{selectedUserIds.length !== 1 ? 's' : ''} selected
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAssignStaff(false);
                      setSelectedUserIds([]);
                      setStaffSearchQuery('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={assignStaffMutation.isPending || selectedUserIds.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {assignStaffMutation.isPending ? 'Assigning...' : `Assign ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`}
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

