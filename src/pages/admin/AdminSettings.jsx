import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Settings, Bell, Mail, Globe, Database, Save, Package, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import apiClient from '../../lib/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CardSkeleton } from '../../components/ui/skeleton';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({});

  const { data: systemSettings, isLoading } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => apiClient.getAdminSettings(),
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (systemSettings) {
      setSettings(systemSettings);
    }
  }, [systemSettings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => apiClient.updateAdminSettings(data),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
    },
    onError: () => {
      toast.error('Failed to update settings');
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
            System Settings
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Link to="/super-admin/module-assignment">
              <Package className="w-4 h-4 mr-2" />
              Module Assignment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={updateSettingsMutation.isLoading}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name || ''}
                onChange={(e) => handleChange('site_name', e.target.value)}
                placeholder="FinanceGrowth"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_url">Site URL</Label>
              <Input
                id="site_url"
                value={settings.site_url || ''}
                onChange={(e) => handleChange('site_url', e.target.value)}
                placeholder="https://financegrowth.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site_description">Site Description</Label>
            <Textarea
              id="site_description"
              value={settings.site_description || ''}
              onChange={(e) => handleChange('site_description', e.target.value)}
              placeholder="Financial management platform for businesses"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Maintenance Mode</div>
              <div className="text-sm text-gray-600">Temporarily disable site access for maintenance</div>
            </div>
            <Switch
              checked={settings.maintenance_mode || false}
              onCheckedChange={(checked) => handleChange('maintenance_mode', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Allow New Registrations</div>
              <div className="text-sm text-gray-600">Enable new business registrations</div>
            </div>
            <Switch
              checked={settings.allow_registrations !== false}
              onCheckedChange={(checked) => handleChange('allow_registrations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={settings.smtp_host || ''}
                onChange={(e) => handleChange('smtp_host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp_port">SMTP Port</Label>
              <Input
                id="smtp_port"
                type="number"
                value={settings.smtp_port || ''}
                onChange={(e) => handleChange('smtp_port', e.target.value)}
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email || ''}
                onChange={(e) => handleChange('from_email', e.target.value)}
                placeholder="noreply@financegrowth.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.from_name || ''}
                onChange={(e) => handleChange('from_name', e.target.value)}
                placeholder="FinanceGrowth"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Email Notifications</div>
              <div className="text-sm text-gray-600">Send email notifications for important events</div>
            </div>
            <Switch
              checked={settings.email_notifications !== false}
              onCheckedChange={(checked) => handleChange('email_notifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">New User Registration</div>
              <div className="text-sm text-gray-600">Notify admins when new users register</div>
            </div>
            <Switch
              checked={settings.notify_new_users !== false}
              onCheckedChange={(checked) => handleChange('notify_new_users', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Business Approval Required</div>
              <div className="text-sm text-gray-600">Notify admins when businesses need approval</div>
            </div>
            <Switch
              checked={settings.notify_approval_required !== false}
              onCheckedChange={(checked) => handleChange('notify_approval_required', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">System Errors</div>
              <div className="text-sm text-gray-600">Notify admins of critical system errors</div>
            </div>
            <Switch
              checked={settings.notify_errors !== false}
              onCheckedChange={(checked) => handleChange('notify_errors', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Daily Reports</div>
              <div className="text-sm text-gray-600">Send daily activity reports to admins</div>
            </div>
            <Switch
              checked={settings.daily_reports || false}
              onCheckedChange={(checked) => handleChange('daily_reports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database & Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cache_timeout">Cache Timeout (seconds)</Label>
              <Input
                id="cache_timeout"
                type="number"
                value={settings.cache_timeout || 300}
                onChange={(e) => handleChange('cache_timeout', parseInt(e.target.value))}
                placeholder="300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={settings.session_timeout || 30}
                onChange={(e) => handleChange('session_timeout', parseInt(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Enable Query Caching</div>
              <div className="text-sm text-gray-600">Cache database queries for better performance</div>
            </div>
            <Switch
              checked={settings.enable_caching !== false}
              onCheckedChange={(checked) => handleChange('enable_caching', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <div className="font-semibold">Debug Mode</div>
              <div className="text-sm text-gray-600">Enable detailed error logging (not recommended for production)</div>
            </div>
            <Switch
              checked={settings.debug_mode || false}
              onCheckedChange={(checked) => handleChange('debug_mode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg" disabled={updateSettingsMutation.isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {updateSettingsMutation.isLoading ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
}
