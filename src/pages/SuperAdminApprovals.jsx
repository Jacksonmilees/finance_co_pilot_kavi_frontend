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

export default function SuperAdminApprovals() {
  const { isSuperAdmin } = useAuth();
  const [viewingBusinessReg, setViewingBusinessReg] = useState(null);
  const [viewingIndividualReg, setViewingIndividualReg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedBusinessId, setAssignedBusinessId] = useState('');
  const [assignedRole, setAssignedRole] = useState('staff');
  const queryClient = useQueryClient();

  // Fetch pending business registrations
  const { data: businessRegistrations = [], isLoading: loadingBusiness } = useQuery({
    queryKey: ['pending-business-registrations'],
    queryFn: async () => {
      return await apiClient.request('/users/admin/pending-registrations/');
    },
    enabled: isSuperAdmin()
  });

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
      return await apiClient.request('/users/admin/businesses/all/');
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
        body: JSON.stringify({ rejection_reason: reason })
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
        body: JSON.stringify({ 
          assigned_business_id: Number(assignedBusinessId), 
          assigned_role: assignedRole 
        })
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
        body: JSON.stringify({ rejection_reason: reason })
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
          <AlertDescription>Access denied. Super Admin access required.</AlertDescription>
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
            {businessRegistrations.length > 0 && (
              <Badge variant="destructive" className="ml-2">{businessRegistrations.length}</Badge>
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
          {loadingBusiness ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            </div>
          ) : businessRegistrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending business registrations</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {businessRegistrations.map((registration) => (
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
