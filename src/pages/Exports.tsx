import { useState } from "react";
import { usePublishedMenus } from "@/hooks/useExports";
import { useTemplateSettings } from "@/hooks/useTemplates";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { ExportValidationBanner } from "@/components/exports/ExportValidationBanner";

export default function Exports() {
  const { data: menus, isLoading } = usePublishedMenus();
  const { data: templateSettings } = useTemplateSettings();
  const [selectedMenuId, setSelectedMenuId] = useState<string>("");

  const selectedMenu = menus?.find((m: any) => m.id === selectedMenuId) ?? null;

  // Pick first menu if none selected
  const activeMenu = selectedMenu ?? (menus?.[0] ?? null);
  const menuLabel = activeMenu
    ? new Date(activeMenu.menu_date + "T00:00:00").toLocaleDateString("sk-SK", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      })
    : "";

  const templateName =
    templateSettings?.primary_template === "modern"
      ? "Modern Dark"
      : templateSettings?.primary_template === "minimal"
        ? "Minimal"
        : "Amber Premium";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Export centrum"
        subtitle="TV, PDF/Tlač, Excel kuchyňa, Web embed"
        actions={[
          { label: "História exportov", onClick: () => {}, variant: "outline" },
          { label: "Exportovať", onClick: () => {}, variant: "primary" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {selectedMenu && <ExportValidationBanner menu={selectedMenu} />}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Preview menu — left 3 cols */}
            <GlassPanel title="Preview menu" className="lg:col-span-3">
              <div className="space-y-2">
                <GlassRow
                  label={`Denne menu ${menuLabel}`}
                  badge={templateName}
                  badgeStyle="bg-primary/20 text-primary"
                />
                <GlassRow label="Zobrazit naklady a marzu" badge="ON" badgeStyle="bg-primary/20 text-primary" />
              </div>
            </GlassPanel>

            {/* Export akcie — right 2 cols */}
            <GlassPanel title="Export akcie" className="lg:col-span-2">
              <div className="space-y-2">
                <GlassRow label="TV FullHD" badge="ready" badgeStyle="bg-muted text-muted-foreground" />
                <GlassRow label="PDF / Tlač" badge="ready" badgeStyle="bg-muted text-muted-foreground" />
                <GlassRow label="Excel kuchyňa" badge="ready" badgeStyle="bg-muted text-muted-foreground" />
                <GlassRow label="Web embed" badge="ready" badgeStyle="bg-muted text-muted-foreground" />
              </div>
            </GlassPanel>
          </div>

          {/* Live URL */}
          <GlassPanel title="Live URL">
            <GlassRow
              label="https://.../menu/tv/2402"
              badge="auto refresh 60s"
              badgeStyle="bg-primary/20 text-primary"
            />
          </GlassPanel>
        </>
      )}
    </div>
  );
}
