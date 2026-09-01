import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatBRLShort, objeto } from "@/lib/api";
import Icon from "@/components/Icons";
import ChatDrawer from "@/components/ChatDrawer";

/**
 * Ordem da navegação: Vendas é o primeiro item e a rota padrão de /app.
 * É a tela onde o dia do lojista começa e a que o cliente vê primeiro.
 */
const NAV = [
  {
    grupo: "Operação",
    itens: [
      { to: "/app/vendas", icon: "cart", label: "Vendas" },
      { to: "/app/estoque", icon: "box", label: "Estoque" },
      { to: "/app/clientes", icon: "users", label: "Clientes" },
    ],
  },
  {
    grupo: "Financeiro",
    itens: [
      { to: "/app/financeiro", icon: "wallet", label: "Financeiro", badgeKey: "financeiro" },
      { to: "/app/notas", icon: "invoice", label: "Notas fiscais" },
    ],
  },
  {
    grupo: "Gestão",
    itens: [
      { to: "/app/painel", icon: "gauge", label: "Painel do sócio" },
      { to: "/app/configuracoes", icon: "gear", label: "Configurações" },
    ],
  },
];

const TITULOS = {
  "/app/vendas": ["Vendas", "Registre pedidos e acompanhe o faturamento"],
  "/app/estoque": ["Estoque", "Saldo, custo e reposição de produtos"],
  "/app/clientes": ["Clientes", "Carteira, recorrência e clientes em risco"],
  "/app/financeiro": ["Financeiro", "Receber, pagar, fluxo de caixa e DRE"],
  "/app/notas": ["Notas fiscais", "Emissão e histórico de NF-e e NFS-e"],
  "/app/painel": ["Painel do sócio", "Indicadores do mês e radar inteligente"],
  "/app/configuracoes": ["Configurações", "Empresa, avisos e integrações"],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.get("/overview").then((r) => setOverview(objeto(r))).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  const [titulo, subtitulo] = TITULOS[pathname] || ["Sócio Digital", ""];

  const vencidos =
    overview && (overview.receber_vencido > 0 || overview.pagar_vencido > 0)
      ? "!"
      : null;

  const sair = () => {
    logout();
    nav("/", { replace: true });
  };

  return (
    <div className="shell">
      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="mark">SD</span>
          <div>
            <strong>Sócio Digital</strong>
            <span>{user?.company_name || "Minha empresa"}</span>
          </div>
        </div>

        {NAV.map((g) => (
          <div key={g.grupo}>
            <div className="nav-group-label">{g.grupo}</div>
            <nav className="nav">
              {g.itens.map((i) => (
                <NavLink
                  key={i.to}
                  to={i.to}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon name={i.icon} size={17} />
                  {i.label}
                  {i.badgeKey === "financeiro" && vencidos && (
                    <span className="badge-dot">{vencidos}</span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-foot">
          <div className="sidebar-card">
            <b>Caixa a receber</b>
            {overview ? (
              <>
                <div className="num" style={{ fontSize: 17, color: "#6ee7b7" }}>
                  {formatBRLShort(overview.receber_total)}
                </div>
                <div style={{ marginTop: 3 }}>
                  A pagar: <span className="num">{formatBRLShort(overview.pagar_total)}</span>
                </div>
              </>
            ) : (
              <div>Carregando…</div>
            )}
          </div>
          <button className="nav-item mt8" style={{ width: "100%" }} onClick={sair}>
            <Icon name="logout" size={17} /> Sair
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <button
            className="btn btn-ghost btn-sm"
            style={{ display: "none" }}
            id="sd-menu-btn"
            onClick={() => setMenuAberto((v) => !v)}
          >
            <Icon name="menu" size={16} />
          </button>
          <div>
            <h1>{titulo}</h1>
            <div className="sub">{subtitulo}</div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-blue btn-sm" onClick={() => setChatAberto(true)}>
              <Icon name="robot" size={15} /> Falar com a IA
            </button>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg,#0a1128,#1e3a8a)",
                color: "#fff", display: "grid", placeItems: "center",
                fontSize: 13, fontWeight: 600, fontFamily: "Outfit, sans-serif",
              }}
              title={user?.name}
            >
              {(user?.name || "?").slice(0, 1).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="page">
          <Outlet context={{ overview }} />
        </div>
      </div>

      {!chatAberto && (
        <button className="chat-fab" onClick={() => setChatAberto(true)}>
          <Icon name="chat" size={17} /> Falar com a IA
        </button>
      )}
      <ChatDrawer open={chatAberto} onClose={() => setChatAberto(false)} />

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(10,17,40,.45)", zIndex: 80 }}
        />
      )}
    </div>
  );
}
