import { Check, Star, StarOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TemplatePreset } from "@/hooks/useTemplates";
import { DISH_CATEGORIES } from "@/lib/constants";
import woodBg from "@/assets/textures/wood-bg.jpg";

interface TemplatePreviewCardProps {
  preset: TemplatePreset;
  isPrimary: boolean;
  isSecondary: boolean;
  onSetPrimary: () => void;
  onSetSecondary: () => void;
}

const SAMPLE_ITEMS = [
  { category: "polievka", name: "Cesnaková krémová", price: "2.50" },
  { category: "hlavne_jedlo", name: "Bravčový rezeň s ryžou", price: "6.90" },
  { category: "hlavne_jedlo", name: "Grilovaný losos", price: "8.50" },
  { category: "dezert", name: "Panna cotta", price: "3.20" },
];

export function TemplatePreviewCard({
  preset,
  isPrimary,
  isSecondary,
  onSetPrimary,
  onSetSecondary,
}: TemplatePreviewCardProps) {
  const { previewColors } = preset;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 ${isPrimary ? "ring-2 ring-primary" : isSecondary ? "ring-2 ring-accent" : "border-border hover:border-primary/20"}`}>
      {/* Mini preview */}
      <div
        className="p-4 space-y-2 bg-cover bg-center"
        style={{
          background: preset.useTexture
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.5)), url(${woodBg})`
            : previewColors.bg,
          backgroundSize: "cover",
          color: preset.useTexture ? "hsl(36 50% 88%)" : previewColors.text,
        }}
      >
        <div className="text-center mb-3">
          <div
            className="font-serif text-sm font-bold"
            style={{ color: previewColors.accent }}
          >
            DENNÉ MENU
          </div>
          <div className="text-[10px] opacity-70">Pondelok 17.2.2026</div>
        </div>

        {SAMPLE_ITEMS.map((item, i) => (
          <div
            key={i}
            className="flex justify-between items-baseline text-[11px] py-0.5"
            style={{ borderBottom: `1px dotted ${previewColors.accent}40` }}
          >
            <span>
              <span className="font-medium">{item.name}</span>
            </span>
            <span className="font-bold ml-2">{item.price} €</span>
          </div>
        ))}
      </div>

      {/* Info + actions */}
      <CardContent className="pt-3 pb-4 space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-semibold text-sm">{preset.name}</h3>
            {isPrimary && (
              <Badge variant="default" className="text-[10px]">Primárna</Badge>
            )}
            {isSecondary && (
              <Badge variant="secondary" className="text-[10px]">Sekundárna</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isPrimary ? "default" : "outline"}
            className="flex-1 text-xs"
            onClick={onSetPrimary}
            disabled={isPrimary}
          >
            {isPrimary ? <Check className="h-3 w-3 mr-1" /> : <Star className="h-3 w-3 mr-1" />}
            {isPrimary ? "Primárna" : "Nastaviť ako primárnu"}
          </Button>
          <Button
            size="sm"
            variant={isSecondary ? "secondary" : "ghost"}
            className="text-xs"
            onClick={onSetSecondary}
            disabled={isSecondary}
          >
            {isSecondary ? <Check className="h-3 w-3 mr-1" /> : <StarOff className="h-3 w-3 mr-1" />}
            {isSecondary ? "Sekundárna" : "2."}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
