import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import FamilyHome from "./pages/FamilyHome";
import ProfessionalHome from "./pages/ProfessionalHome";
import LogEvent from "./pages/LogEvent";
import PatientDashboard from "./pages/PatientDashboard";
import NotFound from "./pages/NotFound";
import Medications from "./pages/Medications";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const HomeRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'professional') return <ProfessionalHome />;
  return <FamilyHome />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<Auth />} />
    <Route path="/" element={<ProtectedRoute><HomeRouter /></ProtectedRoute>} />
    <Route path="/log-event" element={<ProtectedRoute><LogEvent /></ProtectedRoute>} />
    <Route path="/patient/:patientId" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
    <Route path="/medications" element={<Medications />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
