import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { AlertCard } from "@/components/radar/AlertCard";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { ArrowsClockwise, ShieldCheck } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";

const PRIORITY_ORDER = { red: 0, yellow: 1, green: 2 };

export default function RadarPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/radar/alerts");
      setAlerts(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (id) => {
    await api.post(`/radar/alerts/${id}/resolve`);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Alerta resolvido");
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      await api.post("/radar/recompute");
      await load();
      toast.success("Radar atualizado");
    } finally {
      setRecomputing(false);
    }
  };

  const sorted = [...alerts].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  return (
    <div className="space-y-4 max-w-3xl" data-testid="radar-page">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alerts.length} alerta(s) ativo(s)</p>
        <Button variant="outline" size="sm" onClick={handleRecompute} disabled={recomputing} data-testid="radar-recompute-btn">
          <ArrowsClockwise size={16} className={recomputing ? "animate-spin" : ""} /> Atualizar radar
        </Button>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16" data-testid="radar-empty-state">
          <ShieldCheck size={40} className="mx-auto text-credit mb-3" weight="duotone" />
          <p className="font-heading font-bold">Tudo tranquilo por aqui</p>
          <p className="text-sm text-muted-foreground mt-1">Nenhum alerta ativo no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((a) => (
            <AlertCard key={a.id} alert={a} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}
