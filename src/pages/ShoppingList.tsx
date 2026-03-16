import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { useShoppingList } from "@/hooks/useShoppingList";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function ShoppingList() {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const from = format(weekStart, "yyyy-MM-dd");
  const to = format(weekEnd, "yyyy-MM-dd");

  const { data: items, isLoading } = useShoppingList(from, to);

  const handleExportExcel = () => {
    if (!items?.length) return;
    const rows = items.map((i) => ({
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
    toast({ title: "Excel exportovaný" });
  };

  const weekLabel = `${format(weekStart, "d. MMM", { locale: sk })} – ${format(weekEnd, "d. MMM yyyy", { locale: sk })}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nákupný zoznam"
        subtitle="AI generovanie zo surovín menu"
        actions={[
          { label: "Export do Excel", onClick: handleExportExcel, variant: "outline" },
          { label: "Generuj zoznam", onClick: () => {}, variant: "primary" },
        ]}
      />

      {/* Week selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-serif font-semibold text-sm text-foreground">{weekLabel}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : !items?.length ? (
        <GlassPanel>
          <div className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Pre tento týždeň nie sú žiadne menu s ingredienciami.</p>
          </div>
        </GlassPanel>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Položky — left 3 cols */}
            <GlassPanel title="Položky" className="lg:col-span-3">
              <div className="space-y-2">
                {items.map((item) => (
                  <GlassRow
                    key={item.ingredientId}
                    label={item.ingredientName}
                    value={`${item.totalQuantity} ${item.unit}`}
                  />
                ))}
              </div>
            </GlassPanel>

            {/* AI Olivia panel — right 2 cols */}
            <GlassPanel title="AI Olivia panel" className="lg:col-span-2">
              <div className="space-y-2">
                <GlassRow label="Optimalizovať množstvá podľa predaja" badge="AI" />
                <GlassRow label="Pridať rezervu 10 percent" badge="tip" />
                <GlassRow label="Vyhľadať najlacnejšieho dodávateľa" badge="web" />
              </div>
            </GlassPanel>
          </div>

          {/* Dodávatelia */}
          <GlassPanel title="Dodávatelia">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <GlassRow label="Lidl" badge="preferovaný" badgeStyle="bg-primary/20 text-primary" />
              <GlassRow label="Metro" badge="fallback" badgeStyle="bg-muted text-muted-foreground" />
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}
