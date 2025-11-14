import { Navigate } from 'react-router-dom';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { AlertCircle, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import LoadingSpinner from '../LoadingSpinner';

/**
 * Route guard component that checks if user has access to a module
 * Shows friendly error message if module is disabled
 */
export function RequireModule({ moduleId, children, redirectTo = '/dashboard' }) {
  const { hasModuleAccess, isLoading } = useModuleAccess();
  const { isSuperAdmin } = useAuth();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-6 bg-white min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card>
          <CardContent className="p-8">
            <LoadingSpinner size="lg" text="Checking module access..." />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Super admins bypass module checks
  if (isSuperAdmin()) {
    return children;
  }
  
  // Check module access
  if (!hasModuleAccess(moduleId)) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="max-w-2xl mx-auto mt-8">
          <Card className="border-2 border-yellow-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-yellow-900">Module Not Available</CardTitle>
                  <p className="text-sm text-yellow-700 mt-1">This feature requires module activation</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-900 font-medium">Module Access Required</p>
                    <p className="text-blue-700 text-sm mt-1">
                      This module has not been enabled for your business. 
                      Please contact your business administrator or super admin to enable this feature.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>What you can do:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Contact your business administrator to request module access</li>
                    <li>Reach out to super admin for assistance</li>
                    <li>Check your business settings for available modules</li>
                  </ul>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="flex-1 border-gray-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                  </Button>
                  <Button
                    onClick={() => window.location.href = redirectTo}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return children;
}













