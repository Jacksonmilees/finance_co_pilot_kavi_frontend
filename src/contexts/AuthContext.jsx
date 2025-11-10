// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeBusinessId, setActiveBusinessId] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Set active business when user loads
    if (user?.memberships?.length > 0 && !activeBusinessId) {
      const firstBusiness = user.memberships[0];
      setActiveBusinessId(firstBusiness.business_id);
    }
  }, [user, activeBusinessId]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Set the token in the API client
      apiClient.setToken(token);
      
      // Try to use cached user data first for faster loading
      const cachedUser = localStorage.getItem('user_cache');
      if (cachedUser) {
        try {
          const { data, timestamp } = JSON.parse(cachedUser);
          // Use cache if it's less than 5 minutes old
          if (timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
            setUser(data);
            setIsAuthenticated(true);
            setLoading(false);
            // Fetch fresh data in background
            apiClient.me().then(userData => {
              if (userData) {
                localStorage.setItem('user_cache', JSON.stringify({
                  data: userData,
                  timestamp: Date.now()
                }));
                setUser(userData);
              }
            }).catch(() => {
              // Ignore background fetch errors
            });
            return;
          }
        } catch (e) {
          // Invalid cache, continue to fetch fresh data
        }
      }
      
      // Fetch fresh user data
      const userData = await apiClient.me();
      if (userData) {
        localStorage.setItem('user_cache', JSON.stringify({
          data: userData,
          timestamp: Date.now()
        }));
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_cache');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await apiClient.login(username, password);
      if (response && response.access) {
        localStorage.setItem('access_token', response.access);
        if (response.refresh) {
          localStorage.setItem('refresh_token', response.refresh);
        }
        // Update the apiClient with the new token
        apiClient.setToken(response.access);
        
        // Fetch user data after successful login - use cached version if available
        try {
          const userResponse = await apiClient.me();
          if (userResponse) {
            // Cache user data in localStorage for faster subsequent loads
            localStorage.setItem('user_cache', JSON.stringify({
              data: userResponse,
              timestamp: Date.now()
            }));
            setUser(userResponse);
            setIsAuthenticated(true);
            // Return user data so Login component can make redirect decision
            return { success: true, user: userResponse };
          }
        } catch (userError) {
          console.error('Failed to fetch user data:', userError);
          // Still return success if token was obtained, user data can be fetched later
          setIsAuthenticated(true);
          return { success: true };
        }
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_cache');
    setUser(null);
    setIsAuthenticated(false);
  };

  const isSuperAdmin = () => {
    return user?.is_superuser === true;
  };

  const isBusinessAdmin = (businessId = null) => {
    if (!user?.memberships) return false;
    if (businessId) {
      return user.memberships.some(
        m => m.business_id === businessId && m.role_in_business === 'business_admin' && m.is_active
      );
    }
    return user.memberships.some(m => m.role_in_business === 'business_admin' && m.is_active);
  };

  const getUserRoleInBusiness = (businessId) => {
    if (!user?.memberships) return null;
    const membership = user.memberships.find(m => m.business_id === businessId && m.is_active);
    return membership?.role_in_business || null;
  };

  const getBusinesses = () => {
    return user?.memberships?.map(m => ({
      id: m.business_id,
      name: m.business_name,
      role: m.role_in_business
    })) || [];
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    isSuperAdmin,
    isBusinessAdmin,
    getUserRoleInBusiness,
    getBusinesses,
    activeBusinessId,
    setActiveBusiness: setActiveBusinessId
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};