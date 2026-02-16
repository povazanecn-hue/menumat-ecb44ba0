import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Recipe = Tables<"recipes">;
export type RecipeInsert = TablesInsert<"recipes">;
export type RecipeUpdate = TablesUpdate<"recipes">;

export interface RecipeWithDish extends Recipe {
  dish: Tables<"dishes">;
}

/** Fetch all recipes for the restaurant (via dish join) */
export function useRecipes(restaurantId: string | null) {
  return useQuery({
    queryKey: ["recipes", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("recipes")
        .select("*, dish:dishes(*)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      // Filter by restaurant through joined dish
      return (data as RecipeWithDish[]).filter(
        (r) => r.dish?.restaurant_id === restaurantId
      );
    },
    enabled: !!restaurantId,
  });
}

/** Fetch a single recipe by dish_id */
export function useRecipeByDish(dishId: string | null) {
  return useQuery({
    queryKey: ["recipe-by-dish", dishId],
    queryFn: async () => {
      if (!dishId) return null;
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("dish_id", dishId)
        .maybeSingle();
      if (error) throw error;
      return data as Recipe | null;
    },
    enabled: !!dishId,
  });
}

/** Fetch dish_ids that have recipes (for badge display) */
export function useDishRecipeIds(restaurantId: string | null) {
  return useQuery({
    queryKey: ["dish-recipe-ids", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return new Set<string>();
      const { data, error } = await supabase
        .from("recipes")
        .select("dish_id, dish:dishes(restaurant_id)");
      if (error) throw error;
      return new Set(
        (data ?? [])
          .filter((r: any) => r.dish?.restaurant_id === restaurantId)
          .map((r: any) => r.dish_id)
      );
    },
    enabled: !!restaurantId,
  });
}

/** Create or update a recipe (upsert by dish_id) */
export function useUpsertRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      dishId,
      data,
    }: {
      dishId: string;
      data: Partial<Omit<RecipeInsert, "dish_id" | "id">>;
    }) => {
      // Check existing
      const { data: existing } = await supabase
        .from("recipes")
        .select("id, is_locked")
        .eq("dish_id", dishId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("recipes")
          .update(data)
          .eq("id", existing.id);
        if (error) throw error;
        return existing.id;
      } else {
        const { data: created, error } = await supabase
          .from("recipes")
          .insert({ dish_id: dishId, ...data })
          .select("id")
          .single();
        if (error) throw error;
        return created.id;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["recipe-by-dish"] });
      qc.invalidateQueries({ queryKey: ["dish-recipe-ids"] });
    },
  });
}

/** Delete a recipe */
export function useDeleteRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      qc.invalidateQueries({ queryKey: ["recipe-by-dish"] });
      qc.invalidateQueries({ queryKey: ["dish-recipe-ids"] });
    },
  });
}
