import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Building2, Clock, TrendingUp, Shield, Settings, 
  BarChart3, FileText, Activity, CheckCircle, XCircle, 
  AlertCircle, ArrowRight, Zap, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import apiClient from '../lib/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

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
      title: 'Assign Users',
      description: 'Assign users to approved businesses',
      icon: UserPlus,
      path: '/super-admin/assign-users',
      color: 'blue'
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">System Overview and Management Portal</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          System Operational
        </Badge>
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
    </div>
  );
}
