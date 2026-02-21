import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-base", gap: "gap-1.5", subtitle: "text-[9px]" },
  md: { icon: "h-5 w-5", text: "text-lg", gap: "gap-2", subtitle: "text-[10px]" },
  lg: { icon: "h-6 w-6", text: "text-2xl", gap: "gap-2.5", subtitle: "text-xs" },
  xl: { icon: "h-8 w-8", text: "text-3xl", gap: "gap-3", subtitle: "text-sm" },
};

export function LogoBrand({ size = "lg", showSubtitle = false, className }: LogoBrandProps) {
  const s = sizeConfig[size];

  return (
    <div className={cn("flex items-center transition-transform duration-200 hover:scale-[1.02] cursor-pointer", s.gap, className)}>
      <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
        <UtensilsCrossed className={cn(s.icon, "text-primary")} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={cn("font-bold tracking-tight text-foreground", s.text)}>
          menu<span className="text-primary">mat</span>
        </span>
        {showSubtitle && (
          <span className={cn("text-muted-foreground font-medium tracking-wide", s.subtitle)}>
            Správa reštaurácie
          </span>
        )}
      </div>
    </div>
  );
}
