import { createContext, useCallback, useContext, useEffect, useState } from "react";
import Icon from "./Icons";

/* ------------------------------------------------------------------ cards */

export const Card = ({ children, className = "", ...rest }) => (
  <div className={`card ${className}`} {...rest}>
    {children}
  </div>
);

export const CardHead = ({ title, subtitle, icon, iconClass = "", right }) => (
  <div className="card-head">
    {icon && (
      <span className={`kpi-icon ${iconClass}`} style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center" }}>
        <Icon name={icon} size={16} />
      </span>
    )}
    <div>
      <h3>{title}</h3>
      {subtitle && <div className="card-sub">{subtitle}</div>}
    </div>
    {right && <div className="right">{right}</div>}
  </div>
);

/** KPI colorido — o bloco que substitui os cards brancos do painel. */
export const Kpi = ({ tone = "blue", icon = "dot", label, value, foot, footIcon }) => (
  <div className={`kpi kpi-${tone}`}>
    <div className="kpi-top">
      <span className="kpi-icon">
        <Icon name={icon} size={16} />
      </span>
      <span className="kpi-label">{label}</span>
    </div>
    <div className="kpi-value num">{value}</div>
    {foot && (
      <div className="kpi-foot">
        {footIcon && <Icon name={footIcon} size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />}
        {foot}
      </div>
    )}
  </div>
);

export const Tile = ({ tone = "slate", label, value, foot }) => (
  <div className={`tile tile-${tone}`}>
    <div className="t-label">{label}</div>
    <div className="t-value num">{value}</div>
    {foot && <div className="t-foot">{foot}</div>}
  </div>
);

/* ----------------------------------------------------------------- badges */

const STATUS_TONE = {
  pago: "ok",
  autorizada: "ok",
  ativo: "ok",
  confirmada: "ok",
  aberto: "info",
  pendente: "warn",
  vencido: "alert",
  cancelado: "neutral",
  cancelada: "neutral",
  novo: "violet",
  inativo: "neutral",
  risco: "alert",
  excesso: "warn",
  critico: "alert",
};

export const StatusBadge = ({ status }) => {
  const key = String(status || "").toLowerCase();
  const tone = STATUS_TONE[key] || "neutral";
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : "—";
  return <span className={`badge badge-${tone}`}>{label}</span>;
};

export const Badge = ({ tone = "neutral", children }) => (
  <span className={`badge badge-${tone}`}>{children}</span>
);

/* ------------------------------------------------------------------ modal */

export const Modal = ({ open, title, icon = "plus", onClose, children, footer, width }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <div className="modal-head">
          <Icon name={icon} size={18} />
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ campos */

export const Field = ({ label, children, hint }) => (
  <label className="field">
    <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 5 }}>
      {label}
    </span>
    {children}
    {hint && <span className="small muted" style={{ display: "block", marginTop: 4 }}>{hint}</span>}
  </label>
);

export const Segmented = ({ value, onChange, options }) => (
  <div className="seg">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        className={value === o.value ? "on" : ""}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* ------------------------------------------------------------------ estado */

export const Empty = ({ icon = "search", text }) => (
  <div className="empty">
    <Icon name={icon} size={26} style={{ opacity: 0.4, marginBottom: 8 }} />
    <div>{text}</div>
  </div>
);

export const Loading = ({ text = "Carregando…" }) => (
  <div className="empty">{text}</div>
);

/* ------------------------------------------------------------------ toast */

const ToastCtx = createContext({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

export const ToastProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const push = useCallback((text, tone = "ok") => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, text, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div style={{ position: "fixed", right: 18, bottom: 84, zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((i) => (
          <div
            key={i.id}
            className={`alert-item alert-${i.tone === "ok" ? "success" : i.tone === "alert" ? "critical" : "info"}`}
            style={{ minWidth: 250, boxShadow: "var(--shadow-lg)", background: "#fff" }}
          >
            <span className="ai-icon">
              <Icon name={i.tone === "alert" ? "alert" : "check"} size={15} />
            </span>
            <p>{i.text}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};

/* ------------------------------------------------------------------ tabela */

export const Table = ({ columns, rows, empty = "Nenhum registro encontrado.", renderRow }) => (
  <div className="table-wrap">
    <table className="tbl">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key || c.label} className={c.align === "right" ? "right" : ""}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length}>
              <Empty text={empty} />
            </td>
          </tr>
        ) : (
          rows.map(renderRow)
        )}
      </tbody>
    </table>
  </div>
);
