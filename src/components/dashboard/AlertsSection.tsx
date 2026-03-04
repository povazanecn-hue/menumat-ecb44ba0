import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DashboardAlert } from "./types";

const ALERT_VARIANT_MAP: Record<string, "default" | "destructive"> = {
  warning: "default",
  info: "default",
  destructive: "destructive",
};

interface AlertsSectionProps {
  alerts?: DashboardAlert[];
  isLoading: boolean;
}

export function AlertsSection({ alerts, isLoading }: AlertsSectionProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>Všetko v poriadku</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Žiadne upozornenia — vaše dáta sú kompletné.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={ALERT_VARIANT_MAP[alert.type]}
          className={cn(
            alert.type === "warning" && "border-amber-500/30 bg-amber-500/5 [&>svg]:text-amber-600",
            alert.type === "info" && "border-primary/20 bg-primary/5 [&>svg]:text-primary",
          )}
        >
          <alert.icon className="h-4 w-4" />
          <AlertTitle className="text-sm">{alert.title}</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{alert.description}</span>
            {alert.action && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs h-7 px-2"
                onClick={() => navigate(alert.action!.path)}
              >
                {alert.action.label} <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
