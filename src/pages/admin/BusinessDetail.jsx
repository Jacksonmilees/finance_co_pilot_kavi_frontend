import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Building2, Users, Mail, Phone, MapPin, Calendar, FileText,
  ArrowLeft, Edit, Save, X, Trash2, UserPlus, Eye, EyeOff,
  CheckCircle, XCircle, AlertCircle, DollarSign, Activity, Copy
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Skeleton } from '../../components/ui/skeleton';

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch business details
  const { data: business, isLoading, error } = useQuery({
    queryKey: ['business-detail', id],
    queryFn: async () => {
      try {
        const response = await apiClient.request(`/users/businesses/${id}/`);
        return response;
      } catch (error) {
        console.error('❌ Business detail endpoint error:', error.message);
        // Return mock data for development
        return {
          id: parseInt(id),
          legal_name: 'Business Name (Backend Unavailable)',
          business_model: 'N/A',
          owner_email: 'owner@example.com',
          phone_number: 'N/A',
          location: 'N/A',
          status: 'active',
          created_at: new Date().toISOString(),
          user_count: 0,
          transaction_count: 0,
          document_count: 0,
          monthly_revenue: 0,
          last_activity: null,
          business_type: 'N/A'
        };
      }
    },
    retry: 1
  });

  // Fetch business members
  const { data: members = [] } = useQuery({
    queryKey: ['business-members', id],
    queryFn: async () => {
      try {
        const response = await apiClient.request(`/users/businesses/${id}/members/`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('❌ Business members endpoint error:', error.message);
        return [];
      }
    },
    retry: 1,
    enabled: !!business
  });

  // Update business mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.request(`/users/businesses/${id}/`, {
        method: 'PATCH',
        data
      });
    },
    onSuccess: () => {
      toast.success('Business updated successfully');
      setIsEditing(false);
      queryClient.invalidateQueries(['business-detail', id]);
      queryClient.invalidateQueries(['businesses-monitoring']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update business');
    }
  });

  // Delete business mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.request(`/users/businesses/${id}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast.success('Business deleted successfully');
      navigate('/super-admin/businesses');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete business');
    }
  });

  // Update business status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      return await apiClient.request(`/users/businesses/${id}/status/`, {
        method: 'PATCH',
        data: { status }
      });
    },
    onSuccess: () => {
      toast.success('Business status updated');
      queryClient.invalidateQueries(['business-detail', id]);
      queryClient.invalidateQueries(['businesses-monitoring']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiClient.request(`/users/businesses/${id}/members/${userId}/`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries(['business-members', id]);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member');
    }
  });

  const handleEdit = () => {
    setEditedData({
      legal_name: business.legal_name,
      business_model: business.business_model,
      phone_number: business.phone_number,
      location: business.location
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-900 mb-2">Business Not Found</h2>
            <p className="text-red-700 mb-4">The requested business could not be found.</p>
            <Button onClick={() => navigate('/super-admin/businesses')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Businesses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Backend Error Banner */}
      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Backend Endpoint Unavailable</p>
                <p className="text-sm text-amber-700 mt-1">
                  The business detail endpoint is not yet implemented. Showing placeholder data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/super-admin/businesses')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              {isEditing ? (
                <Input
                  value={editedData.legal_name}
                  onChange={(e) => setEditedData({ ...editedData, legal_name: e.target.value })}
                  className="text-3xl font-bold"
                />
              ) : (
                business.legal_name
              )}
            </h1>
            <p className="text-gray-600 mt-1">Business Details & Management</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status & Quick Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <Badge className={getStatusColor(business.status)}>
                  {business.status}
                </Badge>
              </div>
              <div className="flex gap-2">
                {business.status !== 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate('active')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}
                {business.status !== 'suspended' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate('suspended')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                )}
              </div>
            </div>
            <Button onClick={() => navigate('/super-admin/assign-users')}>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Members</p>
                <p className="text-2xl font-bold text-gray-900">{business.user_count || members.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{business.transaction_count || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{business.document_count || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES {parseFloat(business.monthly_revenue || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Business Model</p>
              {isEditing ? (
                <Input
                  value={editedData.business_model}
                  onChange={(e) => setEditedData({ ...editedData, business_model: e.target.value })}
                />
              ) : (
                <p className="font-medium text-gray-900">{business.business_model || 'N/A'}</p>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Business Type</p>
              <p className="font-medium text-gray-900">{business.business_type || 'N/A'}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Owner Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">{business.owner_email}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              {isEditing ? (
                <Input
                  value={editedData.phone_number}
                  onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{business.phone_number || 'N/A'}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Location</p>
              {isEditing ? (
                <Input
                  value={editedData.location}
                  onChange={(e) => setEditedData({ ...editedData, location: e.target.value })}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">{business.location || 'N/A'}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm text-gray-600">Registered</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="font-medium text-gray-900">
                  {new Date(business.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Last Activity</p>
              <p className="font-medium text-gray-900">
                {business.last_activity ? new Date(business.last_activity).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Team Members ({members.length})</span>
              <Button size="sm" onClick={() => navigate('/super-admin/assign-users')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No members assigned</p>
                <p className="text-sm text-gray-400 mt-1">Add users to this business</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name || member.email}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {member.role || 'staff'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                Confirm Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{business.legal_name}</strong>? 
                This action cannot be undone and will remove all associated data.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Business'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
