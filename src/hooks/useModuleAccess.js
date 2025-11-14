import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../lib/apiClient';

/**
 * Hook to check module access for the current user
 * Caches results for performance
 */
export function useModuleAccess() {
  const { user, activeBusinessId } = useAuth();
  
  const { data: modules = [], isLoading, error } = useQuery({
    queryKey: ['user-modules', activeBusinessId, user?.id],
    queryFn: async () => {
      try {
        const response = await apiClient.request('/core/user/modules/');
        return response || [];
      } catch (error) {
        console.error('Error fetching user modules:', error);
        // Return empty array on error, will show only required modules
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  /**
   * Check if user has access to a specific module
   * @param {string} moduleId - The module ID to check
   * @returns {boolean} - True if user has access
   */
  const hasModuleAccess = (moduleId) => {
    if (!user) return false;
    
    // Super admins have access to everything
    if (user.is_superuser) return true;
    
    // Required modules are always accessible
    const requiredModules = ['voice-assistant', 'settings'];
    if (requiredModules.includes(moduleId)) return true;
    
    // Check if module is in enabled modules list
    return modules.some(m => m.module_id === moduleId && m.enabled);
  };
  
  /**
   * Get list of enabled module IDs
   * @returns {string[]} - Array of enabled module IDs
   */
  const getEnabledModules = () => {
    if (!user) return [];
    if (user.is_superuser) {
      // Return all module IDs for super admin
      return [
        'transactions',
        'invoices',
        'cash-flow',
        'credit',
        'suppliers',
        'clients',
        'reports',
        'insights',
        'proactive-alerts',
        'team',
        'voice-assistant',
        'settings'
      ];
    }
    return modules.filter(m => m.enabled).map(m => m.module_id);
  };
  
  /**
   * Get module details for enabled modules
   * @returns {Array} - Array of module objects with details
   */
  const getEnabledModuleDetails = () => {
    return modules.filter(m => m.enabled);
  };
  
  return {
    modules,
    isLoading,
    error,
    hasModuleAccess,
    getEnabledModules,
    getEnabledModuleDetails
  };
}






