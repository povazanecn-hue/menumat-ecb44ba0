import { cn } from "@/lib/utils";
import logoMenumat from "@/assets/logo-menumat.png";

interface LogoBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { img: "h-7", text: "text-sm", subtitle: "text-[8px]" },
  md: { img: "h-9", text: "text-lg", subtitle: "text-[9px]" },
  lg: { img: "h-11", text: "text-xl", subtitle: "text-[10px]" },
  xl: { img: "h-14", text: "text-2xl", subtitle: "text-xs" },
};

export function LogoBrand({ size = "lg", showSubtitle = false, className }: LogoBrandProps) {
  const s = sizeConfig[size];

  return (
    <div className={cn("flex flex-col items-center transition-transform duration-300 hover:scale-105 cursor-pointer", className)}>
      <div className="flex items-center gap-2.5">
        <img src={logoMenumat} alt="menumat" className={cn(s.img, "w-auto object-contain")} />
        <span className={cn("font-sans font-bold tracking-tight text-foreground", s.text)}>
          menu<span className="text-primary">mat</span>
        </span>
      </div>
      {showSubtitle && (
        <span className={cn("mt-1 tracking-[0.15em] uppercase text-muted-foreground/60 font-medium", s.subtitle)}>
          Správa reštaurácie
        </span>
      )}
    </div>
  );
}
