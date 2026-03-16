import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useTemplateSettings,
  useSaveTemplateSettings,
  TEMPLATE_PRESETS,
  FontConfig,
  loadGoogleFonts,
} from "@/hooks/useTemplates";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";

export default function Templates() {
  const { data: settings, isLoading } = useTemplateSettings();
  const saveSettings = useSaveTemplateSettings();
  const { toast } = useToast();

  const currentPreset = TEMPLATE_PRESETS.find(p => p.id === settings?.primary_template) ?? TEMPLATE_PRESETS[0];
  const [fonts, setFonts] = useState<FontConfig>(settings?.fonts ?? currentPreset.defaultFonts);

  useEffect(() => {
    if (settings?.fonts) setFonts(settings.fonts);
    else if (currentPreset) setFonts(currentPreset.defaultFonts);
  }, [settings?.fonts, currentPreset.id]);

  useEffect(() => {
    loadGoogleFonts([fonts.heading, fonts.body]);
  }, [fonts.heading, fonts.body]);

  const handleSetPrimary = async (templateId: string) => {
    try {
      const preset = TEMPLATE_PRESETS.find(p => p.id === templateId);
      await saveSettings.mutateAsync({
        primary_template: templateId,
        secondary_template: settings?.secondary_template === templateId ? null : settings?.secondary_template ?? null,
        fonts: preset?.defaultFonts,
      });
      if (preset) setFonts(preset.defaultFonts);
      toast({ title: "Primárna šablóna nastavená" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const isPrimary = (id: string) => settings?.primary_template === id;
  const isSecondary = (id: string) => settings?.secondary_template === id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Šablóny"
        subtitle="Primárne a sekundárne style sety"
        actions={[
          { label: "Cloudinary AI", onClick: () => {}, variant: "outline" },
          { label: "Nastaviť primárnu", onClick: () => {}, variant: "primary" },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rustikálny */}
            <GlassPanel title="Rustikálny">
              <div className="space-y-2">
                <GlassRow
                  label="Drevený podklad + zlatá typografia"
                  badge={isPrimary("country") ? "primárna" : "nastaviť"}
                  badgeStyle={isPrimary("country") ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                  onClick={() => handleSetPrimary("country")}
                />
                <GlassRow label="Nadpis: Playfair Display" badge="28px" badgeStyle="bg-muted text-muted-foreground" />
              </div>
            </GlassPanel>

            {/* Moderný / Tmavý */}
            <GlassPanel title="Moderný / Tmavý">
              <div className="space-y-2">
                <GlassRow
                  label="Tmavé pozadie + kontrastný text"
                  badge={isPrimary("modern") ? "primárna" : isSecondary("modern") ? "sekundárna" : "nastaviť"}
                  badgeStyle={isPrimary("modern") || isSecondary("modern") ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                  onClick={() => handleSetPrimary("modern")}
                />
                <GlassRow label="Text: Manrope" badge="16px" badgeStyle="bg-muted text-muted-foreground" />
              </div>
            </GlassPanel>
          </div>

          {/* Typografia a AI obrazok */}
          <GlassPanel title="Typografia a AI obrazok">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <GlassRow
                label={`Veľkosť cien ${fonts.priceSize ?? 15}px, heading ${fonts.headingSize ?? 22}px`}
                badge="upraviť"
                badgeStyle="bg-primary/20 text-primary"
              />
              <GlassRow label="AI upscale + remove bg" badge="cloudinary" badgeStyle="bg-muted text-muted-foreground" />
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}
