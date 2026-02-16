import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  UtensilsCrossed, Carrot, CalendarDays, FileOutput,
  Plus, ChefHat, ShoppingCart, ArrowRight, BookOpen,
  TrendingUp, TrendingDown, AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isSameDay, subDays } from "date-fns";
import { sk } from "date-fns/locale";
import {
  Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer,
  Tooltip as RTooltip, Line, LineChart, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface WeekDay {
  label: string;
  date: string;
  dateObj: Date;
  status: "none" | "draft" | "published";
  itemCount: number;
}

interface CostTrendPoint {
  date: string;
  label: string;
  avgCost: number;
  avgPrice: number;
  marginPercent: number;
}

function getWeekDays(): { days: Date[]; monday: string; friday: string } {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  return {
    days,
    monday: format(days[0], "yyyy-MM-dd"),
    friday: format(days[4], "yyyy-MM-dd"),
  };
}

function useDashboardData() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["dashboard", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;

      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
      const { days, monday, friday } = getWeekDays();

      const [
        dishRes, ingredientRes, todayMenuRes, exportsRes,
        recentExportsRes, weekMenusRes, recipesRes, allDishesRes,
      ] = await Promise.all([
        supabase.from("dishes").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("ingredients").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("menus").select("id, status, menu_items(id)").eq("restaurant_id", restaurantId).eq("menu_date", today).maybeSingle(),
        supabase.from("menu_exports").select("id, menu:menus!inner(restaurant_id)").eq("menu.restaurant_id", restaurantId).gte("created_at", weekAgo + "T00:00:00"),
        supabase.from("menu_exports").select("id, format, template_name, created_at, menu:menus!inner(menu_date, restaurant_id)").eq("menu.restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5),
        supabase.from("menus").select("menu_date, status, menu_items(id)").eq("restaurant_id", restaurantId).gte("menu_date", monday).lte("menu_date", friday),
        supabase.from("recipes").select("dish_id, dish:dishes!inner(restaurant_id)").eq("dish.restaurant_id", restaurantId),
        supabase.from("dishes").select("id, cost, vat_rate, final_price, recommended_price, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: true }),
      ]);

      const todayMenu = todayMenuRes.data;
      let menuStatus = "Nevytvorené";
      let menuStatusColor: "destructive" | "default" | "secondary" | "outline" = "destructive";
      if (todayMenu) {
        const itemCount = todayMenu.menu_items?.length ?? 0;
        if (todayMenu.status === "published") {
          menuStatus = `Publikované (${itemCount} jedál)`;
          menuStatusColor = "default";
        } else {
          menuStatus = `Rozpracované (${itemCount} jedál)`;
          menuStatusColor = "secondary";
        }
      }

      // Build week calendar data
      const weekMenus = weekMenusRes.data ?? [];
      const weekDays: WeekDay[] = days.map((d) => {
        const dateStr = format(d, "yyyy-MM-dd");
        const menu = weekMenus.find((m: any) => m.menu_date === dateStr);
        return {
          label: format(d, "EEE", { locale: sk }),
          date: format(d, "d.M."),
          dateObj: d,
          status: menu ? (menu.status === "published" ? "published" : "draft") : "none",
          itemCount: menu ? (menu.menu_items?.length ?? 0) : 0,
        };
      });

      // Recipe coverage
      const recipeCount = recipesRes.data?.length ?? 0;
      const dishCount = dishRes.count ?? 0;
      const recipeCoverage = dishCount > 0 ? Math.round((recipeCount / dishCount) * 100) : 0;

      // Cost trend — aggregate dishes by week over last 30 days
      const allDishes = (allDishesRes.data ?? []) as any[];
      const costTrend = buildCostTrend(allDishes);

      // Top costly dishes (for insight)
      const noPricedCount = allDishes.filter((d: any) => d.cost === 0).length;
      const avgMargin = allDishes.length > 0
        ? allDishes.reduce((sum: number, d: any) => {
            const cwv = d.cost * (1 + (d.vat_rate ?? 20) / 100);
            const price = d.final_price ?? d.recommended_price ?? 0;
            return cwv > 0 ? sum + ((price - cwv) / cwv) * 100 : sum;
          }, 0) / allDishes.filter((d: any) => d.cost > 0).length
        : 0;

      return {
        dishCount,
        ingredientCount: ingredientRes.count ?? 0,
        menuStatus,
        menuStatusColor,
        hasTodayMenu: !!todayMenu,
        exportsThisWeek: exportsRes.data?.length ?? 0,
        recentExports: (recentExportsRes.data ?? []) as any[],
        weekDays,
        recipeCount,
        recipeCoverage,
        costTrend,
        noPricedCount,
        avgMargin: Math.round(avgMargin),
      };
    },
    enabled: !!restaurantId,
  });
}

