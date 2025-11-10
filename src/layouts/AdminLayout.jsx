import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const { isSuperAdmin } = useAuth();

  // Get pending registrations count for badge
  const { data: pendingRegistrations = [] } = useQuery({
    queryKey: ['pending-registrations-count'],
    queryFn: async () => {
      return await apiClient.listPendingRegistrations();
    },
    enabled: isSuperAdmin(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 20000 // Consider data stale after 20 seconds
  });

  return (
    <div className="flex h-screen bg-gray-50" style={{ overflow: 'hidden', position: 'relative' }}>
      <AdminSidebar pendingCount={pendingRegistrations?.length || 0} />
      
      {/* Main Content - offset by sidebar width */}
      <div 
        className="flex-1 transition-all duration-300 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-50 to-white" 
        style={{ 
          marginLeft: '256px',
          minHeight: '100vh',
          width: 'calc(100% - 256px)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div className="w-full" style={{ minHeight: '100%', padding: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
