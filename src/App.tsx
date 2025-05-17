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

const queryClient = new QueryClient();

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
      isLoading: loading 
    });
  }, [user, loading, userRole, requiredRole]);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Not authenticated - redirect to login
  if (!user) {
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<ProtectedRoute requiredRole="admin"><Index /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute requiredRole="admin"><CustomersPage /></ProtectedRoute>} />
            <Route path="/shipments" element={<ProtectedRoute requiredRole="admin"><ShipmentsPage /></ProtectedRoute>} />
            <Route path="/proof-of-delivery" element={<ProtectedRoute requiredRole="admin"><ProofOfDeliveryPage /></ProtectedRoute>} />
            <Route path="/user-dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboardPage /></ProtectedRoute>} />
            <Route path="/congratulations" element={<CongratulationsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
