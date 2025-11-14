import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  AlertCircle,
  ArrowRight,
  Sparkles,
  UserPlus,
  Upload,
  FileText,
  Users,
  CheckCircle,
  Activity,
  BarChart3,
  PlusCircle,
  Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import EmptyState from "../components/ui/EmptyState";
import QuickActions from "../components/QuickActions";
import GettingStartedBanner from "../components/GettingStartedBanner";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, getBusinesses, activeBusinessId } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const formatKes = (value) => {
    try {
      return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch {
      return `KES ${Number(value || 0).toLocaleString()}`;
    }
  };

  // Check if onboarding should be shown
  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem('onboarding_completed');
      const userCreated = new Date(user.date_joined || user.created_at);
      const daysSinceJoin = (Date.now() - userCreated.getTime()) / (1000 * 60 * 60 * 24);
      
      // Show onboarding if not completed and user joined in last 7 days
      if (!completed && daysSinceJoin < 7) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Fetch dashboard data from the API endpoint
  const { data: dashboardData, isLoading: loadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['user-dashboard', businessId],
    queryFn: async () => {
      try {
        const url = businessId 
          ? `/users/user/dashboard/${businessId}/`
          : '/users/user/dashboard/';
        const response = await apiClient.request(url);
        console.log('Dashboard data response:', response);
        return response;
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        return {
          business: null,
          my_work: {
            invoices: 0,
            pending_tasks: 0,
            customers: 0
          },
          recent_transactions: [],
          message: 'No business assigned yet. Please contact your administrator.'
        };
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - cache for 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache
    refetchOnMount: false, // Use cache, don't refetch on mount
    refetchOnWindowFocus: false // Use cache, don't refetch on focus
  });

  // Handle loading states
  if (loadingDashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const business = dashboardData?.business || businesses[0];
  const myWork = dashboardData?.my_work || {
    invoices: 0,
    pending_tasks: 0,
    customers: 0
  };
  const recentTransactions = dashboardData?.recent_transactions || [];

  const quickActions = [
    {
      title: 'Add Transaction',
      description: 'Create a new financial transaction',
      icon: PlusCircle,
      path: '/transactions?action=create',
      color: 'green'
    },
    {
      title: 'Create Invoice',
      description: 'Generate a new invoice',
      icon: FileText,
      path: '/invoices?action=create',
      color: 'blue'
    },
    {
      title: 'Add Client',
      description: 'Register a new client',
      icon: Users,
      path: '/clients?action=create',
      color: 'purple'
    }
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Hero Header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 bg-white/20 rounded-lg grid place-items-center">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Business Dashboard</h1>
            </div>
            <p className="text-white/80">
              {business?.name ? `Welcome to ${business.name}` : 'Welcome to your business dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="bg-white/20 text-white px-3 py-1 border-white/30">
              <Activity className="w-3 h-3 mr-1" />
              {business?.role ? business.role.charAt(0).toUpperCase() + business.role.slice(1) : 'Active'}
            </Badge>
            <Button onClick={() => navigate('/transactions?action=create')} className="bg-white text-blue-700 hover:bg-blue-50">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
            <Button onClick={() => navigate('/invoices?action=create')} className="bg-white/10 border border-white/30 text-white hover:bg-white/20">
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>
      </div>
      {/* Local compliance & payments setup (Kenya-first) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-blue-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">M-Pesa for Business</p>
              <p className="text-sm text-gray-600 mt-1">Connect Lipa na M-Pesa to auto-reconcile collections and settle faster.</p>
            </div>
            <Badge variant="secondary" className="text-xs">Recommended</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={() => navigate('/settings')} className="bg-blue-600 hover:bg-blue-700 text-white">
              Connect M-Pesa
            </Button>
            <Button variant="outline" onClick={() => navigate('/transactions')} className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Reconcile Payments
            </Button>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-700">KRA eTIMS Readiness</p>
              <p className="text-sm text-gray-600 mt-1">Generate compliant e-invoices and stay tax-ready with automated guidance.</p>
            </div>
            <Badge variant="secondary" className="text-xs">New</Badge>
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => navigate('/invoices')} className="border-amber-600 text-amber-700 hover:bg-amber-50">
              Create e-Invoice
            </Button>
            <Button onClick={() => navigate('/voice-assistant')} className="bg-amber-600 hover:bg-amber-700 text-white">
              Ask KAVI
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {dashboardError && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {dashboardData?.message || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* No Business Message */}
      {!business && dashboardData?.message && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {dashboardData.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Getting Started Banner */}
      {!showOnboarding && <GettingStartedBanner />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Invoices Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Invoices</CardTitle>
            <FileText className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{myWork.invoices || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Total invoices
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Tasks</CardTitle>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{myWork.pending_tasks || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Awaiting action
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* My Customers Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/clients')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">My Customers</CardTitle>
            <Users className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{myWork.customers || 0}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Total customers
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Business Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Business</CardTitle>
            <Building2 className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-900 truncate">{business?.name || 'N/A'}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                {business?.role || 'Member'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot (Kenya-specific currency) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              This Month Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const monthTx = recentTransactions.filter(t => {
                const d = t.transaction_date ? new Date(t.transaction_date) : null;
                const now = new Date();
                return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              });
              const income = monthTx.filter(t => (t.transaction_type || '') === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
              const expenses = monthTx.filter(t => (t.transaction_type || '') === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
              const net = income - expenses;
              const avgTicket = monthTx.length ? (income + expenses) / monthTx.length : 0;
              return (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Income</span>
                    <span className="font-semibold text-emerald-700">{formatKes(income)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Expenses</span>
                    <span className="font-semibold text-red-600">{formatKes(expenses)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Net</span>
                    <span className={`font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatKes(net)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Avg. Ticket</span>
                    <span className="font-semibold text-gray-900">{formatKes(avgTicket)}</span>
                  </div>
                </>
              );
            })()}
            <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50" onClick={() => navigate('/cashflow')}>
              View Cash Flow
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Growth Tips by KAVI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 text-blue-800 text-sm">Automate M-Pesa reconciliation to reduce leakages and speed up month-end close.</div>
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm">Offer early payment discounts to improve cash conversion and reduce DSO.</div>
              <div className="p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">Adopt KRA eTIMS e-invoices to stay compliant and build lender confidence.</div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-800 text-sm">Use invoice reminders to reduce overdue amounts and improve working capital.</div>
            </div>
            <div className="mt-3">
              <Button onClick={() => navigate('/voice-assistant')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Ask KAVI for a Growth Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Business Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              My Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Invoices</span>
              <span className="font-semibold text-gray-900">{myWork.invoices || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Pending Tasks</span>
              <span className="font-semibold text-gray-900">{myWork.pending_tasks || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Customers</span>
              <span className="font-semibold text-gray-900">{myWork.customers || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.transaction_type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.transaction_type === 'income' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description || 'No description'}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}KES {transaction.amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState 
                type="transactions"
                primaryAction={{
                  label: "Add Transaction",
                  icon: PlusCircle,
                  path: "/transactions"
                }}
              />
            )}
            {recentTransactions.length > 0 && (
              <Button
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="w-full mt-2"
              >
                View All Transactions
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Business Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Business Name</span>
              <span className="font-semibold text-gray-900 truncate max-w-[150px]">{business?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Your Role</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                {business?.role || 'Member'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Status</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}


