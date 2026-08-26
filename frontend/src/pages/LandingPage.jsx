import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRinging,
  Brain,
  ChartLineUp,
  ChatCircleText,
  CheckCircle,
  CurrencyDollar,
  Gauge,
  Lightning,
  Package,
  Receipt,
  ShieldCheck,
  Sparkle,
  Storefront,
  Target,
  TrendUp,
  UsersThree,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: TrendUp, title: "Vendas em primeiro lugar", text: "Acompanhe faturamento, ticket médio, vendas recebidas e valores em aberto em uma visão simples." },
  { icon: CurrencyDollar, title: "Financeiro integrado", text: "Contas a pagar e a receber, fluxo de caixa, categorias e visão de lucro em tempo real." },
  { icon: BellRinging, title: "Radar inteligente", text: "A IA observa quedas nas vendas, clientes inativos, riscos de estoque e outros sinais antes que virem problema." },
  { icon: Package, title: "Estoque com previsão", text: "Identifique risco de ruptura, estoque parado e oportunidades de promoção para liberar capital." },
  { icon: UsersThree, title: "Clientes e relacionamento", text: "Enxergue quem compra, quem parou de comprar e onde existem oportunidades de reativação." },
  { icon: ChatCircleText, title: "Pergunte à sua empresa", text: "Em vez de procurar relatórios, faça perguntas em linguagem natural e receba respostas contextualizadas." },
  { icon: Target, title: "Metas e projeções", text: "Transforme dados em projeções diárias, prioridades e decisões mais rápidas para o negócio." },
  { icon: Receipt, title: "Dados organizados", text: "Centralize informações e reduza retrabalho com classificações, histórico e reaproveitamento de dados." },
];

