import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Tables } from "@/integrations/supabase/types";
import { startOfWeek, addDays, format } from "date-fns";

export type Menu = Tables<"menus">;
export type MenuItem = Tables<"menu_items">;

export interface MenuWithItems extends Menu {
  menu_items: (MenuItem & { dish: Tables<"dishes"> })[];
}

/** Get Monday of the week containing `date` */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** Get array of weekday dates Mon–Fri */
export function getWeekdays(weekStart: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
}

export function formatDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Fetch menus + items for a given week */
export function useWeekMenus(weekStart: Date) {
  const { restaurantId } = useRestaurant();
  const days = getWeekdays(weekStart);
  const from = formatDateKey(days[0]);
  const to = formatDateKey(days[4]);

  return useQuery({
    queryKey: ["menus", restaurantId, from],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menus")
        .select("*, menu_items(*, dish:dishes(*))")
        .eq("restaurant_id", restaurantId)
        .gte("menu_date", from)
        .lte("menu_date", to)
        .order("menu_date");
      if (error) throw error;
      return data as MenuWithItems[];
    },
    enabled: !!restaurantId,
  });
}

/** Upsert a menu for a given date (create if missing) */
export function useUpsertMenu() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();

  return useMutation({
    mutationFn: async (menuDate: string) => {
      if (!restaurantId) throw new Error("No restaurant");
      // Check if menu exists
      const { data: existing } = await supabase
        .from("menus")
        .select("id")
        .eq("restaurant_id", restaurantId)
        .eq("menu_date", menuDate)
        .maybeSingle();

      if (existing) return existing.id;

      const { data, error } = await supabase
        .from("menus")
        .insert({ restaurant_id: restaurantId, menu_date: menuDate })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/** Add a dish to a menu */
export function useAddMenuItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      menuId,
      dishId,
      sortOrder,
      overridePrice,
      sideDish,
      extras,
    }: {
      menuId: string;
      dishId: string;
      sortOrder: number;
      overridePrice?: number | null;
      sideDish?: string;
      extras?: string;
    }) => {
      const { data, error } = await supabase
        .from("menu_items")
        .insert({
          menu_id: menuId,
          dish_id: dishId,
          sort_order: sortOrder,
          override_price: overridePrice ?? null,
          side_dish: sideDish || null,
          extras: extras || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/** Remove a menu item */
export function useRemoveMenuItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/** Update a menu item (side_dish, extras, dish_id, etc.) */
export function useUpdateMenuItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; dish_id?: string; side_dish?: string | null; extras?: string | null; sort_order?: number }) => {
      const { error } = await supabase
        .from("menu_items")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/** Update menu status */
export function useUpdateMenuStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("menus")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menus"] }),
  });
}

/** Check if a dish was used within the last N days (non-repeat rule) */
export function useRecentDishUsage(nonRepeatDays: number = 14) {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["recent-dish-usage", restaurantId, nonRepeatDays],
    queryFn: async () => {
      if (!restaurantId) return {};
      const cutoff = format(addDays(new Date(), -nonRepeatDays), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("menus")
        .select("menu_date, menu_items(dish_id)")
        .eq("restaurant_id", restaurantId)
        .gte("menu_date", cutoff);
      if (error) throw error;

      // Map: dish_id -> most recent date used
      const usage: Record<string, string> = {};
      for (const menu of data ?? []) {
        for (const item of (menu as any).menu_items ?? []) {
          const existing = usage[item.dish_id];
          if (!existing || menu.menu_date > existing) {
            usage[item.dish_id] = menu.menu_date;
          }
        }
      }
      return usage;
    },
    enabled: !!restaurantId,
  });
}
