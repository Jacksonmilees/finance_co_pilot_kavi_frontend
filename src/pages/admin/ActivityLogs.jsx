import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Activity, Search, Filter, Download, Calendar,
  User, Building2, FileText, Settings, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CardSkeleton, Skeleton } from '../../components/ui/skeleton';

export default function ActivityLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const queryClient = useQueryClient();

  // Fetch activity logs with real-time updates
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', filterType, filterUser, dateRange],
    queryFn: async () => {
      const response = await apiClient.request('/core/admin/activity-logs/', {
        params: {
          type: filterType !== 'all' ? filterType : undefined,
          user: filterUser !== 'all' ? filterUser : undefined,
          range: dateRange
        }
      });
      return response;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 3000
  });

  // Fetch users for filter
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-filter'],
    queryFn: async () => {
      const response = await apiClient.request('/users/admin/users/');
      return response;
    },
    staleTime: 60000
  });

  // Export logs
  const handleExport = () => {
    const csv = [
      ['Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP Address'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user_email || 'System',
        log.action,
        log.resource_type || '',
        log.details || '',
        log.ip_address || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getActionIcon = (action) => {
    if (action?.includes('login')) return User;
    if (action?.includes('business') || action?.includes('company')) return Building2;
    if (action?.includes('document') || action?.includes('file')) return FileText;
    if (action?.includes('settings') || action?.includes('config')) return Settings;
    return Activity;
  };

  const getActionColor = (action) => {
    if (action?.includes('delete') || action?.includes('remove')) return 'bg-red-100 text-red-700';
    if (action?.includes('create') || action?.includes('add')) return 'bg-green-100 text-green-700';
    if (action?.includes('update') || action?.includes('edit')) return 'bg-blue-100 text-blue-700';
    if (action?.includes('login')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>

        {/* Timeline Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-4 p-4 border rounded-lg animate-pulse">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Activity Logs
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring of all system activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['activity-logs'] })}
            variant="outline"
            className="border-gray-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action?.includes('user')).length}
                </p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Business Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action?.includes('business')).length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Login Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action?.includes('login')).length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="all">All Actions</option>
              <option value="login">Login Events</option>
              <option value="user">User Actions</option>
              <option value="business">Business Actions</option>
              <option value="document">Document Actions</option>
              <option value="settings">Settings Changes</option>
            </select>

            {/* User Filter */}
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="all">All Users</option>
              {users.slice(0, 20).map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No activities found</p>
            ) : (
              filteredLogs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{log.action}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {log.user_email || 'System'} • {log.details || 'No additional details'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        {log.resource_type && (
                          <Badge variant="outline" className="text-xs">
                            {log.resource_type}
                          </Badge>
                        )}
                        {log.ip_address && (
                          <span className="text-xs text-gray-500">
                            IP: {log.ip_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
