import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Download, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CardSkeleton, TableSkeleton } from "../components/ui/skeleton";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/apiClient";

import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import TransactionStats from "../components/transactions/TransactionStats";

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filters, setFilters] = useState({ type: "all", category: "all", source: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const queryClient = useQueryClient();
  const { getBusinesses, activeBusinessId, user } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;

  // ========== DEBUG LOGGING ==========
  console.log('=== TRANSACTIONS PAGE DEBUG ===');
  console.log('1. User:', user);
  console.log('2. User ID:', user?.id);
  console.log('3. Businesses from getBusinesses():', businesses);
  console.log('4. Active Business ID:', activeBusinessId);
  console.log('5. Computed businessId:', businessId);
  console.log('6. Query enabled?:', !!businessId && !!user?.id);
  console.log('================================');
  // ===================================


  const { data: transactions = [], isLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', businessId, user?.id], // Include user ID in cache key
    queryFn: async () => {
      console.log('🔍 TRANSACTION QUERY FUNCTION CALLED');
      console.log('   businessId:', businessId);
      console.log('   user?.id:', user?.id);

      if (!businessId) {
        console.error('❌ CANNOT FETCH: No businessId provided');
        return [];
      }
      if (!user?.id) {
        console.error('❌ CANNOT FETCH: User not authenticated');
        return [];
      }
      try {
        // Pass business ID to backend - backend will handle user filtering based on auth
        const params = {
          business: businessId
        };

        console.log('📤 Fetching transactions with params:', params);
        console.log('📍 API endpoint will be: /finance/transactions/?business=' + businessId);

        const result = await apiClient.getTransactions(params);

        console.log('📥 Raw API response type:', typeof result);
        console.log('📥 Raw API response:', result);
        console.log('📥 Is Array?:', Array.isArray(result));
        console.log('📥 Has .results?:', !!result?.results);
        console.log('📥 Has .data?:', !!result?.data);

        // Handle different response formats from backend
        let transactionArray = [];

        if (Array.isArray(result)) {
          // Backend returned array directly
          console.log('✅ Response is direct array');
          transactionArray = result;
        } else if (result?.results && Array.isArray(result.results)) {
          // Paginated response
          console.log('✅ Response has paginated .results');
          transactionArray = result.results;
        } else if (result?.data && Array.isArray(result.data)) {
          // Wrapped in data field
          console.log('✅ Response wrapped in .data');
          transactionArray = result.data;
        } else if (result?.transactions && Array.isArray(result.transactions)) {
          // Wrapped in transactions field
          console.log('✅ Response wrapped in .transactions');
          transactionArray = result.transactions;
        } else {
          console.error('⚠️ UNEXPECTED RESPONSE FORMAT!');
          console.error('Response structure:', Object.keys(result || {}));
          console.error('Full response:', JSON.stringify(result, null, 2));
          transactionArray = [];
        }

        console.log(`✅ Loaded ${transactionArray.length} transactions for business ${businessId}`);
        if (transactionArray.length > 0) {
          console.log('First transaction sample:', transactionArray[0]);
        } else {
          console.warn('⚠️ Transaction array is EMPTY');
        }

        return transactionArray;
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        console.error('Error status:', error.response?.status);
        console.error('Error details:', error.response?.data || error.message);
        if (error.response?.status !== 401) {
          toast.error('Failed to load transactions. Please try again.');
        }
        return [];
      }
    },
    enabled: !!businessId && !!user?.id,
    refetchOnMount: 'always', // ALWAYS refetch on mount to ensure fresh data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 0, // Consider data stale immediately to force fresh fetches
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for 5 mins
    retry: 1, // Retry once on failure
  });

  // Force refetch when businessId or user changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - businessId or user changed');
    console.log('   businessId:', businessId, 'user?.id:', user?.id);
    if (businessId && user?.id) {
      console.log('🚀 Forcing query refetch...');
      queryClient.invalidateQueries({ queryKey: ['transactions', businessId, user?.id] });
    }
  }, [businessId, user?.id, queryClient]);

  if (!businessId) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Selected</h2>
          <p className="text-gray-600">Please select a business to view transactions.</p>
        </div>
      </div>
    );
  }

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!businessId) {
        throw new Error('No business selected. Please select a business first.');
      }
      if (!user?.id) {
        throw new Error('User not authenticated. Please log in.');
      }

      // Validate and set transaction_type (required field)
      const transactionType = data.type || data.transaction_type || 'expense';
      const validTypes = ['income', 'expense', 'transfer', 'investment', 'loan', 'refund'];
      const finalType = validTypes.includes(transactionType) ? transactionType : 'expense';

      // Validate and set payment_method (required field)
      const paymentMethod = data.source || data.payment_method || 'mpesa';
      const validMethods = ['mpesa', 'bank_transfer', 'cash', 'card', 'cheque', 'other'];
      const finalPaymentMethod = validMethods.includes(paymentMethod) ? paymentMethod : 'mpesa';

      // Validate amount
      const amount = parseFloat(data.amount);
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Amount must be greater than 0');
      }

      // Ensure description is not empty (required field)
      const description = (data.description || data.category || 'Transaction').trim();
      if (!description) {
        throw new Error('Description is required');
      }

      // Format transaction_date properly - backend expects ISO datetime string with timezone
      let transactionDate = data.transaction_date;

      // Convert date string to proper ISO datetime format with timezone
      if (!transactionDate) {
        // Use current time if no date provided
        transactionDate = new Date().toISOString();
      } else {
        // Always convert to proper ISO format with timezone
        try {
          // If it's just a date (YYYY-MM-DD), convert to full ISO datetime
          if (transactionDate.length === 10 && transactionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Create a date object and convert to ISO string (includes timezone)
            const dateObj = new Date(transactionDate + 'T00:00:00');
            transactionDate = dateObj.toISOString();
          } else if (transactionDate.includes('T') && !transactionDate.includes('Z') && !transactionDate.includes('+')) {
            // If it's datetime but missing timezone (e.g., "2025-11-11T00:00:00"), add timezone
            const dateObj = new Date(transactionDate);
            if (!isNaN(dateObj.getTime())) {
              transactionDate = dateObj.toISOString();
            } else {
              // Fallback: try to parse and add timezone manually
              const [datePart, timePart] = transactionDate.split('T');
              if (datePart && timePart) {
                const dateObj = new Date(datePart + 'T' + timePart);
                transactionDate = dateObj.toISOString();
              }
            }
          } else if (!transactionDate.includes('T') && !transactionDate.includes('Z') && !transactionDate.includes('+')) {
            // If it's some other format, try to parse it
            const dateObj = new Date(transactionDate);
            if (!isNaN(dateObj.getTime())) {
              transactionDate = dateObj.toISOString();
            }
          }
          // If it already has timezone (Z or +), use as-is
        } catch (e) {
          console.warn('Date conversion error:', e, 'Using current time');
          transactionDate = new Date().toISOString();
        }
      }

      const transactionData = {
        business: businessId,
        user: user.id,
        amount: amount,
        currency: data.currency || 'KES',
        transaction_type: finalType,
        category: data.category || 'other',
        description: description,
        payment_method: finalPaymentMethod,
        transaction_date: transactionDate,
        status: 'completed'
      };

      // Add optional fields only if they exist
      if (data.reference_number) transactionData.reference_number = data.reference_number;
      if (data.external_id) transactionData.external_id = data.external_id;
      if (data.supplier) transactionData.supplier = data.supplier;
      if (data.customer) transactionData.customer = data.customer;
      if (data.invoice) transactionData.invoice = data.invoice;

      console.log('📤 Creating transaction:', JSON.stringify(transactionData, null, 2));
      console.log('📅 Transaction date format:', transactionDate, 'Length:', transactionDate?.length);
      try {
        const result = await apiClient.createTransaction(transactionData);
        console.log('✅ Transaction created successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ API Error:', error);
        console.error('Error object keys:', Object.keys(error));
        console.error('Request payload:', JSON.stringify(transactionData, null, 2));
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        // Check all possible error data locations
        console.error('error.response:', error.response);
        console.error('error.responseData:', error.responseData);
        console.error('error.message:', error.message);
        // Attach response data to error for better error handling
        if (error.response?.data) {
          error.responseData = error.response.data;
        }
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // CRITICAL: Invalidate KAVI's financial context cache
      // This ensures KAVI picks up new data immediately
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId, user?.id] });
        queryClient.invalidateQueries({ queryKey: ['cash-flow', businessId] });
      }

      // Force refetch all data
      queryClient.refetchQueries({ queryKey: ['transactions'] });
      queryClient.refetchQueries({ queryKey: ['user-dashboard'] });

      setShowForm(false);
      setEditingTransaction(null);
      toast.success('Transaction created successfully! KAVI data updated.');
    },
    onError: (error) => {
      console.error('❌ Transaction creation error:', error);
      console.error('Full error object:', error);

      // Extract error message from various possible locations
      let errorMessage = 'Failed to create transaction';
      const errorData = error.response?.data || error.responseData;

      if (errorData) {
        console.error('Error response data:', JSON.stringify(errorData, null, 2));

        // Try different error message formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.transaction_type) {
          errorMessage = Array.isArray(errorData.transaction_type)
            ? errorData.transaction_type[0]
            : errorData.transaction_type;
        } else if (errorData.description) {
          errorMessage = Array.isArray(errorData.description)
            ? errorData.description[0]
            : errorData.description;
        } else if (errorData.payment_method) {
          errorMessage = Array.isArray(errorData.payment_method)
            ? errorData.payment_method[0]
            : errorData.payment_method;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error('Final error message:', errorMessage);
      toast.error(errorMessage);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiClient.put(`/finance/transactions/${id}/`, data);
    },
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // CRITICAL: Invalidate KAVI's financial context cache
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId, user?.id] });
        queryClient.invalidateQueries({ queryKey: ['cash-flow', businessId] });
      }

      setShowForm(false);
      setEditingTransaction(null);
      toast.success('Transaction updated successfully! KAVI data updated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update transaction');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiClient.delete(`/finance/transactions/${id}/`);
    },
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      // CRITICAL: Invalidate KAVI's financial context cache
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId] });
        queryClient.invalidateQueries({ queryKey: ['transactions', businessId, user?.id] });
        queryClient.invalidateQueries({ queryKey: ['cash-flow', businessId] });
      }

      toast.success('Transaction deleted successfully! KAVI data updated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete transaction');
    }
  });

  const handleSubmit = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const filteredTransactions = transactions.filter(t => {
    const typeMatch = filters.type === "all" ||
      (t.transaction_type || t.type) === filters.type;
    const categoryMatch = filters.category === "all" ||
      (t.category || '') === filters.category;
    const sourceMatch = filters.source === "all" ||
      (t.payment_method || t.source) === filters.source;
    const queryMatch = !searchQuery || (t.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const txDateStr = t.transaction_date || '';
    const txDate = txDateStr ? new Date(txDateStr) : null;
    const fromOk = !dateFrom || (txDate && txDate >= new Date(dateFrom));
    const toOk = !dateTo || (txDate && txDate <= new Date(dateTo + 'T23:59:59'));
    return typeMatch && categoryMatch && sourceMatch && queryMatch && fromOk && toOk;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Status'];
    const rows = filteredTransactions.map(t => [
      t.transaction_date || '',
      t.transaction_type || t.type || '',
      t.category || '',
      t.description || '',
      t.amount || 0,
      t.payment_method || t.source || '',
      t.status || 'completed'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (isLoading && transactions.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <CardSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Track all your income and expenses</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredTransactions.length === 0}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <TransactionStats transactions={filteredTransactions} isLoading={isLoading} />

      <TransactionFilters filters={filters} onFilterChange={setFilters} />

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* DEBUG: Log before rendering TransactionList */}
      {console.log('About to render TransactionList with:', {
        filteredCount: filteredTransactions?.length,
        rawCount: transactions?.length,
        isLoading,
        sample: filteredTransactions?.[0]
      })}

      <TransactionList
        transactions={filteredTransactions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={deleteMutation.mutate}
      />
    </div>
  );
}


