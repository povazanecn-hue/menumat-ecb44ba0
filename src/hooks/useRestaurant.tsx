import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RestaurantContextType {
  restaurantId: string | null;
  restaurantName: string | null;
  loading: boolean;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurantId: null,
  restaurantName: null,
  loading: true,
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRestaurantId(null);
      setRestaurantName(null);
      setLoading(false);
      return;
    }

    const fetchRestaurant = async () => {
      const { data: membership } = await supabase
        .from("restaurant_members")
        .select("restaurant_id, restaurants(name)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (membership) {
        setRestaurantId(membership.restaurant_id);
        const restaurant = membership.restaurants as any;
        setRestaurantName(restaurant?.name ?? null);
      }
      setLoading(false);
    };

    fetchRestaurant();
  }, [user]);

  return (
    <RestaurantContext.Provider value={{ restaurantId, restaurantName, loading }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);
