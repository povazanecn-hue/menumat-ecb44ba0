import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "owner" | "manager" | "staff";

export function useUserRole() {
  const { user } = useAuth();
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["user-role", user?.id, restaurantId],
    queryFn: async () => {
      if (!user || !restaurantId) return null;
      const { data, error } = await supabase
        .from("restaurant_members")
        .select("role")
        .eq("user_id", user.id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();
      if (error) throw error;
      return (data?.role ?? "staff") as AppRole;
    },
    enabled: !!user && !!restaurantId,
  });
}

/** Returns true if user can see financial data (cost, margin, recommended price) */
export function useCanViewFinancials() {
  const { data: role } = useUserRole();
  // staff (Chef) cannot see financial columns
  return role !== "staff";
}
