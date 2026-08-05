import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CsvUploader } from "@/components/uploader/CsvUploader";
import { TRANSACTIONS_TEMPLATE_URI } from "@/lib/csvTemplates";
import { toast } from "@/components/ui/sonner";
import { Trash } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export default function FinanceiroPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (type !== "todos") params.type = type;
      if (status !== "todos") params.status = status;
      if (search) params.search = search;
      const res = await api.get("/transactions", { params });
      setItems(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [type, status, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    toast.success("Transação removida");
    load();
  };

  return (
    <div className="space-y-4" data-testid="financeiro-page">
      <CsvUploader
        endpoint="/upload/transactions"
        label="Importar transações (CSV)"
        templateHref={TRANSACTIONS_TEMPLATE_URI}
        templateName="modelo-transacoes.csv"
        onSuccess={load}
      />
      <div className="flex flex-wrap gap-3 items-end">
        <Input placeholder="Buscar descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" data-testid="financeiro-search-input" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40" data-testid="financeiro-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="receita">Receita</SelectItem>
            <SelectItem value="despesa">Despesa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40" data-testid="financeiro-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto" data-testid="financeiro-total-count">{total} transação(ões)</span>
      </div>
      <div className="bg-card border border-border rounded-lg">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground" data-testid="financeiro-empty-state">Nenhuma transação encontrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id} data-testid="transacao-row">
                  <TableCell>{t.date}</TableCell>
                  <TableCell>{t.description}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell className={`text-right tabular-nums font-medium ${t.type === "receita" ? "text-credit" : "text-debit"}`}>
                    {t.type === "receita" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.status === "pago" ? "secondary" : "default"} className={t.status === "pendente" ? "bg-warning-subtle text-warning border-transparent" : ""}>
                      {t.status === "pago" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)} data-testid="transacao-delete-btn">
                      <Trash size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
