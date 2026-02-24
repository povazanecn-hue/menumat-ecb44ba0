import logo from "@/assets/logo-menumat.png";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-12 sm:h-24",
  md: "h-20 sm:h-32",
  lg: "h-32 sm:h-56",
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
        className={cn("relative", sizeMap[size])}
        draggable={false}
      />
    </div>
  );
}
