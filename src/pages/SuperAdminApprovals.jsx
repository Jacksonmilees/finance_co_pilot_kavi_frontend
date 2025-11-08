import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Building2, User, CheckCircle, XCircle, Clock, Eye, 
  Mail, Phone, MapPin, DollarSign, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CardSkeleton, Skeleton } from '../components/ui/skeleton';

export default function SuperAdminApprovals() {
  const { isSuperAdmin, user } = useAuth();
  const [viewingBusinessReg, setViewingBusinessReg] = useState(null);
  const [viewingIndividualReg, setViewingIndividualReg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedBusinessId, setAssignedBusinessId] = useState('');
  const [assignedRole, setAssignedRole] = useState('staff');
  const queryClient = useQueryClient();
  
  // Debug logging
  console.log('SuperAdminApprovals - User:', user);
  console.log('SuperAdminApprovals - isSuperAdmin():', isSuperAdmin());
  console.log('SuperAdminApprovals - user.is_superuser:', user?.is_superuser);

  // Fetch ALL business registrations (not just pending)
  const { data: businessRegistrations = [], isLoading: loadingBusiness, error: businessError } = useQuery({
    queryKey: ['all-business-registrations'],
    queryFn: async () => {
      try {
        // Try the new endpoint first
        const data = await apiClient.request('/users/admin/all-registrations/');
        console.log('Business registrations fetched (all):', data);
        return data;
      } catch (error) {
        // Fallback to pending-only endpoint if all-registrations doesn't exist yet
        console.log('Falling back to pending-registrations endpoint');
        const data = await apiClient.request('/users/admin/pending-registrations/');
        console.log('Business registrations fetched (pending only):', data);
        return data;
      }
    },
    enabled: isSuperAdmin()
  });
  
  // Log any errors
  if (businessError) {
    console.error('Error fetching business registrations:', businessError);
  }
  
  // Filter registrations by status
  const pendingBusinessRegs = businessRegistrations.filter(reg => reg.status === 'pending');
  const approvedBusinessRegs = businessRegistrations.filter(reg => reg.status === 'approved');
  const rejectedBusinessRegs = businessRegistrations.filter(reg => reg.status === 'rejected');

  // Fetch pending individual registrations
  const { data: individualRegistrations = [], isLoading: loadingIndividual } = useQuery({
    queryKey: ['pending-individual-registrations'],
    queryFn: async () => {
      return await apiClient.request('/users/admin/pending-individual-registrations/');
    },
    enabled: isSuperAdmin()
  });

  // Fetch approved businesses for assignment
  const { data: businesses = [] } = useQuery({
    queryKey: ['approved-businesses'],
    queryFn: async () => {
      return await apiClient.request('/users/businesses/');
    },
    enabled: isSuperAdmin()
  });

  // Business approval mutation
  const approveBusinessMutation = useMutation({
    mutationFn: (registrationId) => 
      apiClient.request(`/users/admin/approve-registration/${registrationId}/`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-business-registrations'] });
      setViewingBusinessReg(null);
      toast.success(`Business approved! Username: ${data.username}, Temp Password: ${data.temp_password}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve registration');
    }
  });

  // Business rejection mutation
  const rejectBusinessMutation = useMutation({
    mutationFn: ({ registrationId, reason }) => 
      apiClient.request(`/users/admin/reject-registration/${registrationId}/`, { 
        method: 'POST',
        data: { rejection_reason: reason }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-business-registrations'] });
      setViewingBusinessReg(null);
      setRejectionReason('');
      toast.success('Business registration rejected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject registration');
    }
  });

  // Individual approval mutation
  const approveIndividualMutation = useMutation({
    mutationFn: ({ registrationId, assignedBusinessId, assignedRole }) => 
      apiClient.request(`/users/admin/approve-individual-registration/${registrationId}/`, { 
        method: 'POST',
        data: { assigned_business_id: assignedBusinessId, assigned_role: assignedRole }
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-individual-registrations'] });
      setViewingIndividualReg(null);
      setAssignedBusinessId('');
      setAssignedRole('staff');
      toast.success(`Individual approved! Username: ${data.username}, Temp Password: ${data.temp_password}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to approve registration');
    }
  });

  // Individual rejection mutation
  const rejectIndividualMutation = useMutation({
    mutationFn: ({ registrationId, reason }) => 
      apiClient.request(`/users/admin/reject-individual-registration/${registrationId}/`, { 
        method: 'POST',
        data: { rejection_reason: reason }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-individual-registrations'] });
      setViewingIndividualReg(null);
      setRejectionReason('');
      toast.success('Individual registration rejected');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to reject registration');
    }
  });

  if (!isSuperAdmin()) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Access denied. Super Admin access required.</p>
              <div className="text-sm space-y-1">
                <p>Username: {user?.username || 'Not logged in'}</p>
                <p>Is Superuser: {user?.is_superuser ? 'Yes' : 'No'}</p>
                <p>If you should have access, please contact your administrator or try logging out and back in.</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registration Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve pending registrations</p>
      </div>

      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Business Registrations
            {pendingBusinessRegs.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingBusinessRegs.length} pending</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Individual Registrations
            {individualRegistrations.length > 0 && (
              <Badge variant="destructive" className="ml-2">{individualRegistrations.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Business Registrations Tab */}
        <TabsContent value="business" className="space-y-4">
          {businessError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading registrations: {businessError.message}
              </AlertDescription>
            </Alert>
          )}
          {loadingBusiness ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full mt-4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : businessRegistrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold">No business registrations found in database</p>
                <p className="text-sm text-gray-400 mt-2">This means:</p>
                <ul className="text-sm text-gray-500 mt-2 space-y-1 text-left max-w-md mx-auto">
                  <li>• No businesses have registered yet</li>
                  <li>• Or all registrations were deleted</li>
                  <li>• Or the database was reset</li>
                </ul>
                <p className="text-sm text-blue-600 mt-4">
                  To test: Go to <a href="/register" className="underline font-semibold">/register</a> and submit a business registration
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Pending Registrations */}
              {pendingBusinessRegs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Approval ({pendingBusinessRegs.length})</h3>
                  <div className="grid gap-4">
                    {pendingBusinessRegs.map((registration) => (
                <Card key={registration.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{registration.business_name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted {new Date(registration.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Owner:</span> {registration.owner_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Email:</span> {registration.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Phone:</span> {registration.phone_number}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Location:</span> {registration.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Type:</span> {registration.business_type}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Revenue:</span> KES {parseFloat(registration.monthly_revenue || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {viewingBusinessReg?.id === registration.id ? (
                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label>Rejection Reason (if rejecting)</Label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide reason for rejection..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveBusinessMutation.mutate(registration.id)}
                            disabled={approveBusinessMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {approveBusinessMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!rejectionReason.trim()) {
                                toast.error('Please provide a rejection reason');
                                return;
                              }
                              rejectBusinessMutation.mutate({ 
                                registrationId: registration.id, 
                                reason: rejectionReason 
                              });
                            }}
                            disabled={rejectBusinessMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            {rejectBusinessMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</>
                            ) : (
                              <><XCircle className="w-4 h-4 mr-2" /> Reject</>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setViewingBusinessReg(null);
                              setRejectionReason('');
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setViewingBusinessReg(registration)}
                        variant="outline"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review & Approve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
                  </div>
                </div>
              )}

              {/* Approved Registrations */}
              {approvedBusinessRegs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-700">Approved ({approvedBusinessRegs.length})</h3>
                  <div className="grid gap-4">
                    {approvedBusinessRegs.map((registration) => (
                      <Card key={registration.id} className="border border-green-200 bg-green-50/30">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{registration.business_name}</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                Approved {new Date(registration.updated_at || registration.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Owner:</span> {registration.owner_name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Email:</span> {registration.email}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejected Registrations */}
              {rejectedBusinessRegs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-700">Rejected ({rejectedBusinessRegs.length})</h3>
                  <div className="grid gap-4">
                    {rejectedBusinessRegs.map((registration) => (
                      <Card key={registration.id} className="border border-red-200 bg-red-50/30">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-xl">{registration.business_name}</CardTitle>
                              <p className="text-sm text-gray-500 mt-1">
                                Rejected {new Date(registration.updated_at || registration.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Owner:</span> {registration.owner_name}
                            </div>
                            {registration.rejection_reason && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-xs font-medium text-red-700">Rejection Reason:</p>
                                <p className="text-sm text-red-600">{registration.rejection_reason}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Individual Registrations Tab */}
        <TabsContent value="individual" className="space-y-4">
          {loadingIndividual ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : individualRegistrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending individual registrations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {individualRegistrations.map((registration) => (
                <Card key={registration.id} className="border border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{registration.full_name}</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted {new Date(registration.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Email:</span> {registration.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Phone:</span> {registration.phone_number}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">ID Number:</span> {registration.id_number}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">Location:</span> {registration.city}, {registration.country}
                        </div>
                        {registration.preferred_business_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Preferred:</span> {registration.preferred_business_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {viewingIndividualReg?.id === registration.id ? (
                      <div className="space-y-4 border-t pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Assign to Business *</Label>
                            <Select value={assignedBusinessId} onValueChange={setAssignedBusinessId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business..." />
                              </SelectTrigger>
                              <SelectContent>
                                {businesses.map((business) => (
                                  <SelectItem key={business.id} value={business.id.toString()}>
                                    {business.legal_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Assign Role *</Label>
                            <Select value={assignedRole} onValueChange={setAssignedRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="business_admin">Business Admin</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Rejection Reason (if rejecting)</Label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Provide reason for rejection..."
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              if (!assignedBusinessId) {
                                toast.error('Please select a business to assign');
                                return;
                              }
                              approveIndividualMutation.mutate({ 
                                registrationId: registration.id,
                                assignedBusinessId,
                                assignedRole
                              });
                            }}
                            disabled={approveIndividualMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {approveIndividualMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!rejectionReason.trim()) {
                                toast.error('Please provide a rejection reason');
                                return;
                              }
                              rejectIndividualMutation.mutate({ 
                                registrationId: registration.id, 
                                reason: rejectionReason 
                              });
                            }}
                            disabled={rejectIndividualMutation.isPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            {rejectIndividualMutation.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</>
                            ) : (
                              <><XCircle className="w-4 h-4 mr-2" /> Reject</>
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setViewingIndividualReg(null);
                              setRejectionReason('');
                              setAssignedBusinessId('');
                              setAssignedRole('staff');
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setViewingIndividualReg(registration)}
                        variant="outline"
                        className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review & Approve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
