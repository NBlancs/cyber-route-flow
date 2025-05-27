import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import Index from "./pages/Index";
import AuthPage from "./pages/auth";
import CustomersPage from "./pages/customers";
import ShipmentsPage from "./pages/shipments";
import NotFound from "./pages/NotFound";
import UserDashboardPage from "./pages/user-dashboard";
import ProofOfDeliveryPage from "./pages/proof-of-delivery";
import { useEffect } from "react";
import CongratulationsPage from "./pages/congratulations";
import { preventCaching } from "./utils/cacheManager";
import CacheDebugger from "./components/CacheDebugger";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode;
  requiredRole?: string;
}) {
  const { user, loading, userRole } = useAuth();
  const location = useLocation();
  
  // Log for debugging
  useEffect(() => {
    console.log("Protected Route Check:", { 
      userRole, 
      requiredRole, 
      isAuthenticated: !!user, 
      isLoading: loading,
      currentPath: location.pathname
    });
  }, [user, loading, userRole, requiredRole, location.pathname]);
  
  // Show loading only briefly, with a maximum timeout
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-dark">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyber-neon border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyber-neon">Loading...</p>
          <p className="text-gray-400 text-sm mt-2">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }
  
  // Not authenticated - redirect to login
  if (!user) {
    console.log("User not authenticated, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Role mismatch - redirect based on role
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Access denied: User has role ${userRole} but route requires ${requiredRole}`);
    
    // Redirect users to their appropriate dashboard
    const redirectPath = userRole === 'admin' ? '/' : '/user-dashboard';
    return <Navigate to={redirectPath} replace />;
  }
  
  // Access granted
  return <>{children}</>;
}

const App = () => {
  useEffect(() => {
    // Prevent caching on app initialization
    preventCaching();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<ProtectedRoute requiredRole="admin"><Index /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute requiredRole="admin"><CustomersPage /></ProtectedRoute>} />
              <Route path="/shipments" element={<ProtectedRoute requiredRole="admin"><ShipmentsPage /></ProtectedRoute>} />
              <Route path="/proof-of-delivery" element={<ProtectedRoute requiredRole="admin"><ProofOfDeliveryPage /></ProtectedRoute>} />
              <Route path="/user-dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboardPage /></ProtectedRoute>} />
              <Route path="/congratulations" element={<CongratulationsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <CacheDebugger />
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
