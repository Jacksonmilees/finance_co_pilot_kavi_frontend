import React, { useState } from "react";
import base44 from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ClientOnboarding from "../components/dashboard/ClientOnboarding";
import { apiClient } from "@/lib/apiClient";
import EmptyState from "../components/ui/EmptyState";

export default function Clients() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_at', {}),
    initialData: [],
    refetchOnMount: false, // Use cache, don't refetch on mount
    refetchOnWindowFocus: false, // Use cache, don't refetch on focus
    staleTime: 30 * 60 * 1000, // 30 minutes - cache for 30 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep in cache
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditingClient(null);
    }
  });

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone_number?.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    const matchesType = typeFilter === "all" || client.customer_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    totalInvoiced: clients.reduce((sum, c) => sum + (parseFloat(c.total_invoiced) || 0), 0),
    totalPaid: clients.reduce((sum, c) => sum + (parseFloat(c.total_paid) || 0), 0),
    outstanding: clients.reduce((sum, c) => {
      const invoiced = parseFloat(c.total_invoiced) || 0;
      const paid = parseFloat(c.total_paid) || 0;
      return sum + (invoiced - paid);
    }, 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
            Clients
            <Users className="w-8 h-8 text-blue-500" />
          </h1>
          <p className="text-gray-600 mt-1">Manage your clients and customers</p>
        </div>
        <Button
          onClick={() => setShowOnboarding(true)}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">{stats.active} active</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">KES {stats.totalInvoiced.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">KES {stats.totalPaid.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Received</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">KES {stats.outstanding.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Pending payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Business</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{client.customer_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.status === 'active' ? 'bg-green-100 text-green-800' :
                          client.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {client.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.customer_type === 'business' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {client.customer_type}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{client.phone_number}</span>
                        </div>
                        {client.company_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{client.company_name}</span>
                          </div>
                        )}
                        {client.payment_terms && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{client.payment_terms}</span>
                          </div>
                        )}
                      </div>

                      {client.physical_address && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Address: </span>
                          {client.physical_address}
                        </div>
                      )}

                      <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Invoiced: <span className="font-semibold text-gray-900">KES {parseFloat(client.total_invoiced || 0).toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            Paid: <span className="font-semibold text-green-600">KES {parseFloat(client.total_paid || 0).toLocaleString()}</span>
                          </span>
                        </div>
                        {(parseFloat(client.total_invoiced || 0) - parseFloat(client.total_paid || 0)) > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-600">
                              Outstanding: <span className="font-semibold text-orange-600">KES {(parseFloat(client.total_invoiced || 0) - parseFloat(client.total_paid || 0)).toLocaleString()}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingClient(client)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState 
              type="customers"
              title={searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                ? "No Clients Match Your Filters" 
                : "No Customers Yet"}
              description={searchTerm || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your search or filters to find clients."
                : "Add your customers to track relationships and manage invoices."}
              primaryAction={!searchTerm && statusFilter === "all" && typeFilter === "all" ? {
                label: "Add Customer",
                icon: Plus,
                path: "#",
                onClick: () => setShowOnboarding(true)
              } : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Client Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <ClientOnboarding onClose={() => setShowOnboarding(false)} />
          </div>
        </div>
      )}
    </div>
  );
}