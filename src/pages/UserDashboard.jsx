import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, Users, CheckCircle, Clock, 
  Sparkles, Plus, ArrowRight, Building2, User, Briefcase, Mail, Phone, MapPin, Calendar, DollarSign, TrendingUp, Receipt
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton, CardSkeleton } from '../components/ui/skeleton';
import OnboardingWizard from '../components/onboarding/OnboardingWizard';
import EmptyState from '../components/ui/EmptyState';
import QuickActions from '../components/QuickActions';
import GettingStartedBanner from '../components/GettingStartedBanner';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function UserDashboard() {
  const { user, getBusinesses, activeBusinessId } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      return await apiClient.me();
    },
    enabled: !!user
  });

  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError } = useQuery({
    queryKey: ['user-dashboard', businessId],
    queryFn: async () => {
      try {
        const url = businessId 
          ? `/users/user/dashboard/${businessId}/`
          : '/users/user/dashboard/';
        return await apiClient.request(url);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        // Return empty data structure instead of throwing
        return {
          business: null,
          my_work: {},
          recent_transactions: []
        };
      }
    },
    enabled: !!user && !!businessId,
    retry: false
  });

  const { data: customersData = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', businessId],
    queryFn: async () => {
      try {
        const params = businessId ? { business: businessId } : {};
        return await apiClient.request(`/users/customers/${params ? '?' + new URLSearchParams(params).toString() : ''}`);
      } catch (error) {
        console.error('Customers data fetch error:', error);
        return [];
      }
    },
    enabled: !!businessId,
    retry: false
  });

  const isLoading = isLoadingUser || isLoadingDashboard || isLoadingCustomers;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const business = dashboardData?.business || businesses[0];
  const myWork = dashboardData?.my_work || {};
  const recentTransactions = dashboardData?.recent_transactions || [];

  return (
    <div className="space-y-6 p-4 md:p-8 bg-white min-h-screen">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {dashboardError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Some dashboard data may be unavailable. You can still add transactions, invoices, and customers using the buttons below.
          </p>
        </div>
      )}

      {/* Getting Started Banner */}
      {!showOnboarding && <GettingStartedBanner />}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {userData?.first_name || user?.username || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {business?.name || 'Your Dashboard'}
            {business?.role && <span className="ml-2 text-sm text-gray-500">({business.role})</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Link to="/voice-assistant">
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">KAVI Assistant</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* My Work Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">My Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{myWork.invoices || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {myWork.pending_tasks || 0} pending tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">My Customers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{myWork.customers || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Onboarded</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Business Info</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-gray-900 truncate">{business?.name || 'N/A'}</div>
            <p className="text-xs text-gray-500 mt-1">Your role: {business?.role || 'member'}</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Profile</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-gray-900 truncate">
              {userData?.first_name} {userData?.last_name}
            </div>
            <p className="text-xs text-gray-500 mt-1">{userData?.email}</p>
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
            {recentTransactions.length > 0 && (
              <Button variant="outline" size="sm" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Link to="/transactions">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{tx.description || 'No description'}</p>
                    <p className="text-xs text-gray-500">{tx.category || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.transaction_type === 'income' ? '+' : '-'}{tx.currency || 'KES'} {parseFloat(tx.amount || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState type="transactions" />
          )}
        </CardContent>
      </Card>

      {/* Recent Customers */}
      {customersData.length > 0 ? (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Recent Customers</CardTitle>
              <Button variant="outline" size="sm" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Link to="/clients">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customersData.slice(0, 3).map((customer) => (
                <Card key={customer.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription>{customer.company_name || 'Individual Customer'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState type="customers" />
      )}
    </div>
  );
}
