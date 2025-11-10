import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle, XCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import apiClient from '../../lib/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CardSkeleton } from '../../components/ui/skeleton';
import toast from 'react-hot-toast';

export default function Security() {
  const queryClient = useQueryClient();

  const { data: securitySettings, isLoading } = useQuery({
    queryKey: ['admin-security-settings'],
    queryFn: () => apiClient.getAdminSecurity(),
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['admin-security-activity'],
    queryFn: () => apiClient.getAdminSecurityActivity(),
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ setting, value }) =>
      apiClient.post('/users/admin/security/update/', { setting, value }),
    onSuccess: () => {
      toast.success('Security setting updated');
      queryClient.invalidateQueries({ queryKey: ['admin-security-settings'] });
    },
    onError: () => {
      toast.error('Failed to update setting');
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const handleToggle = (setting, currentValue) => {
    updateSettingMutation.mutate({ setting, value: !currentValue });
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-600" />
          Security & Access Control
        </h1>
        <p className="text-gray-600 mt-1">Manage system security settings and monitor access</p>
      </div>

      {/* Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Security Score</CardTitle>
            <Shield className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{securitySettings?.security_score || 85}%</div>
            <p className="text-xs text-gray-600 mt-1">System security rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Failed Logins (24h)</CardTitle>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{securitySettings?.failed_logins_24h || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Suspicious activity detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Sessions</CardTitle>
            <Activity className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{securitySettings?.active_sessions || 0}</div>
            <p className="text-xs text-gray-600 mt-1">Currently logged in users</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-semibold">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Require 2FA for all admin accounts</div>
            </div>
            <Switch
              checked={securitySettings?.require_2fa || false}
              onCheckedChange={() => handleToggle('require_2fa', securitySettings?.require_2fa)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-semibold">Password Complexity</div>
              <div className="text-sm text-gray-600">Enforce strong password requirements</div>
            </div>
            <Switch
              checked={securitySettings?.password_complexity || true}
              onCheckedChange={() => handleToggle('password_complexity', securitySettings?.password_complexity)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-semibold">Session Timeout</div>
              <div className="text-sm text-gray-600">Auto-logout after 30 minutes of inactivity</div>
            </div>
            <Switch
              checked={securitySettings?.session_timeout || true}
              onCheckedChange={() => handleToggle('session_timeout', securitySettings?.session_timeout)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-semibold">Login Attempt Limit</div>
              <div className="text-sm text-gray-600">Lock account after 5 failed login attempts</div>
            </div>
            <Switch
              checked={securitySettings?.login_attempt_limit || true}
              onCheckedChange={() => handleToggle('login_attempt_limit', securitySettings?.login_attempt_limit)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="font-semibold">IP Whitelist</div>
              <div className="text-sm text-gray-600">Restrict admin access to specific IP addresses</div>
            </div>
            <Switch
              checked={securitySettings?.ip_whitelist || false}
              onCheckedChange={() => handleToggle('ip_whitelist', securitySettings?.ip_whitelist)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Security Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Security Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(recentActivity || []).slice(0, 10).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {activity.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : activity.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">{activity.message}</div>
                    <div className="text-xs text-gray-600">{activity.user} • {activity.ip}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{activity.timestamp}</div>
              </div>
            ))}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="text-center text-gray-500 py-8">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
