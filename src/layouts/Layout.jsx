import React from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { useModuleAccess } from "../hooks/useModuleAccess";
import {
  LayoutDashboard,
  Receipt,
  ArrowLeftRight,
  TrendingUp,
  Users,
  CreditCard,
  Lightbulb,
  Settings,
  LogOut,
  ChevronRight,
  Building2,
  Sparkles,
  AlertCircle,
  Home,
  Wallet,
  FileText,
  UserCircle,
  BarChart3,
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import BusinessSwitcher from "../components/BusinessSwitcher";
import NotificationCenter from "../components/notifications/NotificationCenter";

// Navigation organized by category - will be filtered based on role
const baseNavigationItems = [
  // Dashboard links based on role
  // Note: Super Admin uses separate AdminLayout, not this Layout
  {
    title: "Dashboard",
    url: (businessId) => `/business/${businessId}/dashboard`,
    icon: Home,
    color: "text-blue-400",
    category: "main",
    roles: ["business_admin"],
    dynamic: true
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    color: "text-blue-400",
    category: "main",
    roles: ["staff", "viewer"]
  },
  {
    title: "KAVI Assistant",
    url: "/voice-assistant",
    icon: Zap,
    color: "text-purple-400",
    badge: "AI",
    category: "ai",
    highlight: true,
    roles: ["super_admin", "business_admin", "staff", "viewer"],
    module_id: "voice-assistant",
    required: true
  },
  
  // Financial Management
  {
    title: "Transactions",
    url: "/transactions",
    icon: Wallet,
    color: "text-emerald-400",
    category: "financial",
    roles: ["super_admin", "business_admin", "staff"],
    module_id: "transactions"
  },
  {
    title: "Invoices",
    url: "/invoices",
    icon: FileText,
    color: "text-cyan-400",
    category: "financial",
    roles: ["super_admin", "business_admin", "staff"],
    module_id: "invoices"
  },
  {
    title: "Cash Flow",
    url: "/cash-flow",
    icon: TrendingUp,
    color: "text-green-400",
    category: "financial",
    roles: ["super_admin", "business_admin"],
    module_id: "cash-flow"
  },
  {
    title: "Credit",
    url: "/credit",
    icon: CreditCard,
    color: "text-orange-400",
    category: "financial",
    roles: ["super_admin", "business_admin"],
    module_id: "credit"
  },
  
  // People & Relationships
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
    color: "text-indigo-400",
    category: "people",
    roles: ["super_admin", "business_admin", "staff"],
    module_id: "suppliers"
  },
  {
    title: "Clients",
    url: "/clients",
    icon: UserCircle,
    color: "text-sky-400",
    category: "people",
    roles: ["super_admin", "business_admin", "staff"],
    module_id: "clients"
  },
  
  // Insights & Alerts
  {
    title: "Insights",
    url: "/insights",
    icon: BarChart3,
    color: "text-violet-400",
    category: "insights",
    roles: ["super_admin", "business_admin"],
    module_id: "insights"
  },
  {
    title: "Alerts",
    url: "/proactive-alerts",
    icon: AlertCircle,
    color: "text-rose-400",
    category: "insights",
    roles: ["super_admin", "business_admin"],
    module_id: "proactive-alerts"
  },
  
  // Settings
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    color: "text-gray-400",
    category: "settings",
    roles: ["super_admin", "business_admin", "staff", "viewer"],
    module_id: "settings",
    required: true
  }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout, isSuperAdmin, isBusinessAdmin, activeBusinessId, setActiveBusiness, getBusinesses } = useAuth();
  const { hasModuleAccess, isLoading: modulesLoading } = useModuleAccess();

  console.log('⚪⚪⚪ Main Layout RENDERING - This should NOT show for /super-admin routes');
  console.log('⚪ Current path:', location.pathname);
  console.log('⚪ User:', user);
  console.log('⚪ Is Super Admin:', isSuperAdmin());

  // CRITICAL: If this is a super admin on a /super-admin route, something is wrong!
  if (location.pathname.startsWith('/super-admin')) {
    console.error('❌❌❌ ERROR: Main Layout is rendering for /super-admin route!');
    console.error('❌ This should use AdminLayout instead!');
    console.error('❌ Redirecting to fix the issue...');
    // Don't redirect here as it might cause a loop
  }

  // Filter navigation items based on user role AND module access
  const navigationItems = baseNavigationItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true; // No roles specified means accessible to all authenticated
    
    const userIsSuperAdmin = isSuperAdmin();
    const userIsBusinessAdmin = isBusinessAdmin(activeBusinessId);
    const userHasMemberships = user?.memberships?.length > 0;
    
    // Role check first
    let hasRoleAccess = false;
    
    // Super admins have access to all items that include "super_admin" in roles
    if (userIsSuperAdmin && item.roles.includes("super_admin")) {
      hasRoleAccess = true;
    }
    
    // Business admins have access to items that include "business_admin"
    if (userIsBusinessAdmin && item.roles.includes("business_admin")) {
      hasRoleAccess = true;
    }
    
    // Staff and viewer roles - check if user has any business membership
    if (userHasMemberships && (item.roles.includes("staff") || item.roles.includes("viewer"))) {
      hasRoleAccess = true;
    }
    
    if (!hasRoleAccess) return false;
    
    // Module access check (if module_id is defined)
    if (item.module_id) {
      // Required modules are always accessible
      if (item.required) return true;
      // Check module access
      return hasModuleAccess(item.module_id);
    }
    
    return true;
  });

  const handleLogout = () => {
    logout(); // Use auth.logout()
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  const renderMenuItem = (item) => {
    let itemUrl = typeof item.url === 'function' 
      ? (activeBusinessId ? item.url(activeBusinessId) : '/dashboard')
      : item.url;
    
    const isActive = location.pathname === itemUrl || 
      (itemUrl === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) ||
      (itemUrl.includes("/super-admin") && location.pathname.includes("/super-admin")) ||
      (itemUrl.includes("/business/") && location.pathname.includes("/business/")) ||
      (itemUrl.includes("/voice-assistant") && location.pathname.includes("/voice-assistant")) ||
      (itemUrl.includes("/transactions") && location.pathname.includes("/transactions")) ||
      (itemUrl.includes("/invoices") && location.pathname.includes("/invoices")) ||
      (itemUrl.includes("/cash-flow") && location.pathname.includes("/cash-flow")) ||
      (itemUrl.includes("/credit") && location.pathname.includes("/credit")) ||
      (itemUrl.includes("/suppliers") && location.pathname.includes("/suppliers")) ||
      (itemUrl.includes("/clients") && location.pathname.includes("/clients")) ||
      (itemUrl.includes("/insights") && location.pathname.includes("/insights")) ||
      (itemUrl.includes("/proactive-alerts") && location.pathname.includes("/proactive-alerts")) ||
      (itemUrl.includes("/settings") && location.pathname.includes("/settings"));
    
    const Icon = item.icon;
    
    return (
      <SidebarMenuItem key={item.title}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            navigate(itemUrl);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title={item.title}
          className={`
            w-full flex items-center justify-start group-data-[collapsible=icon]:justify-center gap-3 px-3 py-2.5 rounded-lg mb-1
            transition-all duration-200 cursor-pointer relative
            ${isActive 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
          `}
          style={{ pointerEvents: 'auto', zIndex: 1000 }}
        >
          <div className={isActive ? 'text-white' : item.color}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <span className={`text-sm font-medium`}>
              {item.title}
            </span>
            {item.badge && (
              <Badge className="ml-auto bg-purple-500 text-white text-[10px] px-1.5 py-0.5 font-semibold">
                {item.badge}
              </Badge>
            )}
          </div>
        </button>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-800 bg-gradient-to-b from-gray-900 to-gray-800">
          <SidebarHeader className="border-b border-gray-700 p-4 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-3 flex-1 min-w-0 group-data-[collapsible=icon]:justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="group-data-[collapsible=icon]:hidden min-w-0">
                  <h2 className="font-bold text-white text-base truncate">FinanceGrowth</h2>
                  <p className="text-[11px] text-gray-400 truncate">SME Co-Pilot</p>
                </div>
              </div>
              <SidebarTrigger className="text-gray-300 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors flex-shrink-0" />
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-2 flex-1 overflow-y-auto custom-scrollbar">
            {/* Main Section */}
            {navigationItems.filter(item => item.category === "main").length > 0 && (
              <SidebarGroup className="mb-4">
                <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                  Workspace
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "main").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* AI Section */}
            {navigationItems.filter(item => item.category === "ai").length > 0 && (
              <SidebarGroup className="mb-4">
                <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                  AI Tools
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "ai").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Financial Section */}
            {navigationItems.filter(item => item.category === "financial").length > 0 && (
              <SidebarGroup className="mb-4">
                <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                  Finance
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "financial").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* People Section */}
            {navigationItems.filter(item => item.category === "people").length > 0 && (
              <SidebarGroup className="mb-4">
                <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                  Contacts
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "people").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Insights Section */}
            {navigationItems.filter(item => item.category === "insights").length > 0 && (
              <SidebarGroup className="mb-4">
                <SidebarGroupLabel className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 mb-1">
                  Intelligence
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "insights").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Settings Section */}
            {navigationItems.filter(item => item.category === "settings").length > 0 && (
              <SidebarGroup className="mt-auto pt-4">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.filter(item => item.category === "settings").map(renderMenuItem)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-700 p-3 flex-shrink-0">
            {user && (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-sm">
                      {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="font-semibold text-white text-sm truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-start group-data-[collapsible=icon]:justify-center gap-2 px-3 py-2 text-sm text-gray-400 hover:bg-red-600/10 hover:text-red-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="group-data-[collapsible=icon]:hidden font-medium">Logout</span>
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto bg-gray-50">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
