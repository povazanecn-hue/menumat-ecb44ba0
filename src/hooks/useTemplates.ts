import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  style: "country" | "minimal" | "modern";
  useTexture?: boolean;
  previewColors: {
    bg: string;
    text: string;
    accent: string;
    card: string;
  };
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "country",
    name: "Vidiecky / Rustikálny",
    description: "Teplé farby, drevené textúry, tradičný vzhľad pre klasickú reštauráciu.",
    style: "country",
    useTexture: true,
    previewColors: {
      bg: "hsl(24 20% 18%)",
      text: "hsl(36 50% 88%)",
      accent: "hsl(40 55% 55%)",
      card: "hsl(36 30% 92%)",
    },
  },
  {
    id: "minimal",
    name: "Minimalistický",
    description: "Čistý biely dizajn, jednoduchá typografia, moderný a elegantný.",
    style: "minimal",
    previewColors: {
      bg: "hsl(0 0% 100%)",
      text: "hsl(0 0% 13%)",
      accent: "hsl(0 0% 20%)",
      card: "hsl(0 0% 98%)",
    },
  },
  {
    id: "modern",
    name: "Moderný / Tmavý",
    description: "Tmavé pozadie, výrazné akcenty, ideálny pre TV displej a moderné podniky.",
    style: "modern",
    previewColors: {
      bg: "hsl(235 25% 13%)",
      text: "hsl(0 0% 88%)",
      accent: "hsl(350 80% 58%)",
      card: "hsl(235 20% 18%)",
    },
  },
];

export interface TemplateSettings {
  primary_template: string;
  secondary_template: string | null;
}

/** Read template settings from restaurant.settings JSON */
export function useTemplateSettings() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["template-settings", restaurantId],
    queryFn: async (): Promise<TemplateSettings> => {
      if (!restaurantId) return { primary_template: "country", secondary_template: null };
      const { data, error } = await supabase
        .from("restaurants")
        .select("settings")
        .eq("id", restaurantId)
        .single();
      if (error) throw error;
      const s = data?.settings as Record<string, any> ?? {};
      return {
        primary_template: s.primary_template ?? "country",
        secondary_template: s.secondary_template ?? null,
      };
    },
    enabled: !!restaurantId,
  });
}

/** Save template preferences to restaurant.settings */
export function useSaveTemplateSettings() {
  const qc = useQueryClient();
  const { restaurantId } = useRestaurant();

  return useMutation({
    mutationFn: async (settings: TemplateSettings) => {
      if (!restaurantId) throw new Error("No restaurant");
      // Read current settings first to merge
      const { data: current } = await supabase
        .from("restaurants")
        .select("settings")
        .eq("id", restaurantId)
        .single();

      const merged = {
        ...((current?.settings as Record<string, any>) ?? {}),
        primary_template: settings.primary_template,
        secondary_template: settings.secondary_template,
      };

      const { error } = await supabase
        .from("restaurants")
        .update({ settings: merged })
        .eq("id", restaurantId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["template-settings"] }),
  });
}
