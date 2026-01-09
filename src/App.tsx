import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import FamilyHome from "./pages/FamilyHome";

const Root = () => {
  const { user, isLoading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Timer de emergência para evitar o carregamento infinito
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Se o Auth travar, mas o timer estourar, mandamos para o Login por segurança
  if (isLoading && !timedOut) {
    return (
      <div className="h-screen w-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Se não houver usuário ou se o carregamento deu timeout, mostra Auth */}
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
      <Route path="/" element={user ? <FamilyHome /> : <Navigate to="/auth" />} />
      <Route path="*" element={<Navigate to="/auth" />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
