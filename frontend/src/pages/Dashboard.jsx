import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import api, {
  formatBRL, formatBRLShort, formatDate, formatDayShort, formatPct,
} from "@/lib/api";
import Icon from "@/components/Icons";
import { Card, CardHead, Empty, Kpi, Loading, Tile } from "@/components/ui";

const TOM_ALERTA = {
  critical: "critical", critico: "critical", alta: "critical", high: "critical",
  warning: "warning", aviso: "warning", media: "warning", medium: "warning",
  info: "info", baixa: "info", low: "info",
  success: "success", ok: "success",
};

const ICONE_ALERTA = { critical: "alert", warning: "clock", info: "bell", success: "check" };

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [overview, setOverview] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/summary"),
      api.get("/alerts"),
      api.get("/overview"),
    ])
      .then(([d, a, o]) => {
        setResumo(d.data);
        setAlertas(a.data);
        setOverview(o.data);
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <Loading />;
  if (!resumo) return <Empty text="Não foi possível carregar os indicadores." />;

  const tendenciaPositiva = (resumo.sales_trend_pct || 0) >= 0;
  const progresso = Math.min(100, Math.max(0, resumo.goal_progress_pct || 0));

  return (
    <>
      <div className="page-head">
        <h2>Painel do sócio</h2>
        <p>O retrato dos últimos 30 dias e o que o radar encontrou sozinho.</p>
      </div>

      <div className="grid g4 mb16">
        <Kpi
          tone="emerald"
          icon="cart"
          label="Faturamento (30 dias)"
          value={formatBRLShort(resumo.revenue_30)}
          foot={`${resumo.orders_30} pedidos no período`}
        />
        <Kpi
          tone="blue"
          icon={tendenciaPositiva ? "trendUp" : "trendDown"}
          label="Tendência semanal"
          value={`${tendenciaPositiva ? "+" : ""}${formatPct(resumo.sales_trend_pct)}`}
          foot={`Últimos 7 dias: ${formatBRLShort(resumo.revenue_7)}`}
        />
        <Kpi
          tone="violet"
          icon="wallet"
          label="Lucro líquido (30 dias)"
          value={formatBRLShort(resumo.net_profit_30)}
          foot={`Despesas de ${formatBRLShort(resumo.expenses_30)}`}
        />
        <Kpi
          tone="amber"
          icon="target"
          label="Meta do mês"
          value={formatPct(resumo.goal_progress_pct)}
          foot={`Meta de ${formatBRLShort(resumo.goal_monthly)}`}
        />
      </div>

      <div className="grid g-2-1 mb16">
        <Card>
          <CardHead
            title="Receita e lucro"
            subtitle="Evolução diária dos últimos 30 dias"
            icon="trendUp"
            iconClass="kpi-emerald"
          />
          <div className="card-pad" style={{ height: 300 }}>
            {!resumo.daily?.length ? (
              <Empty text="Sem vendas registradas no período." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resumo.daily} margin={{ top: 6, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="dProf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eaf0f8" vertical={false} />
                  <XAxis dataKey="day" tickFormatter={formatDayShort} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#7b8798" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v, n) => [formatBRL(v), n === "revenue" ? "Receita" : "Lucro"]}
                    labelFormatter={(l) => formatDate(l)}
                    contentStyle={{ borderRadius: 10, fontSize: 12.5 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.2} fill="url(#dRev)" />
                  <Area type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={2} fill="url(#dProf)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="grid" style={{ gap: 15, alignContent: "start" }}>
          <Card className="card-pad">
            <div className="row mb12">
              <span className="kpi-icon kpi-amber" style={{ width: 30, height: 30, borderRadius: 9, display: "grid", placeItems: "center", color: "#fff" }}>
                <Icon name="target" size={16} />
              </span>
              <h3 style={{ fontSize: 14.5 }}>Meta mensal</h3>
            </div>
            <div className="num" style={{ fontSize: 24, fontWeight: 600, fontFamily: "Outfit, sans-serif" }}>
              {formatBRL(resumo.revenue_30)}
            </div>
            <div className="small muted mb12">de {formatBRL(resumo.goal_monthly)}</div>
            <div className="progress"><i style={{ width: `${progresso}%` }} /></div>
            <div className="small muted mt8">
              Projeção para o mês: <b className="num">{formatBRL(resumo.projection_monthly)}</b>
            </div>
          </Card>

          <Tile
            tone="blue"
            label="A receber em aberto"
            value={formatBRL(overview?.receber_total)}
            foot={`${formatBRL(overview?.receber_semana)} vencem em 7 dias`}
          />
          <Tile
            tone="rose"
            label="A pagar em aberto"
            value={formatBRL(overview?.pagar_total)}
            foot={`${formatBRL(overview?.pagar_semana)} vencem em 7 dias`}
          />
        </div>
      </div>

      <div className="grid g4 mb16">
        <Tile tone="emerald" label="Produtos cadastrados" value={resumo.products_count} foot="No catálogo" />
        <Tile tone="amber" label="Estoque no limite" value={resumo.low_stock_count} foot="Precisam de reposição" />
        <Tile tone="blue" label="Clientes ativos" value={resumo.customers_count} foot="Na carteira" />
        <Tile tone="violet" label="Notas emitidas" value={overview?.notas_emitidas ?? 0} foot={formatBRL(overview?.valor_notas)} />
      </div>

      <div className="grid g2">
        <Card>
          <CardHead
            title="Radar inteligente"
            subtitle="O que a IA encontrou sem você pedir"
            icon="radar"
            iconClass="kpi-violet"
          />
          <div className="card-pad grid" style={{ gap: 10 }}>
            {alertas.length === 0 ? (
              <Empty icon="check" text="Nenhum problema detectado no momento." />
            ) : (
              alertas.slice(0, 6).map((a) => {
                const tom = TOM_ALERTA[String(a.severity || a.type || "").toLowerCase()] || "info";
                return (
                  <div key={a.id} className={`alert-item alert-${tom}`}>
                    <span className="ai-icon"><Icon name={ICONE_ALERTA[tom]} size={15} /></span>
                    <div>
                      <b>{a.title}</b>
                      <p>{a.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHead
            title="Estoque em atenção"
            subtitle="Produtos no ponto de reposição"
            icon="box"
            iconClass="kpi-cyan"
            right={<Link to="/app/estoque" className="btn btn-ghost btn-sm">Ver estoque</Link>}
          />
          <div className="card-pad grid" style={{ gap: 9 }}>
            {!overview?.estoque_baixo?.length ? (
              <Empty icon="check" text="Nenhum produto no limite de estoque." />
            ) : (
              overview.estoque_baixo.map((p) => (
                <div key={p.id} className="row" style={{ padding: "9px 12px", background: "#fef4e2", border: "1px solid #f7dfb0", borderRadius: 11 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#92400e" }}>{p.name}</span>
                  <span className="spacer badge badge-warn num">
                    {p.stock} / mín. {p.min_stock}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
