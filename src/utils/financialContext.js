// Financial context utilities for voice assistant
import base44 from '../api/base44Client';
import apiClient from '../lib/apiClient';
import { queryClient } from '../lib/queryClient';

/**
 * Build financial context for system prompts
 * Uses cached data from React Query FIRST - avoids DB calls
 * Only fetches if absolutely necessary (data not in cache)
 */
export async function buildFinancialContext() {
  try {
    // Get authenticated user with full profile data
    const user = await base44.auth.me().catch(() => null);
    
    if (!user || !user.id) {
      console.error('⚠️ KAVI: No authenticated user found');
      return {
        business: { business_name: 'SME' },
        transactions: [],
        invoices: [],
        last7Days: { income: 0, expenses: 0, net: 0 },
        last30Days: { income: 0, expenses: 0, net: 0 },
        invoices: { overdue: 0, pending: 0, overdueAmount: 0, pendingAmount: 0, totalOutstanding: 0 }
      };
    }
    
    const currentUserId = user.id; // Store current user ID for filtering
    
    console.log('✅ KAVI: Building context for user:', {
      id: user.id,
      name: user.full_name || user.username,
      email: user.email
    });
    
    // Get all businesses the user has access to
    const businesses = await base44.entities.Business.list().catch(() => []);
    
    // Determine active business (prefer business_admin role)
    let activeBusiness = businesses.find(b => b.role === 'business_admin') || businesses[0] || null;
    const businessId = activeBusiness?.id;
    
    // Get user's role in the active business
    const userRole = activeBusiness?.role || 'owner';

    // PRIORITY 1: Try to get ALL data from React Query cache first
    // This is what the user sees in the UI - use it directly!
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    
    // Find all cached queries related to this business
    const businessQueries = allQueries.filter(query => {
      const key = query.queryKey;
      if (Array.isArray(key)) {
        return (businessId && key.includes(businessId)) || 
               key.includes('dashboard') ||
               key.includes('transactions') ||
               key.includes('invoices') ||
               key.includes('customers') ||
               key.includes('suppliers') ||
               key.includes('cash-flow');
      }
      return false;
    });

    // Extract cached data
    let dashboardData = null;
    let transactions = [];
    let invoices = [];
    let customers = [];
    let suppliers = [];
    let cashFlow = null;

    businessQueries.forEach(query => {
      const key = query.queryKey;
      const data = query.state.data;
      
      if (!data) return;
      
      // Match dashboard data
      if (key.includes('dashboard') || key.includes('user-dashboard')) {
        dashboardData = data;
      }
      
      // Match transactions
      if (key.includes('transactions')) {
        if (Array.isArray(data)) {
          transactions = data;
        } else if (data.results) {
          transactions = data.results;
        } else if (data.transactions) {
          transactions = data.transactions;
        }
      }
      
      // Match invoices
      if (key.includes('invoices')) {
        if (Array.isArray(data)) {
          invoices = data;
        } else if (data.results) {
          invoices = data.results;
        } else if (data.invoices) {
          invoices = data.invoices;
        }
      }
      
      // Match customers
      if (key.includes('customers') || key.includes('clients')) {
        if (Array.isArray(data)) {
          customers = data;
        } else if (data.results) {
          customers = data.results;
        }
      }
      
      // Match suppliers
      if (key.includes('suppliers')) {
        if (Array.isArray(data)) {
          suppliers = data;
        } else if (data.results) {
          suppliers = data.results;
        }
      }
      
      // Match cash flow
      if (key.includes('cash-flow')) {
        cashFlow = data;
      }
    });

    // Convert user ID to string early for consistent comparison
    const currentUserIdStr = String(currentUserId);
    
    // PRIORITY 2: Try direct cache lookup (faster) - use user-specific cache keys
    if (!dashboardData) {
      dashboardData = queryClient.getQueryData(['user-dashboard', businessId, currentUserId]) ||
                     queryClient.getQueryData(['user-dashboard', businessId]) ||
                     queryClient.getQueryData(['user-dashboard']);
    }
    
    if (transactions.length === 0) {
      // Try user-specific cache first
      const cached = queryClient.getQueryData(['transactions', businessId, currentUserId]) ||
                    queryClient.getQueryData(['transactions', businessId]) ||
                    queryClient.getQueryData(['transactions']);
      if (cached) {
        const txArray = Array.isArray(cached) ? cached : (cached.results || cached.transactions || []);
        // Filter by user ID immediately
        transactions = txArray.filter(t => {
          const txUserId = t.user || t.user_id || t.user?.id;
          return txUserId && String(txUserId) === currentUserIdStr;
        });
      }
    }
    
    if (invoices.length === 0) {
      // Try user-specific cache first
      const cached = queryClient.getQueryData(['invoices', businessId, currentUserId]) ||
                    queryClient.getQueryData(['invoices', businessId]) ||
                    queryClient.getQueryData(['invoices']);
      if (cached) {
        const invArray = Array.isArray(cached) ? cached : (cached.results || cached.invoices || []);
        // Filter by user ID immediately
        invoices = invArray.filter(i => {
          const invUserId = i.user || i.user_id || i.user?.id;
          return invUserId && String(invUserId) === currentUserIdStr;
        });
      }
    }

    // PRIORITY 3: Only fetch if NOT in cache (avoid DB calls)
    // This should rarely happen if user has visited dashboard/pages
    if (!dashboardData && businessId) {
      console.log('⚠️ Dashboard data not in cache, fetching...');
      try {
        dashboardData = await apiClient.request(`/users/user/dashboard/${businessId}/`);
        // Cache it for next time
        queryClient.setQueryData(['user-dashboard', businessId], dashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    }

    if (transactions.length === 0 && businessId) {
      console.log('⚠️ Transactions not in cache, fetching...');
      try {
        const fetched = await apiClient.getTransactions({ business: businessId }).catch(() => []);
        const txArray = Array.isArray(fetched) ? fetched : (fetched.results || fetched.transactions || []);
        // Filter by user ID before caching
        transactions = txArray.filter(t => {
          const txUserId = t.user || t.user_id || t.user?.id;
          return txUserId && String(txUserId) === currentUserIdStr;
        });
        // Cache with user-specific key
        queryClient.setQueryData(['transactions', businessId, currentUserId], transactions);
        queryClient.setQueryData(['transactions', businessId], transactions); // Also cache without user ID for backward compatibility
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
        transactions = [];
      }
    }
    
    if (invoices.length === 0 && businessId) {
      console.log('⚠️ Invoices not in cache, fetching...');
      try {
        const fetched = await apiClient.getInvoices({ business: businessId }).catch(() => []);
        const invArray = Array.isArray(fetched) ? fetched : (fetched.results || fetched.invoices || []);
        // Filter by user ID before caching
        invoices = invArray.filter(i => {
          const invUserId = i.user || i.user_id || i.user?.id;
          return invUserId && String(invUserId) === currentUserIdStr;
        });
        // Cache with user-specific key
        queryClient.setQueryData(['invoices', businessId, currentUserId], invoices);
        queryClient.setQueryData(['invoices', businessId], invoices); // Also cache without user ID for backward compatibility
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
        invoices = [];
      }
    }

    const now = new Date();
    
    // Calculate date ranges
    // CRITICAL: Filter transactions and invoices by current user ID
    // Only show data belonging to the logged-in user
    // currentUserIdStr is already defined above
    const userIdStr = user?.id ? String(user.id) : null;
    
    // ALWAYS filter by user ID - even if data was already filtered, double-check
    const userTransactions = transactions.filter(t => {
      // Check if transaction belongs to current user
      // Handle multiple possible field names and formats
      const transactionUserId = t.user || t.user_id || t.user?.id;
      if (!transactionUserId) {
        console.warn('⚠️ Transaction missing user ID:', t.id);
        return false; // No user ID means it doesn't belong to anyone
      }
      
      // Convert to string for comparison
      const txUserIdStr = String(transactionUserId);
      
      // Match if it belongs to current user
      const matches = txUserIdStr === currentUserIdStr || (userIdStr && txUserIdStr === userIdStr);
      if (!matches) {
        console.warn('⚠️ Transaction belongs to different user:', {
          transactionId: t.id,
          transactionUserId: txUserIdStr,
          currentUserId: currentUserIdStr
        });
      }
      return matches;
    });
    
    const userInvoices = invoices.filter(i => {
      // Check if invoice belongs to current user
      // Handle multiple possible field names and formats
      const invoiceUserId = i.user || i.user_id || i.user?.id;
      if (!invoiceUserId) {
        console.warn('⚠️ Invoice missing user ID:', i.id);
        return false; // No user ID means it doesn't belong to anyone
      }
      
      // Convert to string for comparison
      const invUserIdStr = String(invoiceUserId);
      
      // Match if it belongs to current user
      const matches = invUserIdStr === currentUserIdStr || (userIdStr && invUserIdStr === userIdStr);
      if (!matches) {
        console.warn('⚠️ Invoice belongs to different user:', {
          invoiceId: i.id,
          invoiceUserId: invUserIdStr,
          currentUserId: currentUserIdStr
        });
      }
      return matches;
    });
    
    // Log for debugging
    console.log('🔍 KAVI Data Filtering:', {
      totalTransactions: transactions.length,
      userTransactions: userTransactions.length,
      totalInvoices: invoices.length,
      userInvoices: userInvoices.length,
      currentUserId: currentUserIdStr,
      userId: userIdStr,
      filteredOutTransactions: transactions.length - userTransactions.length,
      filteredOutInvoices: invoices.length - userInvoices.length
    });
    
    const last7Days = userTransactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return (now - tDate) / (1000 * 60 * 60 * 24) <= 7;
    });
    
    const last30Days = userTransactions.filter(t => {
      const tDate = new Date(t.transaction_date);
      return (now - tDate) / (1000 * 60 * 60 * 24) <= 30;
    });

    // Calculate metrics
    // Handle both 'type' and 'transaction_type' fields
    const weekIncome = last7Days.filter(t => {
      const txType = t.type || t.transaction_type;
      return txType === 'income' || txType === 'INCOME';
    }).reduce((sum, t) => sum + (t.amount || 0), 0);
    const weekExpenses = last7Days.filter(t => {
      const txType = t.type || t.transaction_type;
      return txType === 'expense' || txType === 'EXPENSE' || txType === 'expenses';
    }).reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthIncome = last30Days.filter(t => {
      const txType = t.type || t.transaction_type;
      return txType === 'income' || txType === 'INCOME';
    }).reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthExpenses = last30Days.filter(t => {
      const txType = t.type || t.transaction_type;
      return txType === 'expense' || txType === 'EXPENSE' || txType === 'expenses';
    }).reduce((sum, t) => sum + (t.amount || 0), 0);

    const overdueInvoices = userInvoices.filter(i => i.status === 'overdue');
    const pendingInvoices = userInvoices.filter(i => i.status === 'sent');
    const totalOutstanding = [...overdueInvoices, ...pendingInvoices].reduce((sum, i) => sum + (i.total_amount || 0), 0);

    return {
      business: activeBusiness || { business_name: 'SME' },
      user: user ? {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name || user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_superuser: user.is_superuser || false,
      } : { full_name: 'Business Owner' },
      role: userRole,
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.legal_name || b.business_name || b.name,
        role: b.role,
      })),
      dashboardData: dashboardData, // Include raw dashboard data
      customers: customers, // Include customers from cache
      suppliers: suppliers, // Include suppliers from cache
      cashFlow: cashFlow, // Include cash flow from cache
      dataSource: transactions.length > 0 || invoices.length > 0 ? 'cache' : 'api', // Track data source
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
      invoices: {
        overdue: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
        pending: pendingInvoices.length,
        pendingAmount: pendingInvoices.reduce((s, i) => s + (i.total_amount || 0), 0),
        totalOutstanding: totalOutstanding,
        total: userInvoices.length,
      },
      transactions: {
        total: userTransactions.length,
        last7Days: last7Days.length,
        last30Days: last30Days.length,
        recentTransactions: userTransactions.slice(0, 5).map(t => ({
          date: t.transaction_date,
          type: t.type || t.transaction_type,
          amount: t.amount,
          description: t.description,
        })),
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error building financial context:', error);
    return null;
  }
}

