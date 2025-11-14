import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreVertical, Send, CheckCircle, XCircle, Download, Smartphone } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/EmptyState";

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800"
};

export default function InvoiceList({ invoices, isLoading, onEdit, onDelete, onUpdateStatus, onDownloadPDF, onPayWithMpesa }) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 mb-3" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState 
        type="invoices"
        primaryAction={{
          label: "Create Invoice",
          icon: Pencil,
          path: "#"
        }}
      />
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>All Invoices ({invoices.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900">#{invoice.invoice_number}</h3>
                  <Badge className={statusColors[invoice.status]}>
                    {invoice.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  <span>Issued: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</span>
                  <span>•</span>
                  <span>Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    KES {invoice.total_amount.toLocaleString()}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDownloadPDF(invoice)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(invoice)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {invoice.status === 'draft' && (
                      <DropdownMenuItem onClick={() => onUpdateStatus({ id: invoice.id, status: 'sent' })}>
                        <Send className="w-4 h-4 mr-2" />
                        Mark as Sent
                      </DropdownMenuItem>
                    )}
                    {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                      <>
                        <DropdownMenuItem onClick={() => onPayWithMpesa ? onPayWithMpesa(invoice) : null}>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Pay with M-Pesa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onUpdateStatus({ id: invoice.id, status: 'paid' })}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Paid
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(invoice.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


