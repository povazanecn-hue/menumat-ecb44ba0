import { useState } from "react";
import { Eye, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermanentCategoryWithItems } from "@/hooks/usePermanentMenu";
import { useTemplateSettings, TEMPLATE_PRESETS } from "@/hooks/useTemplates";
import woodPlanks from "@/assets/textures/wood-planks.jpg";
import woodBg from "@/assets/textures/wood-bg.jpg";

interface PermanentMenuPreviewProps {
  categories: PermanentCategoryWithItems[];
  restaurantName: string;
}

const TEMPLATE_STYLES = {
  country: {
    bg: "#170f0a",
    text: "#f2e4cb",
    accent: "#d8b469",
    headerFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Source Sans 3', sans-serif",
    categoryDivider: "border-b-2 border-[#d8b469]/40",
    useTexture: true,
  },
  minimal: {
    bg: "#ffffff",
    text: "#1a1a1a",
    accent: "#333333",
    headerFont: "'Playfair Display', Georgia, serif",
    bodyFont: "'Source Sans 3', sans-serif",
    categoryDivider: "border-b border-gray-200",
    useTexture: false,
  },
  modern: {
    bg: "#1a1a2e",
    text: "#e0e0e0",
    accent: "#e94560",
    headerFont: "'Inter', Arial, sans-serif",
    bodyFont: "'Inter', Arial, sans-serif",
    categoryDivider: "border-b border-[#e94560]/30",
    useTexture: false,
  },
};

