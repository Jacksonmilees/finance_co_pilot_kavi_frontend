import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { 
  Inbox, FileText, DollarSign, Users, TrendingUp, 
  Plus, ArrowRight, HelpCircle, Sparkles 
} from 'lucide-react';

const emptyStateConfigs = {
  transactions: {
    icon: DollarSign,
    title: 'No Transactions Yet',
    description: 'Start tracking your income and expenses to get better financial insights.',
    primaryAction: {
      label: 'Add Transaction',
      icon: Plus,
      path: '/transactions'
    },
    secondaryAction: {
      label: 'Learn More',
      icon: HelpCircle,
      path: '/help'
    },
    tips: [
      'Record all business income and expenses',
      'Categorize transactions for better insights',
      'KAVI can help analyze your spending patterns'
    ]
  },
  invoices: {
    icon: FileText,
    title: 'No Invoices Yet',
    description: 'Create your first invoice to start getting paid faster.',
    primaryAction: {
      label: 'Create Invoice',
      icon: Plus,
      path: '/invoices'
    },
    secondaryAction: {
      label: 'View Guide',
      icon: HelpCircle,
      path: '/help/invoices'
    },
    tips: [
      'Send invoices immediately after completing work',
      'Set payment terms to manage cash flow',
      'Track overdue invoices with KAVI'
    ]
  },
  customers: {
    icon: Users,
    title: 'No Customers Yet',
    description: 'Add your customers to track relationships and manage invoices.',
    primaryAction: {
      label: 'Add Customer',
      icon: Plus,
      path: '/clients'
    },
    secondaryAction: {
      label: 'Import Customers',
      icon: ArrowRight,
      path: '/clients/import'
    },
    tips: [
      'Add customer contact information',
      'Track payment history per customer',
      'Use KAVI to get customer insights'
    ]
  },
  suppliers: {
    icon: Users,
    title: 'No Suppliers Yet',
    description: 'Add your suppliers to track expenses and manage relationships.',
    primaryAction: {
      label: 'Add Supplier',
      icon: Plus,
      path: '/suppliers'
    },
    tips: [
      'Track supplier payment terms',
      'Monitor supplier expenses',
      'Get insights on supplier spending'
    ]
  },
  cashflow: {
    icon: TrendingUp,
    title: 'No Cash Flow Data',
    description: 'Add transactions to see your cash flow forecast and insights.',
    primaryAction: {
      label: 'Add Transaction',
      icon: Plus,
      path: '/transactions'
    },
    tips: [
      'Cash flow is calculated from your transactions',
      'Add income and expenses to see forecasts',
      'Ask KAVI about your cash flow trends'
    ]
  },
  default: {
    icon: Inbox,
    title: 'No Data Yet',
    description: 'Get started by adding your first item.',
    primaryAction: {
      label: 'Get Started',
      icon: Plus,
      path: '/dashboard'
    }
  }
};

export default function EmptyState({ 
  type = 'default', 
  title, 
  description, 
  primaryAction, 
  secondaryAction,
  tips,
  className = '' 
}) {
  const config = emptyStateConfigs[type] || emptyStateConfigs.default;
  
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalPrimaryAction = primaryAction || config.primaryAction;
  const finalSecondaryAction = secondaryAction || config.secondaryAction;
  const finalTips = tips || config.tips;

  const Icon = config.icon;

  return (
    <Card className={`border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <CardContent className="p-8 md:p-12">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <Icon className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">{finalTitle}</h3>
            <p className="text-gray-600 max-w-md mx-auto">{finalDescription}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {finalPrimaryAction && (
              <Button
                onClick={finalPrimaryAction.onClick}
                asChild={!finalPrimaryAction.onClick}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                {finalPrimaryAction.onClick ? (
                  <>
                    {finalPrimaryAction.icon && (typeof finalPrimaryAction.icon === 'function' ? 
                      <finalPrimaryAction.icon /> : 
                      <finalPrimaryAction.icon className="w-5 h-5 mr-2" />
                    )}
                    {finalPrimaryAction.label}
                  </>
                ) : (
                  <a href={finalPrimaryAction.path}>
                    {finalPrimaryAction.icon && (typeof finalPrimaryAction.icon === 'function' ? 
                      <finalPrimaryAction.icon /> : 
                      <finalPrimaryAction.icon className="w-5 h-5 mr-2" />
                    )}
                    {finalPrimaryAction.label}
                  </a>
                )}
              </Button>
            )}
            {finalSecondaryAction && (
              <Button
                asChild
                variant="outline"
                size="lg"
              >
                <a href={finalSecondaryAction.path}>
                  {finalSecondaryAction.icon && (typeof finalSecondaryAction.icon === 'function' ? 
                    <finalSecondaryAction.icon /> : 
                    <finalSecondaryAction.icon className="w-5 h-5 mr-2" />
                  )}
                  {finalSecondaryAction.label}
                </a>
              </Button>
            )}
          </div>

          {/* Tips */}
          {finalTips && finalTips.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Quick Tips</h4>
              </div>
              <ul className="space-y-2 text-left max-w-md mx-auto">
                {finalTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

