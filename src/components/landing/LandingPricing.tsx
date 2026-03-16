import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "Zadarmo",
    desc: "Pre začínajúce reštaurácie",
    features: ["1 prevádzka", "Denné menu", "PDF export", "5 jedál"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "€ 95 / mesiac",
    desc: "Nena Reštáli",
    features: ["Neobmedzené jedlá", "AI generovanie", "TV + Web export", "Supplier intelligence", "Prioritná podpora"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Doo Pogurácie",
    desc: "Nena Regiutrared",
    features: ["Multi-prevádzka", "API integrácia", "Custom šablóny", "Dedikovaný manažér", "> 200€ / mesiac"],
    highlight: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function LandingPricing() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.h2
          className="mb-14 text-center font-serif text-3xl font-bold sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Pricing
        </motion.h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={cn(
                "rounded-xl border p-6 flex flex-col",
                plan.highlight
                  ? "border-primary bg-card/80 shadow-[0_0_30px_hsl(38_81%_67%/0.12)]"
                  : "border-border/40 bg-card/40"
              )}
            >
              <h3 className={cn(
                "font-serif text-2xl font-bold mb-1",
                plan.highlight ? "text-primary" : "text-foreground"
              )}>
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">{plan.desc}</p>
              <p className="font-mono text-lg font-semibold text-foreground mb-5">{plan.price}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "default" : "outline"}
                className={cn(
                  "w-full rounded-full",
                  plan.highlight && "bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground"
                )}
                asChild
              >
                <Link to="/auth">{plan.highlight ? "Začať teraz" : "Vybrať"}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