function MenuCard({
  categories,
  restaurantName,
  template,
  compact = false,
}: {
  categories: PermanentCategoryWithItems[];
  restaurantName: string;
  template: keyof typeof TEMPLATE_STYLES;
  compact?: boolean;
}) {
  const style = TEMPLATE_STYLES[template];
  const textSize = compact ? "text-[10px]" : "text-sm";
  const headingSize = compact ? "text-xs" : "text-lg";
  const titleSize = compact ? "text-sm" : "text-2xl";
  const gap = compact ? "gap-2" : "gap-5";

  return (
    <div
      className={`rounded-xl overflow-hidden ${compact ? "p-3" : "p-6 md:p-10"}`}
      style={{
        background: style.useTexture
          ? `linear-gradient(rgba(23,15,10,0.82), rgba(23,15,10,0.88)), url(${woodPlanks})`
          : style.bg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: style.text,
        fontFamily: style.bodyFont,
      }}
    >
      {/* Header */}
      <div className={`text-center ${compact ? "mb-3" : "mb-8"}`}>
        <h1
          className={`${titleSize} font-bold uppercase tracking-[0.15em]`}
          style={{ fontFamily: style.headerFont, color: style.accent }}
        >
          {restaurantName}
        </h1>
        <div
          className={`${compact ? "mt-0.5" : "mt-1"} ${compact ? "text-[8px]" : "text-xs"} uppercase tracking-[0.3em] opacity-60`}
        >
          Jedálny lístok
        </div>
        {/* Decorative line */}
        <div
          className={`mx-auto ${compact ? "mt-1.5 w-12" : "mt-3 w-24"} border-t-2`}
          style={{ borderColor: style.accent }}
        />
      </div>

      {/* Categories */}
      <div className={`flex flex-col ${gap}`}>
        {categories.map((cat) => (
          <div key={cat.id}>
            {/* Category heading */}
            <div className={`${compact ? "mb-1" : "mb-3"} ${compact ? "pb-0.5" : "pb-1"}`} style={{ borderBottom: `1px solid ${style.accent}40` }}>
              <h2
                className={`${headingSize} font-bold uppercase tracking-[0.1em]`}
                style={{ fontFamily: style.headerFont, color: style.accent }}
              >
                {template === "country" && "✦ "}
                {cat.name}
              </h2>
            </div>

            {/* Items */}
            <div className={`flex flex-col ${compact ? "gap-0.5" : "gap-1.5"}`}>
              {cat.items.map((item) => {
                const price = item.dish.final_price ?? item.dish.recommended_price;
                return (
                  <div
                    key={item.id}
                    className={`flex items-baseline justify-between ${textSize} ${compact ? "py-0" : "py-0.5"}`}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold">{item.dish.name}</span>
                      {item.dish.grammage && (
                        <span className="opacity-50 ml-1" style={{ fontSize: compact ? "8px" : "12px" }}>
                          {item.dish.grammage}
                        </span>
                      )}
                      {item.dish.allergens.length > 0 && (
                        <span className="opacity-40 ml-1" style={{ fontSize: compact ? "7px" : "10px" }}>
                          A: {item.dish.allergens.join(",")}
                        </span>
                      )}
                    </div>
                    <div
                      className={`${compact ? "ml-2" : "ml-4"} font-bold whitespace-nowrap`}
                      style={{
                        borderBottom: `1px dotted ${style.accent}30`,
                        paddingBottom: "1px",
                      }}
                    >
                      {price > 0 ? `${price.toFixed(2)} €` : ""}
                    </div>
                  </div>
                );
              })}
              {cat.items.length === 0 && (
                <div className={`${textSize} opacity-30 italic`}>Žiadne jedlá</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={`text-center ${compact ? "mt-3" : "mt-8"} opacity-40`} style={{ fontSize: compact ? "7px" : "10px" }}>
        Alergény: 1-Lepok, 3-Vajcia, 7-Mlieko, 9-Zeler. Informujte nás o alergiách.
      </div>
    </div>
  );
}

export function PermanentMenuPreview({ categories, restaurantName }: PermanentMenuPreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"country" | "minimal" | "modern">("country");
  const { data: templateSettings } = useTemplateSettings();

  const handlePrint = () => {
    const style = TEMPLATE_STYLES[selectedTemplate];
    const html = buildPrintHTML(categories, restaurantName, selectedTemplate, style);
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 600);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          <Eye className="h-4 w-4 mr-1.5" />
          Náhľad JL
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-1.5" />
          Tlač JL
        </Button>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
            <DialogTitle className="font-serif text-base">Náhľad jedálneho lístka</DialogTitle>
            <div className="flex items-center gap-3">
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as any)}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="country">Vidiecky / Rustikálny</SelectItem>
                  <SelectItem value="minimal">Minimalistický</SelectItem>
                  <SelectItem value="modern">Moderný / Tmavý</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="text-xs" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5 mr-1" />
                Tlač
              </Button>
            </div>
          </div>
          <div className="p-4">
            <MenuCard
              categories={categories}
              restaurantName={restaurantName}
              template={selectedTemplate}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Compact preview card for Templates page */
export function PermanentMenuTemplateCard({
  categories,
  restaurantName,
  template,
}: {
  categories: PermanentCategoryWithItems[];
  restaurantName: string;
  template: "country" | "minimal" | "modern";
}) {
  return (
    <MenuCard
      categories={categories}
      restaurantName={restaurantName}
      template={template}
      compact
    />
  );
}

function buildPrintHTML(
  categories: PermanentCategoryWithItems[],
  restaurantName: string,
  template: string,
  style: (typeof TEMPLATE_STYLES)[keyof typeof TEMPLATE_STYLES]
) {
  let catHtml = "";
  for (const cat of categories) {
    catHtml += `<div style="margin-bottom:24px;">
      <h2 style="font-family:${style.headerFont};font-size:18px;font-weight:700;color:${style.accent};
        text-transform:uppercase;letter-spacing:3px;border-bottom:1px solid ${style.accent}40;padding-bottom:4px;margin-bottom:8px;">
        ${template === "country" ? "✦ " : ""}${escHtml(cat.name)}
      </h2>`;
    for (const item of cat.items) {
      const price = item.dish.final_price ?? item.dish.recommended_price;
      catHtml += `<div style="display:flex;justify-content:space-between;align-items:baseline;
        font-family:${style.bodyFont};font-size:14px;padding:3px 0;border-bottom:1px dotted ${style.accent}20;">
        <span>
          <strong>${escHtml(item.dish.name)}</strong>
          ${item.dish.grammage ? `<span style="font-size:11px;opacity:0.5;margin-left:6px;">${escHtml(item.dish.grammage)}</span>` : ""}
          ${item.dish.allergens.length ? `<span style="font-size:10px;opacity:0.4;margin-left:6px;">A: ${item.dish.allergens.join(",")}</span>` : ""}
        </span>
        <span style="font-weight:700;white-space:nowrap;margin-left:16px;">${price > 0 ? `${price.toFixed(2)} €` : ""}</span>
      </div>`;
    }
    catHtml += `</div>`;
  }

  return `<!DOCTYPE html><html lang="sk"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;} @page{size:A4;margin:15mm;}</style></head>
<body style="background:${style.bg};color:${style.text};padding:40px;font-family:${style.bodyFont};">
<div style="text-align:center;margin-bottom:32px;">
  <h1 style="font-family:${style.headerFont};font-size:28px;font-weight:700;color:${style.accent};
    text-transform:uppercase;letter-spacing:6px;">${escHtml(restaurantName)}</h1>
  <div style="font-size:12px;text-transform:uppercase;letter-spacing:5px;opacity:0.5;margin-top:4px;">Jedálny lístok</div>
  <div style="width:80px;border-top:2px solid ${style.accent};margin:12px auto 0;"></div>
</div>
${catHtml}
<div style="text-align:center;margin-top:32px;font-size:9px;opacity:0.4;">
  Alergény: 1-Lepok, 2-Kôrovce, 3-Vajcia, 4-Ryby, 5-Arašidy, 6-Sója, 7-Mlieko, 8-Orechy, 9-Zeler, 10-Horčica, 11-Sezam, 12-Siričitany, 13-Lupina, 14-Mäkkýše
</div>
</body></html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
