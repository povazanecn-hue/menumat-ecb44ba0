import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  Calendar,
  FileText,
  TrendingUp,
  ShoppingCart,
  Truck,
  ArrowRight,
  Sparkles,
  UserPlus,
  LogIn,
} from "lucide-react";
import { motion } from "framer-motion";
import { LogoBrand } from "@/components/LogoBrand";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";

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

const logoReveal = {
  hidden: { opacity: 0, scale: 0.5, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const featureIcons = [
  { icon: UtensilsCrossed, title: "Auto databáza jedál" },
  { icon: Calendar, title: "AI generovanie menu" },
  { icon: FileText, title: "Magic importy & exporty" },
  { icon: ShoppingCart, title: "Inteligentný sklad" },
  { icon: TrendingUp, title: "AI Price Power" },
  { icon: Truck, title: "Agent surovín" },
];

export default function Landing() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LogoBrand size="sm" />
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
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/[0.06] blur-[140px]" />
        </div>

        <motion.div
          className="relative z-10 flex max-w-4xl flex-col items-center space-y-8"
          initial="hidden"
          animate="visible"
          variants={containerStagger}
        >
          <motion.div variants={logoReveal}>
            <LogoBrand size="lg" glow />
          </motion.div>

          <motion.p variants={fadeUp} className="text-sm font-medium uppercase tracking-widest text-primary/60">
            Smart nástroj prevádzok budúcnosti
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl"
          >
            Kompletný AI nástroj pre reštaurácie — od databázy jedál cez generovanie denného menu
            až po exporty na TV, web a tlač.{" "}
            <span className="font-semibold text-primary">Za minúty, nie hodiny.</span>
          </motion.p>

          {/* Icon strip */}
          <motion.div
            variants={containerStagger}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap items-center justify-center gap-5 py-4"
          >
            {featureIcons.map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                whileHover={{ scale: 1.2, rotate: 5 }}
                className="group relative flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card/40 text-primary transition-all duration-300 hover:border-primary/50 hover:bg-card/70 hover:shadow-[0_0_20px_hsl(38_81%_67%/0.2)]"
              >
                <f.icon className="h-7 w-7 transition-all duration-300 group-hover:drop-shadow-[0_0_6px_hsl(38_81%_67%/0.6)]" />
                <span className="pointer-events-none absolute -bottom-7 whitespace-nowrap text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {f.title}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={fadeUp}
            className="flex w-full flex-col items-center gap-3 pt-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4"
          >
            <Button size="lg" className="h-14 w-full rounded-full px-10 text-lg shadow-[0_0_20px_hsl(38_81%_67%/0.25)] sm:w-auto" asChild>
              <Link to="/auth">
                <Sparkles className="mr-2 h-5 w-5" />
                Vyskúšať zadarmo
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 w-full rounded-full border-border px-10 text-lg hover:border-primary/40 hover:bg-card/40 sm:w-auto" asChild>
              <Link to="/auth">
                <UserPlus className="mr-2 h-5 w-5" />
                Zaregistruj sa
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-14 w-full rounded-full px-10 text-lg text-muted-foreground hover:text-foreground sm:w-auto" asChild>
              <Link to="/auth">
                <LogIn className="mr-2 h-5 w-5" />
                Prihlásiť sa
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </header>

      <LandingFeatures />
      <LandingHowItWorks />

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
            Pripojte sa k reštauráciám, ktoré už používajú MENUMAT na efektívnu tvorbu
            a publikovanie denného menu.
          </p>
          <Button size="lg" className="h-14 rounded-full px-10 text-lg shadow-[0_0_20px_hsl(38_81%_67%/0.25)]" asChild>
            <Link to="/auth">
              Vyskúšať zadarmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground space-y-1">
        <p>© {new Date().getFullYear()} MENUMAT. Všetky práva vyhradené.</p>
        <p className="text-[10px] text-muted-foreground/50">Powered by N-[vision] | N-oLiMiT gastro</p>
      </footer>
    </div>
  );
}
