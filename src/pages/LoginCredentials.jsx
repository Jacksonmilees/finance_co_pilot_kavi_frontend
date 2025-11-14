// Login Credentials Display Page - For Testing & Demo
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Eye, EyeOff, User, Shield, Briefcase } from 'lucide-react';
import apiClient from '../lib/apiClient';
import toast from 'react-hot-toast';

export default function LoginCredentials() {
  const [copiedField, setCopiedField] = useState(null);
  const [showPasswords, setShowPasswords] = useState(false);

  // Fetch all users
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users-credentials'],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/users/users/', {
          method: 'GET',
        });
        return response;
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success(`Copied ${field}!`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'superadmin':
        return <Shield className="w-5 h-5 text-purple-600" />;
      case 'business_admin':
        return <Briefcase className="w-5 h-5 text-blue-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      superadmin: 'bg-purple-100 text-purple-800 border-purple-300',
      business_admin: 'bg-blue-100 text-blue-800 border-blue-300',
      staff: 'bg-green-100 text-green-800 border-green-300',
      viewer: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Hardcoded common test credentials (add your actual users here)
  const testCredentials = [
    {
      id: 'super',
      username: 'admin',
      email: 'admin@financegrowth.com',
      password: 'admin123',
      role: 'superadmin',
      description: 'Super Admin - Full system access',
    },
    {
      id: 'demo',
      username: 'jaredahazq_2',
      email: 'jaredahazq@gmail.com',
      password: 'user123',
      role: 'staff',
      description: 'Demo User - For testing KAVI and regular features',
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading credentials...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Login Credentials</h1>
            <p className="text-blue-100">
              Test accounts for development and demo purposes
            </p>
          </div>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowPasswords(!showPasswords)}
            className="text-white hover:bg-white/20"
          >
            {showPasswords ? (
              <>
                <EyeOff className="w-5 h-5 mr-2" />
                Hide Passwords
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Show Passwords
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900">
                Development/Demo Use Only
              </p>
              <p className="text-sm text-amber-800">
                These credentials are for testing purposes. Never share production credentials this way.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Test Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {testCredentials.map((cred) => (
            <Card key={cred.id} className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getRoleIcon(cred.role)}
                    <div>
                      <CardTitle className="text-lg">{cred.username}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{cred.description}</p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(
                      cred.role
                    )}`}
                  >
                    {cred.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Username */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Username
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm font-mono font-semibold text-gray-900">
                      {cred.username}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(cred.username, `${cred.id}-username`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `${cred.id}-username` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Email
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm font-mono font-semibold text-gray-900">
                      {cred.email}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(cred.email, `${cred.id}-email`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `${cred.id}-email` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-gray-500 uppercase">
                    Password
                  </label>
                  <div className="flex items-center justify-between mt-1">
                    <code className="text-sm font-mono font-semibold text-gray-900">
                      {showPasswords ? cred.password : '••••••••'}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(cred.password, `${cred.id}-password`)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedField === `${cred.id}-password` ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Quick Login Button */}
                <Button
                  className="w-full mt-2"
                  variant="outline"
                  onClick={() => {
                    copyToClipboard(
                      `Username: ${cred.username}\nPassword: ${cred.password}`,
                      `${cred.id}-both`
                    );
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Both
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dynamic Users from Database */}
      {users && users.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Database Users ({users.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <Card key={user.id} className="border hover:border-blue-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-base">
                      {user.full_name || user.username}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Username:</span>
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-xs">{user.username}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(user.username, `db-${user.id}-username`)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === `db-${user.id}-username` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Email:</span>
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-xs">{user.email}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(user.email, `db-${user.id}-email`)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedField === `db-${user.id}-email` ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="pt-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_superuser
                          ? 'bg-purple-100 text-purple-800'
                          : user.is_staff
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.is_superuser
                        ? 'Super Admin'
                        : user.is_staff
                        ? 'Staff'
                        : 'User'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick Reference Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span>💡</span>
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-blue-900">Super Admin Login:</p>
              <p className="text-blue-800">URL: /super-admin</p>
              <p className="text-blue-800">Use: Full system management</p>
            </div>
            <div>
              <p className="font-semibold text-blue-900">Regular User Login:</p>
              <p className="text-blue-800">URL: /login</p>
              <p className="text-blue-800">Use: Dashboard, KAVI, transactions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


