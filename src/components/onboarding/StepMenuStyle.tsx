import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const TEMPLATES = [
  { id: "classic", label: "Klasická Reštaurácia", color: "from-amber-900/60 to-amber-800/40" },
  { id: "modern", label: "Moderný Bistro", color: "from-slate-800/60 to-slate-700/40" },
  { id: "minimal", label: "Minimalistická Kaviareň", color: "from-stone-700/60 to-stone-600/40" },
  { id: "luxury", label: "Luxusná Reštaurácia", color: "from-yellow-900/60 to-yellow-800/40" },
] as const;

interface Props {
  selectedTemplate: string;
  setSelectedTemplate: (id: string) => void;
}

export function StepMenuStyle({ selectedTemplate, setSelectedTemplate }: Props) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl font-bold text-foreground">Ako má vyzerať Vaše Menu?</h2>
        <p className="text-sm text-muted-foreground">Vyberte si vizuálny štýl menu šablóny</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedTemplate(t.id)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
              selectedTemplate === t.id
                ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(38_81%_67%/0.15)]"
                : "border-border/40 bg-card/30 hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-full aspect-[3/4] rounded-lg bg-gradient-to-b flex items-center justify-center",
              t.color
            )}>
              <div className="space-y-1 text-center px-2">
                <div className="h-1 w-10 mx-auto rounded bg-foreground/20" />
                <div className="h-0.5 w-14 mx-auto rounded bg-foreground/10" />
                <div className="h-0.5 w-8 mx-auto rounded bg-foreground/10" />
                <div className="mt-2 space-y-0.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="h-0.5 w-12 rounded bg-foreground/15" />
                      <div className="h-0.5 w-4 rounded bg-primary/30" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <span className={cn(
              "text-xs font-medium",
              selectedTemplate === t.id ? "text-primary" : "text-muted-foreground"
            )}>
              {t.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
