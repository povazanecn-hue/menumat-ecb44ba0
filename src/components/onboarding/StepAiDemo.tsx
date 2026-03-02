import { useState, useEffect } from "react";
import { Sparkles, ChefHat, Soup, IceCream, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_MENU = [
  { icon: Soup, category: "Polievka", name: "Hovädzia vývarová s rezancami", price: "2,50 €" },
  { icon: ChefHat, category: "Hlavné jedlo 1", name: "Bravčový rezeň s ryžou", price: "7,90 €" },
  { icon: ChefHat, category: "Hlavné jedlo 2", name: "Grilovaný losos so zeleninou", price: "9,50 €" },
  { icon: IceCream, category: "Dezert", name: "Palacinky s Nutellou", price: "3,90 €" },
];

export function StepAiDemo() {
  const [visibleItems, setVisibleItems] = useState(0);
  const [phase, setPhase] = useState<"generating" | "done">("generating");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    DEMO_MENU.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleItems(i + 1), 600 + i * 500));
    });
    timers.push(setTimeout(() => setPhase("done"), 600 + DEMO_MENU.length * 500 + 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-4 py-2">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl font-bold text-foreground">AI generovanie v akcii</h2>
        <p className="text-sm text-muted-foreground">
          Takto jednoducho AI vytvorí vaše denné menu
        </p>
      </div>

      {/* Simulated generation */}
      <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-primary font-medium mb-3">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {phase === "generating" ? "AI generuje menu..." : "Menu pripravené!"}
          {phase === "done" && <Check className="h-3.5 w-3.5 text-primary" />}
        </div>

        <AnimatePresence>
          {DEMO_MENU.slice(0, visibleItems).map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between rounded-md bg-card border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="h-4 w-4 text-primary/70 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.category}</p>
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary whitespace-nowrap ml-2">{item.price}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          AI rešpektuje vaše pravidlá — 14-dňové neopakovanie, kategórie, alergény aj ceny.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {["TV export", "PDF tlač", "Excel", "Web embed"].map((tag) => (
            <span key={tag} className="text-[10px] rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
