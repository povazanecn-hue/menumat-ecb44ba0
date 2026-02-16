import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";

export interface FontConfig {
  heading: string;
  body: string;
  headingSize: number; // px
  bodySize: number;    // px
  priceSize: number;   // px
}

export const GOOGLE_FONTS = [
  { id: "Playfair Display", label: "Playfair Display", type: "serif" },
  { id: "Lora", label: "Lora", type: "serif" },
  { id: "Merriweather", label: "Merriweather", type: "serif" },
  { id: "Roboto Slab", label: "Roboto Slab", type: "serif" },
  { id: "Dancing Script", label: "Dancing Script", type: "cursive" },
  { id: "Oswald", label: "Oswald", type: "sans-serif" },
  { id: "Montserrat", label: "Montserrat", type: "sans-serif" },
  { id: "Source Sans 3", label: "Source Sans 3", type: "sans-serif" },
  { id: "Open Sans", label: "Open Sans", type: "sans-serif" },
  { id: "Roboto", label: "Roboto", type: "sans-serif" },
  { id: "Lato", label: "Lato", type: "sans-serif" },
  { id: "Raleway", label: "Raleway", type: "sans-serif" },
  { id: "Poppins", label: "Poppins", type: "sans-serif" },
  { id: "Cormorant Garamond", label: "Cormorant Garamond", type: "serif" },
] as const;

export const DEFAULT_FONTS: FontConfig = {
  heading: "Playfair Display",
  body: "Source Sans 3",
  headingSize: 22,
  bodySize: 14,
  priceSize: 15,
};

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  style: "country" | "minimal" | "modern";
  useTexture?: boolean;
  defaultFonts: FontConfig;
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
    defaultFonts: { heading: "Playfair Display", body: "Source Sans 3", headingSize: 22, bodySize: 14, priceSize: 15 },
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
    defaultFonts: { heading: "Montserrat", body: "Open Sans", headingSize: 20, bodySize: 14, priceSize: 15 },
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
    defaultFonts: { heading: "Oswald", body: "Roboto", headingSize: 24, bodySize: 14, priceSize: 16 },
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
  fonts?: FontConfig;
}

/** Load Google Fonts link dynamically */
export function loadGoogleFonts(fonts: string[]) {
  const uniqueFonts = [...new Set(fonts)];
  const families = uniqueFonts.map(f => f.replace(/ /g, "+") + ":wght@400;600;700").join("&family=");
  const linkId = "google-fonts-dynamic";
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`;
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
        fonts: s.fonts ?? undefined,
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

      const merged: Record<string, any> = {
        ...((current?.settings as Record<string, any>) ?? {}),
        primary_template: settings.primary_template,
        secondary_template: settings.secondary_template,
        ...(settings.fonts ? { fonts: settings.fonts } : {}),
      };

      const { error } = await supabase
        .from("restaurants")
        .update({ settings: merged as any })
        .eq("id", restaurantId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["template-settings"] }),
  });
}
