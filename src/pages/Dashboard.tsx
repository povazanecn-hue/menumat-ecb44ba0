import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, Carrot, CalendarDays, FileOutput, Plus, ChefHat, ShoppingCart, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

function useDashboardData() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["dashboard", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return null;

      const today = format(new Date(), "yyyy-MM-dd");
      const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");

      const [dishRes, ingredientRes, todayMenuRes, exportsRes, recentExportsRes] = await Promise.all([
        supabase.from("dishes").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("ingredients").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("menus").select("id, status, menu_items(id)").eq("restaurant_id", restaurantId).eq("menu_date", today).maybeSingle(),
        supabase.from("menu_exports").select("id, menu:menus!inner(restaurant_id)").eq("menu.restaurant_id", restaurantId).gte("created_at", weekAgo + "T00:00:00"),
        supabase.from("menu_exports").select("id, format, template_name, created_at, menu:menus!inner(menu_date, restaurant_id)").eq("menu.restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5),
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

      return {
        dishCount: dishRes.count ?? 0,
        ingredientCount: ingredientRes.count ?? 0,
        menuStatus,
        menuStatusColor,
        hasTodayMenu: !!todayMenu,
        exportsThisWeek: exportsRes.data?.length ?? 0,
        recentExports: (recentExportsRes.data ?? []) as any[],
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
