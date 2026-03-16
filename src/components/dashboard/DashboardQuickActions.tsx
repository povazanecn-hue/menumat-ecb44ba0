import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { sk } from "date-fns/locale";
import { ShoppingCart, FileDown, TrendingUp, Download, Printer, Tv, FileSpreadsheet, Loader2, ArrowRight, Instagram } from "lucide-react";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useRestaurant } from "@/hooks/useRestaurant";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface DashboardQuickActionsProps {
  avgMargin: number;
  dishCount: number;
  hasTodayMenu: boolean;
}

export function DashboardQuickActions({ avgMargin, dishCount, hasTodayMenu }: DashboardQuickActionsProps) {
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [marginOpen, setMarginOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  // Shopping list data for current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const from = format(weekStart, "yyyy-MM-dd");
  const to = format(weekEnd, "yyyy-MM-dd");
  const { data: shoppingItems, isLoading: shoppingLoading } = useShoppingList(from, to);

  const weekLabel = `${format(weekStart, "d. MMM", { locale: sk })} – ${format(weekEnd, "d. MMM", { locale: sk })}`;

  // Shopping list Excel export
  const handleShoppingExcel = () => {
    if (!shoppingItems?.length) return;
    const rows = shoppingItems.map((i) => ({
      Ingrediencia: i.ingredientName,
      Množstvo: i.totalQuantity,
      Jednotka: i.unit,
      "Cena/j (€)": i.basePrice,
      "Odhadovaná cena (€)": i.estimatedCost,
      "Použité v jedlách": i.dishNames.join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nákupný zoznam");
    XLSX.writeFile(wb, `nakupny-zoznam-${from}-${to}.xlsx`);
    toast({ title: "✅ Nákupný zoznam exportovaný", description: `${shoppingItems.length} položiek` });
  };

  // Quick export for today's menu
  const handleQuickExport = async (format: "pdf" | "excel" | "tv") => {
    if (!restaurantId) return;
    setExporting(format);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: menu } = await supabase
        .from("menus")
        .select("id, menu_date, status, menu_items(sort_order, override_price, dish:dishes(name, category, allergens, grammage, final_price, recommended_price, cost, vat_rate))")
        .eq("restaurant_id", restaurantId)
        .eq("menu_date", today)
        .maybeSingle();

      if (!menu || !menu.menu_items?.length) {
        toast({ title: "Žiadne menu", description: "Dnes nie je vytvorené menu na export.", variant: "destructive" });
        return;
      }

      const { exportPDF, exportExcel, exportTV } = await import("@/lib/exportUtils");

      if (format === "pdf") {
        exportPDF(menu as any);
        toast({ title: "✅ PDF otvorený na tlač" });
      } else if (format === "excel") {
        exportExcel(menu as any);
        toast({ title: "✅ Excel stiahnutý" });
      } else if (format === "tv") {
        const result = await exportTV(menu as any);
        window.open(result.url, "_blank");
        toast({ title: "✅ TV displej otvorený", description: "Odkaz na FullHD zobrazenie" });
      } else if (format === "instagram") {
        const { exportInstagramStory } = await import("@/lib/exportUtils");
        exportInstagramStory(menu as any);
        toast({ title: "✅ Instagram Story otvorená", description: "1080×1920 formát" });
      }
    } catch (err: any) {
      toast({ title: "Chyba exportu", description: err.message, variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  // Margin analysis
  const marginColor = avgMargin < 30 ? "text-destructive" : avgMargin < 60 ? "text-[hsl(var(--gold-gradient-from))]" : "text-[hsl(var(--success))]";
  const marginAdvice = avgMargin < 30
    ? "Marža je kriticky nízka. Zvážte zvýšenie cien alebo hľadanie lacnejších surovín."
    : avgMargin < 60
      ? "Marža je priemerná. Preskúmajte najdrahšie jedlá a optimalizujte suroviny."
      : "Marža je zdravá. Udržujte aktuálne ceny a sledujte promo akcie dodávateľov.";

  const totalCost = shoppingItems?.reduce((sum, i) => sum + i.estimatedCost, 0) ?? 0;
  const missingPriceCount = shoppingItems?.filter(i => i.isMissingPrice).length ?? 0;

  return (
    <>
      <GlassPanel title="AI Olivia">
        <p className="text-sm text-muted-foreground mb-4">Rýchle akcie a návrhy marže.</p>
        <div className="space-y-2">
          <GlassRow
            label="Generuj nákupný zoznam"
            badge="AUTO"
            badgeStyle="bg-primary/20 text-primary"
            onClick={() => setShoppingOpen(true)}
          />
          <GlassRow
            label="Export TV + PDF + Excel"
            badge="READY"
            badgeStyle="bg-primary/20 text-primary"
            onClick={() => setExportOpen(true)}
          />
          <GlassRow
            label="Návrh marže pre menu"
            badge={`${avgMargin}%`}
            badgeStyle="bg-primary/20 text-primary"
            onClick={() => setMarginOpen(true)}
          />
        </div>
      </GlassPanel>

      {/* Shopping List Dialog */}
      <Dialog open={shoppingOpen} onOpenChange={setShoppingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Nákupný zoznam — {weekLabel}
            </DialogTitle>
          </DialogHeader>

          {shoppingLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Generujem...</span>
            </div>
          ) : !shoppingItems?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Žiadne menu na tento týždeň.</p>
              <Button variant="outline" className="mt-3" onClick={() => { setShoppingOpen(false); navigate("/daily-menu"); }}>
                Vytvoriť menu
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-foreground">{shoppingItems.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Položiek</p>
                </div>
                <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
                  <p className="text-2xl font-bold font-mono text-foreground">{totalCost.toFixed(0)}€</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Odhad</p>
                </div>
                <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
                  <p className={cn("text-2xl font-bold font-mono", missingPriceCount > 0 ? "text-destructive" : "text-foreground")}>{missingPriceCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bez ceny</p>
                </div>
              </div>

              {/* Top 5 items */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {shoppingItems.slice(0, 8).map((item) => (
                  <div key={item.ingredientId} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/30 bg-card/20 text-sm">
                    <span className={cn("text-foreground/90", item.isMissingPrice && "text-destructive")}>{item.ingredientName}</span>
                    <span className="font-mono text-muted-foreground">{item.totalQuantity} {item.unit}</span>
                  </div>
                ))}
                {shoppingItems.length > 8 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+ ďalších {shoppingItems.length - 8} položiek</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleShoppingExcel} className="flex-1" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Stiahnuť Excel
                </Button>
                <Button onClick={() => { setShoppingOpen(false); navigate("/shopping-list"); }} className="flex-1">
                  Otvoriť celý zoznam
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <FileDown className="h-5 w-5 text-primary" />
              Rýchly export — dnes
            </DialogTitle>
          </DialogHeader>

          {!hasTodayMenu ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Dnes nie je vytvorené menu.</p>
              <Button variant="outline" className="mt-3" onClick={() => { setExportOpen(false); navigate("/daily-menu"); }}>
                Vytvoriť menu
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleQuickExport("pdf")}
                disabled={!!exporting}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-all text-left"
              >
                <Printer className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">PDF / Tlač</p>
                  <p className="text-xs text-muted-foreground">A4 formát, priamy print</p>
                </div>
                {exporting === "pdf" && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
              <button
                onClick={() => handleQuickExport("excel")}
                disabled={!!exporting}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-all text-left"
              >
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Excel kuchyňa</p>
                  <p className="text-xs text-muted-foreground">Tabuľka pre kuchynský tím</p>
                </div>
                {exporting === "excel" && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
              <button
                onClick={() => handleQuickExport("tv")}
                disabled={!!exporting}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-card/40 hover:border-primary/30 hover:bg-card/60 transition-all text-left"
              >
                <Tv className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">TV FullHD</p>
                  <p className="text-xs text-muted-foreground">1920×1080 displej</p>
                </div>
                {exporting === "tv" && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => { setExportOpen(false); navigate("/exports"); }}
              >
                Export centrum
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Margin Dialog */}
      <Dialog open={marginOpen} onOpenChange={setMarginOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif">
              <TrendingUp className="h-5 w-5 text-primary" />
              Analýza marže
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-4">
              <p className={cn("text-5xl font-bold font-mono", marginColor)}>{avgMargin}%</p>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Priemerná marža</p>
            </div>

            <div className="rounded-lg border border-border bg-card/40 p-4">
              <p className="text-sm text-foreground/90 leading-relaxed">{marginAdvice}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
                <p className="text-xl font-bold font-mono text-foreground">{dishCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Celkom jedál</p>
              </div>
              <div className="rounded-lg border border-border bg-card/40 p-3 text-center">
                <p className={cn("text-xl font-bold font-mono", avgMargin < 30 ? "text-destructive" : "text-[hsl(var(--success))]")}>
                  {avgMargin < 30 ? "⚠️ Nízka" : avgMargin < 60 ? "⚡ OK" : "✅ Zdravá"}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stav</p>
              </div>
            </div>

            <Button className="w-full" onClick={() => { setMarginOpen(false); navigate("/dishes"); }}>
              Upraviť ceny jedál
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
