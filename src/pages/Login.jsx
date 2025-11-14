import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, AlertCircle, Loader2, Building2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const auth = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await auth.login(username, password);
      
      if (result && result.success) {
        // Use the user data returned from login to make redirect decision
        const userData = result.user;
        
        console.log('🔑 Login successful, user data:', userData);
        console.log('🔑 is_superuser:', userData?.is_superuser);
        
        // Decide redirect based on role and memberships from fresh user data
        if (userData?.is_superuser === true) {
          console.log('✅ Redirecting to /super-admin');
          navigate('/super-admin', { replace: true });
          return;
        }
        
        const memberships = userData?.memberships || [];
        const adminBiz = memberships.find(b => b.role_in_business === 'business_admin');
        if (adminBiz) {
          console.log('✅ Redirecting to business dashboard:', adminBiz.business_id);
          navigate(`/business/${adminBiz.business_id}/dashboard`, { replace: true });
          return;
        }
        
        console.log('✅ Redirecting to /dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        setError(result?.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.message || "Invalid username or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md border-none shadow-2xl backdrop-blur-sm bg-white/95 relative z-10">
        <CardHeader className="text-center space-y-3 pb-6">
          {/* Logo */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg transform hover:scale-105 transition-transform">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">FinanceGrowth</h1>
            <p className="text-sm text-gray-500">SME Financial Co-Pilot</p>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 pt-4">Welcome Back</CardTitle>
          <CardDescription className="text-base text-gray-600">
            Sign in to manage your business finances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isLoading}
                className="h-11 border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                className="h-11 border-gray-300"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">New to FinanceGrowth?</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/register')}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Register Your Business
            </Button>
            <p className="text-xs text-gray-500">
              Already registered? <Button variant="link" className="p-0 h-auto text-blue-600 text-xs" onClick={() => navigate('/registration-status')}>Check status</Button>
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

// Add these animations to your global CSS or tailwind.config.js
// @keyframes blob {
//   0% { transform: translate(0px, 0px) scale(1); }
//   33% { transform: translate(30px, -50px) scale(1.1); }
//   66% { transform: translate(-20px, 20px) scale(0.9); }
//   100% { transform: translate(0px, 0px) scale(1); }
// }
// .animate-blob { animation: blob 7s infinite; }
// .animation-delay-2000 { animation-delay: 2s; }
// .animation-delay-4000 { animation-delay: 4s; }

