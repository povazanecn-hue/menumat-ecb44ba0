import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "h-5 w-5",
    menu: "text-xs",
    master: "text-sm",
    line: "w-6",
    gap: "gap-1.5",
    subtitle: "text-[8px]",
    ring: "h-9 w-9",
  },
  md: {
    icon: "h-6 w-6",
    menu: "text-sm",
    master: "text-lg",
    line: "w-8",
    gap: "gap-2",
    subtitle: "text-[9px]",
    ring: "h-11 w-11",
  },
  lg: {
    icon: "h-8 w-8",
    menu: "text-base",
    master: "text-2xl",
    line: "w-10",
    gap: "gap-2.5",
    subtitle: "text-[10px]",
    ring: "h-14 w-14",
  },
  xl: {
    icon: "h-10 w-10",
    menu: "text-lg",
    master: "text-3xl",
    line: "w-14",
    gap: "gap-3",
    subtitle: "text-xs",
    ring: "h-[4.5rem] w-[4.5rem]",
  },
};

export function LogoBrand({ size = "lg", showSubtitle = false, className }: LogoBrandProps) {
  const s = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center transition-transform duration-300 hover:scale-105 group cursor-pointer", className)}>
      <div className={cn("flex items-center", s.gap)}>
        {/* Left decorative line */}
        <div className="flex items-center gap-1">
          <span className={cn("block h-px bg-gradient-to-r from-transparent via-primary/70 to-primary/90", s.line)} />
          <span className="block h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(40_55%_55%/0.6)]" />
        </div>

        {/* Icon with glowing ring */}
        <div className={cn(
          "relative flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-primary/20 to-primary/5",
          "shadow-[0_0_25px_hsl(40_55%_55%/0.4),inset_0_0_15px_hsl(40_55%_55%/0.1)]",
          "border border-primary/30",
          s.ring
        )}>
          <ChefHat className={cn(s.icon, "text-primary icon-glow")} />
        </div>

        {/* Text block */}
        <div className="flex flex-col items-center leading-none">
          <span className={cn(
            "font-serif font-light tracking-[0.35em] uppercase text-primary/90",
            s.menu
          )}>
            Menu
          </span>
          <span className={cn(
            "font-serif font-bold tracking-[0.2em] uppercase text-primary logo-glow -mt-0.5",
            s.master
          )}>
            Master
          </span>
        </div>

        {/* Right decorative line */}
        <div className="flex items-center gap-1">
          <span className="block h-1.5 w-1.5 rounded-full bg-primary/70 shadow-[0_0_6px_hsl(40_55%_55%/0.6)]" />
          <span className={cn("block h-px bg-gradient-to-l from-transparent via-primary/70 to-primary/90", s.line)} />
        </div>
      </div>

      {showSubtitle && (
        <span className={cn(
          "mt-1 tracking-[0.25em] uppercase text-muted-foreground/60 font-medium",
          s.subtitle
        )}>
          Správa reštaurácie
        </span>
      )}
    </div>
  );
}
