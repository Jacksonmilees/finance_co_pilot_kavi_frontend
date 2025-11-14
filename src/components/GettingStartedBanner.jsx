import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

/**
 * Getting Started Banner for new users
 * Shows helpful tips and quick links
 */
export default function GettingStartedBanner({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('getting_started_dismissed', 'true');
    if (onDismiss) onDismiss();
  };

  // Check if already dismissed
  if (dismissed || localStorage.getItem('getting_started_dismissed') === 'true') {
    return null;
  }

  const quickSteps = [
    { id: 1, label: 'Add your first transaction', path: '/transactions' },
    { id: 2, label: 'Create an invoice', path: '/invoices' },
    { id: 3, label: 'Add a customer', path: '/clients' },
    { id: 4, label: 'Try KAVI assistant', path: '/voice-assistant' }
  ];

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-lg mb-6">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Welcome! Let's Get Started</h3>
                <p className="text-sm text-gray-600">Complete these quick steps to set up your business</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
              {quickSteps.map((step) => (
                <Button
                  key={step.id}
                  asChild
                  variant="outline"
                  className="justify-start border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                >
                  <Link to={step.path}>
                    <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                    <span className="text-sm">{step.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-blue-600" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}












