import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CheckSquare,
  Activity,
  FileText,
  Settings,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export default function AdminSidebar({ pendingCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/super-admin',
      badge: null
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/super-admin/users',
      badge: null
    },
    {
      icon: Building2,
      label: 'Businesses',
      path: '/super-admin/businesses',
      badge: null
    },
    {
      icon: CheckSquare,
      label: 'Approvals',
      path: '/super-admin/approvals',
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      icon: Activity,
      label: 'Activity Logs',
      path: '/super-admin/logs',
      badge: null
    },
    {
      icon: FileText,
      label: 'Documents',
      path: '/super-admin/documents',
      badge: null
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/super-admin/analytics',
      badge: null
    },
    {
      icon: Shield,
      label: 'Security',
      path: '/super-admin/security',
      badge: null
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/super-admin/settings',
      badge: null
    }
  ];

  const isActive = (path) => {
    if (path === '/super-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen fixed left-0 top-0 transition-all duration-300 ease-in-out flex flex-col shadow-2xl`}
      style={{ zIndex: 1000, pointerEvents: 'auto' }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">FinanceGrowth</h2>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-700"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer relative no-underline ${
                    active
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg font-bold'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white font-medium'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : ''}
                  style={{ 
                    pointerEvents: 'auto', 
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  <Icon className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium text-sm">{item.label}</span>
                      {item.badge && (
                        <Badge className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <div className="absolute right-2 top-2 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info & Footer */}
      <div className="border-t border-gray-700">
        {/* User Info - Below modules */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{user?.full_name || user?.username || 'Admin'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-blue-600/20 relative"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></span>
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Logout */}
        <div className="p-4">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              logout();
            }}
            className={`w-full flex items-center gap-3 text-gray-300 hover:text-white hover:bg-red-600/20 transition-all cursor-pointer font-medium ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
            style={{ 
              pointerEvents: 'auto',
              zIndex: 1000,
              background: 'transparent',
              border: 'none'
            }}
          >
            <LogOut className={`${collapsed ? 'w-6 h-6' : 'w-5 h-5'}`} />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
