import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';

/**
 * Contextual help tooltip component
 * Shows helpful information when user clicks help icon
 */
export default function HelpTooltip({ 
  title, 
  content, 
  placement = 'top',
  className = '' 
}) {
  const [isOpen, setIsOpen] = useState(false);

  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-blue-600 transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Tooltip */}
          <Card className={`absolute z-50 w-64 md:w-80 shadow-xl border-2 border-blue-200 ${placementClasses[placement]}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">{content}</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}












