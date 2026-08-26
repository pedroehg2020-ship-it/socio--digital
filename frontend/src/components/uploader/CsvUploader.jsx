import { useState, useRef } from "react";
import { UploadSimple, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export function CsvUploader({ endpoint, label, templateHref, templateName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const testIdSuffix = endpoint.replace(/\//g, "-");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post(endpoint, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`${res.data.imported} registro(s) importado(s) com sucesso!`);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erro ao importar arquivo");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-3 text-center bg-muted/30">
      <UploadSimple size={28} className="text-muted-foreground" />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">Arquivo CSV (.csv)</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        onChange={handleFile}
        className="hidden"
        data-testid={`csv-input-${testIdSuffix}`}
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={loading} onClick={() => inputRef.current?.click()} data-testid={`csv-upload-btn-${testIdSuffix}`}>
          {loading ? <CircleNotch size={16} className="animate-spin" /> : <UploadSimple size={16} />}
          {loading ? "Importando..." : "Selecionar arquivo"}
        </Button>
        {templateHref && (
          <a href={templateHref} download={templateName} data-testid={`csv-template-link-${testIdSuffix}`}>
            <Button size="sm" variant="outline" type="button">Baixar modelo</Button>
          </a>
        )}
      </div>
    </div>
  );
}
