import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  FileText, Search, Download, Eye, Building2, User, 
  Filter, Calendar, CheckCircle, XCircle, Clock, FileCheck
} from 'lucide-react';
import { Skeleton, CardSkeleton } from '../../components/ui/skeleton';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DocumentManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['registration-documents'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/users/admin/documents/');
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents');
        return [];
      }
    },
    staleTime: 60000
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      doc.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.owner_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.document_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Get document type icon
  const getDocumentTypeIcon = (type) => {
    switch (type) {
      case 'business_registration':
        return Building2;
      case 'individual_registration':
        return User;
      default:
        return FileText;
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'needs_revision': { color: 'bg-orange-100 text-orange-800', icon: FileCheck },
    };
    return badges[status] || badges['pending'];
  };

  // Get document type badge
  const getDocumentTypeBadge = (docType) => {
    const types = {
      'registration_certificate': 'Reg. Certificate',
      'kra_pin_certificate': 'KRA PIN',
      'id_document': 'ID Document',
    };
    return types[docType] || docType;
  };

  // Download document
  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // View document
  const handleView = (url) => {
    window.open(url, '_blank');
  };

  // Get stats
  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            Document Management
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            View and manage registration documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, business, or document type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-blue-600' : ''}
              >
                <Filter className="w-4 h-4 mr-2" />
                All Status
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-yellow-600' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
                className={statusFilter === 'approved' ? 'bg-green-600' : ''}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
                className={statusFilter === 'rejected' ? 'bg-red-600' : ''}
              >
                Rejected
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
                className={typeFilter === 'all' ? 'bg-blue-600' : ''}
              >
                All Types
              </Button>
              <Button
                variant={typeFilter === 'business_registration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('business_registration')}
              >
                Business
              </Button>
              <Button
                variant={typeFilter === 'individual_registration' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('individual_registration')}
              >
                Individual
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
          <CardTitle className="text-gray-900">
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No documents found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No documents have been uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => {
                const TypeIcon = getDocumentTypeIcon(doc.type);
                const statusBadge = getStatusBadge(doc.status);
                const StatusIcon = statusBadge.icon;

                return (
                  <div
                    key={doc.id}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors gap-4 border border-gray-200"
                  >
                    <div className="flex-1 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                        doc.type === 'business_registration' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        <TypeIcon className={`w-6 h-6 ${
                          doc.type === 'business_registration' ? 'text-blue-600' : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{doc.document_name}</h3>
                          <Badge className={statusBadge.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {doc.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getDocumentTypeBadge(doc.document_type)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Owner:</span> {doc.owner_name} ({doc.owner_email})
                          </p>
                          {doc.business_name && (
                            <p>
                              <span className="font-medium">Business:</span> {doc.business_name}
                            </p>
                          )}
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            Uploaded: {format(new Date(doc.uploaded_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc.url)}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.url, doc.document_name)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

