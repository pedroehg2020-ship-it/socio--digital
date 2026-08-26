import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OnboardingPage from "@/pages/OnboardingPage";
import AppLayout from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ChatPage from "@/pages/ChatPage";
import RadarPage from "@/pages/RadarPage";
import ClientesPage from "@/pages/ClientesPage";
import EstoquePage from "@/pages/EstoquePage";
import FinanceiroPage from "@/pages/FinanceiroPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import CommandCenterPage from "@/pages/CommandCenterPage";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<CommandCenterPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="investigar" element={<ChatPage mode="investigate" />} />
              <Route path="simular" element={<ChatPage mode="simulate" />} />
              <Route path="acoes" element={<RadarPage />} />
              <Route path="dados" element={<DashboardPage />} />
              <Route path="radar" element={<RadarPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="estoque" element={<EstoquePage />} />
              <Route path="financeiro" element={<FinanceiroPage />} />
              <Route path="configuracoes" element={<ConfiguracoesPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
