import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Building2, Users, UserPlus, Copy, CheckCircle, AlertCircle, 
  Loader2, Mail, Shield, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '../components/ui/skeleton';

export default function SuperAdminBusinessAssignment() {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('staff');
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  // Fetch approved businesses
  const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ['approved-businesses'],
    queryFn: async () => {
      return await apiClient.request('/users/admin/approved-businesses/');
    }
  });

  // Assign user mutation
  const assignUserMutation = useMutation({
    mutationFn: async (data) => {
      return await apiClient.request('/users/admin/assign-user-to-business/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setAssignmentResult(data);
      setUserEmail('');
      queryClient.invalidateQueries(['approved-businesses']);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign user');
    }
  });

  const handleAssignUser = (e) => {
    e.preventDefault();
    if (!selectedBusiness || !userEmail) {
      toast.error('Please select a business and enter user email');
      return;
    }

    assignUserMutation.mutate({
      business_id: selectedBusiness.id,
      user_email: userEmail,
      role: userRole
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business User Assignment</h1>
        <p className="text-gray-600 mt-1">Assign users to approved businesses</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Business List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Approved Businesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBusinesses ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 border rounded-lg animate-pulse">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-4 mt-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No approved businesses found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    onClick={() => setSelectedBusiness(business)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedBusiness?.id === business.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{business.legal_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{business.business_model}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {business.owner_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {business.member_count} members
                          </span>
                        </div>
                      </div>
                      {selectedBusiness?.id === business.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Assignment Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Assign User
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedBusiness ? (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Select a business to assign users</p>
                </div>
              ) : (
                <form onSubmit={handleAssignUser} className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Selected Business</Label>
                    <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-900">{selectedBusiness.legal_name}</p>
                      <p className="text-sm text-blue-700">{selectedBusiness.business_model}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="userEmail">User Email *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If user doesn't exist, a new account will be created
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="userRole">Role *</Label>
                    <select
                      id="userRole"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="staff">Staff - Standard employee access</option>
                      <option value="business_admin">Business Admin - Full management access</option>
                      <option value="viewer">Viewer - Read-only access</option>
                    </select>
                  </div>

                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      <strong>Important:</strong> If a new user is created, temporary login credentials will be generated. 
                      Make sure to copy and share them with the user!
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="submit"
                    disabled={assignUserMutation.isPending}
                    className="w-full"
                  >
                    {assignUserMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign User
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Assignment Result with Credentials */}
          {assignmentResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  Assignment Successful!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-white border-green-200">
                  <AlertDescription>
                    <p className="font-medium text-green-900">{assignmentResult.message}</p>
                    {assignmentResult.user_created && (
                      <p className="text-sm text-blue-600 mt-1">✨ New user account created</p>
                    )}
                  </AlertDescription>
                </Alert>

                {/* Show temporary credentials if new user */}
                {assignmentResult.temporary_credentials && (
                  <Alert className="bg-red-50 border-red-500">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-900">
                      <p className="font-bold text-sm mb-2">⚠️ COPY THESE CREDENTIALS NOW!</p>
                      <p className="text-xs mb-3">Share these with the user. They won't be shown again.</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-red-300">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Username</p>
                            <p className="font-mono font-semibold text-sm">{assignmentResult.temporary_credentials.username}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(assignmentResult.temporary_credentials.username, 'Username')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded border border-red-300">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Email</p>
                            <p className="font-mono font-semibold text-sm">{assignmentResult.temporary_credentials.email}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(assignmentResult.temporary_credentials.email, 'Email')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between p-2 bg-white rounded border border-red-300">
                          <div className="flex-1">
                            <p className="text-xs text-gray-600">Temporary Password</p>
                            <div className="flex items-center gap-2">
                              <p className="font-mono font-semibold text-sm">
                                {showPassword ? assignmentResult.temporary_credentials.password : '••••••••••••'}
                              </p>
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(assignmentResult.temporary_credentials.password, 'Password')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            const creds = assignmentResult.temporary_credentials;
                            const text = `Login Credentials:\nUsername: ${creds.username}\nEmail: ${creds.email}\nPassword: ${creds.password}\n\n⚠️ Please change your password after first login!`;
                            copyToClipboard(text, 'All credentials');
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy All Credentials
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div>
                      <p className="text-xs text-gray-500">User Email</p>
                      <p className="font-medium text-gray-900">{assignmentResult.membership.user_email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(assignmentResult.membership.user_email, 'Email')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div>
                      <p className="text-xs text-gray-500">Business</p>
                      <p className="font-medium text-gray-900">{assignmentResult.membership.business_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <Badge variant="outline" className="mt-1">
                        <Shield className="w-3 h-3 mr-1" />
                        {assignmentResult.membership.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setAssignmentResult(null);
                    setShowPassword(false);
                  }}
                >
                  Assign Another User
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
