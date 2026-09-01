import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import FronteiraDeErro from "@/components/FronteiraDeErro";
import { ToastProvider } from "@/components/ui";
import Landing from "@/pages/Landing";
import { Login, Register } from "@/pages/Auth";
import AppLayout from "@/pages/AppLayout";
import Sales from "@/pages/Sales";
import Dashboard from "@/pages/Dashboard";
import Finance from "@/pages/Finance";
import { Customers, Inventory, Invoices, Settings } from "@/pages/Modules";

/** Rotas públicas: quem já está logado vai direto para Vendas. */
function SomentePublico({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app/vendas" replace />;
  return children;
}

function Protegida({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <FronteiraDeErro>
      <BrowserRouter>
        <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<SomentePublico><Landing /></SomentePublico>} />
            <Route path="/login" element={<SomentePublico><Login /></SomentePublico>} />
            <Route path="/cadastro" element={<SomentePublico><Register /></SomentePublico>} />

            <Route path="/app" element={<Protegida><AppLayout /></Protegida>}>
              {/* Vendas é a rota padrão do app. */}
              <Route index element={<Navigate to="/app/vendas" replace />} />
              <Route path="vendas" element={<Sales />} />
              <Route path="estoque" element={<Inventory />} />
              <Route path="clientes" element={<Customers />} />
              <Route path="financeiro" element={<Finance />} />
              <Route path="notas" element={<Invoices />} />
              <Route path="painel" element={<Dashboard />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>

            {/* Compatibilidade com as rotas da versão anterior. */}
            <Route path="/dashboard" element={<Navigate to="/app/painel" replace />} />
            <Route path="/vendas" element={<Navigate to="/app/vendas" replace />} />
            <Route path="/estoque" element={<Navigate to="/app/estoque" replace />} />
            <Route path="/clientes" element={<Navigate to="/app/clientes" replace />} />
            <Route path="/financeiro" element={<Navigate to="/app/financeiro" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </FronteiraDeErro>
  );
}
