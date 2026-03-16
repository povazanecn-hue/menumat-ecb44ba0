import {
  UtensilsCrossed,
  Calendar,
  FileText,
  TrendingUp,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Auto databáza jedál",
    desc: "Spravujte kompletný katalóg jedál s alergénmi, gramážou a cenami na jednom mieste.",
  },
  {
    icon: Calendar,
    title: "AI generovanie menu",
    desc: "Nechajte AI zostaviť denné menu s pravidlami neopakovania a kategóriami.",
  },
  {
    icon: FileText,
    title: "Magic importy & exporty",
    desc: "Import z Excel/CSV, export na TV, PDF, kuchyňu aj web — všetko jedným klikom.",
  },
  {
    icon: ShoppingCart,
    title: "Inteligentný sklad",
    desc: "Automatické nákupné zoznamy generované z menu a receptov.",
  },
  {
    icon: TrendingUp,
    title: "AI Price Power",
    desc: "Marže, cenotvorba a odporúčané ceny s plnou kontrolou nad finálnou cenou.",
  },
  {
    icon: Truck,
    title: "Agent surovín & dodávatelia",
    desc: "Porovnávajte ceny od Lidl, Kaufland, Metro a ďalších dodávateľov v reálnom čase.",
  },
];

const containerStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <motion.h2
        className="mb-14 text-center font-serif text-3xl font-bold sm:text-5xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
      >
        Všetko čo vaša reštaurácia potrebuje
      </motion.h2>
      <motion.div
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        variants={containerStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {features.map((f) => (
          <motion.div key={f.title} variants={fadeUp}>
            <div className="group h-full rounded-xl border border-border bg-card/60 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-card/80">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(38_81%_67%/0.2)]">
                <f.icon className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_hsl(38_81%_67%/0.5)]" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
