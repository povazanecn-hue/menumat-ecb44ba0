import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTemplateSettings,
  useSaveTemplateSettings,
  TEMPLATE_PRESETS,
  FontConfig,
  DEFAULT_FONTS,
  loadGoogleFonts,
} from "@/hooks/useTemplates";
import { TemplatePreviewCard } from "@/components/templates/TemplatePreviewCard";
import { FontSettingsCard } from "@/components/templates/FontSettingsCard";
import { CloudinaryToolsCard } from "@/components/templates/CloudinaryToolsCard";

export default function Templates() {
  const { data: settings, isLoading } = useTemplateSettings();
  const saveSettings = useSaveTemplateSettings();
  const { toast } = useToast();

  const currentPreset = TEMPLATE_PRESETS.find(p => p.id === settings?.primary_template) ?? TEMPLATE_PRESETS[0];
  const [fonts, setFonts] = useState<FontConfig>(settings?.fonts ?? currentPreset.defaultFonts);

  useEffect(() => {
    if (settings?.fonts) {
      setFonts(settings.fonts);
    } else if (currentPreset) {
      setFonts(currentPreset.defaultFonts);
    }
  }, [settings?.fonts, currentPreset.id]);

  useEffect(() => {
    loadGoogleFonts([fonts.heading, fonts.body]);
  }, [fonts.heading, fonts.body]);

  const handleSetPrimary = async (templateId: string) => {
    try {
      const secondary = settings?.secondary_template === templateId ? null : settings?.secondary_template ?? null;
      const preset = TEMPLATE_PRESETS.find(p => p.id === templateId);
      await saveSettings.mutateAsync({
        primary_template: templateId,
        secondary_template: secondary,
        fonts: preset?.defaultFonts,
      });
      if (preset) setFonts(preset.defaultFonts);
      toast({ title: "Primárna šablóna nastavená" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleSetSecondary = async (templateId: string) => {
    try {
      await saveSettings.mutateAsync({
        primary_template: settings?.primary_template ?? "country",
        secondary_template: templateId,
        fonts,
      });
      toast({ title: "Sekundárna šablóna nastavená" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleSaveFonts = async () => {
    try {
      await saveSettings.mutateAsync({
        primary_template: settings?.primary_template ?? "country",
        secondary_template: settings?.secondary_template ?? null,
        fonts,
      });
      toast({ title: "Typografia uložená" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleResetFonts = () => {
    setFonts(currentPreset.defaultFonts);
  };

  const primaryPreset = TEMPLATE_PRESETS.find((p) => p.id === settings?.primary_template);
  const secondaryPreset = TEMPLATE_PRESETS.find((p) => p.id === settings?.secondary_template);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Šablóny</h1>
          <p className="text-muted-foreground text-sm mt-1">Primárne a sekundárne style sety</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border text-foreground hover:bg-secondary rounded-full px-5">
            Cloudinary AI
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5">
            Nastaviť primárnu
          </Button>
        </div>
      </div>

      {!isLoading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-base">Aktuálny výber</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Primárna:</span>
              <Badge variant="default">{primaryPreset?.name ?? "Nezvolená"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sekundárna:</span>
              <Badge variant="secondary">{secondaryPreset?.name ?? "Žiadna"}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATE_PRESETS.map((preset) => (
              <TemplatePreviewCard
                key={preset.id}
                preset={preset}
                isPrimary={settings?.primary_template === preset.id}
                isSecondary={settings?.secondary_template === preset.id}
                onSetPrimary={() => handleSetPrimary(preset.id)}
                onSetSecondary={() => handleSetSecondary(preset.id)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FontSettingsCard
              fonts={fonts}
              onChange={setFonts}
              onSave={handleSaveFonts}
              onReset={handleResetFonts}
              saving={saveSettings.isPending}
              primaryTemplate={settings?.primary_template ?? "country"}
            />
            <CloudinaryToolsCard />
          </div>
        </>
      )}

      <Card>
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground">
            <strong>Primárna šablóna</strong> sa automaticky predvolí pri exporte. 
            <strong> Sekundárna šablóna</strong> je dostupná ako rýchla alternatíva v export centre.
            Šablóny ovplyvňujú TV FullHD výstup, PDF/tlač a web embed export.
            <strong> Typografia</strong> sa aplikuje na všetky exporty.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
