import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CsvUploader } from "@/components/uploader/CsvUploader";
import { Button } from "@/components/ui/button";
import { TRANSACTIONS_TEMPLATE_URI } from "@/lib/csvTemplates";
import { ChartLineUp } from "@phosphor-icons/react";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { company, refreshCompany } = useAuth();

  const handleSuccess = async () => {
    await refreshCompany();
    navigate("/vendas");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg text-center" data-testid="onboarding-page">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ChartLineUp size={28} className="text-primary" weight="duotone" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Vamos conhecer a {company?.name || "sua empresa"}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Envie uma planilha CSV com suas transações financeiras para o Sócio Digital montar seu dashboard e começar a monitorar sua empresa.
        </p>
        <div className="mt-6">
          <CsvUploader
            endpoint="/upload/transactions"
            label="Importar transações (CSV)"
            templateHref={TRANSACTIONS_TEMPLATE_URI}
            templateName="modelo-transacoes.csv"
            onSuccess={handleSuccess}
          />
        </div>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/vendas")} data-testid="skip-onboarding-btn">
          Pular por agora
        </Button>
      </div>
    </div>
  );
}
