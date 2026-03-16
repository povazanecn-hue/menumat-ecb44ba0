import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { sk } from "date-fns/locale";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, DollarSign, UtensilsCrossed, Percent } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(38 92% 50%)",
  "hsl(142 76% 36%)",
  "hsl(262 83% 58%)",
  "hsl(var(--destructive))",
  "hsl(200 80% 50%)",
];

export default function Analytics() {
  const { restaurantId } = useRestaurant();
  const [period, setPeriod] = useState<"7" | "30" | "90">("30");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics", restaurantId, period],
    queryFn: async () => {
      if (!restaurantId) return null;

      const fromDate = format(subDays(new Date(), Number(period)), "yyyy-MM-dd");
      const today = format(new Date(), "yyyy-MM-dd");

      const [dishesRes, menuItemsRes, ingredientsRes] = await Promise.all([
        supabase.from("dishes").select("id, name, category, cost, vat_rate, final_price, recommended_price")
          .eq("restaurant_id", restaurantId),
        supabase.from("menu_items").select("dish_id, dish:dishes!inner(name, category, cost, final_price, recommended_price, vat_rate, restaurant_id), menu:menus!inner(menu_date, restaurant_id)")
          .eq("dish.restaurant_id", restaurantId)
          .eq("menu.restaurant_id", restaurantId)
          .gte("menu.menu_date", fromDate),
        supabase.from("ingredients").select("id, name, base_price")
          .eq("restaurant_id", restaurantId),
      ]);

      const dishes = (dishesRes.data ?? []) as any[];
      const menuItems = (menuItemsRes.data ?? []) as any[];
      const ingredients = (ingredientsRes.data ?? []) as any[];

      // Popular dishes (by menu appearances)
      const popMap = new Map<string, { name: string; count: number; category: string }>();
      for (const mi of menuItems) {
        const id = mi.dish_id;
        const ex = popMap.get(id);
        if (ex) ex.count++;
        else popMap.set(id, { name: mi.dish?.name ?? "—", count: 1, category: mi.dish?.category ?? "ine" });
      }
      const topDishes = Array.from(popMap.values()).sort((a, b) => b.count - a.count).slice(0, 10);

      // Category distribution
      const catMap = new Map<string, number>();
      for (const mi of menuItems) {
        const cat = mi.dish?.category ?? "ine";
        catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
      }
      const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Margin analysis
      const marginData = dishes
        .filter((d: any) => d.cost > 0)
        .map((d: any) => {
          const cwv = d.cost * (1 + (d.vat_rate ?? 20) / 100);
          const price = d.final_price ?? d.recommended_price ?? 0;
          const margin = cwv > 0 ? ((price - cwv) / cwv) * 100 : 0;
          return { name: d.name, margin: Math.round(margin), cost: d.cost, price };
        })
        .sort((a, b) => a.margin - b.margin);

      const avgMargin = marginData.length > 0
        ? Math.round(marginData.reduce((s, d) => s + d.margin, 0) / marginData.length)
        : 0;

      const avgFoodCost = dishes.length > 0
        ? Math.round(dishes.reduce((s: number, d: any) => {
            const price = d.final_price ?? d.recommended_price ?? 1;
            return price > 0 ? s + (d.cost / price) * 100 : s;
          }, 0) / dishes.filter((d: any) => (d.final_price ?? d.recommended_price ?? 0) > 0).length)
        : 0;

      return {
        topDishes,
        categoryData,
        marginData,
        avgMargin,
        avgFoodCost,
        totalDishes: dishes.length,
        totalIngredients: ingredients.length,
        zeroPriceIngredients: ingredients.filter(i => i.base_price === 0).length,
        totalMenuItems: menuItems.length,
      };
    },
    enabled: !!restaurantId,
  });

  const CATEGORY_LABELS: Record<string, string> = {
    polievka: "Polievky", hlavne_jedlo: "Hlavné jedlá", dezert: "Dezerty",
    predjedlo: "Predjedlá", salat: "Šaláty", pizza: "Pizza",
    burger: "Burgery", pasta: "Pasta", napoj: "Nápoje", ine: "Iné",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytika"
        subtitle="Prehľad výkonnosti menu a nákladov"
        actions={[
          { label: "7 dní", onClick: () => setPeriod("7"), variant: period === "7" ? "primary" : "outline" },
          { label: "30 dní", onClick: () => setPeriod("30"), variant: period === "30" ? "primary" : "outline" },
          { label: "90 dní", onClick: () => setPeriod("90"), variant: period === "90" ? "primary" : "outline" },
        ]}
      />

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1">
                <Percent className="h-3 w-3" /> Priem. marža
              </p>
              <p className={cn("text-3xl font-bold font-mono", data.avgMargin < 30 ? "text-destructive" : "text-foreground")}>
                {data.avgMargin}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Food cost
              </p>
              <p className={cn("text-3xl font-bold font-mono", data.avgFoodCost > 40 ? "text-destructive" : "text-foreground")}>
                {data.avgFoodCost}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1">
                <UtensilsCrossed className="h-3 w-3" /> Menu položky
              </p>
              <p className="text-3xl font-bold font-mono text-foreground">{data.totalMenuItems}</p>
            </div>
            <div className="rounded-xl border border-border bg-card/60 p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Jedál v DB
              </p>
              <p className="text-3xl font-bold font-mono text-foreground">{data.totalDishes}</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Top dishes bar chart */}
            <GlassPanel title="Najpopulárnejšie jedlá" className="lg:col-span-3">
              {data.topDishes.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Žiadne dáta za zvolené obdobie.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topDishes} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" name="Výskyty v menu" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassPanel>

            {/* Category pie chart */}
            <GlassPanel title="Rozdelenie kategórií" className="lg:col-span-2">
              {data.categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Žiadne dáta.</p>
              ) : (
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${CATEGORY_LABELS[name] ?? name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.categoryData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, CATEGORY_LABELS[name] ?? name]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </GlassPanel>
          </div>

          {/* Margin analysis */}
          <GlassPanel title="Analýza marže — najnižšie prvé">
            {data.marginData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Žiadne jedlá s nákladmi.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {data.marginData.slice(0, 15).map((d) => (
                  <GlassRow
                    key={d.name}
                    label={d.name}
                    value={`${d.cost.toFixed(2)}€ → ${d.price.toFixed(2)}€`}
                    badge={`${d.margin}%`}
                    badgeStyle={cn(
                      d.margin < 30 ? "bg-destructive/20 text-destructive"
                        : d.margin < 60 ? "bg-[hsl(var(--gold-gradient-from))]/20 text-[hsl(var(--gold-gradient-from))]"
                          : "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                    )}
                  />
                ))}
              </div>
            )}
          </GlassPanel>
        </>
      ) : null}
    </div>
  );
}
