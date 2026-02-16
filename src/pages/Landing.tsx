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
} from "lucide-react";

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
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <ChefHat className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-serif text-5xl font-bold tracking-tight sm:text-7xl">
            <span className="bg-gold-gradient bg-clip-text text-transparent">MENU</span>{" "}
            <span className="text-foreground">MASTER</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground sm:text-xl">
            Kompletný AI nástroj pre reštaurácie — od databázy jedál cez generovanie denného menu
            až po exporty na TV, web a tlač. Za minúty, nie hodiny.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button size="lg" className="text-base" asChild>
              <Link to="/auth">
                <Sparkles className="mr-2 h-5 w-5" />
                Začať zadarmo
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base" asChild>
              <Link to="/auth">Prihlásiť sa</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="mb-12 text-center font-serif text-3xl font-bold sm:text-4xl">
          Všetko čo vaša reštaurácia potrebuje
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50 bg-card/50 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold sm:text-4xl">
            Ako to funguje
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.num} className="flex gap-4">
                <span className="font-serif text-4xl font-bold text-primary/30">{s.num}</span>
                <div>
                  <h3 className="font-serif text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-24 text-center">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">
            Prestaňte strácať čas s Excelom
          </h2>
          <p className="text-muted-foreground">
            Pripojte sa k reštauráciám, ktoré už používajú Menu Master na efektívnu tvorbu
            a publikovanie denného menu.
          </p>
          <Button size="lg" className="text-base" asChild>
            <Link to="/auth">
              Vyskúšať zadarmo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-4 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Menu Master. Všetky práva vyhradené.
      </footer>
    </div>
  );
}
