import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ArrowLeft, Sparkles, DollarSign, Receipt, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';

const steps = [
  {
    id: 1,
    title: 'Welcome to FinanceGrowth!',
    description: 'Your AI-powered financial assistant for SMEs',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          FinanceGrowth helps you manage your business finances with ease. 
          Track income, expenses, invoices, and get AI-powered insights.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-semibold text-sm">Track Finances</h4>
            <p className="text-xs text-gray-600">Monitor income & expenses</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <Receipt className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-semibold text-sm">Manage Invoices</h4>
            <p className="text-xs text-gray-600">Create & track invoices</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <Users className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-semibold text-sm">Team Collaboration</h4>
            <p className="text-xs text-gray-600">Work with your team</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
            <h4 className="font-semibold text-sm">AI Insights</h4>
            <p className="text-xs text-gray-600">Get smart recommendations</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Meet KAVI - Your AI Assistant',
    description: 'Get instant answers about your finances',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-gray-600">
          KAVI is your intelligent financial assistant. Ask questions in English, Swahili, or Sheng!
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg space-y-3">
          <h4 className="font-semibold">Try asking KAVI:</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>"How much did I make this week?"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>"Show me my overdue invoices"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>"What are my expenses this month?"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span>"Give me financial insights"</span>
            </li>
          </ul>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          💡 Tip: Click the microphone icon to start talking with KAVI!
        </p>
      </div>
    )
  },
  {
    id: 3,
    title: 'Quick Start Guide',
    description: 'Get started in 3 easy steps',
    icon: CheckCircle,
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Add Your First Transaction</h4>
              <p className="text-sm text-gray-600">
                Go to Transactions and click "Add Transaction" to record income or expenses.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Create an Invoice</h4>
              <p className="text-sm text-gray-600">
                Navigate to Invoices and create your first invoice for a customer.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Ask KAVI for Insights</h4>
              <p className="text-sm text-gray-600">
                Visit the Voice Assistant and ask KAVI about your finances!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "You're All Set!",
    description: 'Start managing your finances',
    icon: CheckCircle,
    content: (
      <div className="space-y-4 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Ready to Go!</h3>
        <p className="text-gray-600">
          You're all set to start managing your business finances. 
          Remember, you can always ask KAVI for help!
        </p>
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <p className="text-sm text-blue-900">
            <strong>Pro Tip:</strong> Bookmark your dashboard for quick access. 
            The more you use the system, the better insights KAVI can provide!
          </p>
        </div>
      </div>
    )
  }
];

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (onSkip) onSkip();
  };

  if (completed) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 border-blue-200 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">{step.title}</h2>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Content */}
          <div className="min-h-[300px] mb-6">
            {step.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="text-gray-600"
              >
                Skip
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}












