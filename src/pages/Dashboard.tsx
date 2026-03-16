import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const { restaurantName } = useRestaurant();
  const navigate = useNavigate();

  const kpiCards = [
    { label: "JEDLÁ", value: data?.dishCount ?? 0, warn: false },
    { label: "INGREDIENCIE", value: data?.ingredientCount ?? 0, warn: false },
    { label: "DNES MENU", value: data?.hasTodayMenu ? (data?.weekDays?.find(d => {
      const today = new Date();
      return d.dateObj.toDateString() === today.toDateString();
    })?.itemCount ?? 0) : 0, warn: false },
    { label: "BEZ CENY", value: data?.noPricedCount ?? 0, warn: (data?.noPricedCount ?? 0) > 0 },
  ];

  const dayNames = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok"];

  const oliviaActions = [
    { label: "Generuj nákupný zoznam", badge: "AUTO", badgeStyle: "bg-primary/20 text-primary", onClick: () => navigate("/shopping-list") },
    { label: "Export TV + PDF + Excel", badge: "READY", badgeStyle: "bg-primary/20 text-primary", onClick: () => navigate("/exports") },
    { label: "Návrh marže pre menu", badge: `${data?.avgMargin ?? 0}%`, badgeStyle: "bg-primary/20 text-primary", onClick: () => navigate("/daily-menu") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={restaurantName ? `${restaurantName} — prehľad` : "Amber Glass overview"}
        actions={[
          {
            label: "AI týždeň",
            icon: <Sparkles className="h-4 w-4" />,
            onClick: () => navigate("/daily-menu"),
            variant: "primary",
          },
          {
            label: "Publikovať všetko",
            onClick: () => navigate("/exports"),
            variant: "outline",
          },
        ]}
      />

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
        <div className="lg:col-span-3">
          <GlassPanel title="Týždenný prehľad">
            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))
              ) : (
                data?.weekDays?.map((day, i) => {
                  const hasItems = day.itemCount > 0;
                  return (
                    <GlassRow
                      key={day.date}
                      label={`${dayNames[i]}: ${hasItems ? `${day.itemCount} jedál` : "—"}`}
                      badge={hasItems ? "OK" : "CHÝBA"}
                      badgeStyle={hasItems
                        ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                        : "bg-destructive/20 text-destructive"
                      }
                      onClick={() => navigate(`/daily-menu?date=${day.date}`)}
                    />
                  );
                })
              )}
            </div>
          </GlassPanel>
        </div>

        <div className="lg:col-span-2">
          <GlassPanel title="AI Olivia">
            <p className="text-sm text-muted-foreground mb-4">Rýchle akcie a návrhy marže.</p>
            <div className="space-y-2">
              {oliviaActions.map((action) => (
                <GlassRow
                  key={action.label}
                  label={action.label}
                  badge={action.badge}
                  badgeStyle={action.badgeStyle}
                  onClick={action.onClick}
                />
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* Alerts */}
      {!isLoading && (data?.noPricedCount ?? 0) > 0 && (
        <GlassPanel title="Upozornenia">
          <div className="space-y-2">
            <GlassRow
              label={`${data?.noPricedCount} jedál bez nastavenej ceny`}
              badge="OPRAVIŤ"
              badgeStyle="bg-destructive/20 text-destructive"
              onClick={() => navigate("/dishes")}
            />
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
