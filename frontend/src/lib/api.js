import axios from "axios";

const BACKEND_URL = window.location.origin;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sd_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

/** Versão compacta para KPIs: R$ 12,4 mil / R$ 1,2 mi. */
export const formatBRLShort = (v) => {
  const n = Number(v || 0);
  const abs = Math.abs(n);
  if (abs >= 1000000) return `R$ ${(n / 1000000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 10000) return `R$ ${(n / 1000).toFixed(1).replace(".", ",")} mil`;
  return formatBRL(n);
};

export const formatPct = (v) => `${Number(v || 0).toFixed(1)}%`;

export const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(String(iso).length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
};

export const formatDayShort = (iso) => {
  if (!iso) return "";
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso).slice(5);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

export const monthLabel = (ym) => {
  if (!ym) return "";
  const [y, m] = String(ym).split("-");
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${nomes[Number(m) - 1] || m}/${String(y).slice(2)}`;
};

/** Dias até o vencimento (negativo = já venceu). */
export const daysUntil = (iso) => {
  if (!iso) return 0;
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`);
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  return Math.round((d - hoje) / 86400000);
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const apiError = (e, fallback = "Não foi possível concluir a operação.") => {
  const d = e && e.response && e.response.data && e.response.data.detail;
  if (typeof d === "string") return d;
  return (e && e.message) || fallback;
};
