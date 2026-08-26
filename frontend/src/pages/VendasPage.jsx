import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowUpRight, CurrencyDollar, MagnifyingGlass, Plus, Receipt, TrendUp, Wallet } from "@phosphor-icons/react";

const money = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const paymentLabel = { pix: "Pix", cartao: "Cartão", boleto: "Boleto", dinheiro: "Dinheiro", transferencia: "Transferência", "não informado": "Não informado" };

function SalesKpi({ icon: Icon, label, value, detail, tone }) {
  const toneClass = tone === "emerald" ? "from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-300" : tone === "violet" ? "from-violet-500/15 to-violet-500/5 text-violet-700 dark:text-violet-300" : tone === "amber" ? "from-amber-500/15 to-amber-500/5 text-amber-700 dark:text-amber-300" : "from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-300";
  return <Card className={`border-border/70 bg-gradient-to-br ${toneClass}`}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 font-heading text-2xl font-black tabular-nums text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div><div className="rounded-xl bg-background/70 p-2.5"><Icon size={22} weight="duotone" /></div></div></CardContent></Card>;
}

export default function VendasPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), customer_name: "", description: "Venda", amount: "", status: "pago", payment_method: "pix", item_count: "1", notes: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (status !== "todos") params.status = status;
      if (search.trim()) params.search = search.trim();
      const [list, sum] = await Promise.all([api.get("/sales", { params }), api.get("/sales/summary")]);
      setItems(list.data.items || []);
      setSummary(sum.data);
    } catch (err) {
      toast.error("Não foi possível carregar as vendas");
    } finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const createSale = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/sales", { ...form, amount: Number(String(form.amount).replace(",", ".")), item_count: Number(form.item_count || 1), customer_name: form.customer_name || "Cliente não informado" });
      toast.success("Venda registrada com sucesso");
      setOpen(false);
      setForm({ date: new Date().toISOString().slice(0, 10), customer_name: "", description: "Venda", amount: "", status: "pago", payment_method: "pix", item_count: "1", notes: "" });
      load();
    } catch (err) { toast.error(err.response?.data?.detail || "Não foi possível registrar a venda"); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (sale) => {
    const next = sale.status === "pago" ? "pendente" : "pago";
    try { await api.patch(`/sales/${sale.id}/status`, { status: next }); toast.success(next === "pago" ? "Venda marcada como recebida" : "Venda marcada como pendente"); load(); }
    catch { toast.error("Não foi possível atualizar a venda"); }
  };

  const receivedPercent = useMemo(() => summary?.faturamento_mes ? Math.round((summary.recebidas / summary.faturamento_mes) * 100) : 0, [summary]);

  return (
    <div className="mx-auto max-w-[1500px] space-y-6" data-testid="vendas-page">
      <section className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-7">
        <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100">Seu ponto de partida</p><h1 className="mt-2 font-heading text-3xl font-black tracking-tight sm:text-4xl">Vendas</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-100">Registre vendas, acompanhe o que já entrou e o que ainda precisa receber. O financeiro é atualizado a partir daqui.</p></div>
          <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button className="h-11 bg-white text-blue-700 hover:bg-blue-50"><Plus size={18} weight="bold" /> Nova venda</Button></DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Registrar nova venda</DialogTitle></DialogHeader><form onSubmit={createSale} className="mt-2 grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><Label>Data</Label><Input type="date" required value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/></div><div className="space-y-1.5"><Label>Cliente</Label><Input placeholder="Nome do cliente" value={form.customer_name} onChange={(e)=>setForm({...form,customer_name:e.target.value})}/></div><div className="space-y-1.5 sm:col-span-2"><Label>Produto ou serviço</Label><Input required value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})}/></div><div className="space-y-1.5"><Label>Valor</Label><Input inputMode="decimal" placeholder="0,00" required value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})}/></div><div className="space-y-1.5"><Label>Quantidade de itens</Label><Input type="number" min="1" value={form.item_count} onChange={(e)=>setForm({...form,item_count:e.target.value})}/></div><div className="space-y-1.5"><Label>Situação</Label><Select value={form.status} onValueChange={(v)=>setForm({...form,status:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pago">Recebida</SelectItem><SelectItem value="pendente">A receber</SelectItem></SelectContent></Select></div><div className="space-y-1.5"><Label>Forma de pagamento</Label><Select value={form.payment_method} onValueChange={(v)=>setForm({...form,payment_method:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pix">Pix</SelectItem><SelectItem value="cartao">Cartão</SelectItem><SelectItem value="boleto">Boleto</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem><SelectItem value="transferencia">Transferência</SelectItem></SelectContent></Select></div><div className="space-y-1.5 sm:col-span-2"><Label>Observações</Label><Input placeholder="Opcional" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div><Button type="submit" className="sm:col-span-2" disabled={saving}>{saving ? "Salvando..." : "Registrar venda"}</Button></form></DialogContent></Dialog>
        </div>
      </section>

      {loading && !summary ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(i=><Skeleton key={i} className="h-32 rounded-xl" />)}</div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SalesKpi icon={CurrencyDollar} label="Faturamento no mês" value={money(summary?.faturamento_mes)} detail={summary?.variacao == null ? "Sem base anterior para comparação" : `${summary.variacao >= 0 ? "+" : ""}${summary.variacao}% vs mês anterior`} tone="blue"/><SalesKpi icon={Receipt} label="Vendas no mês" value={summary?.vendas_mes || 0} detail="Pedidos e lançamentos de receita" tone="violet"/><SalesKpi icon={TrendUp} label="Ticket médio" value={money(summary?.ticket_medio)} detail="Valor médio por venda" tone="emerald"/><SalesKpi icon={Wallet} label="A receber" value={money(summary?.em_aberto)} detail={`${receivedPercent}% do faturamento já recebido`} tone="amber"/></div>}

      <section className="rounded-2xl border border-border/80 bg-card/90 shadow-sm backdrop-blur"><div className="flex flex-col gap-4 border-b border-border/70 p-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-heading text-xl font-bold">Histórico de vendas</h2><p className="text-sm text-muted-foreground">Consulte clientes, valores e situação de recebimento.</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><MagnifyingGlass size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar cliente ou venda" className="pl-9 sm:w-64"/></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todas</SelectItem><SelectItem value="pago">Recebidas</SelectItem><SelectItem value="pendente">A receber</SelectItem></SelectContent></Select></div></div>
        {loading ? <div className="space-y-2 p-5">{[1,2,3,4,5].map(i=><Skeleton key={i} className="h-11"/>)}</div> : items.length === 0 ? <div className="p-10 text-center"><Receipt size={34} className="mx-auto text-blue-500"/><h3 className="mt-3 font-heading text-lg font-bold">Nenhuma venda encontrada</h3><p className="mt-1 text-sm text-muted-foreground">Registre a primeira venda para começar a montar seus indicadores.</p><Button className="mt-4" onClick={()=>setOpen(true)}><Plus size={17}/> Nova venda</Button></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Venda</TableHead><TableHead>Cliente</TableHead><TableHead>Descrição</TableHead><TableHead>Pagamento</TableHead><TableHead>Situação</TableHead><TableHead className="text-right">Valor</TableHead><TableHead className="w-10" /></TableRow></TableHeader><TableBody>{items.map((sale)=><TableRow key={sale.id}><TableCell><p className="font-semibold">{sale.sale_number || "Venda"}</p><p className="text-xs text-muted-foreground">{sale.date ? new Date(`${sale.date}T12:00:00`).toLocaleDateString("pt-BR") : "—"}</p></TableCell><TableCell className="font-medium">{sale.customer_name}</TableCell><TableCell><p>{sale.description}</p><p className="text-xs text-muted-foreground">{sale.item_count || 1} item(ns)</p></TableCell><TableCell>{paymentLabel[sale.payment_method] || sale.payment_method}</TableCell><TableCell><button onClick={()=>toggleStatus(sale)} title="Alterar situação"><Badge className={sale.status === "pago" ? "border-transparent bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300" : "border-transparent bg-amber-500/12 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300"}>{sale.status === "pago" ? "Recebida" : "A receber"}</Badge></button></TableCell><TableCell className="text-right font-bold tabular-nums">{money(sale.amount)}</TableCell><TableCell><ArrowUpRight size={17} className="text-muted-foreground"/></TableCell></TableRow>)}</TableBody></Table></div>}
      </section>
    </div>
  );
}
