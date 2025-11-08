import React, { useState } from "react";
import base44 from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  PlusCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Receipt,
  AlertCircle,
  ArrowRight,
  Activity,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiClient } from "@/lib/apiClient";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DataEntryDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        return await apiClient.getUserProfile();
      } catch (error) {
        return null;
      }
    }
  });

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: () => base44.entities.Transaction.list('-transaction_date', 20),
    initialData: []
  });

  const { data: invoices = [], isLoading: loadingInvoices } = useQuery({
    queryKey: ['recent-invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 10),
    initialData: []
  });

  // Calculate stats for data entry user
  const stats = {
    totalTransactions: transactions.length,
    pendingTransactions: transactions.filter(t => !t.id).length,
    totalInvoices: invoices.length,
    pendingInvoices: invoices.filter(i => i.status === 'sent').length,
    todayEntries: transactions.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return t.transaction_date?.startsWith(today);
    }).length
  };

  // Handle loading states
  if (loadingTransactions || loadingInvoices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

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
      title: 'Import Invoices',
      description: 'Bulk import invoices from file',
      icon: Upload,
      path: '/invoices?action=import',
      color: 'purple'
    },
    {
      title: 'Add Client',
      description: 'Register a new client',
      icon: PlusCircle,
      path: '/clients?action=create',
      color: 'orange'
    }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Data Entry Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage and input financial data</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 px-3 py-1">
          <Activity className="w-3 h-3 mr-1" />
          System Operational
        </Badge>
      </div>

      {showSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Operation completed successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Entries Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/transactions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Entries</CardTitle>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.todayEntries}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Transactions added today
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Transactions Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/transactions')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
            <DollarSign className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                All time entries
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invoices Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Invoices</CardTitle>
            <Receipt className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.pendingInvoices}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                Awaiting processing
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Invoices Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/invoices')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoices</CardTitle>
            <FileText className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalInvoices}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                All invoices
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

      {/* Data Entry Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length > 0 ? (
              <>
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description || 'No description'}</p>
                        <p className="text-xs text-gray-500">
                          {transaction.party_name || 'N/A'} • {transaction.category || 'Uncategorized'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}KES {transaction.amount?.toLocaleString() || '0'}
                      </p>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => navigate('/transactions')}
                  variant="outline"
                  className="w-full mt-2"
                >
                  View All Transactions
                </Button>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Entry Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Today's Entries</span>
              <span className="font-semibold text-gray-900">{stats.todayEntries}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="font-semibold text-gray-900">
                {transactions.filter(t => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return t.transaction_date && new Date(t.transaction_date) >= weekAgo;
                }).length}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="font-semibold text-gray-900">
                {transactions.filter(t => {
                  const now = new Date();
                  const month = now.getMonth();
                  const year = now.getFullYear();
                  return t.transaction_date && new Date(t.transaction_date).getMonth() === month && new Date(t.transaction_date).getFullYear() === year;
                }).length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Pending Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.pendingInvoices > 0 || stats.pendingTransactions > 0 ? (
              <>
                {stats.pendingInvoices > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Pending Invoices</span>
                    <Badge variant="destructive">{stats.pendingInvoices}</Badge>
                  </div>
                )}
                {stats.pendingTransactions > 0 && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Pending Transactions</span>
                    <Badge variant="destructive">{stats.pendingTransactions}</Badge>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  All Processed
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
