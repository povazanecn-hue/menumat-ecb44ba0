import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Tables, Enums } from "@/integrations/supabase/types";

export type MenuExport = Tables<"menu_exports">;
export type ExportFormat = Enums<"export_format">;

/** Fetch export history for the restaurant */
export function useExportHistory() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["menu-exports", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menu_exports")
        .select("*, menu:menus(menu_date, restaurant_id)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      // Filter by restaurant via joined menu
      return (data ?? []).filter(
        (e: any) => e.menu?.restaurant_id === restaurantId
      );
    },
    enabled: !!restaurantId,
  });
}

/** Save an export record */
export function useSaveExport() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      menuId,
      format,
      templateName,
      fileUrl,
    }: {
      menuId: string;
      format: ExportFormat;
      templateName?: string;
      fileUrl?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("menu_exports")
        .insert({
          menu_id: menuId,
          format,
          template_name: templateName ?? null,
          file_url: fileUrl ?? null,
          exported_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-exports"] }),
  });
}

/** Fetch published menus for the restaurant (to pick from) */
export function usePublishedMenus() {
  const { restaurantId } = useRestaurant();

  return useQuery({
    queryKey: ["published-menus", restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      const { data, error } = await supabase
        .from("menus")
        .select("*, menu_items(*, dish:dishes(*))")
        .eq("restaurant_id", restaurantId)
        .order("menu_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!restaurantId,
  });
}
