import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Carrot, CalendarDays, FileOutput, Plus, ChefHat, ShoppingCart, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { sk } from "date-fns/locale";
import { Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface WeekDay {
  label: string;
  date: string;
  dateObj: Date;
  status: "none" | "draft" | "published";
  itemCount: number;
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

      const [dishRes, ingredientRes, todayMenuRes, exportsRes, recentExportsRes, weekMenusRes] = await Promise.all([
        supabase.from("dishes").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("ingredients").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("menus").select("id, status, menu_items(id)").eq("restaurant_id", restaurantId).eq("menu_date", today).maybeSingle(),
        supabase.from("menu_exports").select("id, menu:menus!inner(restaurant_id)").eq("menu.restaurant_id", restaurantId).gte("created_at", weekAgo + "T00:00:00"),
        supabase.from("menu_exports").select("id, format, template_name, created_at, menu:menus!inner(menu_date, restaurant_id)").eq("menu.restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5),
        supabase.from("menus").select("menu_date, status, menu_items(id)").eq("restaurant_id", restaurantId).gte("menu_date", monday).lte("menu_date", friday),
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

      return {
        dishCount: dishRes.count ?? 0,
        ingredientCount: ingredientRes.count ?? 0,
        menuStatus,
        menuStatusColor,
        hasTodayMenu: !!todayMenu,
        exportsThisWeek: exportsRes.data?.length ?? 0,
        recentExports: (recentExportsRes.data ?? []) as any[],
        weekDays,
      };
    },
    enabled: !!restaurantId,
  });
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
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis hide />
            <Tooltip
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
                  cursor="pointer"
                  onClick={() => navigate(`/daily-menu?date=${format(weekDays[i].dateObj, "yyyy-MM-dd")}`)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Day labels with status dots */}
      <div className="flex justify-between px-2">
        {weekDays.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-[10px] leading-none",
              isToday(d) ? "font-bold text-primary" : "text-muted-foreground"
            )}>
              {d.date}
            </span>
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                d.status === "published" && "bg-primary",
                d.status === "draft" && "bg-accent",
                d.status === "none" && "bg-muted-foreground/20"
              )}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
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
          {restaurantName ? `${restaurantName} — Dashboard` : "Dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Prehľad vašej reštaurácie</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) =>
          isLoading ? (
            <Card key={s.label}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ) : (
            <Card key={s.label} className="hover:shadow-md transition-shadow">
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
        {/* Quick Actions */}
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
                  className="flex flex-col items-center gap-1.5 h-auto py-4"
                  onClick={() => navigate(a.path)}
                >
                  <a.icon className="h-5 w-5" />
                  <span className="text-xs">{a.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
}
