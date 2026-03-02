import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";

export interface ShoppingItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  totalQuantity: number;
  basePrice: number;
  estimatedCost: number;
  dishNames: string[];
  isMissingPrice: boolean;
  isAiExtracted: boolean;
}

/**
 * Fetch all menu items in a date range, join through dish_ingredients
 * and aggregate quantities per ingredient.
 */
export function useShoppingList(from: string, to: string) {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["shopping-list", restaurantId, from, to],
    queryFn: async (): Promise<ShoppingItem[]> => {
      if (!restaurantId) return [];

      // Get menus in range with their items -> dishes
      const { data: menus, error: menuErr } = await supabase
        .from("menus")
        .select("menu_date, menu_items(dish_id, dish:dishes(id, name))")
        .eq("restaurant_id", restaurantId)
        .gte("menu_date", from)
        .lte("menu_date", to);
      if (menuErr) throw menuErr;

      // Collect unique dish IDs + dish names
      const dishMap = new Map<string, string>();
      for (const menu of menus ?? []) {
        for (const item of (menu as any).menu_items ?? []) {
          const dish = item.dish;
          if (dish) dishMap.set(dish.id, dish.name);
        }
      }

      const dishIds = Array.from(dishMap.keys());
      if (dishIds.length === 0) return [];

      // Fetch dish_ingredients for all dishes + ingredient info
      const { data: diRows, error: diErr } = await supabase
        .from("dish_ingredients")
        .select("dish_id, quantity, unit, ingredient:ingredients(id, name, unit, base_price)")
        .in("dish_id", dishIds);
      if (diErr) throw diErr;

      // Fetch supplier prices to detect AI-extracted ingredients
      const ingredientIds = new Set<string>();
      for (const row of diRows ?? []) {
        const ing = (row as any).ingredient;
        if (ing) ingredientIds.add(ing.id);
      }

      const aiIngredientIds = new Set<string>();
      if (ingredientIds.size > 0) {
        const { data: supplierRows } = await supabase
          .from("supplier_prices")
          .select("ingredient_id, confidence")
          .in("ingredient_id", Array.from(ingredientIds))
          .eq("confidence", "ai_extracted");
        for (const sp of supplierRows ?? []) {
          aiIngredientIds.add(sp.ingredient_id);
        }
      }

      // Count how many times each dish appears across menus
      const dishCount = new Map<string, number>();
      for (const menu of menus ?? []) {
        for (const item of (menu as any).menu_items ?? []) {
          const did = item.dish_id as string;
          dishCount.set(did, (dishCount.get(did) ?? 0) + 1);
        }
      }

      // Aggregate per ingredient
      const agg = new Map<
        string,
        { name: string; unit: string; qty: number; basePrice: number; dishes: Set<string> }
      >();

      for (const row of diRows ?? []) {
        const ing = (row as any).ingredient;
        if (!ing) continue;
        const id = ing.id as string;
        const count = dishCount.get(row.dish_id) ?? 1;
        const existing = agg.get(id);
        if (existing) {
          existing.qty += row.quantity * count;
          existing.dishes.add(dishMap.get(row.dish_id) ?? "");
        } else {
          agg.set(id, {
            name: ing.name,
            unit: ing.unit,
            qty: row.quantity * count,
            basePrice: ing.base_price,
            dishes: new Set([dishMap.get(row.dish_id) ?? ""]),
          });
        }
      }

      return Array.from(agg.entries())
        .map(([id, v]) => ({
          ingredientId: id,
          ingredientName: v.name,
          unit: v.unit,
          totalQuantity: Math.round(v.qty * 100) / 100,
          basePrice: v.basePrice,
          estimatedCost: Math.round(v.qty * v.basePrice * 100) / 100,
          dishNames: Array.from(v.dishes).filter(Boolean),
          isMissingPrice: v.basePrice === 0,
          isAiExtracted: aiIngredientIds.has(id),
        }))
        .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
    },
    enabled: !!restaurantId && !!from && !!to,
  });
}
