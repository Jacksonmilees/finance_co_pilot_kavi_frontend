import {
  DollarSign,
  Receipt,
  TrendingUp,
  CreditCard,
  Users,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Settings,
  Sparkles,
  Building2
} from 'lucide-react';

/**
 * Complete module definitions for the Finance Growth Co-Pilot system
 * Each module maps to a route and defines access requirements
 */
export const MODULE_DEFINITIONS = {
  transactions: {
    id: 'transactions',
    name: 'Transactions',
    description: 'Manage income and expenses',
    route: '/transactions',
    icon: DollarSign,
    category: 'financial',
    color: 'bg-green-100 text-green-700',
    roles: ['super_admin', 'business_admin', 'staff'],
    required: false
  },
  invoices: {
    id: 'invoices',
    name: 'Invoices',
    description: 'Create and manage invoices',
    route: '/invoices',
    icon: Receipt,
    category: 'financial',
    color: 'bg-blue-100 text-blue-700',
    roles: ['super_admin', 'business_admin', 'staff'],
    required: false
  },
  cashFlow: {
    id: 'cash-flow',
    name: 'Cash Flow',
    description: 'Track cash flow and forecasts',
    route: '/cash-flow',
    icon: TrendingUp,
    category: 'financial',
    color: 'bg-purple-100 text-purple-700',
    roles: ['super_admin', 'business_admin'],
    required: false
  },
  credit: {
    id: 'credit',
    name: 'Credit Management',
    description: 'Manage credit scores and applications',
    route: '/credit',
    icon: CreditCard,
    category: 'financial',
    color: 'bg-indigo-100 text-indigo-700',
    roles: ['super_admin', 'business_admin'],
    required: false
  },
  suppliers: {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Manage supplier relationships',
    route: '/suppliers',
    icon: Users,
    category: 'people',
    color: 'bg-orange-100 text-orange-700',
    roles: ['super_admin', 'business_admin', 'staff'],
    required: false
  },
  clients: {
    id: 'clients',
    name: 'Clients',
    description: 'Manage customer relationships',
    route: '/clients',
    icon: Users,
    category: 'people',
    color: 'bg-teal-100 text-teal-700',
    roles: ['super_admin', 'business_admin', 'staff'],
    required: false
  },
  reports: {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Financial reports and insights',
    route: '/insights',
    icon: BarChart3,
    category: 'insights',
    color: 'bg-purple-100 text-purple-700',
    roles: ['super_admin', 'business_admin'],
    required: false
  },
  insights: {
    id: 'insights',
    name: 'AI Insights',
    description: 'AI-powered financial insights',
    route: '/insights',
    icon: Lightbulb,
    category: 'insights',
    color: 'bg-yellow-100 text-yellow-700',
    roles: ['super_admin', 'business_admin'],
    required: false
  },
  alerts: {
    id: 'proactive-alerts',
    name: 'Proactive Alerts',
    description: 'Financial alerts and notifications',
    route: '/proactive-alerts',
    icon: AlertCircle,
    category: 'insights',
    color: 'bg-red-100 text-red-700',
    roles: ['super_admin', 'business_admin'],
    required: false
  },
  team: {
    id: 'team',
    name: 'Team Management',
    description: 'Manage team members',
    route: (businessId) => `/business/${businessId}/team`,
    icon: Users,
    category: 'management',
    color: 'bg-pink-100 text-pink-700',
    roles: ['super_admin', 'business_admin'],
    required: false,
    dynamic: true
  },
  voiceAssistant: {
    id: 'voice-assistant',
    name: 'KAVI Voice Assistant',
    description: 'AI voice assistant',
    route: '/voice-assistant',
    icon: Sparkles,
    category: 'ai',
    color: 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700',
    roles: ['super_admin', 'business_admin', 'staff', 'viewer'],
    required: true // Always available
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    description: 'Business settings and configuration',
    route: '/settings',
    icon: Settings,
    category: 'settings',
    color: 'bg-gray-100 text-gray-700',
    roles: ['super_admin', 'business_admin', 'staff', 'viewer'],
    required: true // Always available
  }
};

/**
 * Get module by ID
 */
export const getModuleById = (moduleId) => {
  return Object.values(MODULE_DEFINITIONS).find(m => m.id === moduleId);
};

/**
 * Get modules by category
 */
export const getModulesByCategory = (category) => {
  return Object.values(MODULE_DEFINITIONS).filter(m => m.category === category);
};

/**
 * Get all module IDs
 */
export const getAllModuleIds = () => {
  return Object.values(MODULE_DEFINITIONS).map(m => m.id);
};

/**
 * Module categories for organization
 */
export const MODULE_CATEGORIES = {
  financial: {
    name: 'Financial',
    icon: DollarSign,
    color: 'text-blue-600'
  },
  people: {
    name: 'People',
    icon: Users,
    color: 'text-orange-600'
  },
  insights: {
    name: 'Insights',
    icon: BarChart3,
    color: 'text-purple-600'
  },
  management: {
    name: 'Management',
    icon: Building2,
    color: 'text-pink-600'
  },
  ai: {
    name: 'AI Assistant',
    icon: Sparkles,
    color: 'text-indigo-600'
  },
  settings: {
    name: 'Settings',
    icon: Settings,
    color: 'text-gray-600'
  }
};













