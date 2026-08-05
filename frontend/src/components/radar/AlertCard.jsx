import { WarningCircle, WarningOctagon, CheckCircle, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PRIORITY_STYLES = {
  red: { borderColor: "hsl(var(--debit))", bg: "bg-debit-subtle", icon: WarningOctagon, iconClass: "text-debit" },
  yellow: { borderColor: "hsl(var(--warning))", bg: "bg-warning-subtle", icon: WarningCircle, iconClass: "text-warning" },
  green: { borderColor: "hsl(var(--credit))", bg: "bg-credit-subtle", icon: CheckCircle, iconClass: "text-credit" },
};

export function AlertCard({ alert, onResolve }) {
  const navigate = useNavigate();
  const style = PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.yellow;
  const Icon = style.icon;
  return (
    <div
      className={`border border-border ${style.bg} rounded-lg p-4 flex items-start gap-3 border-l-4`}
      style={{ borderLeftColor: style.borderColor }}
      data-testid="radar-alert-card"
    >
      <Icon size={22} className={`${style.iconClass} shrink-0 mt-0.5`} weight="fill" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{alert.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
        <div className="flex items-center gap-3 mt-3">
          {alert.action_route && (
            <Button size="sm" variant="outline" onClick={() => navigate(alert.action_route)} data-testid="alert-action-btn">
              {alert.action_label || "Ver detalhes"} <ArrowRight size={14} />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)} data-testid="alert-resolve-btn">
            Marcar como resolvido
          </Button>
        </div>
      </div>
    </div>
  );
}
