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
import Medications from "./pages/Medications";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/" element={user ? (user.role === 'professional' ? <ProfessionalHome /> : <FamilyHome />) : <Navigate to="/auth" />} />
      <Route path="/log-event" element={user ? <LogEvent /> : <Navigate to="/auth" />} />
      <Route path="/patient/:patientId" element={user ? <PatientDashboard /> : <Navigate to="/auth" />} />
      <Route path="/medications" element={user ? <Medications /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

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
