import { ArrowRight, CheckCircle, WarningCircle, WarningOctagon } from "@phosphor-icons/react";

const styles = {
  critical: { icon: WarningOctagon, accent: "border-l-rose-500", iconClass: "text-rose-500", label: "Crítico" },
  important: { icon: WarningCircle, accent: "border-l-amber-500", iconClass: "text-amber-500", label: "Importante" },
  positive: { icon: CheckCircle, accent: "border-l-emerald-500", iconClass: "text-emerald-500", label: "Oportunidade" },
  informative: { icon: CheckCircle, accent: "border-l-blue-500", iconClass: "text-blue-500", label: "Informativo" },
};

export function InsightCard({ insight, onAsk }) {
  const style = styles[insight.severity] || styles.informative;
  const Icon = style.icon;
  return (
    <article className={`border border-border border-l-4 bg-card p-5 transition-transform duration-200 hover:-translate-y-0.5 ${style.accent}`} data-testid={`command-insight-${insight.id}`}>
      <div className="flex items-start gap-3">
        <Icon size={21} weight="fill" className={`mt-0.5 shrink-0 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${style.iconClass}`}>{style.label}</span><span className="text-xs text-muted-foreground">Confiança: {insight.confidence}</span></div>
          <h3 className="mt-2 font-heading text-lg font-bold tracking-tight">{insight.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{insight.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">{insight.evidence.map((item) => <span key={item} className="border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground" data-testid="insight-evidence">{item}</span>)}</div>
          <button onClick={() => onAsk(insight.prompt)} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-primary/70" data-testid={`insight-action-${insight.id}`}>{insight.action}<ArrowRight size={15} /></button>
        </div>
      </div>
    </article>
  );
}