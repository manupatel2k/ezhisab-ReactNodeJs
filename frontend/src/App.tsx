import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { ReportProvider } from "./context/ReportContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import UserAudit from "./pages/UserAudit";
import { StoreHeader } from "./components";
import { AuthProvider, useAuthContext } from '@/context/AuthContext';
import ManageStores from '@/pages/ManageStores';
import { StoreProvider } from '@/context/StoreContext';

const queryClient = new QueryClient();

// Layout component that includes the header for all protected routes
const AppLayout = () => (
  <>
    <StoreHeader />
    <div className="container mx-auto py-4">
      <Outlet />
    </div>
  </>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Check if the user has admin role for admin routes
    if (requiredRole === 'admin' && user?.role !== 'admin') {
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
};

// Renamed from AppRoutes to AppRouter to avoid naming conflict
const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={
            <ReportProvider>
              <Index />
            </ReportProvider>
          }
        />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audit"
          element={
            <ProtectedRoute requiredRole="admin">
              <UserAudit />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/stores"
          element={
            <ProtectedRoute requiredRole="admin">
              <ManageStores />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ReportProvider>
              <Index />
            </ReportProvider>
          }
        />
      </Route>
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <StoreProvider>
            <Router>
              <ReportProvider>
                <AppRouter />
              </ReportProvider>
            </Router>
          </StoreProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
