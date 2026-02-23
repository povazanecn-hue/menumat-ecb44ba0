import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat,
  UtensilsCrossed,
  Calendar,
  FileText,
  TrendingUp,
  ShoppingCart,
  BookOpen,
  Truck,
  ArrowRight,
  Sparkles,
  UserPlus,
  LogIn,
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

const steps = [
  {
    num: "01",
    title: "Importuj & plň databázu",
    desc: "Nahrajte jedlá, suroviny a recepty — ručne alebo importom.",
  },
  {
    num: "02",
    title: "Generujte menu",
    desc: "AI alebo manuálne zostavte denné menu s pravidlami a kategóriami.",
  },
  {
    num: "03",
    title: "Exportujte & publikujte",
    desc: "TV obrazovky, PDF, Excel pre kuchyňu, web embed — všetky formáty.",
  },
  {
    num: "04",
    title: "AI Recept book & Sklad",
    desc: "Recepty, nákupné zoznamy a cenová inteligencia — automaticky.",
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function Landing() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ChefHat className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <header className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(40_55%_55%/0.06)_0%,transparent_70%)]" />

        <motion.div
          className="relative z-10 flex max-w-4xl flex-col items-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerStagger}
        >
          {/* Glowing logo */}
          <motion.div variants={scaleIn} className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-2xl" />
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 shadow-[0_0_40px_hsl(40_55%_55%/0.3),inset_0_0_20px_hsl(40_55%_55%/0.1)]">
              <ChefHat className="h-14 w-14 text-primary drop-shadow-[0_0_8px_hsl(40_55%_55%/0.6)]" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={fadeUp}
            className="font-serif text-6xl font-bold tracking-tight sm:text-8xl lg:text-9xl"
          >
            <span className="bg-gold-gradient bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(40_55%_55%/0.4)]">
              MENU
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
          >
            Kompletný AI nástroj pre reštaurácie — od databázy jedál cez generovanie denného menu
            až po exporty na TV, web a tlač.{" "}
            <span className="font-semibold text-primary">Za minúty, nie hodiny.</span>
          </motion.p>

          {/* Feature icon strip */}
          <motion.div
            variants={containerStagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-5 py-4"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="group relative flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:shadow-[0_0_20px_hsl(40_55%_55%/0.25)]"
              >
                <f.icon className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_hsl(40_55%_55%/0.6)]" />
                <span className="pointer-events-none absolute -bottom-7 whitespace-nowrap text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {f.title}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" className="h-14 px-10 text-lg shadow-[0_0_20px_hsl(40_55%_55%/0.3)]" asChild>
              <Link to="/auth">
                <Sparkles className="mr-2 h-5 w-5" />
                Vyskúšať zadarmo
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 border-primary/30 px-10 text-lg hover:border-primary/60 hover:shadow-[0_0_15px_hsl(40_55%_55%/0.15)]" asChild>
              <Link to="/auth">
                <UserPlus className="mr-2 h-5 w-5" />
                Zaregistruj sa
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-14 px-10 text-lg text-muted-foreground hover:text-foreground" asChild>
              <Link to="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Prihlásiť sa
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* Features */}
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
              <Card className="group h-full border-border/50 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(40_55%_55%/0.1)]">
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(40_55%_55%/0.2)]">
                    <f.icon className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_hsl(40_55%_55%/0.5)]" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50 bg-card/50 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            className="mb-14 text-center font-serif text-3xl font-bold sm:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            Ako to funguje
          </motion.h2>
          <motion.div
            className="grid gap-10 sm:grid-cols-2"
            variants={containerStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            {steps.map((s) => (
              <motion.div key={s.num} variants={fadeUp} className="flex gap-5">
                <span className="font-serif text-5xl font-bold text-primary/25">{s.num}</span>
                <div>
                  <h3 className="font-serif text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-28 text-center">
        <motion.div
          className="mx-auto max-w-2xl space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl font-bold sm:text-5xl">
            Prestaňte strácať čas s Excelom
          </h2>
          <p className="text-lg text-muted-foreground">
            Pripojte sa k reštauráciám, ktoré už používajú Menu na efektívnu tvorbu
            a publikovanie denného menu.
          </p>
          <Button size="lg" className="h-14 px-10 text-lg shadow-[0_0_20px_hsl(40_55%_55%/0.3)]" asChild>
            <Link to="/auth">
              Vyskúšať zadarmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MENUMAT. Všetky práva vyhradené.
      </footer>
    </div>
  );
}
