import React, { useState } from "react";
import apiClient from "../lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { CardSkeleton, TableSkeleton } from "../components/ui/skeleton";

import InvoiceForm from "../components/invoices/InvoiceForm";
import InvoiceList from "../components/invoices/InvoiceList";
import InvoiceStats from "../components/invoices/InvoiceStats";
import { generateInvoicePDF } from "../components/invoices/InvoicePDFGenerator";
import ImportInvoices from "../components/invoices/ImportInvoices";
import MpesaPaymentModal from "../components/payments/MpesaPaymentModal";

export default function Invoices() {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showMpesaModal, setShowMpesaModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const queryClient = useQueryClient();
  const { getBusinesses, activeBusinessId, user } = useAuth();
  const businesses = getBusinesses();
  const businessId = activeBusinessId || businesses[0]?.id;

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices', businessId, user?.id], // Include user ID in cache key
    queryFn: async () => {
      if (!businessId) {
        return [];
      }
      try {
        const params = { business: businessId };
        const result = await apiClient.getInvoices(params);
        // Ensure we have an array
        const invoiceArray = Array.isArray(result) ? result : (result?.results || result?.invoices || []);
        // Filter by user ID on frontend as well (double-check)
        const userInvoices = invoiceArray.filter(inv => {
          const invUserId = inv.user || inv.user_id || inv.user?.id;
          return invUserId && String(invUserId) === String(user?.id);
        });
        return userInvoices;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
      }
    },
    enabled: !!businessId && !!user?.id,
    initialData: [],
    refetchOnMount: false, // Use cache, don't refetch on mount
    refetchOnWindowFocus: false, // Use cache, don't refetch on focus
    staleTime: 30 * 60 * 1000, // 30 minutes - cache for 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache
  });
  
  if (!businessId) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Selected</h2>
          <p className="text-gray-600">Please select a business to view invoices.</p>
        </div>
      </div>
    );
  }

  // Business data is available from auth context, no need to fetch separately
  const business = businesses[0] || null;

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!businessId) {
        throw new Error('No business selected. Please select a business first.');
      }
      const invoiceData = {
        business: businessId,
        user: user?.id,
        invoice_number: data.invoice_number || `INV-${Date.now()}`,
        customer_name: data.customer_name,
        customer_email: data.customer_email || '',
        customer_phone: data.customer_phone || '',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: data.currency || 'KES',
        subtotal: parseFloat(data.subtotal) || 0,
        tax_amount: parseFloat(data.tax_amount) || 0,
        total_amount: parseFloat(data.total_amount) || 0,
        notes: data.notes || '',
        status: data.status || 'draft'
      };
      const invoice = await apiClient.createInvoice(invoiceData);
      
      // Create invoice items if provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          if (item.description) {
            await apiClient.post(`/finance/invoice-items/`, {
              invoice: invoice.id,
              description: item.description,
              quantity: parseFloat(item.quantity) || 1,
              unit_price: parseFloat(item.unit_price) || 0
            });
          }
        }
      }
      
      return invoice;
    },
    onSuccess: () => {
      // Invalidate all invoice-related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // CRITICAL: Invalidate KAVI's financial context cache
      // This ensures KAVI picks up new data immediately
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId, user?.id] });
      }
      
      // Force refetch all data
      queryClient.refetchQueries({ queryKey: ['invoices'] });
      queryClient.refetchQueries({ queryKey: ['user-dashboard'] });
      
      setShowForm(false);
      setEditingInvoice(null);
      toast.success('Invoice created successfully! KAVI data updated.');
    },
    onError: (error) => {
      console.error('Invoice creation error:', error);
      
      // Check if it's a backend database/cache error
      const errorMsg = error.message || '';
      if (errorMsg.includes('cache_table') || errorMsg.includes('ProgrammingError')) {
        toast.error('Backend database needs setup. Please contact admin to run: python manage.py createcachetable');
      } else {
        toast.error(errorMsg || 'Failed to create invoice');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await apiClient.request(`/finance/invoices/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // Invalidate all invoice-related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // CRITICAL: Invalidate KAVI's financial context cache
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId, user?.id] });
      }
      
      setShowForm(false);
      setEditingInvoice(null);
      toast.success('Invoice updated successfully! KAVI data updated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update invoice');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await apiClient.request(`/finance/invoices/${id}/`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Invalidate all invoice-related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // CRITICAL: Invalidate KAVI's financial context cache
      if (businessId) {
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId] });
        queryClient.invalidateQueries({ queryKey: ['invoices', businessId, user?.id] });
      }
      
      toast.success('Invoice deleted successfully! KAVI data updated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete invoice');
    }
  });

  const handleSubmit = (data) => {
    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDownloadPDF = async (invoice) => {
    await generateInvoicePDF(invoice, business);
  };

  if (isLoading && invoices.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <CardSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg">
            <ImportInvoices onClose={() => setShowImport(false)} businessId={businessId} />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Create and manage your business invoices</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setShowImport(true)}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Invoices
          </Button>
          <Button
            onClick={() => {
              setEditingInvoice(null);
              setShowForm(!showForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </div>
      </div>

      <InvoiceStats invoices={invoices} />

      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <InvoiceList
        invoices={invoices}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={deleteMutation.mutate}
        onUpdateStatus={({ id, status }) => updateMutation.mutate({ id, data: { status } })}
        onDownloadPDF={handleDownloadPDF}
        onPayWithMpesa={(invoice) => {
          setSelectedInvoice(invoice);
          setShowMpesaModal(true);
        }}
      />

      {/* M-Pesa Payment Modal */}
      <MpesaPaymentModal
        isOpen={showMpesaModal}
        onClose={() => {
          setShowMpesaModal(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        amount={selectedInvoice?.total_amount}
        businessId={businessId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['user-dashboard'] });
        }}
      />
    </div>
  );
}


