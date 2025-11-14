import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { queryClient } from '../lib/queryClient';
import apiClient from '../lib/apiClient';

/**
 * Comprehensive hook that aggregates ALL available frontend data for KAVI
 * Uses React Query cache first, only fetches if needed
 * This avoids DB calls by using data already loaded in the UI
 */
export function useKaviData() {
  const { user, activeBusinessId, getBusinesses } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;

  // Get all cached data from React Query
  const getCachedData = (queryKey, fallbackFn) => {
    const cached = queryClient.getQueryData(queryKey);
    if (cached) return cached;
    
    // Return a promise that will be resolved when data is available
    // This allows KAVI to use data that's being fetched elsewhere
    return null;
  };

  // Try to get dashboard data from cache
  const dashboardQueryKey = businessId 
    ? ['user-dashboard', businessId]
    : ['user-dashboard'];
  
  const cachedDashboard = getCachedData(dashboardQueryKey);
  
  // Try to get transactions from cache
  const transactionsQueryKey = businessId 
    ? ['transactions', businessId]
    : ['transactions'];
  const cachedTransactions = getCachedData(transactionsQueryKey);

  // Try to get invoices from cache
  const invoicesQueryKey = businessId 
    ? ['invoices', businessId]
    : ['invoices'];
  const cachedInvoices = getCachedData(invoicesQueryKey);

  // Try to get customers from cache
  const customersQueryKey = businessId 
    ? ['customers', businessId]
    : ['customers'];
  const cachedCustomers = getCachedData(customersQueryKey);

  // Try to get suppliers from cache
  const suppliersQueryKey = businessId 
    ? ['suppliers', businessId]
    : ['suppliers'];
  const cachedSuppliers = getCachedData(suppliersQueryKey);

  // Try to get cash flow from cache
  const cashFlowQueryKey = businessId 
    ? ['cash-flow', businessId]
    : ['cash-flow'];
  const cachedCashFlow = getCachedData(cashFlowQueryKey);

  // Get all query cache entries related to this business
  const getAllCachedBusinessData = () => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    
    // Filter queries related to current business
    const businessQueries = allQueries.filter(query => {
      const key = query.queryKey;
      if (Array.isArray(key)) {
        return key.includes(businessId) || 
               key.includes('dashboard') ||
               key.includes('transactions') ||
               key.includes('invoices') ||
               key.includes('customers') ||
               key.includes('suppliers');
      }
      return false;
    });

    // Extract data from queries
    const data = {};
    businessQueries.forEach(query => {
      const key = query.queryKey.join('-');
      data[key] = query.state.data;
    });

    return data;
  };

  // Build comprehensive financial context from ALL available cache
  const buildContextFromCache = () => {
    const allCached = getAllCachedBusinessData();
    
    // Use cached dashboard if available
    const dashboard = cachedDashboard || 
                     allCached['user-dashboard'] ||
                     allCached[`user-dashboard-${businessId}`];

    // Use cached transactions
    const transactions = cachedTransactions || 
                         allCached['transactions'] ||
                         allCached[`transactions-${businessId}`] ||
                         [];

    // Use cached invoices
    const invoices = cachedInvoices || 
                    allCached['invoices'] ||
                    allCached[`invoices-${businessId}`] ||
                    [];

    // Use cached customers
    const customers = cachedCustomers || 
                     allCached['customers'] ||
                     allCached[`customers-${businessId}`] ||
                     [];

    // Use cached suppliers
    const suppliers = cachedSuppliers || 
                     allCached['suppliers'] ||
                     allCached[`suppliers-${businessId}`] ||
                     [];

    // Use cached cash flow
    const cashFlow = cachedCashFlow || 
                    allCached['cash-flow'] ||
                    allCached[`cash-flow-${businessId}`];

    // Calculate metrics from cached transactions
    const now = new Date();
    const last7Days = transactions.filter(t => {
      if (!t || !t.transaction_date) return false;
      const tDate = new Date(t.transaction_date);
      return (now - tDate) / (1000 * 60 * 60 * 24) <= 7;
    });

    const last30Days = transactions.filter(t => {
      if (!t || !t.transaction_date) return false;
      const tDate = new Date(t.transaction_date);
      return (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
    });

    const weekIncome = last7Days
      .filter(t => t.transaction_type === 'income' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const weekExpenses = last7Days
      .filter(t => t.transaction_type === 'expense' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const monthIncome = last30Days
      .filter(t => t.transaction_type === 'income' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    
    const monthExpenses = last30Days
      .filter(t => t.transaction_type === 'expense' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Process invoices from cache
    const overdueInvoices = invoices.filter(i => 
      i.status === 'overdue' || 
      (i.due_date && new Date(i.due_date) < now && i.status !== 'paid')
    );
    
    const pendingInvoices = invoices.filter(i => 
      i.status === 'sent' || i.status === 'pending'
    );

    return {
      // User info
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_superuser: user.is_superuser || false,
      } : null,

      // Business info
      business: businesses[0] || null,
      businesses: businesses,
      businessId: businessId,

      // Dashboard data (from cache)
      dashboard: dashboard,

      // Financial metrics (calculated from cache)
      last7Days: {
        income: weekIncome,
        expenses: weekExpenses,
        net: weekIncome - weekExpenses,
        transactionCount: last7Days.length,
      },
      last30Days: {
        income: monthIncome,
        expenses: monthExpenses,
        net: monthIncome - monthExpenses,
        transactionCount: last30Days.length,
      },

      // Invoices (from cache)
      invoices: {
        total: invoices.length,
        overdue: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((s, i) => s + (parseFloat(i.total_amount || i.amount || 0)), 0),
        pending: pendingInvoices.length,
        pendingAmount: pendingInvoices.reduce((s, i) => s + (parseFloat(i.total_amount || i.amount || 0)), 0),
        all: invoices,
      },

      // Transactions (from cache)
      transactions: {
        total: transactions.length,
        last7Days: last7Days.length,
        last30Days: last30Days.length,
        recent: transactions.slice(0, 10),
        all: transactions,
      },

      // Customers (from cache)
      customers: {
        total: customers.length,
        all: customers,
      },

      // Suppliers (from cache)
      suppliers: {
        total: suppliers.length,
        all: suppliers,
      },

      // Cash flow (from cache)
      cashFlow: cashFlow,

      // Metadata
      timestamp: new Date().toISOString(),
      source: 'cache', // Indicates this came from cache, not DB
    };
  };

  return {
    context: buildContextFromCache(),
    isLoading: false, // Always instant since we're using cache
    refresh: () => {
      // Invalidate queries to force refresh if needed
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['user-dashboard', businessId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId] });
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
      }
    },
    getAllCachedData: getAllCachedBusinessData,
  };
}

