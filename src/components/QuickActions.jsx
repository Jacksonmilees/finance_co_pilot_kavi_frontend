import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { 
  Plus, FileText, DollarSign, Users, TrendingUp, 
  CreditCard, Sparkles, ArrowRight, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useModuleAccess } from '../hooks/useModuleAccess';

const quickActions = [
  {
    id: 'transaction',
    label: 'Add Transaction',
    icon: DollarSign,
    path: '/transactions',
    moduleId: 'transactions',
    color: 'bg-green-50 text-green-700 hover:bg-green-100',
    description: 'Record income or expense'
  },
  {
    id: 'invoice',
    label: 'Create Invoice',
    icon: FileText,
    path: '/invoices',
    moduleId: 'invoices',
    color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    description: 'Generate new invoice'
  },
  {
    id: 'customer',
    label: 'Add Customer',
    icon: Users,
    path: '/clients',
    moduleId: 'clients',
    color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    description: 'Register new customer'
  },
  {
    id: 'kavi',
    label: 'Ask KAVI',
    icon: Sparkles,
    path: '/voice-assistant',
    moduleId: 'voice-assistant',
    color: 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100',
    description: 'Get AI insights',
    highlight: true
  }
];

export default function QuickActions({ className = '' }) {
  const { user, activeBusinessId } = useAuth();
  const { hasModuleAccess } = useModuleAccess();

  // Filter actions based on module access
  const availableActions = quickActions.filter(action => {
    if (!action.moduleId) return true;
    return hasModuleAccess(action.moduleId);
  });

  // Show top 4 actions
  const displayActions = availableActions.slice(0, 4);

  if (displayActions.length === 0) {
    return null;
  }

  return (
    <Card className={`border border-gray-200 shadow-sm ${className}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {displayActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                asChild
                variant="outline"
                className={`h-auto flex-col gap-2 p-4 ${action.color} border-2 ${
                  action.highlight ? 'border-indigo-300 shadow-md' : 'border-gray-200'
                }`}
              >
                <Link to={action.path}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    action.highlight ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-white'
                  }`}>
                    <Icon className={`w-6 h-6 ${action.highlight ? 'text-white' : 'text-current'}`} />
                  </div>
                  <span className="text-sm font-medium text-center">{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-gray-600 text-center">{action.description}</span>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}












