import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Brain, Trash, Plus } from "@phosphor-icons/react";

export function BusinessMemorySection() {
  const [memory, setMemory] = useState(null);
  const [goals, setGoals] = useState({ revenue: "", margin: "", notes: "" });
  const [newFact, setNewFact] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await api.get("/memory");
    setMemory(res.data);
    setGoals({
      revenue: res.data.revenue_goal_monthly ?? "",
      margin: res.data.margin_goal_pct ?? "",
      notes: res.data.seasonality_notes ?? "",
    });
  };

  useEffect(() => { load(); }, []);

  const saveGoals = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/memory", {
        revenue_goal_monthly: goals.revenue === "" ? null : Number(goals.revenue),
        margin_goal_pct: goals.margin === "" ? null : Number(goals.margin),
        seasonality_notes: goals.notes || null,
      });
      toast.success("Metas salvas. Seu Sócio vai usá-las nos conselhos.");
      load();
    } catch {
      toast.error("Erro ao salvar metas");
    } finally {
      setSaving(false);
    }
  };

  const addFact = async () => {
    if (!newFact.trim()) return;
    try {
      await api.post("/memory/facts", { text: newFact.trim() });
      setNewFact("");
      toast.success("Fato adicionado à memória");
      load();
    } catch {
      toast.error("Erro ao adicionar fato");
    }
  };

  const removeFact = async (id) => {
    try {
      await api.delete(`/memory/facts/${id}`);
      load();
    } catch {
      toast.error("Erro ao remover fato");
    }
  };

  if (!memory) return null;
  const seasonality = memory.seasonality || [];
  const maxIndex = Math.max(100, ...seasonality.map((s) => s.index));

  return (
    <Card data-testid="business-memory-section">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain size={20} weight="duotone" className="text-primary" /> Memória do Negócio
        </CardTitle>
        <p className="text-sm text-muted-foreground">O que o seu Sócio aprendeu sobre a empresa. Ele usa isso para dar conselhos cada vez mais certeiros — e também aprende sozinho durante as conversas.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={saveGoals} className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Metas</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Meta de faturamento mensal (R$)</Label>
              <Input type="number" min="0" step="100" value={goals.revenue} onChange={(e) => setGoals({ ...goals, revenue: e.target.value })} placeholder="Ex: 60000" data-testid="memory-revenue-goal-input" />
            </div>
            <div className="space-y-1.5">
              <Label>Meta de margem (%)</Label>
              <Input type="number" min="0" max="100" step="0.5" value={goals.margin} onChange={(e) => setGoals({ ...goals, margin: e.target.value })} placeholder="Ex: 25" data-testid="memory-margin-goal-input" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observações de sazonalidade</Label>
            <Input value={goals.notes} onChange={(e) => setGoals({ ...goals, notes: e.target.value })} placeholder="Ex: dezembro é o mês mais forte" data-testid="memory-notes-input" />
          </div>
          <Button type="submit" size="sm" disabled={saving} data-testid="memory-save-btn">{saving ? "Salvando..." : "Salvar metas"}</Button>
        </form>

        {seasonality.length > 0 && (
          <div data-testid="memory-seasonality">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sazonalidade calculada das suas vendas</p>
            <div className="mt-3 space-y-1.5">
              {seasonality.map((s) => (
                <div key={s.month} className="flex items-center gap-3 text-sm">
                  <span className="w-20 shrink-0 capitalize text-muted-foreground">{s.label}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${s.index >= 110 ? "bg-emerald-500" : s.index <= 90 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${(s.index / maxIndex) * 100}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums text-xs font-semibold">{s.index}%</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">100% = mês médio. Calculado automaticamente das transações importadas.</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fatos aprendidos</p>
          <div className="mt-2 space-y-2">
            {(memory.facts || []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum fato ainda. Conte algo ao seu Sócio no chat ou adicione abaixo.</p>}
            {(memory.facts || []).map((f) => (
              <div key={f.id} className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0" data-testid="memory-fact-row">
                <p className="text-sm leading-relaxed">{f.text}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="secondary" className="text-[10px]">{f.source === "chat" ? "aprendido no chat" : "manual"}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFact(f.id)} data-testid="memory-fact-remove-btn">
                    <Trash size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input value={newFact} onChange={(e) => setNewFact(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFact(); } }} placeholder="Ex: meu ponto de equilíbrio é R$ 40 mil/mês" data-testid="memory-fact-input" />
            <Button type="button" variant="outline" onClick={addFact} disabled={!newFact.trim()} data-testid="memory-add-fact-btn">
              <Plus size={15} /> Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
