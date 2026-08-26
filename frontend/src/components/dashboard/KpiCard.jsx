import { TrendUp, TrendDown } from "@phosphor-icons/react";

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export function KpiCard({ label, value, variacao, tone = "neutral", testId }) {
  const toneClass = tone === "credit" ? "text-credit" : tone === "debit" ? "text-debit" : tone === "warning" ? "text-warning" : "text-foreground";
  const surfaceClass = tone === "credit" ? "from-emerald-500/15 to-emerald-500/[0.03]" : tone === "debit" ? "from-rose-500/15 to-rose-500/[0.03]" : tone === "warning" ? "from-amber-500/15 to-amber-500/[0.03]" : "from-blue-500/15 to-blue-500/[0.03]";
  return (
    <div className={`bg-gradient-to-br ${surfaceClass} border border-border/70 rounded-xl p-6 hover:-translate-y-[2px] hover:shadow-md transition-all h-full`} data-testid={testId}>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneClass}`}>{formatCurrency(value)}</p>
      {variacao !== null && variacao !== undefined && (
        <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${variacao >= 0 ? "text-credit" : "text-debit"}`}>
          {variacao >= 0 ? <TrendUp size={14} /> : <TrendDown size={14} />}
          {Math.abs(variacao)}% vs mês anterior
        </div>
      )}
    </div>
  );
}
