import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { CalendarDays, Carrot, DollarSign, Tag, AlertTriangle, TrendingDown } from "lucide-react";
import { WeekDay, DashboardAlert, CostTrendPoint, getWeekDays, buildCostTrend } from "./types";

export function useDashboardData() {
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
        allIngredientsRes, promoRes,
      ] = await Promise.all([
        supabase.from("dishes").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("ingredients").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
        supabase.from("menus").select("id, status, menu_items(id)").eq("restaurant_id", restaurantId).eq("menu_date", today).maybeSingle(),
        supabase.from("menu_exports").select("id, menu:menus!inner(restaurant_id)").eq("menu.restaurant_id", restaurantId).gte("created_at", weekAgo + "T00:00:00"),
        supabase.from("menu_exports").select("id, format, template_name, created_at, menu:menus!inner(menu_date, restaurant_id)").eq("menu.restaurant_id", restaurantId).order("created_at", { ascending: false }).limit(5),
        supabase.from("menus").select("menu_date, status, menu_items(id)").eq("restaurant_id", restaurantId).gte("menu_date", monday).lte("menu_date", friday),
        supabase.from("recipes").select("dish_id, dish:dishes!inner(restaurant_id)").eq("dish.restaurant_id", restaurantId),
        supabase.from("dishes").select("id, name, cost, vat_rate, final_price, recommended_price, created_at").eq("restaurant_id", restaurantId).order("created_at", { ascending: true }),
        supabase.from("ingredients").select("id, name, base_price").eq("restaurant_id", restaurantId),
        supabase.from("supplier_prices").select("id, supplier_name, ingredient_id, is_promo, price, valid_from, valid_to, ingredient:ingredients!inner(restaurant_id, name)").eq("ingredient.restaurant_id", restaurantId).eq("is_promo", true),
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

      const recipeCount = recipesRes.data?.length ?? 0;
      const dishCount = dishRes.count ?? 0;
      const recipeCoverage = dishCount > 0 ? Math.round((recipeCount / dishCount) * 100) : 0;

      const allDishes = (allDishesRes.data ?? []) as any[];
      const costTrend = buildCostTrend(allDishes);

      const noPricedCount = allDishes.filter((d: any) => d.cost === 0).length;
      const avgMargin = allDishes.length > 0
        ? allDishes.reduce((sum: number, d: any) => {
            const cwv = d.cost * (1 + (d.vat_rate ?? 20) / 100);
            const price = d.final_price ?? d.recommended_price ?? 0;
            return cwv > 0 ? sum + ((price - cwv) / cwv) * 100 : sum;
          }, 0) / allDishes.filter((d: any) => d.cost > 0).length
        : 0;

      // Build alerts
      const alerts: DashboardAlert[] = [];

      const missingDays = weekDays.filter(d => d.status === "none" && d.dateObj >= new Date(today));
      if (missingDays.length > 0) {
        alerts.push({
          id: "missing-menu-days",
          type: "warning",
          icon: CalendarDays,
          title: `${missingDays.length} deň/dní bez menu tento týždeň`,
          description: `Chýba menu na: ${missingDays.map(d => d.date).join(", ")}`,
          action: { label: "Vytvoriť menu", path: "/daily-menu" },
        });
      }

      const noPriceDishes = allDishes.filter((d: any) => !d.final_price && d.final_price !== 0);
      if (noPriceDishes.length > 0) {
        alerts.push({
          id: "missing-prices",
          type: "warning",
          icon: DollarSign,
          title: `${noPriceDishes.length} jedál bez finálnej ceny`,
          description: noPriceDishes.length <= 3
            ? noPriceDishes.map((d: any) => d.name).join(", ")
            : `${noPriceDishes.slice(0, 3).map((d: any) => d.name).join(", ")} a ďalšie…`,
          action: { label: "Upraviť jedlá", path: "/dishes" },
        });
      }

      if (noPricedCount > 0 && dishCount > 0) {
        alerts.push({
          id: "missing-costs",
          type: "destructive",
          icon: AlertTriangle,
          title: `${noPricedCount} jedál bez kalkulácie nákladov`,
          description: "Doplňte suroviny a ich ceny pre správny výpočet marže.",
          action: { label: "Suroviny", path: "/ingredients" },
        });
      }

      const zeroPriceIngredients = (allIngredientsRes.data ?? []).filter((i: any) => i.base_price === 0);
      if (zeroPriceIngredients.length > 0) {
        alerts.push({
          id: "zero-ingredient-price",
          type: "warning",
          icon: Carrot,
          title: `${zeroPriceIngredients.length} surovín bez ceny`,
          description: zeroPriceIngredients.length <= 3
            ? zeroPriceIngredients.map((i: any) => i.name).join(", ")
            : `${zeroPriceIngredients.slice(0, 3).map((i: any) => i.name).join(", ")} a ďalšie…`,
          action: { label: "Aktualizovať ceny", path: "/ingredients" },
        });
      }

      const activePromos = (promoRes.data ?? []).filter((p: any) => {
        if (!p.valid_to) return true;
        return p.valid_to >= today;
      });
      if (activePromos.length > 0) {
        const uniqueSuppliers = [...new Set(activePromos.map((p: any) => p.supplier_name))];
        alerts.push({
          id: "active-promos",
          type: "info",
          icon: Tag,
          title: `${activePromos.length} aktívnych promo cien`,
          description: `Od: ${uniqueSuppliers.slice(0, 3).join(", ")}${uniqueSuppliers.length > 3 ? " a ďalší…" : ""}`,
          action: { label: "Pozrieť suroviny", path: "/ingredients" },
        });
      }

      if (avgMargin < 30 && allDishes.filter((d: any) => d.cost > 0).length > 0) {
        alerts.push({
          id: "low-margin",
          type: "destructive",
          icon: TrendingDown,
          title: `Priemerná marža len ${Math.round(avgMargin)}%`,
          description: "Zvážte úpravu cien alebo zmenu surovín pre lepšiu ziskovosť.",
          action: { label: "Jedlá a ceny", path: "/dishes" },
        });
      }

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
        alerts,
      };
    },
    enabled: !!restaurantId,
  });
}
