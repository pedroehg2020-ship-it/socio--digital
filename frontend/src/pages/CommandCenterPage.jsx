import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Lightning, PlayCircle, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_COMMAND_DATA } from "@/lib/demoCommandData";
import { HealthScore } from "@/components/command/HealthScore";
import { InsightCard } from "@/components/command/InsightCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommandCenterPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [demo, setDemo] = useState(false);
  const [question, setQuestion] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await api.get("/command-center/overview"); setData(response.data); setError(false); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const hour = new Date().getHours();
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const active = demo ? { ...DEMO_COMMAND_DATA, greeting: `${saudacao}, ${user?.name?.split(" ")[0] || "gestor"}.` } : data;
  const ask = (prompt) => {
    if (demo) {
      toast.info("No modo demonstração o chat com IA fica indisponível. Importe seus dados para conversar com seu Sócio.");
      return;
    }
    navigate(`/chat?prompt=${encodeURIComponent(prompt)}`);
  };
  const submit = (event) => { event.preventDefault(); if (question.trim()) ask(question.trim()); };

  if (loading) return <div className="space-y-6" data-testid="command-center-loading"><Skeleton className="h-32" /><div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><Skeleton className="h-72" /><Skeleton className="h-72" /></div><Skeleton className="h-44" /></div>;
  if (error) return <div className="border border-rose-200 bg-rose-50 p-6 text-rose-900 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-100" data-testid="command-center-error"><p className="font-bold">Não consegui atualizar sua Central de Comando.</p><p className="mt-1 text-sm">Verifique sua conexão e tente novamente.</p><Button className="mt-4" onClick={load} data-testid="command-center-retry-btn">Tentar novamente</Button></div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6" data-testid="command-center-page">
      {demo && <div className="flex items-center justify-between gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100" data-testid="demo-mode-banner"><div className="flex items-center gap-2 text-sm font-semibold"><PlayCircle size={19} weight="fill" /> Modo demonstração · estes dados são fictícios</div><button onClick={() => setDemo(false)} className="text-xs font-bold underline" data-testid="exit-demo-btn">Voltar aos meus dados</button></div>}
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 md:flex-row md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Central de comando · Hoje</p><h1 className="mt-2 font-heading text-4xl font-black tracking-tight sm:text-5xl" data-testid="command-center-greeting">{active?.greeting}</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground" data-testid="executive-briefing">{active?.briefing}</p></div>
        {!data?.has_data && !demo ? <Button variant="outline" onClick={() => setDemo(true)} data-testid="open-demo-btn"><PlayCircle size={17} /> Ver demonstração</Button> : <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Atualizado agora</div>}
      </header>
      <form onSubmit={submit} className="relative flex flex-col gap-3 border border-primary/40 bg-primary/[0.08] p-4 sm:flex-row sm:items-center sm:p-5" data-testid="command-question-form">
        <Sparkle size={23} weight="fill" className="hidden shrink-0 text-primary sm:block" /><Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte qualquer coisa sobre sua empresa..." className="h-12 border-border bg-card" data-testid="command-question-input" /><Button type="submit" disabled={!question.trim()} className="h-12 shrink-0" data-testid="command-question-submit">Conversar com seu Sócio <ArrowRight size={17} /></Button>
      </form>
      {!active?.has_data && !demo ? <div className="border border-border bg-card p-8 text-center" data-testid="command-empty-state"><WarningCircle size={32} className="mx-auto text-amber-500" /><h2 className="mt-3 font-heading text-xl font-bold">Estou pronto para começar a observar</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Importe suas transações ou explore a demonstração profissional. Dados demo ficam sempre identificados.</p><Button className="mt-5" onClick={() => setDemo(true)} data-testid="empty-open-demo-btn">Explorar demonstração <ArrowRight size={16} /></Button></div> : <>
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]"><HealthScore health={active.health} /><section className="border border-transparent bg-ink p-5 text-white sm:p-6" data-testid="today-priority-card"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-400"><Lightning size={17} weight="fill" /> Minha prioridade para você hoje</div><h2 className="mt-4 font-heading text-2xl font-bold tracking-tight">{active.insights[0]?.title || "Continue observando os sinais do negócio"}</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">{active.insights[0]?.summary || "Ainda não há uma recomendação prioritária baseada nos seus dados."}</p><div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => active.insights[0] && ask(active.insights[0].prompt)} data-testid="priority-investigate-btn">Investigar comigo</Button><Button variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => ask("Simule o impacto da minha principal recomendação") } data-testid="priority-simulate-btn">Simular impacto</Button><Button variant="ghost" className="text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => ask("Prepare uma ação para minha principal recomendação")} data-testid="priority-action-btn">Preparar ação</Button></div></section></div>
        <section data-testid="executive-insights-section"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Briefing executivo</p><h2 className="mt-1 font-heading text-2xl font-bold tracking-tight">O que merece sua atenção</h2></div><span className="text-xs text-muted-foreground">{active.insights.length} sinais encontrados</span></div><div className="grid gap-4 xl:grid-cols-2">{active.insights.map((insight) => <InsightCard key={insight.id} insight={insight} onAsk={ask} />)}</div></section>
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground" data-testid="command-data-scope"><span>Base analisada: <strong className="text-foreground">{active.data_scope?.transactions || 0} transações</strong> · {active.data_scope?.customers || 0} clientes · {active.data_scope?.products || 0} produtos</span><button onClick={() => navigate("/dados")} className="font-bold text-primary" data-testid="command-open-data-btn">Ver dados <ArrowRight size={15} className="inline" /></button></div>
      </>}
    </div>
  );
}