import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: { label: string; icon?: ReactNode; onClick: () => void; variant?: "primary" | "outline" }[];
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant === "primary" ? "default" : "outline"}
              className={
                action.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5"
                  : "border-border text-foreground hover:bg-secondary rounded-full px-5"
              }
              onClick={action.onClick}
            >
              {action.icon && <span className="mr-1.5">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
