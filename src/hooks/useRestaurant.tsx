import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface WizardDefaults {
  slots?: { soups: number; mains: number; desserts: number };
  extraSlots?: { category: string; count: number }[];
  selectedDays?: number[];
}

interface RestaurantSettings {
  default_margin: number;
  vat_rate: number;
  non_repeat_days: number;
  wizard_defaults?: WizardDefaults;
}

const DEFAULT_SETTINGS: RestaurantSettings = {
  default_margin: 100,
  vat_rate: 20,
  non_repeat_days: 14,
};

interface RestaurantContextType {
  restaurantId: string | null;
  restaurantName: string | null;
  settings: RestaurantSettings;
  loading: boolean;
  refetch: () => void;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurantId: null,
  restaurantName: null,
  settings: DEFAULT_SETTINGS,
  loading: true,
  refetch: () => {},
});

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    if (!user) {
      setRestaurantId(null);
      setRestaurantName(null);
      setSettings(DEFAULT_SETTINGS);
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
        .select("name, settings")
        .eq("id", rid)
        .single();

      setRestaurantName(restaurant?.name ?? null);
      if (restaurant?.settings) {
        const s = restaurant.settings as any;
        setSettings({
          default_margin: s.default_margin ?? DEFAULT_SETTINGS.default_margin,
          vat_rate: s.vat_rate ?? DEFAULT_SETTINGS.vat_rate,
          non_repeat_days: s.non_repeat_days ?? DEFAULT_SETTINGS.non_repeat_days,
          wizard_defaults: s.wizard_defaults ?? undefined,
        });
      }
    } else {
      setRestaurantId(null);
      setRestaurantName(null);
      setSettings(DEFAULT_SETTINGS);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRestaurant();
  }, [user]);

  return (
    <RestaurantContext.Provider value={{ restaurantId, restaurantName, settings, loading, refetch: fetchRestaurant }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export const useRestaurant = () => useContext(RestaurantContext);