function buildCostTrend(dishes: any[]): CostTrendPoint[] {
  // Group dishes into 4-week buckets ending today
  const now = new Date();
  const points: CostTrendPoint[] = [];

  for (let w = 3; w >= 0; w--) {
    const end = subDays(now, w * 7);
    const start = subDays(end, 6);
    const label = format(start, "d.M.", { locale: sk });
    const dateStr = format(end, "yyyy-MM-dd");

    // Dishes created up to this point
    const eligible = dishes.filter(
      (d: any) => d.created_at && d.created_at.slice(0, 10) <= dateStr
    );

    if (eligible.length === 0) {
      points.push({ date: dateStr, label, avgCost: 0, avgPrice: 0, marginPercent: 0 });
      continue;
    }

    const totalCost = eligible.reduce((s: number, d: any) => s + (d.cost * (1 + (d.vat_rate ?? 20) / 100)), 0);
    const totalPrice = eligible.reduce((s: number, d: any) => s + (d.final_price ?? d.recommended_price ?? 0), 0);
    const avgCost = totalCost / eligible.length;
    const avgPrice = totalPrice / eligible.length;
    const marginPercent = avgCost > 0 ? Math.round(((avgPrice - avgCost) / avgCost) * 100) : 0;

    points.push({
      date: dateStr,
      label,
      avgCost: Math.round(avgCost * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100,
      marginPercent,
    });
  }

  return points;
}

const FORMAT_LABELS: Record<string, string> = {
  tv: "TV FullHD",
  pdf: "PDF / Tlač",
  excel: "Excel",
  webflow: "Web embed",
};

const STATUS_CONFIG = {
  none: { color: "hsl(var(--muted))", label: "Žiadne" },
  draft: { color: "hsl(var(--accent))", label: "Rozpracované" },
  published: { color: "hsl(var(--primary))", label: "Publikované" },
};

function WeekCalendar({ weekDays, isLoading }: { weekDays?: WeekDay[]; isLoading: boolean }) {
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!weekDays) return null;

  const chartData = weekDays.map((d) => ({
    ...d,
    value: d.status === "none" ? 0.3 : d.itemCount || 1,
    fill: STATUS_CONFIG[d.status].color,
  }));

  const isToday = (d: WeekDay) => isSameDay(d.dateObj, new Date());

  return (
    <div className="space-y-3">
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={32}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <RTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as WeekDay & { fill: string };
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{d.date} ({d.label})</p>
                    <p className="text-muted-foreground">
                      {STATUS_CONFIG[d.status].label}
                      {d.itemCount > 0 && ` — ${d.itemCount} jedál`}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.fill}
                  opacity={entry.status === "none" ? 0.3 : 1}
                  stroke={isToday(weekDays[i]) ? "hsl(var(--primary))" : "none"}
                  strokeWidth={isToday(weekDays[i]) ? 2.5 : 0}
                  cursor="pointer"
                  onClick={() => navigate(`/daily-menu?date=${format(weekDays[i].dateObj, "yyyy-MM-dd")}`)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between px-2">
        {weekDays.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-[10px] leading-none",
              isToday(d) ? "font-bold text-primary" : "text-muted-foreground"
            )}>
              {d.date}
            </span>
            <div className={cn(
              "h-2 w-2 rounded-full",
              d.status === "published" && "bg-primary",
              d.status === "draft" && "bg-accent",
              d.status === "none" && "bg-muted-foreground/20"
            )} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 justify-center text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Publikované
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> Rozpracované
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/20" /> Žiadne
        </span>
      </div>
    </div>
  );
}

function CostTrendChart({ data, isLoading }: { data?: CostTrendPoint[]; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data || data.every((d) => d.avgCost === 0 && d.avgPrice === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Nedostatok dát pre zobrazenie trendu.
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
          <RTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as CostTrendPoint;
              return (
                <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                  <p className="font-medium">Týždeň od {d.label}</p>
                  <p>Priem. náklady: <strong>{d.avgCost.toFixed(2)} €</strong></p>
                  <p>Priem. cena: <strong>{d.avgPrice.toFixed(2)} €</strong></p>
                  <p>Marža: <strong>{d.marginPercent}%</strong></p>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="avgCost"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Náklady"
          />
          <Line
            type="monotone"
            dataKey="avgPrice"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Cena"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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

  const quickActions = [
    { label: "Nové menu", icon: Plus, path: "/daily-menu" },
    { label: "Pridať jedlo", icon: ChefHat, path: "/dishes" },
    { label: "Nákupný zoznam", icon: ShoppingCart, path: "/shopping-list" },
    { label: "Exportovať", icon: FileOutput, path: "/exports" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {restaurantName ? `${restaurantName} — ` : ""}Prehľad vašej reštaurácie
        </p>
      </div>

      {/* Primary Stats — mockup-inspired cards with gold icon circles */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) =>
          isLoading ? (
            <Card key={s.label}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ) : (
            <Card key={s.label} className="border-primary/10 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardContent className="flex flex-col items-center text-center gap-2 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                {s.badge ? (
                  <Badge variant={s.badge} className="text-sm mt-1">{s.value}</Badge>
                ) : (
                  <div className="text-2xl font-bold font-serif">{s.value}</div>
                )}
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
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

        {/* Quick Actions — mockup grid style */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg">Rýchle akcie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((a) => (
                <Button
                  key={a.label}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-5 border-primary/15 hover:border-primary/40 hover:bg-primary/5"
                  onClick={() => navigate(a.path)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{a.label}</span>
                </Button>
              ))}
            </div>
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
