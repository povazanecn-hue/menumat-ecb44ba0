import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Dish = Tables<"dishes">;
export type DishInsert = TablesInsert<"dishes">;
export type DishUpdate = TablesUpdate<"dishes">;

export function useDishes() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["dishes", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("dishes")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return data as Dish[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateDish() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();

  return useMutation({
    mutationFn: async (dish: Omit<DishInsert, "restaurant_id">) => {
      if (!restaurantId) throw new Error("No restaurant");
      const { data, error } = await supabase
        .from("dishes")
        .insert({ ...dish, restaurant_id: restaurantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dishes"] }),
  });
}

export function useUpdateDish() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DishUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("dishes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dishes"] }),
  });
}

export function useDeleteDish() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dishes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dishes"] }),
  });
}
