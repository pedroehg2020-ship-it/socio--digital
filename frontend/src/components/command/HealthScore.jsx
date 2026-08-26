import { useState } from "react";
import { ArrowUpRight, CaretDown, CaretUp } from "@phosphor-icons/react";

export function HealthScore({ health }) {
  const [expanded, setExpanded] = useState(false);
  if (health?.score == null) return null;
  const tone = health.score >= 75 ? "text-emerald-600 dark:text-emerald-400" : health.score >= 55 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";
  const barTone = health.score >= 75 ? "bg-emerald-500" : health.score >= 55 ? "bg-amber-500" : "bg-rose-500";
  const ringTone = health.score >= 75 ? "border-emerald-500/25 bg-emerald-500/10" : health.score >= 55 ? "border-amber-500/25 bg-amber-500/10" : "border-rose-500/25 bg-rose-500/10";
  return (
    <section className="border border-border bg-card p-5 sm:p-6" data-testid="company-health-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Saúde da empresa</p>
          <div className="mt-3 flex items-end gap-3">
            <span className={`font-heading text-5xl font-black tracking-tight ${tone}`} data-testid="company-health-score">{health.score}</span>
            <span className="pb-2 text-sm text-muted-foreground">/ 100 · {health.status}</span>
          </div>
        </div>
        <div className={`hidden h-14 w-14 items-center justify-center rounded-full border-4 sm:flex ${ringTone}`}>
          <ArrowUpRight size={22} className={tone} weight="bold" />
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" aria-label="Pontuação de saúde">
        <div className={`h-full rounded-full transition-[width] duration-700 ${barTone}`} style={{ width: `${health.score}%` }} />
      </div>
      <button onClick={() => setExpanded((value) => !value)} className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-primary" data-testid="company-health-details-btn">
        Por que essa nota? {expanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
      </button>
      {expanded && (
        <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2" data-testid="company-health-breakdown">
          {health.components.map((component) => (
            <div key={component.key} className="flex items-center justify-between gap-3 border-b border-border/60 py-2 last:border-0">
              <div><p className="text-sm font-semibold">{component.label}</p><p className="text-xs text-muted-foreground">{component.reason}</p></div>
              <span className="tabular-nums text-sm font-bold">{component.score}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}