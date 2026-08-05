import { NavLink } from "react-router-dom";
import { ChartLineUp } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { NAV_ITEMS } from "./navItems";

export function Sidebar() {
  const { user, company, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-card h-screen sticky top-0" data-testid="sidebar">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
          <ChartLineUp size={18} weight="bold" className="text-primary-foreground" />
        </div>
        <span className="font-heading font-extrabold text-lg tracking-tight">Sócio Digital</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            data-testid={`nav-link-${label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`
            }
          >
            <Icon size={20} weight="duotone" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" data-testid="sidebar-user-name">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{company?.name}</p>
          </div>
        </div>
        <button
          onClick={logout}
          data-testid="logout-btn"
          className="w-full mt-1 text-left px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
