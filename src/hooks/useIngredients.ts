import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Ingredient = Tables<"ingredients">;
export type IngredientInsert = TablesInsert<"ingredients">;
export type IngredientUpdate = TablesUpdate<"ingredients">;
export type SupplierPrice = Tables<"supplier_prices">;

export interface IngredientWithSuppliers extends Ingredient {
  supplier_prices: SupplierPrice[];
}

export function useIngredients() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["ingredients", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("ingredients")
        .select("*, supplier_prices(*)")
        .eq("restaurant_id", restaurantId)
        .order("name");
      if (error) throw error;
      return data as IngredientWithSuppliers[];
    },
    enabled: !!restaurantId,
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();

  return useMutation({
    mutationFn: async (ingredient: Omit<IngredientInsert, "restaurant_id">) => {
      if (!restaurantId) throw new Error("No restaurant");
      const { data, error } = await supabase
        .from("ingredients")
        .insert({ ...ingredient, restaurant_id: restaurantId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: IngredientUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("ingredients")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ingredients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

// Supplier prices
export function useCreateSupplierPrice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (price: Omit<TablesInsert<"supplier_prices">, "id">) => {
      const { data, error } = await supabase
        .from("supplier_prices")
        .insert(price)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useDeleteSupplierPrice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("supplier_prices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

/** Use a supplier price as the ingredient's base price */
export function useApplySupplierPrice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ ingredientId, price }: { ingredientId: string; price: number }) => {
      const { error } = await supabase
        .from("ingredients")
        .update({ base_price: price })
        .eq("id", ingredientId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}
