import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  steps: StepDef[];
  currentStep: number;
}

export function OnboardingStepper({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === currentStep;
        const isDone = i < currentStep;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-secondary text-muted-foreground"
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
