import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassPanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ title, children, className }: GlassPanelProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card/60 p-6", className)}>
      {title && (
        <h2 className="font-serif text-xl font-bold text-foreground mb-5">{title}</h2>
      )}
      {children}
    </div>
  );
}

interface GlassRowProps {
  label: string;
  value?: string | ReactNode;
  badge?: string;
  badgeStyle?: string;
  onClick?: () => void;
  className?: string;
}

export function GlassRow({ label, value, badge, badgeStyle, onClick, className }: GlassRowProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between py-3.5 px-4 rounded-lg border border-border/40 bg-card/30 text-left",
        onClick && "hover:border-primary/30 hover:bg-card/60 transition-all cursor-pointer",
        className
      )}
    >
      <span className="text-sm text-foreground/90">{label}</span>
      {value && (
        <span className="text-sm font-mono text-muted-foreground">{value}</span>
      )}
      {badge && (
        <span className={cn(
          "text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-primary/20 text-primary",
          badgeStyle
        )}>
          {badge}
        </span>
      )}
    </Comp>
  );
}
