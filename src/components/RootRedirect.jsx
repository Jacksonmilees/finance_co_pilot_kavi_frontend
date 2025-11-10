import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "@/pages/Login";
import { useAuth } from "../contexts/AuthContext";

export default function RootRedirect() {
  const navigate = useNavigate();
  
  // Safely get auth context - handle case where it might not be available yet
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    // If AuthProvider is not available, just show login
    return <Login />;
  }

  useEffect(() => {
    if (!auth) return;
    if (auth.loading) return;
    if (!auth.isAuthenticated) return; // show login

    if (auth.isSuperAdmin && auth.isSuperAdmin()) {
      navigate('/super-admin', { replace: true });
      return;
    }
    
    if (auth.getBusinesses) {
      const businesses = auth.getBusinesses();
      const adminBiz = businesses.find(b => b.role === 'business_admin');
      if (adminBiz) {
        navigate(`/business/${adminBiz.id}/dashboard`, { replace: true });
        return;
      }
    }
    
    navigate('/dashboard', { replace: true });
  }, [auth?.loading, auth?.isAuthenticated, navigate, auth]);

  return <Login />;
}

