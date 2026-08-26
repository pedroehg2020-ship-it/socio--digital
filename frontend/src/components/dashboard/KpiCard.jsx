import { TrendUp, TrendDown } from "@phosphor-icons/react";

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export function KpiCard({ label, value, variacao, tone = "neutral", testId }) {
  const toneClass = tone === "credit" ? "text-credit" : tone === "debit" ? "text-debit" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="bg-card border border-border border-t-2 rounded-lg p-6 hover:-translate-y-[1px] hover:border-foreground/20 transition-transform h-full" style={{ borderTopColor: tone === "credit" ? "hsl(var(--credit))" : tone === "debit" ? "hsl(var(--debit))" : tone === "warning" ? "hsl(var(--warning))" : "hsl(var(--primary))" }} data-testid={testId}>
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
