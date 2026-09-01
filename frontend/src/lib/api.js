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

/**
 * Normaliza uma resposta que deveria ser uma lista.
 *
 * Existe por causa de um bug concreto: quando o backend devolvia HTML com
 * status 200 para uma rota de API inexistente, o axios entregava uma *string*
 * em `response.data`. O componente guardava a string no lugar da lista e o
 * primeiro `.filter()` estourava "t.filter is not a function", derrubando a
 * árvore inteira do React e deixando a tela branca.
 *
 * A causa foi corrigida no backend (rotas /api agora devolvem 404 em JSON).
 * Esta função é a segunda linha de defesa: qualquer payload que não seja uma
 * lista vira lista vazia, e a tela mostra "sem registros" em vez de sumir.
 *
 * Aceita tanto `[...]` quanto `{ items: [...] }` / `{ data: [...] }`, formatos
 * usados por endpoints paginados.
 */
export function lista(payload) {
  const corpo = payload && payload.data !== undefined ? payload.data : payload;
  if (Array.isArray(corpo)) return corpo;
  if (corpo && Array.isArray(corpo.items)) return corpo.items;
  if (corpo && Array.isArray(corpo.results)) return corpo.results;
  if (corpo && Array.isArray(corpo.data)) return corpo.data;
  return [];
}

/**
 * Mesma ideia para respostas que deveriam ser um objeto de indicadores.
 * Evita que `resumo.receita` quebre quando vier uma string ou nulo.
 */
export function objeto(payload, padrao = {}) {
  const corpo = payload && payload.data !== undefined ? payload.data : payload;
  if (corpo && typeof corpo === "object" && !Array.isArray(corpo)) return corpo;
  return padrao;
}

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
