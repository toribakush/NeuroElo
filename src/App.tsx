import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import FamilyHome from "./pages/FamilyHome";
import LogEvent from "./pages/LogEvent";
import Medications from "./pages/Medications";
import ProfessionalHome from "./pages/ProfessionalHome";
import PatientDashboard from "./pages/PatientDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'professional' ? <ProfessionalHome /> : <FamilyHome />}
        </ProtectedRoute>
      } />
      <Route path="/log-event" element={
        <ProtectedRoute>
          <LogEvent />
        </ProtectedRoute>
      } />
      <Route path="/medications" element={
        <ProtectedRoute>
          <Medications />
        </ProtectedRoute>
      } />
      <Route path="/patient/:patientId" element={
        <ProtectedRoute>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
