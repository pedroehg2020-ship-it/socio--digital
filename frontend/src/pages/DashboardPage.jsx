import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { CsvUploader } from "@/components/uploader/CsvUploader";
import { TRANSACTIONS_TEMPLATE_URI } from "@/lib/csvTemplates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [cashflow, setCashflow] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c, cat] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/cashflow"),
        api.get("/dashboard/categories"),
      ]);
      setSummary(s.data);
      setCashflow(c.data);
      setCategories(cat.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading) {
    return (
      <div className="space-y-6" data-testid="dashboard-loading">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (!summary?.has_data) {
    return (
      <div className="max-w-lg mx-auto text-center py-16" data-testid="dashboard-empty-state">
        <h2 className="font-heading text-xl font-bold">Nenhum dado importado ainda</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-6">Importe uma planilha de transações para o Sócio Digital montar seu dashboard financeiro.</p>
        <CsvUploader
          endpoint="/upload/transactions"
          label="Importar transações (CSV)"
          templateHref={TRANSACTIONS_TEMPLATE_URI}
          templateName="modelo-transacoes.csv"
          onSuccess={loadAll}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-2">
          <KpiCard label="Receita do mês" value={summary.receita_mes} variacao={summary.receita_variacao} tone="credit" testId="kpi-receita" />
        </div>
        <div className="lg:col-span-2">
          <KpiCard
            label="Despesa do mês"
            value={summary.despesa_mes}
            variacao={summary.despesa_variacao !== null && summary.despesa_variacao !== undefined ? -summary.despesa_variacao : summary.despesa_variacao}
            tone="debit"
            testId="kpi-despesa"
          />
        </div>
        <div className="lg:col-span-2">
          <KpiCard label="Lucro do mês" value={summary.lucro_mes} variacao={summary.lucro_variacao} tone={summary.lucro_mes >= 0 ? "credit" : "debit"} testId="kpi-lucro" />
        </div>
        <div className="lg:col-span-2">
          <KpiCard label="Saldo total" value={summary.saldo_total} testId="kpi-saldo" />
        </div>
        <div className="lg:col-span-2">
          <KpiCard label="Contas a pagar" value={summary.contas_pagar} tone="warning" testId="kpi-contas-pagar" />
        </div>
        <div className="lg:col-span-2">
          <KpiCard label="Contas a receber" value={summary.contas_receber} tone="credit" testId="kpi-contas-receber" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de caixa</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={cashflow} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={categories} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
