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
import heroFood from "@/assets/hero-food.jpg";
import kolieskoKresba from "@/assets/textures/koliesko-bg.jpg";

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
  { num: "01", title: "Importuj & plň databázu", desc: "Nahrajte jedlá, suroviny a recepty — ručne alebo importom." },
  { num: "02", title: "Generujte menu", desc: "AI alebo manuálne zostavte denné menu s pravidlami a kategóriami." },
  { num: "03", title: "Exportujte & publikujte", desc: "TV obrazovky, PDF, Excel pre kuchyňu, web embed — všetky formáty." },
  { num: "04", title: "AI Recept book & Sklad", desc: "Recepty, nákupné zoznamy a cenová inteligencia — automaticky." },
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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-[0.65]" style={{ backgroundImage: `url(${kolieskoKresba})` }} />
      {/* Hero — Mobile-first full-screen layout inspired by mockup */}
      <header className="relative flex min-h-screen flex-col items-center justify-between px-0">
        {/* Top bar with logo */}
        <motion.div
          className="relative z-10 flex w-full items-center justify-center gap-2 pt-8 pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ChefHat className="h-8 w-8 text-primary icon-glow" />
          <span className="font-serif text-2xl font-bold tracking-wider text-primary logo-glow">MENU MASTER</span>
        </motion.div>

        {/* Hero food image */}
        <motion.div
          className="relative z-10 w-full max-w-lg px-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="relative mx-auto overflow-hidden rounded-3xl border border-primary/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <img
              src={heroFood}
              alt="Fine dining"
              className="w-full aspect-square object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
          </div>
        </motion.div>

        {/* Title and CTAs */}
        <motion.div
          className="relative z-10 flex flex-col items-center space-y-6 px-6 pb-12 pt-6 text-center"
          initial="hidden"
          animate="visible"
          variants={containerStagger}
        >
          <motion.h1
            variants={fadeUp}
            className="font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl"
          >
            <span className="text-foreground">Vytvorte</span>
            <br />
            <span className="bg-gold-gradient bg-clip-text text-transparent">dokonalé menu</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground"
          >
            Kompletný AI nástroj pre reštaurácie — od databázy jedál cez generovanie menu
            až po exporty.{" "}
            <span className="font-semibold text-primary">Za minúty, nie hodiny.</span>
          </motion.p>

          {/* Gold gradient CTA buttons — matching mockup style */}
          <motion.div variants={fadeUp} className="flex w-full max-w-sm flex-col gap-3">
            <Button
              size="lg"
              className="h-14 w-full text-lg font-semibold bg-gold-gradient border-0 text-primary-foreground shadow-[0_4px_20px_hsl(40_55%_55%/0.35)] hover:shadow-[0_6px_30px_hsl(40_55%_55%/0.5)]"
              asChild
            >
              <Link to="/auth">
                <Sparkles className="mr-2 h-5 w-5" />
                Vyskúšať zadarmo
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-full border-primary/40 text-lg text-foreground hover:border-primary/70 hover:bg-primary/5"
              asChild
            >
              <Link to="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Prihlásiť sa
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* Feature icon strip */}
      <section className="py-12 px-4">
        <motion.div
          className="flex flex-wrap items-center justify-center gap-5"
          variants={containerStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={scaleIn}
              whileHover={{ scale: 1.15, rotate: 3 }}
              className="group relative flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-all duration-300 hover:border-primary/50 hover:bg-primary/15 hover:shadow-[0_0_20px_hsl(40_55%_55%/0.25)]"
            >
              <f.icon className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_hsl(40_55%_55%/0.6)]" />
              <span className="pointer-events-none absolute -bottom-7 whitespace-nowrap text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {f.title}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-20">
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
              <Card className="group h-full border-border/50 bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_30px_hsl(40_55%_55%/0.1)]">
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
      <section className="border-y border-border/50 bg-card/40 backdrop-blur-sm px-4 py-24">
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
          <Button
            size="lg"
            className="h-14 px-10 text-lg bg-gold-gradient border-0 text-primary-foreground shadow-[0_4px_20px_hsl(40_55%_55%/0.35)]"
            asChild
          >
            <Link to="/auth">
              Vyskúšať zadarmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Menu Master. Všetky práva vyhradené.
      </footer>
    </div>
  );
}
