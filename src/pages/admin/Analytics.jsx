import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Users, Building2, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import apiClient from '../../lib/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Analytics() {
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/users/admin/analytics/');
        return response;
      } catch (error) {
        console.error('❌ Analytics endpoint error:', error.message);
        // Return fallback data when backend is unavailable
        return {
          user_growth: 0,
          business_growth: 0,
          revenue_growth: 0,
          active_rate: 0,
          daily_active_users: 0,
          weekly_active_users: 0,
          monthly_active_users: 0,
          avg_session_duration: '0m',
          total_revenue: 0,
          avg_invoice_value: 0,
          payment_success_rate: 0,
          businesses_with_invoices: 0,
          top_businesses: []
        };
      }
    },
    staleTime: 60000, // 1 minute
    cacheTime: 300000, // 5 minutes
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Backend Error Banner */}
      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Analytics Endpoint Unavailable</p>
                <p className="text-sm text-amber-700 mt-1">
                  The analytics endpoint is not yet implemented. Showing placeholder data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-purple-600" />
          Analytics & Insights
        </h1>
        <p className="text-gray-600 mt-1">System-wide analytics and performance metrics</p>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">User Growth</CardTitle>
            <Users className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">+{analytics?.user_growth || 0}%</div>
            <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Business Growth</CardTitle>
            <Building2 className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">+{analytics?.business_growth || 0}%</div>
            <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Growth</CardTitle>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">+{analytics?.revenue_growth || 0}%</div>
            <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Rate</CardTitle>
            <Activity className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{analytics?.active_rate || 0}%</div>
            <p className="text-xs text-gray-600 mt-1">User engagement</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Activity Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Daily Active Users</span>
                <span className="font-semibold">{analytics?.daily_active_users || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Weekly Active Users</span>
                <span className="font-semibold">{analytics?.weekly_active_users || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monthly Active Users</span>
                <span className="font-semibold">{analytics?.monthly_active_users || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Session Duration</span>
                <span className="font-semibold">{analytics?.avg_session_duration || '0m'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="font-semibold">KES {analytics?.total_revenue?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Invoice Value</span>
                <span className="font-semibold">KES {analytics?.avg_invoice_value?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Payment Success Rate</span>
                <span className="font-semibold">{analytics?.payment_success_rate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Businesses with Active Invoices</span>
                <span className="font-semibold">{analytics?.businesses_with_invoices || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(analytics?.top_businesses || []).map((business, index) => (
              <div key={business.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{business.name}</div>
                    <div className="text-xs text-gray-600">{business.industry}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">KES {business.revenue?.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">{business.transactions} transactions</div>
                </div>
              </div>
            ))}
            {(!analytics?.top_businesses || analytics.top_businesses.length === 0) && (
              <div className="text-center text-gray-500 py-8">No data available</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
