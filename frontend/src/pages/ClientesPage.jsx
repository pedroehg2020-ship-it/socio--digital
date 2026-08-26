import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const res = await api.get("/customers", { params: s !== "todos" ? { status: s } : {} });
      setCustomers(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
  }, [status, load]);

  return (
    <div className="space-y-4" data-testid="clientes-page">
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="todos" data-testid="clientes-tab-todos">Todos</TabsTrigger>
          <TabsTrigger value="ativo" data-testid="clientes-tab-ativo">Ativos</TabsTrigger>
          <TabsTrigger value="inativo" data-testid="clientes-tab-inativo">Inativos</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="bg-card border border-border rounded-lg">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : customers.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground" data-testid="clientes-empty-state">
            Nenhum cliente encontrado. Clientes são detectados a partir da coluna "cliente" no CSV de transações.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total gasto</TableHead>
                <TableHead className="text-right">Compras</TableHead>
                <TableHead>Última compra</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id} data-testid="cliente-row">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(c.total_spent)}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.purchase_count}</TableCell>
                  <TableCell>{c.last_purchase_date}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "ativo" ? "secondary" : "default"} className={c.status === "inativo" ? "bg-warning-subtle text-warning border-transparent" : ""}>
                      {c.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
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
