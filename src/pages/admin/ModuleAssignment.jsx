import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { 
  Package, Building2, CheckCircle, XCircle, Search,
  TrendingUp, Users, BarChart3, Settings, Sparkles,
  DollarSign, Receipt, CreditCard, Lightbulb, AlertCircle,
  ChevronRight, Filter, CheckSquare, XSquare
} from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Skeleton, CardSkeleton } from '../../components/ui/skeleton';
import { MODULE_DEFINITIONS, MODULE_CATEGORIES } from '../../config/modules';

export default function ModuleAssignment() {
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const queryClient = useQueryClient();

  // Fetch businesses
  const { data: businesses = [], isLoading: businessesLoading } = useQuery({
    queryKey: ['businesses-list'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/core/admin/businesses/');
        console.log('📊 Fetched businesses from API:', response);
        
        // Handle different response formats
        let businessList = [];
        if (Array.isArray(response)) {
          businessList = response;
        } else if (response.results && Array.isArray(response.results)) {
          // Paginated response
          businessList = response.results;
        } else if (response.data && Array.isArray(response.data)) {
          businessList = response.data;
        }
        
        console.log('✅ Parsed business list:', businessList.length, 'businesses');
        return businessList;
      } catch (error) {
        console.error('❌ Error fetching businesses:', error);
        // Don't show error toast, just log it
        // Backend might be deploying or have stale code
        console.warn('⚠️ Backend error - using fallback empty list');
        return [];
      }
    },
    staleTime: 60000,
    retry: 2,
    retryDelay: 1000
  });

  // Fetch module assignments for selected business
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['module-assignments', selectedBusiness?.id],
    queryFn: async () => {
      if (!selectedBusiness) return [];
      try {
        const response = await apiClient.get(`/core/admin/businesses/${selectedBusiness.id}/modules/`);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Error fetching module assignments:', error);
        toast.error('Failed to fetch module assignments');
        return [];
      }
    },
    enabled: !!selectedBusiness,
    staleTime: 30000
  });

  // Toggle module mutation
  const toggleModuleMutation = useMutation({
    mutationFn: ({ businessId, moduleId, enabled }) =>
      apiClient.post(`/core/admin/businesses/${businessId}/modules/${moduleId}/`, {
        enabled
      }),
    onSuccess: () => {
      toast.success('Module updated successfully');
      queryClient.invalidateQueries({ queryKey: ['module-assignments'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update module');
    }
  });

  // Bulk toggle mutation
  const bulkToggleMutation = useMutation({
    mutationFn: ({ businessId, moduleIds, enabled }) => {
      const promises = moduleIds.map(moduleId =>
        apiClient.post(`/core/admin/businesses/${businessId}/modules/${moduleId}/`, {
          enabled
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      toast.success('Modules updated successfully');
      queryClient.invalidateQueries({ queryKey: ['module-assignments'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update modules');
    }
  });

  const isModuleEnabled = (moduleId) => {
    return assignments.some(a => a.module_id === moduleId && a.enabled);
  };

  // Get all modules from definitions
  const allModules = Object.values(MODULE_DEFINITIONS);
  
  // Filter modules by search and category
  const filteredModules = allModules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group modules by category
  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {});

  // Get enabled/disabled counts
  const enabledCount = filteredModules.filter(m => isModuleEnabled(m.id)).length;
  const disabledCount = filteredModules.length - enabledCount;

  // Handle bulk enable/disable
  const handleBulkToggle = (enabled) => {
    if (!selectedBusiness) return;
    const moduleIds = filteredModules.map(m => m.id);
    bulkToggleMutation.mutate({
      businessId: selectedBusiness.id,
      moduleIds,
      enabled
    });
  };

  if (businessesLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <div className="lg:col-span-2">
            <CardSkeleton />
          </div>
        </div>
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
              <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          Module Assignment
        </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
          Assign and manage modules for businesses
        </p>
        </div>
        {selectedBusiness && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleBulkToggle(true)}
              disabled={bulkToggleMutation.isPending || toggleModuleMutation.isPending}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <CheckSquare className="w-4 h-4 mr-2" />
              Enable All
            </Button>
            <Button
              onClick={() => handleBulkToggle(false)}
              disabled={bulkToggleMutation.isPending || toggleModuleMutation.isPending}
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <XSquare className="w-4 h-4 mr-2" />
              Disable All
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business List */}
        <Card className="lg:col-span-1 border border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Building2 className="w-5 h-5 text-blue-600" />
                Businesses
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700">
                {businesses.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
              {businesses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No businesses found</p>
                </div>
              ) : (
                businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => setSelectedBusiness(business)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedBusiness?.id === business.id
                        ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                        : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                >
                    <p className="font-semibold text-gray-900">{business.legal_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{business.business_type || 'N/A'}</p>
                </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Module Assignment */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-gray-900">
                {selectedBusiness ? (
                  <div>
                    <span className="text-lg md:text-xl">Modules for </span>
                    <span className="text-lg md:text-xl font-bold text-blue-600">
                      {selectedBusiness.legal_name}
                    </span>
                  </div>
                ) : (
                  'Select a Business'
                )}
            </CardTitle>
              {selectedBusiness && (
                <div className="flex gap-2 text-sm">
                  <Badge className="bg-green-100 text-green-700">
                    {enabledCount} Enabled
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-700">
                    {disabledCount} Disabled
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {!selectedBusiness ? (
              <div className="text-center py-12 md:py-16">
                <Package className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Select a business to manage modules</p>
                <p className="text-gray-400 text-sm mt-2">Choose a business from the list to enable or disable modules</p>
              </div>
            ) : assignmentsLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search modules..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-gray-300"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <Button
                      variant={selectedCategory === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory('all')}
                      className={selectedCategory === 'all' ? 'bg-blue-600' : ''}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      All
                    </Button>
                    {Object.entries(MODULE_CATEGORIES).map(([key, category]) => (
                      <Button
                        key={key}
                        variant={selectedCategory === key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(key)}
                        className={selectedCategory === key ? 'bg-blue-600' : ''}
                      >
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Modules by Category */}
                {Object.keys(modulesByCategory).length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No modules found matching your search</p>
                  </div>
                ) : (
                  Object.entries(modulesByCategory).map(([category, modules]) => {
                    const categoryInfo = MODULE_CATEGORIES[category];
                    const CategoryIcon = categoryInfo?.icon || Package;
                    
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                          <CategoryIcon className={`w-5 h-5 ${categoryInfo?.color || 'text-gray-600'}`} />
                          <h3 className="font-semibold text-gray-900">{categoryInfo?.name || category}</h3>
                          <Badge variant="outline" className="ml-auto">
                            {modules.length} modules
                          </Badge>
                        </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {modules.map((module) => {
                  const Icon = module.icon;
                  const enabled = isModuleEnabled(module.id);
                            const isRequired = module.required;
                  
                  return (
                    <Card
                      key={module.id}
                                className={`border-2 transition-all hover:shadow-md ${
                                  enabled 
                                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' 
                                    : 'border-gray-200 bg-white'
                                } ${isRequired ? 'ring-2 ring-blue-200' : ''}`}
                              >
                                <CardContent className="p-4 md:p-5">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${module.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                                    {!isRequired && (
                          <button
                            onClick={() => {
                              toggleModuleMutation.mutate({
                                businessId: selectedBusiness.id,
                                moduleId: module.id,
                                enabled: !enabled
                              });
                            }}
                            disabled={toggleModuleMutation.isPending}
                                        className={`p-2 rounded-full transition-all shadow-sm ${
                              enabled
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-gray-300 hover:bg-gray-400 text-white'
                            }`}
                          >
                            {enabled ? (
                                          <CheckCircle className="w-5 h-5" />
                            ) : (
                                          <XCircle className="w-5 h-5" />
                            )}
                          </button>
                                    )}
                                    {isRequired && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                        Required
                                      </Badge>
                                    )}
                        </div>
                                  <h3 className="font-semibold text-gray-900 mb-1 text-base">{module.name}</h3>
                                  <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                                  <div className="flex items-center justify-between">
                                    <Badge 
                                      className={
                                        enabled 
                                          ? 'bg-green-100 text-green-700 border-green-300' 
                                          : 'bg-gray-100 text-gray-700 border-gray-300'
                                      }
                                    >
                          {enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                                    {module.route && (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                      </CardContent>
                    </Card>
                  );
                })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
