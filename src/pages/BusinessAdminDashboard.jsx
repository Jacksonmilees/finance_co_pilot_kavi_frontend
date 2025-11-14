import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt,
  Users, AlertCircle, FileText, Sparkles, Settings, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { CardSkeleton, Skeleton } from '../components/ui/skeleton';
import QuickActions from '../components/QuickActions';
import GettingStartedBanner from '../components/GettingStartedBanner';

export default function BusinessAdminDashboard() {
  const { businessId } = useParams();
  const { isBusinessAdmin, getBusinesses } = useAuth();
  const businesses = getBusinesses();
  const activeBusinessId = businessId || businesses[0]?.id;
  const formatKes = (value) => {
    try {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch {
      return `KES ${Number(value || 0).toLocaleString()}`;
    }
  };

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['business-admin-dashboard', activeBusinessId],
    queryFn: async () => {
      try {
        const response = await apiClient.request(`/users/business/${activeBusinessId}/dashboard/`);
        return response;
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        throw err;
      }
    },
    enabled: !!activeBusinessId && isBusinessAdmin(activeBusinessId),
    retry: 1,
    staleTime: 30000
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!activeBusinessId) {
    return (
      <div className="p-6">
        <Card className="border border-yellow-200">
          <CardContent className="p-6">
            <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="text-yellow-600 font-medium">No business found. Please contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isBusinessAdmin(activeBusinessId)) {
    return (
      <div className="p-6">
        <Card className="border border-red-200">
          <CardContent className="p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <p className="text-red-600 font-medium">Access denied. Business Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border border-red-200">
          <CardContent className="p-6">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <p className="text-red-600 font-medium">Error loading dashboard: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 hover:bg-blue-700">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Getting Started Banner */}
      <GettingStartedBanner />

      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-lg grid place-items-center">
                <Building2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Business Dashboard</h1>
            </div>
            <p className="text-white/80">{stats?.business?.name || 'Business Overview'}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild className="bg-white/10 border border-white/30 text-white hover:bg-white/20">
              <Link to="/voice-assistant">
                <Sparkles className="w-4 h-4 mr-2" />
                KAVI Assistant
              </Link>
            </Button>
            <Button asChild className="bg-white/10 border border-white/30 text-white hover:bg-white/20">
              <Link to={`/business/${activeBusinessId}/team`}>
                <Users className="w-4 h-4 mr-2" />
                Manage Team
              </Link>
            </Button>
            <Button asChild className="bg-white text-blue-700 hover:bg-blue-50">
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
      {/* Kenya-first compliance & payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Connect M-Pesa (Lipa na M-Pesa)</p>
              <p className="text-sm text-gray-600 mt-1">Enable automatic reconciliation and channel-level insights.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => window.location.assign('/settings')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Connect Now
            </Button>
            <Button variant="outline" onClick={() => window.location.assign('/transactions')} className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Review Reconciliation
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">KRA eTIMS Compliance</p>
              <p className="text-sm text-gray-600 mt-1">Generate e-invoices and keep your books tax-ready.</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => window.location.assign('/invoices')} className="border-amber-600 text-amber-700 hover:bg-amber-50">
              Create e-Invoice
            </Button>
            <Button onClick={() => window.location.assign('/voice-assistant')} className="bg-amber-600 hover:bg-amber-700 text-white">
              Ask KAVI
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatKes(stats?.financial?.total_income || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatKes(stats?.financial?.total_expenses || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(stats?.financial?.net_profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatKes(stats?.financial?.net_profit || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Team Size</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats?.team?.size || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active members</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Invoices Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Invoices</span>
                <span className="font-semibold text-gray-900">{stats?.invoices?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Paid</span>
                <span className="font-semibold text-green-600">{stats?.invoices?.paid || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{stats?.invoices?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overdue</span>
                <span className="font-semibold text-red-600">
                  {stats?.invoices?.overdue?.count || 0} ({formatKes(stats?.invoices?.overdue?.amount || 0)})
                </span>
              </div>
            </div>
            <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link to="/invoices">
                <Receipt className="w-4 h-4 mr-2" />
                Manage Invoices
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Customers & Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Customers</span>
                <span className="font-semibold text-gray-900">{stats?.customers?.total || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Budget Utilization</span>
                <span className={`font-semibold ${parseFloat(stats?.budgets?.utilization_percent || 0) > 80 ? 'text-red-600' : 'text-green-600'}`}>
                  {parseFloat(stats?.budgets?.utilization_percent || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Budgeted</span>
                <span className="font-semibold text-gray-900">
                  {formatKes(stats?.budgets?.total_budgeted || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="font-semibold text-gray-900">
                  {formatKes(stats?.budgets?.total_spent || 0)}
                </span>
              </div>
            </div>
            <Button className="w-full mt-4 border-blue-600 text-blue-600 hover:bg-blue-50" variant="outline" asChild>
              <Link to="/clients">
                <Users className="w-4 h-4 mr-2" />
                Manage Customers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Transactions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900">Recent Transactions</CardTitle>
            <Button variant="outline" size="sm" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Link to="/transactions">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recent_transactions?.length > 0 ? (
            <>
              <div className="space-y-3">
                {stats.recent_transactions.slice(0, 10).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{tx.description || 'No description'}</p>
                      <p className="text-xs text-gray-500">{tx.category || 'Uncategorized'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.transaction_type === 'income' ? '+' : '-'}{formatKes(tx.amount || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>No transactions yet</p>
              <Button asChild variant="outline" className="mt-4 border-blue-600 text-blue-600 hover:bg-blue-50">
                <Link to="/transactions">Add Your First Transaction</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
