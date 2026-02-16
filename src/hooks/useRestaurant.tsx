import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RestaurantContextType {
  restaurantId: string | null;
  restaurantName: string | null;
  loading: boolean;
  refetch: () => void;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurantId: null,
  restaurantName: null,
  loading: true,
  refetch: () => {},
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    if (!user) {
      setRestaurantId(null);
      setRestaurantName(null);
      setLoading(false);
      return;
    }

    const { data: memberships } = await supabase
      .from("restaurant_members")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .limit(1);

    if (memberships && memberships.length > 0) {
      const rid = memberships[0].restaurant_id;
      setRestaurantId(rid);

      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name")
        .eq("id", rid)
        .single();

      setRestaurantName(restaurant?.name ?? null);
    } else {
      setRestaurantId(null);
      setRestaurantName(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();
  }, [user]);

  return (
    <RestaurantContext.Provider value={{ restaurantId, restaurantName, loading, refetch: fetchRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);
