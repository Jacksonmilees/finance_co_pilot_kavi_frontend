import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Building2, Users, TrendingUp, Activity, Search, 
  Eye, Calendar, Mail, Phone, MapPin, DollarSign,
  CheckCircle, XCircle, Clock, RefreshCw, FileText
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CardSkeleton, TableSkeleton, Skeleton } from '../../components/ui/skeleton';

export default function BusinessMonitoring() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  // Fetch all businesses with their stats
  const { data: businesses = [], isLoading, error: businessError } = useQuery({
    queryKey: ['businesses-monitoring', filterStatus],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/users/admin/businesses-monitoring/', {
          params: {
            status: filterStatus !== 'all' ? filterStatus : undefined
          }
        });
        return response;
      } catch (error) {
        console.error('Business monitoring error:', error);
        return [];
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
    retry: 2 // Retry twice before giving up
  });

  // Fetch business stats summary
  const { data: summary = {}, error: summaryError } = useQuery({
    queryKey: ['business-summary'],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/users/admin/business-summary/');
        return response;
      } catch (error) {
        console.error('Business summary error:', error);
        return { total: 0, active: 0, inactive: 0, this_month: 0, total_users: 0 };
      }
    },
    refetchInterval: 60000,
    staleTime: 30000,
    retry: 2
  });

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = !searchQuery || 
      business.legal_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.business_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
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
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Summary Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        {/* Search and Filter Skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Skeleton */}
        <TableSkeleton rows={5} cols={6} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            Business Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor all businesses and their activities
          </p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['businesses-monitoring'] })}
          variant="outline"
          className="border-gray-300"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Businesses</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total || 0}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{summary.active || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-purple-600">{summary.total_users || 0}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-orange-600">{summary.this_month || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
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
                placeholder="Search businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 bg-white min-w-[150px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Business List */}
      <div className="grid gap-4">
        {filteredBusinesses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No businesses found</p>
            </CardContent>
          </Card>
        ) : (
          filteredBusinesses.map((business) => (
            <Card key={business.id} className="border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{business.legal_name}</h3>
                      <Badge className={getStatusColor(business.status)}>
                        {business.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Registered {new Date(business.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/super-admin/businesses/${business.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{business.owner_email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{business.phone_number || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{business.location || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{business.business_type}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{business.user_count || 0} Users</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        Last active: {business.last_activity ? new Date(business.last_activity).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Transactions</p>
                    <p className="text-lg font-semibold text-gray-900">{business.transaction_count || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Documents</p>
                    <p className="text-lg font-semibold text-gray-900">{business.document_count || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">
                      KES {parseFloat(business.monthly_revenue || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
