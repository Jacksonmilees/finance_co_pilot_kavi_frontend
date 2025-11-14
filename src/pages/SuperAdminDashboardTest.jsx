import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function SuperAdminDashboardTest() {
  const location = useLocation();
  const { user, isSuperAdmin } = useAuth();
  
  return (
    <div className="p-8 bg-red-100 min-h-screen">
      <h1 className="text-4xl font-bold text-red-900">TEST - Super Admin Dashboard</h1>
      <p className="text-xl mt-4 text-green-700">✅ If you can see this RED background, the routing is working!</p>
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow space-y-4">
        <h2 className="text-2xl font-bold mb-4">Debug Information</h2>
        <div>
          <strong>Current URL:</strong> {location.pathname}
        </div>
        <div>
          <strong>User:</strong> {user?.username || 'Not logged in'}
        </div>
        <div>
          <strong>Is Super Admin:</strong> {isSuperAdmin() ? 'YES ' : 'NO '}
        </div>
        <div>
          <strong>Layout:</strong> This should be using AdminLayout with dark sidebar
        </div>
      </div>
      
      <div className="mt-8 p-6 bg-yellow-100 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-2">Expected Behavior:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>You should see a DARK GRAY/BLACK sidebar on the left (not the white one)</li>
          <li>The sidebar should have "FinanceGrowth - Super Admin" at the top</li>
          <li>This red content area should be visible</li>
        </ul>
      </div>
    </div>
  );
}
