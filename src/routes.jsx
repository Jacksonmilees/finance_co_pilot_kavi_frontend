import { createBrowserRouter } from "react-router-dom";
import Layout from "./layouts/Layout";
import AdminLayout from "./layouts/AdminLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import DataEntryDashboard from "./pages/DataEntryDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Insights from "./pages/Insights";
import Transactions from "./pages/Transactions";
import Invoices from "./pages/Invoices";
import CashFlow from "./pages/CashFlow";
import Suppliers from "./pages/Suppliers";
import Credit from "./pages/Credit";
import Settings from "./pages/Settings";
import VoiceAssistant from "./pages/VoiceAssistant";
import ProactiveAlerts from "./pages/ProactiveAlerts";
import CustomerPortal from "./pages/CustomerPortal";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ElevenLabs from "./pages/ElevenLabs";
import Clients from "./pages/Clients";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import RootRedirect from "./components/RootRedirect";
import { RequireAuth, RequireSuperAdmin, RequireBusinessAdmin } from "./components/guards";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminDashboardTest from "./pages/SuperAdminDashboardTest";
import BusinessAdminDashboard from "./pages/BusinessAdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import Team from "./pages/Team";
import UserManagement from "./pages/admin/UserManagement";
import SecurityModule from "./pages/admin/SecurityModule";
import ActivityLogs from "./pages/admin/ActivityLogs";
import ModuleAssignment from "./pages/admin/ModuleAssignment";
import BusinessMonitoring from "./pages/admin/BusinessMonitoring";
import RegisterNew from "./pages/RegisterNew";
import RegistrationStatus from "./pages/RegistrationStatus";
import SuperAdminApprovals from "./pages/SuperAdminApprovals";
import SuperAdminBusinessAssignment from "./pages/SuperAdminBusinessAssignment";
import RoutingDiagnostic from "./pages/RoutingDiagnostic";
import Analytics from "./pages/admin/Analytics";
import Security from "./pages/admin/Security";
import AdminSettings from "./pages/admin/AdminSettings";
import Documents from "./pages/admin/Documents";

export const router = createBrowserRouter([
  // Super Admin Routes with AdminLayout (MUST be first to avoid being caught by Layout)
  {
    path: "/super-admin",
    element: <RequireAuth><RequireSuperAdmin><AdminLayout /></RequireSuperAdmin></RequireAuth>,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <SuperAdminDashboard />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "users",
        element: <UserManagement />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "businesses",
        element: <BusinessMonitoring />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "approvals",
        element: <SuperAdminApprovals />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "assign-users",
        element: <SuperAdminBusinessAssignment />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "logs",
        element: <ActivityLogs />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "documents",
        element: <Documents />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "analytics",
        element: <Analytics />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "security",
        element: <Security />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "settings",
        element: <AdminSettings />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "test",
        element: <SuperAdminDashboardTest />,
        errorElement: <ErrorBoundary />
      },
      {
        path: "diagnostic",
        element: <RoutingDiagnostic />,
        errorElement: <ErrorBoundary />
      }
    ]
  },
  // Root redirect
  {
    path: "/",
    element: <RootRedirect />,
    errorElement: <ErrorBoundary />,
    index: true
  },
  // Main Layout Routes (for regular users, business admins, etc.)
  {
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      { 
        path: "dashboard", 
        element: <RequireAuth><RoleBasedRedirect /></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "old-dashboard", 
        element: <RequireAuth><UserDashboard /></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "business/:businessId/dashboard", 
        element: <RequireAuth><RequireBusinessAdmin><BusinessAdminDashboard /></RequireBusinessAdmin></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "business/:businessId/team", 
        element: <RequireAuth><RequireBusinessAdmin><Team /></RequireBusinessAdmin></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      // Legacy routes - redirect to new dashboards
      { 
        path: "data-entry-dashboard", 
        element: <RequireAuth><UserDashboard /></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "admin-dashboard", 
        element: <RequireAuth><UserDashboard /></RequireAuth>,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "insights", 
        element: <Insights />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "proactive-alerts", 
        element: <ProactiveAlerts />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "transactions", 
        element: <Transactions />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "invoices", 
        element: <Invoices />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "cash-flow", 
        element: <CashFlow />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "suppliers", 
        element: <Suppliers />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "credit", 
        element: <Credit />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "clients", 
        element: <Clients />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "customer-portal", 
        element: <CustomerPortal />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "voice-assistant", 
        element: <VoiceAssistant />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "elevenlabs", 
        element: <ElevenLabs />,
        errorElement: <ErrorBoundary />
      },
      { 
        path: "settings", 
        element: <Settings />,
        errorElement: <ErrorBoundary />
      }
    ]
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorBoundary />
  },
  {
    path: "/register",
    element: <RegisterNew />,
    errorElement: <ErrorBoundary />
  },
  {
    path: "/registration-status",
    element: <RegistrationStatus />,
    errorElement: <ErrorBoundary />
  },
  {
    path: "/registration-status/:email",
    element: <RegistrationStatus />,
    errorElement: <ErrorBoundary />
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

// Suppress React Router future flag warning
console.log = ((originalLog) => {
  return function (...args) {
    if (args[0]?.includes?.('React Router Future Flag Warning')) {
      return; // Suppress this warning
    }
    originalLog.apply(console, args);
  };
})(console.log);
