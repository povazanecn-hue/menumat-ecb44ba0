import { useState } from "react";
import { Dish } from "@/hooks/useDishes";
import { useToast } from "@/hooks/use-toast";

interface RegenerateOptions {
  dishes: Dish[];
  recentUsage: Record<string, string>;
  nonRepeatDays: number;
}

export function useMenuRegenerate({ dishes, recentUsage, nonRepeatDays }: RegenerateOptions) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callRegenerate = async (body: Record<string, any>) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-menu-item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            ...body,
            dishes: dishes.map((d) => ({
              id: d.id,
              name: d.name,
              category: d.category,
              is_daily_menu: d.is_daily_menu,
              final_price: d.final_price,
              recommended_price: d.recommended_price,
            })),
            recentUsage,
            nonRepeatDays,
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: "Chyba AI", description: data.error, variant: "destructive" });
        return null;
      }
      return data.result;
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const regenerateSideDish = (dishName: string) =>
    callRegenerate({ level: "side_dish", currentDishName: dishName });

  const regenerateDish = (dishId: string, dishName: string, category: string) =>
    callRegenerate({ level: "dish", currentDishId: dishId, currentDishName: dishName, currentCategory: category });

  const regenerateDay = (daySlots?: { soups: number; mains: number; desserts: number }) =>
    callRegenerate({ level: "day", daySlots });

  const regenerateWeek = (daySlots?: { soups: number; mains: number; desserts: number }) =>
    callRegenerate({ level: "week", daySlots });

  return { loading, regenerateSideDish, regenerateDish, regenerateDay, regenerateWeek };
}
