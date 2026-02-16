import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";
import {
  FontConfig,
  GOOGLE_FONTS,
  DEFAULT_FONTS,
  TEMPLATE_PRESETS,
  loadGoogleFonts,
} from "@/hooks/useTemplates";

interface FontSettingsCardProps {
  fonts: FontConfig;
  onChange: (fonts: FontConfig) => void;
  onSave: () => void;
  onReset: () => void;
  saving: boolean;
  primaryTemplate: string;
}

export function FontSettingsCard({
  fonts,
  onChange,
  onSave,
  onReset,
  saving,
  primaryTemplate,
}: FontSettingsCardProps) {
  // Load Google Fonts dynamically
  useEffect(() => {
    loadGoogleFonts([fonts.heading, fonts.body]);
  }, [fonts.heading, fonts.body]);

  const preset = TEMPLATE_PRESETS.find(p => p.id === primaryTemplate);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base">Typografia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Heading font */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Font nadpisov</Label>
          <Select value={fonts.heading} onValueChange={(v) => onChange({ ...fonts, heading: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: `'${f.id}', ${f.type}` }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3">
            <Label className="text-xs shrink-0 w-20">Veľkosť: {fonts.headingSize}px</Label>
            <Slider
              value={[fonts.headingSize]}
              min={14}
              max={36}
              step={1}
              onValueChange={([v]) => onChange({ ...fonts, headingSize: v })}
            />
          </div>
        </div>

        {/* Body font */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Font textu</Label>
          <Select value={fonts.body} onValueChange={(v) => onChange({ ...fonts, body: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_FONTS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  <span style={{ fontFamily: `'${f.id}', ${f.type}` }}>{f.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-3">
            <Label className="text-xs shrink-0 w-20">Veľkosť: {fonts.bodySize}px</Label>
            <Slider
              value={[fonts.bodySize]}
              min={10}
              max={24}
              step={1}
              onValueChange={([v]) => onChange({ ...fonts, bodySize: v })}
            />
          </div>
        </div>

        {/* Price font size */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Veľkosť cien: {fonts.priceSize}px</Label>
          <Slider
            value={[fonts.priceSize]}
            min={11}
            max={28}
            step={1}
            onValueChange={([v]) => onChange({ ...fonts, priceSize: v })}
          />
        </div>

        {/* Preview */}
        <div
          className="p-4 rounded-lg border border-border"
          style={{
            background: preset?.useTexture ? "hsl(24 20% 15%)" : preset?.previewColors.bg ?? "hsl(0 0% 100%)",
            color: preset?.previewColors.text ?? "hsl(0 0% 13%)",
          }}
        >
          <p
            style={{
              fontFamily: `'${fonts.heading}', serif`,
              fontSize: `${fonts.headingSize}px`,
              fontWeight: 700,
              color: preset?.previewColors.accent,
            }}
          >
            Denné Menu
          </p>
          <p
            style={{
              fontFamily: `'${fonts.body}', sans-serif`,
              fontSize: `${fonts.bodySize}px`,
              marginTop: 4,
            }}
          >
            Bryndzové halušky so slaninou
          </p>
          <p
            style={{
              fontFamily: `'${fonts.body}', sans-serif`,
              fontSize: `${fonts.priceSize}px`,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            6.90 €
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving} className="flex-1">
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "Ukladám..." : "Uložiť fonty"}
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