/**
 * Format financial context as system prompt text
 */
export function formatFinancialContext(context) {
  if (!context) {
    return '';
  }

  try {
    const businessName = context.business?.legal_name || context.business?.business_name || context.business?.name || 'SME';
    const ownerName = context.user?.full_name || context.user?.first_name || 'Business Owner';
    const userRole = context.role || 'owner';
    const userEmail = context.user?.email || '';

    let prompt = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 FINANCIAL CONTEXT - REAL-TIME DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 USER INFORMATION:
- Name: ${ownerName}
- Email: ${userEmail}
- Role: ${userRole.toUpperCase()}
- Business: ${businessName}
${context.user?.is_superuser ? '- Status: SUPER ADMIN (Full System Access)\n' : ''}`;

    // Add business list if user has multiple businesses
    if (context.businesses && context.businesses.length > 1) {
      prompt += `\n📍 YOUR BUSINESSES (${context.businesses.length}):\n`;
      context.businesses.forEach((biz, idx) => {
        prompt += `  ${idx + 1}. ${biz.name} (${biz.role})\n`;
      });
    }

    prompt += `\n💰 FINANCIAL DATA (Last 7 Days):
- Income: KES ${(context.last7Days?.income || 0).toLocaleString()}
- Expenses: KES ${(context.last7Days?.expenses || 0).toLocaleString()}
- Net Profit/Loss: KES ${(context.last7Days?.net || 0).toLocaleString()}
- Transactions: ${context.last7Days?.transactionCount || 0}

💰 FINANCIAL DATA (Last 30 Days):
- Income: KES ${(context.last30Days?.income || 0).toLocaleString()}
- Expenses: KES ${(context.last30Days?.expenses || 0).toLocaleString()}
- Net Profit/Loss: KES ${(context.last30Days?.net || 0).toLocaleString()}
- Transactions: ${context.last30Days?.transactionCount || 0}

📄 INVOICES STATUS:
- Total Invoices: ${context.invoices?.total || 0}
- Overdue: ${context.invoices?.overdue || 0} invoices (KES ${(context.invoices?.overdueAmount || 0).toLocaleString()})
- Pending Payment: ${context.invoices?.pending || 0} invoices (KES ${(context.invoices?.pendingAmount || 0).toLocaleString()})
- Total Outstanding: KES ${(context.invoices?.totalOutstanding || 0).toLocaleString()}`;

    // Add recent transactions if available
    if (context.transactions?.recentTransactions && context.transactions.recentTransactions.length > 0) {
      prompt += `\n\n📝 RECENT TRANSACTIONS (Last 5):\n`;
      context.transactions.recentTransactions.forEach((t, idx) => {
        const date = new Date(t.date).toLocaleDateString('en-KE');
        const txType = t.type || t.transaction_type || '';
        const typeLabel = (txType === 'income' || txType === 'INCOME') ? '💵 Income' : '💸 Expense';
        prompt += `  ${idx + 1}. ${date} - ${typeLabel}: KES ${(t.amount || 0).toLocaleString()} - ${t.description || 'N/A'}\n`;
      });
    }

    // Add dashboard-specific data if available
    if (context.dashboardData) {
      const dash = context.dashboardData;
      if (dash.my_work) {
        prompt += `\n\n📋 YOUR WORK SUMMARY:
- Your Invoices: ${dash.my_work.invoices || 0}
- Pending Tasks: ${dash.my_work.pending_tasks || 0}
- Your Customers: ${dash.my_work.customers || 0}`;
      }
    }

    prompt += `\n\n⏰ Data Updated: ${new Date(context.timestamp || Date.now()).toLocaleString('en-KE')}`;
    prompt += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    prompt += `\n⚠️ IMPORTANT: Use the EXACT numbers above when answering questions about finances. This is REAL data from ${ownerName}'s business, not generic examples.\n`;

    return prompt;
  } catch (error) {
    console.error('Error formatting financial context:', error);
    return '';
  }
}