const PROBLEMS = [
  "Queda nas vendas sem aviso",
  "Lucro desconhecido até o fim do mês",
  "Estoque acabando ou parado",
  "Clientes deixando de comprar",
  "Relatórios demais e respostas de menos",
  "Decisões tomadas quando já é tarde",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#081321] text-white overflow-hidden" data-testid="landing-page">
      <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_20%_15%,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.2),transparent_30%),radial-gradient(circle_at_55%_45%,rgba(139,92,246,0.16),transparent_32%)] pointer-events-none" />
      <header className="relative z-10 border-b border-white/10 bg-[#081321]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <ChartLineUp size={22} weight="bold" />
            </div>
            <div><p className="font-heading text-lg font-black tracking-tight">Sócio Digital</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Gestão com inteligência</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="text-slate-200 hover:bg-white/10 hover:text-white"><Link to="/login">Entrar</Link></Button>
            <Button asChild className="bg-blue-500 text-white hover:bg-blue-400"><Link to="/register">Começar agora <ArrowRight size={16} /></Link></Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-28 lg:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200"><Sparkle size={15} weight="fill" /> Não é só um ERP. É um sócio que observa o negócio.</div>
            <h1 className="mt-6 max-w-3xl font-heading text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Sua empresa mais clara, <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">antes que o problema apareça.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">O Sócio Digital acompanha vendas, financeiro, clientes e estoque, interpreta os dados e transforma sinais do dia a dia em alertas e ações práticas.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12 bg-blue-500 px-6 text-white hover:bg-blue-400"><Link to="/register">Criar minha conta <ArrowRight size={18} /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link to="/login">Já sou cliente</Link></Button></div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span className="flex items-center gap-2"><CheckCircle className="text-emerald-400" weight="fill" /> Vendas no centro da gestão</span><span className="flex items-center gap-2"><CheckCircle className="text-emerald-400" weight="fill" /> IA que interpreta dados</span><span className="flex items-center gap-2"><CheckCircle className="text-emerald-400" weight="fill" /> Visão integrada do negócio</span></div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-blue-950/40 backdrop-blur sm:p-5">
              <div className="rounded-2xl border border-white/10 bg-[#0d1d30] p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Vendas hoje</p><p className="mt-2 font-heading text-3xl font-black">R$ 18.420,00</p></div><div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><TrendUp size={28} weight="duotone" /></div></div>
                <div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-blue-500/10 p-3"><p className="text-[11px] text-slate-400">Pedidos</p><p className="mt-1 text-xl font-bold">37</p></div><div className="rounded-xl bg-violet-500/10 p-3"><p className="text-[11px] text-slate-400">Ticket médio</p><p className="mt-1 text-xl font-bold">R$ 498</p></div><div className="rounded-xl bg-amber-500/10 p-3"><p className="text-[11px] text-slate-400">A receber</p><p className="mt-1 text-xl font-bold">R$ 3,2 mil</p></div></div>
                <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.06] p-4"><div className="flex items-start gap-3"><Brain size={24} weight="duotone" className="mt-0.5 shrink-0 text-cyan-300" /><div><p className="font-bold text-cyan-100">Seu Sócio encontrou um sinal</p><p className="mt-1 text-sm leading-relaxed text-slate-300">As vendas estão 12% acima da média da semana, mas 4 clientes importantes ainda não recompraram neste mês.</p><button className="mt-3 text-sm font-bold text-cyan-300">Ver oportunidade →</button></div></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.035]">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Do documento mestre para o produto</p><h2 className="mt-3 font-heading text-3xl font-black sm:text-4xl">Um sistema que encontra o problema antes do empresário precisar procurar.</h2><p className="mt-4 text-slate-300">A proposta é unir a organização de um ERP com uma camada de inteligência que conversa, interpreta, alerta e sugere ações.</p></div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{FEATURES.map(({ icon: Icon, title, text }, i) => <article key={title} className={`rounded-2xl border border-white/10 p-5 ${i % 4 === 0 ? "bg-blue-500/10" : i % 4 === 1 ? "bg-emerald-500/10" : i % 4 === 2 ? "bg-violet-500/10" : "bg-amber-500/10"}`}><Icon size={26} weight="duotone" className="text-white" /><h3 className="mt-4 font-heading text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Gestão que trabalha a seu favor</p><h2 className="mt-3 font-heading text-4xl font-black">Você não deveria descobrir tudo no fim do mês.</h2><p className="mt-4 text-slate-300">O Sócio Digital foi pensado para reduzir reação tardia, retrabalho e falta de visibilidade.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{PROBLEMS.map((item) => <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-200"><Lightning className="mt-0.5 shrink-0 text-amber-300" weight="fill" />{item}</div>)}</div></div><div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-violet-500/10 to-emerald-500/10 p-7"><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-[#0b1828] p-5"><Gauge size={28} className="text-cyan-300" /><p className="mt-5 text-sm text-slate-400">Saúde do negócio</p><p className="mt-1 font-heading text-4xl font-black">82<span className="text-lg text-slate-500">/100</span></p></div><div className="rounded-2xl bg-[#0b1828] p-5"><Storefront size={28} className="text-violet-300" /><p className="mt-5 text-sm text-slate-400">Clientes ativos</p><p className="mt-1 font-heading text-4xl font-black">286</p></div><div className="rounded-2xl bg-[#0b1828] p-5 sm:col-span-2"><ShieldCheck size={28} className="text-emerald-300" /><p className="mt-5 font-bold">Monitoramento contínuo</p><p className="mt-2 text-sm leading-relaxed text-slate-300">Vendas, caixa, estoque e clientes analisados em conjunto para destacar o que merece atenção agora.</p></div></div></div></div></section>

        <section className="border-t border-white/10 bg-gradient-to-r from-blue-600/20 via-violet-600/15 to-emerald-500/15"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 lg:flex-row lg:items-center lg:px-8"><div><p className="font-heading text-3xl font-black">Transforme dados em decisões.</p><p className="mt-2 text-slate-300">Comece com vendas, financeiro, clientes e estoque em um único lugar.</p></div><Button asChild size="lg" className="h-12 bg-white px-6 text-[#081321] hover:bg-slate-100"><Link to="/register">Começar com o Sócio Digital <ArrowRight size={18} /></Link></Button></div></section>
      </main>
    </div>
  );
}
