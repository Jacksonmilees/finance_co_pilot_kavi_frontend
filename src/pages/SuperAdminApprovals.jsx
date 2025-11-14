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
  Mail, Phone, MapPin, DollarSign, FileText, Loader2, AlertCircle, Copy, AlertTriangle, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SuperAdminApprovals() {
  const { isSuperAdmin } = useAuth();
  const [viewingBusinessReg, setViewingBusinessReg] = useState(null);
  const [viewingIndividualReg, setViewingIndividualReg] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedBusinessId, setAssignedBusinessId] = useState('');
  const [assignedRole, setAssignedRole] = useState('staff');
  const [approvedCredentials, setApprovedCredentials] = useState(null); // NEW: Store credentials after approval
  const [copiedField, setCopiedField] = useState(null); // NEW: Track copied fields
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
      return await apiClient.request('/users/businesses/');
    },
    enabled: isSuperAdmin()
  });

  // Copy to clipboard helper
  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(`Copied ${field}!`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Business approval mutation
  const approveBusinessMutation = useMutation({
    mutationFn: (registrationId) => 
      apiClient.request(`/users/admin/approve-registration/${registrationId}/`, { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-business-registrations'] });
      setViewingBusinessReg(null);
      
      // Show credentials modal instead of toast
      setApprovedCredentials({
        type: 'business',
        businessName: data.business_name || 'New Business',
        username: data.username,
        password: data.temp_password,
        email: data.email
      });
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
      apiClient.post(`/users/admin/approve-individual-registration/${registrationId}/`, { 
        assigned_business_id: assignedBusinessId, 
        assigned_role: assignedRole 
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pending-individual-registrations'] });
      setViewingIndividualReg(null);
      setAssignedBusinessId('');
      setAssignedRole('staff');
      
      // Show credentials modal instead of toast
      setApprovedCredentials({
        type: 'individual',
        fullName: data.full_name || 'New User',
        username: data.username,
        password: data.temp_password,
        email: data.email
      });
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

      {/* Credentials Modal - Shows after approval */}
      {approvedCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl border-4 border-green-500 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8" />
                  <div>
                    <CardTitle className="text-2xl">
                      {approvedCredentials.type === 'business' ? '🎉 Business Approved!' : '✅ User Approved!'}
                    </CardTitle>
                    <p className="text-green-100 text-sm mt-1">
                      {approvedCredentials.type === 'business' 
                        ? approvedCredentials.businessName 
                        : approvedCredentials.fullName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setApprovedCredentials(null)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Critical Warning */}
              <Alert className="border-2 border-amber-500 bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <p className="font-bold text-lg mb-2">⚠️ IMPORTANT - Read Carefully!</p>
                  <ul className="space-y-1 text-sm">
                    <li>✋ <strong>Copy these credentials NOW!</strong></li>
                    <li>🔒 <strong>You will NOT see them again</strong> after closing this window</li>
                    <li>🔄 The user must change their password on first login</li>
                    <li>📧 Send these credentials to: <code className="bg-amber-100 px-1 rounded">{approvedCredentials.email}</code></li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Login Credentials */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Login Credentials
                </h3>

                {/* Email */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <label className="text-xs font-bold text-blue-900 uppercase mb-2 block">
                    📧 Email Address
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-lg font-mono font-bold text-blue-900 bg-white px-3 py-2 rounded flex-1">
                      {approvedCredentials.email}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(approvedCredentials.email, 'Email')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {copiedField === 'Email' ? (
                        <><CheckCircle className="w-4 h-4 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Username */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <label className="text-xs font-bold text-purple-900 uppercase mb-2 block">
                    👤 Username
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-lg font-mono font-bold text-purple-900 bg-white px-3 py-2 rounded flex-1">
                      {approvedCredentials.username}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(approvedCredentials.username, 'Username')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {copiedField === 'Username' ? (
                        <><CheckCircle className="w-4 h-4 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Temporary Password */}
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                  <label className="text-xs font-bold text-red-900 uppercase mb-2 block">
                    🔑 Temporary Password (Must Change on First Login)
                  </label>
                  <div className="flex items-center justify-between gap-3">
                    <code className="text-lg font-mono font-bold text-red-900 bg-white px-3 py-2 rounded flex-1">
                      {approvedCredentials.password}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(approvedCredentials.password, 'Password')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {copiedField === 'Password' ? (
                        <><CheckCircle className="w-4 h-4 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1" /> Copy</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Copy All Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-6 text-lg"
                  onClick={() => {
                    const allCreds = `
Login Credentials for ${approvedCredentials.type === 'business' ? approvedCredentials.businessName : approvedCredentials.fullName}

Email: ${approvedCredentials.email}
Username: ${approvedCredentials.username}
Temporary Password: ${approvedCredentials.password}

⚠️ IMPORTANT: You must change your password on first login!

Login URL: ${window.location.origin}/login
                    `.trim();
                    copyToClipboard(allCreds, 'All Credentials');
                  }}
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Copy All Credentials
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">📋 Next Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  <li>Copy the credentials above (click "Copy All Credentials")</li>
                  <li>Send them to the user via email: <strong>{approvedCredentials.email}</strong></li>
                  <li>Inform them to login at: <code className="bg-gray-200 px-1 rounded">{window.location.origin}/login</code></li>
                  <li>User must change password on first login for security</li>
                  <li><strong className="text-red-600">Close this window only after copying!</strong></li>
                </ol>
              </div>

              {/* Close Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (confirm('⚠️ Have you copied the credentials? You won\'t be able to see them again!')) {
                      setApprovedCredentials(null);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    if (confirm('✅ Confirm: I have copied and saved the credentials')) {
                      setApprovedCredentials(null);
                      toast.success('Great! Credentials saved. User can now login.');
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  I've Copied the Credentials
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
