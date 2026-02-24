import logo from "@/assets/logo-menumat.png";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-10 sm:h-14",
  md: "h-14 sm:h-20",
  lg: "h-20 sm:h-28",
} as const;

interface LogoBrandProps {
  size?: keyof typeof sizeMap;
  glow?: boolean;
  className?: string;
}

export function LogoBrand({ size = "md", glow = false, className }: LogoBrandProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {glow && (
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-primary/20",
            size === "lg" ? "blur-2xl animate-pulse" : "blur-xl"
          )}
        />
      )}
      <img
        src={logo}
        alt="MENUMAT logo"
        className={cn("relative object-contain", sizeMap[size])}
        draggable={false}
        loading="eager"
      />
    </div>
  );
}
