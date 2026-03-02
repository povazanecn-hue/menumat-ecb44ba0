import { Sparkles, ChefHat, BarChart3, FileOutput } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: ChefHat, title: "Databáza jedál a receptov", desc: "Kompletná správa vášho jedálnička" },
  { icon: Sparkles, title: "AI generovanie menu", desc: "Denné menu za pár sekúnd" },
  { icon: BarChart3, title: "Náklady a marže", desc: "Presná kalkulácia cien" },
  { icon: FileOutput, title: "Export na TV, PDF, web", desc: "Publikujte jedným kliknutím" },
];

export function StepWelcome() {
  return (
    <div className="space-y-6 py-2">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Vitajte v MENUMAT
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Profesionálny nástroj pre reštaurácie — od tvorby menu až po publikovanie. 
          Nastavenie trvá menej ako 2 minúty.
        </p>
      </div>

      <div className="grid gap-2.5">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg bg-secondary/50 border border-border p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15">
              <f.icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/70 text-center">
        Používa viac ako 200+ reštaurácií na Slovensku
      </p>
    </div>
  );
}
