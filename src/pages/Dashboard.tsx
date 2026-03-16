import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Send, ShoppingCart, FileOutput, BarChart3 } from "lucide-react";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const { restaurantName } = useRestaurant();
  const navigate = useNavigate();

  const kpiCards = [
    { label: "JEDLA", value: data?.dishCount ?? 0, warn: false },
    { label: "INGREDIENCIE", value: data?.ingredientCount ?? 0, warn: false },
    { label: "DNES MENU", value: data?.hasTodayMenu ? (data?.weekDays?.find(d => {
      const today = new Date();
      return d.dateObj.toDateString() === today.toDateString();
    })?.itemCount ?? 0) : 0, warn: false },
    { label: "BEZ CENY", value: data?.noPricedCount ?? 0, warn: (data?.noPricedCount ?? 0) > 0 },
  ];

  // Build weekly overview from weekDays data
  const dayNames = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];

  const oliviaActions = [
    { label: "Generuj nákupný zoznam", badge: "AUTO", badgeStyle: "bg-primary/20 text-primary" },
    { label: "Export TV + PDF + Excel", badge: "READY", badgeStyle: "bg-primary/20 text-primary" },
    { label: "Návrh marže pre menu", badge: `${data?.avgMargin ?? 0}%`, badgeStyle: "bg-primary/20 text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Variant A amber glass overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-full px-5"
            onClick={() => navigate("/daily-menu")}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            AI týždeň
          </Button>
          <Button
            variant="outline"
            className="border-border text-foreground hover:bg-secondary rounded-full px-5"
          >
            Publikovať všetko
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) =>
          isLoading ? (
            <div key={kpi.label} className="rounded-xl border border-border bg-card/60 p-5">
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div
              key={kpi.label}
              className="rounded-xl border border-border bg-card/60 p-5 transition-all hover:border-primary/20"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
                {kpi.label}
              </p>
              <p className={cn(
                "text-4xl font-serif font-bold",
                kpi.warn ? "text-destructive" : "text-foreground"
              )}>
                {kpi.value}
              </p>
            </div>
          )
        )}
      </div>

      {/* Two-column: Weekly Overview + AI Olivia */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Weekly Overview - takes 3 cols */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card/60 p-6">
          <h2 className="font-serif text-xl font-bold text-foreground mb-5">Týždenný prehľad</h2>
          <div className="space-y-0">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-3 border-b border-border/50 last:border-0">
                  <Skeleton className="h-5 w-full" />
                </div>
              ))
            ) : (
              data?.weekDays?.map((day, i) => (
                <button
                  key={day.date}
                  onClick={() => navigate(`/daily-menu?date=${day.date}`)}
                  className="w-full flex items-center justify-between py-3.5 px-4 rounded-lg border border-border/40 bg-card/30 mb-2 last:mb-0 hover:border-primary/30 hover:bg-card/60 transition-all text-left"
                >
                  <span className="text-sm text-foreground/90">
                    <span className="font-medium">{dayNames[i]}:</span>{" "}
                    <span className="text-muted-foreground">
                      {day.itemCount > 0 ? `${day.itemCount} jedál` : "—"}
                    </span>
                  </span>
                  <span className="text-sm font-mono text-muted-foreground">
                    {day.itemCount > 0 ? `${day.itemCount * 2} porcií` : ""}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* AI Olivia - takes 2 cols */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card/60 p-6">
          <h2 className="font-serif text-xl font-bold text-foreground mb-1">AI Olivia</h2>
          <p className="text-sm text-muted-foreground mb-5">Rýchle akcie a návrhy marže.</p>
          <div className="space-y-3">
            {oliviaActions.map((action) => (
              <button
                key={action.label}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-lg border border-border/40 bg-card/30 hover:border-primary/30 hover:bg-card/60 transition-all text-left"
              >
                <span className="text-sm text-foreground/90">{action.label}</span>
                <span className={cn(
                  "text-xs font-mono font-medium px-2.5 py-1 rounded-full",
                  action.badgeStyle
                )}>
                  {action.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
