import React from "react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, getBusinesses, activeBusinessId } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;

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
    staleTime: 30000, // 30 seconds
    cacheTime: 300000, // 5 minutes
    refetchOnWindowFocus: false
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Business Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            {business?.name ? `Welcome to ${business.name}` : 'Welcome to your business dashboard'}
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          {business?.role ? business.role.charAt(0).toUpperCase() + business.role.slice(1) : 'Active'}
        </Badge>
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              red: 'bg-red-50 text-red-600 hover:bg-red-100',
              orange: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
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
              <div className="text-center py-4 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent transactions</p>
              </div>
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
  );
}


