import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { LogoBrand } from "@/components/LogoBrand";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingPricing } from "@/components/landing/LandingPricing";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const containerStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-background/60 border-b border-border/30">
        <LogoBrand size="sm" />
        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Správa Menu</a>
          <a href="#how" className="hover:text-foreground transition-colors">Obsah</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <Button variant="outline" size="sm" className="rounded-full border-border/60 text-foreground" asChild>
          <Link to="/auth">Začnite Teraz</Link>
        </Button>
      </nav>

      {/* Hero */}
      <header className="relative flex min-h-screen flex-col items-start justify-center px-6 sm:px-16 pt-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[800px] rounded-full bg-primary/[0.06] blur-[140px]" />
        </div>

        {/* Hero background image placeholder */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50" />
        </div>

        <motion.div
          className="relative z-10 max-w-2xl space-y-6"
          initial="hidden"
          animate="visible"
          variants={containerStagger}
        >
          <motion.h1
            variants={fadeUp}
            className="font-serif text-4xl font-bold leading-tight sm:text-6xl text-foreground"
          >
            Digitálny Nástroj pre Moderné Reštaurácie
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg text-muted-foreground leading-relaxed max-w-lg"
          >
            Spravujte menu, ceny a ziskovosť jednoducho.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-wrap gap-3 pt-2"
          >
            <Button
              size="lg"
              className="h-12 rounded-full px-8 bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground font-semibold shadow-[0_0_20px_hsl(38_81%_67%/0.25)]"
              asChild
            >
              <Link to="/auth">
                <Sparkles className="mr-2 h-4 w-4" />
                Vyskúšať Zdarma
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full px-8 border-border/60 text-foreground hover:border-primary/40"
              asChild
            >
              <Link to="/auth">Objednať Demo</Link>
            </Button>
          </motion.div>
        </motion.div>
      </header>

      {/* Features */}
      <div id="features">
        <LandingFeatures />
      </div>

      {/* How it works */}
      <div id="how">
        <LandingHowItWorks />
      </div>

      {/* Dashboard preview section */}
      <section className="px-4 py-24 text-center">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl font-bold sm:text-5xl mb-4">
            Optimalizujte Vaše Podnikanie
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Všetko čo potrebujete pre efektívnu správu reštaurácie
          </p>
          {/* Dashboard preview placeholder */}
          <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm p-8 aspect-video flex items-center justify-center">
            <p className="text-muted-foreground/50 text-sm">Dashboard Preview</p>
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <div id="pricing">
        <LandingPricing />
      </div>

      {/* Final CTA */}
      <section className="px-4 py-28 text-center">
        <motion.div
          className="mx-auto max-w-2xl space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl font-bold sm:text-5xl">
            Start optimizing your restaurant today.
          </h2>
          <p className="text-lg text-muted-foreground">
            Pripojte sa k reštauráciám, ktoré už používajú MENUMAT.
          </p>
          <Button
            size="lg"
            className="h-14 rounded-full px-10 text-lg bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground font-semibold shadow-[0_0_20px_hsl(38_81%_67%/0.25)]"
            asChild
          >
            <Link to="/auth">
              Vytvoriť účet
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
