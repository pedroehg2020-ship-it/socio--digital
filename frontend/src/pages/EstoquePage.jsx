import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CsvUploader } from "@/components/uploader/CsvUploader";
import { INVENTORY_TEMPLATE_URI } from "@/lib/csvTemplates";
import { Skeleton } from "@/components/ui/skeleton";

const RISK_LABEL = { ruptura: "Risco de ruptura", parado: "Estoque parado", ok: "OK" };

export default function EstoquePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/inventory");
      setProducts(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6" data-testid="estoque-page">
      <CsvUploader
        endpoint="/upload/inventory"
        label="Importar estoque (CSV)"
        templateHref={INVENTORY_TEMPLATE_URI}
        templateName="modelo-estoque.csv"
        onSuccess={load}
      />
      <div className="bg-card border border-border rounded-lg">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground" data-testid="estoque-empty-state">Nenhum produto importado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Estoque atual</TableHead>
                <TableHead className="text-right">Estoque mínimo</TableHead>
                <TableHead className="text-right">Vendas médias/mês</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} data-testid="produto-row">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.stock_qty}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.min_stock}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.avg_monthly_sales}</TableCell>
                  <TableCell>
                    <Badge
                      variant={p.risk === "ok" ? "secondary" : "default"}
                      className={p.risk === "ruptura" ? "bg-debit-subtle text-debit border-transparent" : p.risk === "parado" ? "bg-warning-subtle text-warning border-transparent" : ""}
                    >
                      {RISK_LABEL[p.risk]}
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
