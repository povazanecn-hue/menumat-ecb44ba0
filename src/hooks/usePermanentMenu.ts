import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PermanentCategory = Tables<"permanent_menu_categories">;
export type PermanentItem = Tables<"permanent_menu_items">;

export interface PermanentCategoryWithItems extends PermanentCategory {
  items: (PermanentItem & { dish: Tables<"dishes"> })[];
}

export function usePermanentMenu() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["permanent-menu", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("permanent_menu_categories")
        .select("*, items:permanent_menu_items(*, dish:dishes(*))")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map((cat: any) => ({
        ...cat,
        items: (cat.items ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      })) as PermanentCategoryWithItems[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();

  return useMutation({
    mutationFn: async ({ name, sortOrder }: { name: string; sortOrder: number }) => {
      if (!restaurantId) throw new Error("No restaurant");
      const { data, error } = await supabase
        .from("permanent_menu_categories")
        .insert({ restaurant_id: restaurantId, name, sort_order: sortOrder })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permanent-menu"] }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("permanent_menu_categories")
        .update({ name })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permanent-menu"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("permanent_menu_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permanent-menu"] }),
  });
}

export function useAddPermanentItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      dishId,
      sortOrder,
    }: {
      categoryId: string;
      dishId: string;
      sortOrder: number;
    }) => {
      const { data, error } = await supabase
        .from("permanent_menu_items")
        .insert({ category_id: categoryId, dish_id: dishId, sort_order: sortOrder })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permanent-menu"] }),
  });
}

export function useRemovePermanentItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("permanent_menu_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["permanent-menu"] }),
  });
}
