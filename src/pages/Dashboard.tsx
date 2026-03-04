import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  UtensilsCrossed, Carrot, CalendarDays, FileOutput,
  ArrowRight, BookOpen, TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { WeekCalendar } from "@/components/dashboard/WeekCalendar";
import { CostTrendChart } from "@/components/dashboard/CostTrendChart";
import { AlertsSection } from "@/components/dashboard/AlertsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { FORMAT_LABELS } from "@/components/dashboard/types";

export default function Dashboard() {
  const { data, isLoading } = useDashboardData();
  const { restaurantName } = useRestaurant();
  const navigate = useNavigate();

  const stats = [
    { label: "Jedlá", value: data?.dishCount ?? 0, icon: UtensilsCrossed, desc: "v databáze" },
    { label: "Ingrediencie", value: data?.ingredientCount ?? 0, icon: Carrot, desc: "registrovaných" },
    { label: "Dnešné menu", value: data?.menuStatus ?? "—", icon: CalendarDays, desc: format(new Date(), "EEEE d.M.", { locale: sk }), badge: data?.menuStatusColor },
    { label: "Exporty", value: data?.exportsThisWeek ?? 0, icon: FileOutput, desc: "tento týždeň" },
  ];

  const insightStats = [
    {
      label: "Recepty",
      value: `${data?.recipeCount ?? 0}`,
      icon: BookOpen,
      desc: `${data?.recipeCoverage ?? 0}% pokrytie`,
      onClick: () => navigate("/recipes"),
    },
    {
      label: "Priem. marža",
      value: `${data?.avgMargin ?? 0}%`,
      icon: data?.avgMargin && data.avgMargin < 30 ? TrendingDown : TrendingUp,
      desc: data?.avgMargin && data.avgMargin < 30 ? "pod 30% — zvážte úpravu" : "zdravá úroveň",
      warn: data?.avgMargin != null && data.avgMargin < 30,
    },
    {
      label: "Bez ceny",
      value: data?.noPricedCount ?? 0,
      icon: AlertTriangle,
      desc: "jedál bez nákladov",
      warn: (data?.noPricedCount ?? 0) > 0,
      onClick: () => navigate("/dishes"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {restaurantName ? `${restaurantName} — Dashboard` : "Dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Prehľad vašej reštaurácie</p>
      </div>

      {/* Actionable Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Upozornenia
            {data?.alerts && data.alerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px] ml-1">
                {data.alerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsSection alerts={data?.alerts} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Primary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) =>
          isLoading ? (
            <Card key={s.label}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ) : (
            <Card key={s.label} className="border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {s.badge ? (
                  <Badge variant={s.badge} className="text-sm">{s.value}</Badge>
                ) : (
                  <div className="text-2xl font-bold font-serif">{s.value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Business Insights Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {insightStats.map((s) =>
          isLoading ? (
            <Card key={s.label}><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>
          ) : (
            <Card
              key={s.label}
              className={cn(
                "border-border transition-all",
                s.warn && "border-destructive/30 bg-destructive/5",
                s.onClick && "cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              )}
              onClick={s.onClick}
            >
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full shrink-0",
                  s.warn ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                )}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-bold font-serif">{s.value}</div>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Weekly Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg">Týždenný prehľad menu</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/daily-menu")} className="text-xs">
            Denné menu <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <WeekCalendar weekDays={data?.weekDays} isLoading={isLoading} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cost Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              Trend nákladov vs. cien
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="text-[10px]">4 týždne</Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Priemerné náklady (s DPH) a predajné ceny jedál za posledné 4 týždne.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CostTrendChart data={data?.costTrend} isLoading={isLoading} />
            <div className="flex items-center gap-4 justify-center mt-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-6 rounded-sm bg-destructive" /> Náklady
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-6 rounded-sm bg-primary" /> Cena
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Rýchle akcie</CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions />
          </CardContent>
        </Card>
      </div>

      {/* Recent Exports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-serif text-lg">Posledné exporty</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/exports")} className="text-xs">
            Všetky <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : !data?.recentExports.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Zatiaľ žiadne exporty.</p>
          ) : (
            <div className="space-y-2">
              {data.recentExports.map((exp: any) => (
                <div key={exp.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {FORMAT_LABELS[exp.format] ?? exp.format}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {exp.menu?.menu_date
                        ? format(new Date(exp.menu.menu_date + "T00:00:00"), "d.M.yyyy")
                        : "—"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(exp.created_at), "d.M. HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
