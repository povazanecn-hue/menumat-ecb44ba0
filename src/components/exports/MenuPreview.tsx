import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DISH_CATEGORIES } from "@/lib/constants";
import { TEMPLATE_PRESETS } from "@/hooks/useTemplates";
import woodBg from "@/assets/textures/wood-bg.jpg";
import woodHeader from "@/assets/textures/wood-header.jpg";

interface MenuPreviewProps {
  menu: any;
  templateStyle?: string;
  showFinancials?: boolean;
}

export function MenuPreview({ menu, templateStyle = "country", showFinancials = false }: MenuPreviewProps) {
  const preset = TEMPLATE_PRESETS.find((p) => p.id === templateStyle) ?? TEMPLATE_PRESETS[0];
  const { previewColors } = preset;

  if (!menu) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Vyberte menu pre náhľad.
        </CardContent>
      </Card>
    );
  }

  const items = [...(menu.menu_items ?? [])].sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const cat = item.dish?.category ?? "ine";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const getPrice = (item: any) => {
    const p = item.override_price ?? item.dish?.final_price ?? item.dish?.recommended_price ?? 0;
    return `${Number(p).toFixed(2)} €`;
  };

  const getCost = (item: any) => {
    return Number(item.dish?.cost ?? 0).toFixed(2);
  };

  const getMargin = (item: any) => {
    const price = item.override_price ?? item.dish?.final_price ?? item.dish?.recommended_price ?? 0;
    const cost = item.dish?.cost ?? 0;
    if (cost === 0) return "—";
    return `${(((price - cost) / cost) * 100).toFixed(0)}%`;
  };

  const dateStr = menu.menu_date
    ? new Date(menu.menu_date + "T00:00:00").toLocaleDateString("sk-SK", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Card className="overflow-hidden">
      <div
        className="rounded-lg bg-cover bg-center"
        style={{
          background: preset.useTexture
            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.5)), url(${woodBg})`
            : previewColors.bg,
          backgroundSize: "cover",
          color: preset.useTexture ? previewColors.text : previewColors.text,
        }}
      >
        <div
          className="p-5 pb-3 text-center border-b bg-cover bg-center"
          style={{
            borderColor: `${previewColors.accent}30`,
            ...(preset.useTexture ? {
              background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.4)), url(${woodHeader})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}),
          }}
        >
          <h2
            className="font-serif text-xl font-bold tracking-wide uppercase"
            style={{ color: previewColors.accent }}
          >
            Denné Menu
          </h2>
          <p className="text-sm mt-1 capitalize opacity-75">{dateStr}</p>
          <Badge
            className="mt-2 text-[10px]"
            style={{
              background: `${previewColors.accent}20`,
              color: previewColors.accent,
              border: `1px solid ${previewColors.accent}40`,
            }}
          >
            {menu.status === "published" ? "Publikované" : "Koncept"}
          </Badge>
        </div>

        <div className="p-5 space-y-5">
          {Object.entries(groups).map(([cat, catItems]) => (
            <div key={cat}>
              <h4
                className="font-serif font-semibold text-xs uppercase tracking-[0.15em] mb-2 pb-1"
                style={{ color: previewColors.accent, borderBottom: `2px solid ${previewColors.accent}40` }}
              >
                {DISH_CATEGORIES[cat] || cat}
              </h4>
              <div className="space-y-1.5">
                {catItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="text-sm py-0.5"
                    style={{ borderBottom: `1px dotted ${previewColors.accent}25` }}
                  >
                    <div className="flex justify-between items-baseline">
                      <span>
                        {item.dish?.name}
                        {item.dish?.grammage && (
                          <span className="ml-1 opacity-60 text-xs">({item.dish.grammage})</span>
                        )}
                      </span>
                      <span className="font-bold ml-4 whitespace-nowrap">{getPrice(item)}</span>
                    </div>
                    {showFinancials && (
                      <div className="flex gap-3 text-[10px] opacity-50 mt-0.5">
                        <span>Náklad: {getCost(item)} €</span>
                        <span>Marža: {getMargin(item)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!items.length && (
            <p className="text-sm text-center opacity-50">Toto menu nemá žiadne jedlá.</p>
          )}
        </div>

        <div className="px-5 py-3 text-center opacity-40">
          <p className="text-[10px] uppercase tracking-widest">Šablóna: {preset.name}</p>
        </div>
      </div>
    </Card>
  );
}
