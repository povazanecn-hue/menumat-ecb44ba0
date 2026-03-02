import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { sk } from "date-fns/locale";
import {
  ShoppingCart,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Package,
  AlertTriangle,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShoppingList } from "@/hooks/useShoppingList";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

/* ── Summary cards ── */
function SummaryCards({
  itemCount,
  totalCost,
  missingPriceCount,
}: {
  itemCount: number;
  totalCost: number;
  missingPriceCount: number;
}) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-3">
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-muted-foreground font-normal">Ingrediencií</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <span className="text-xl font-bold">{itemCount}</span>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-1 pt-3 px-4">
          <CardTitle className="text-xs text-muted-foreground font-normal">Odhadované náklady</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <span className="text-xl font-bold">{totalCost.toFixed(2)} €</span>
        </CardContent>
      </Card>
      {missingPriceCount > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-destructive font-normal flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Chýbajúce ceny
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <span className="text-xl font-bold text-destructive">{missingPriceCount}</span>
            <Button
              variant="link"
              size="sm"
              className="ml-2 text-xs h-auto p-0"
              onClick={() => navigate("/ingredients")}
            >
              Doplniť →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── Dish badges ── */
function DishBadges({ dishNames }: { dishNames: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {dishNames.slice(0, 3).map((d) => (
        <Tooltip key={d}>
          <TooltipTrigger>
            <Badge variant="outline" className="text-[10px]">
              {d.length > 18 ? d.slice(0, 18) + "…" : d}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>{d}</TooltipContent>
        </Tooltip>
      ))}
      {dishNames.length > 3 && (
        <Badge variant="secondary" className="text-[10px]">
          +{dishNames.length - 3}
        </Badge>
      )}
    </div>
  );
}

/* ── Main page ── */
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

  const totalCost = useMemo(
    () => items?.reduce((s, i) => s + i.estimatedCost, 0) ?? 0,
    [items]
  );

  const missingPriceCount = useMemo(
    () => items?.filter((i) => i.isMissingPrice).length ?? 0,
    [items]
  );

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    if (!items?.length) return;
    const rows = items.map((i) => ({
      Ingrediencia: i.ingredientName,
      Množstvo: i.totalQuantity,
      Jednotka: i.unit,
      "Cena/j (€)": i.basePrice,
      "Odhadovaná cena (€)": i.estimatedCost,
      "Použité v jedlách": i.dishNames.join(", "),
      "Chýba cena": i.isMissingPrice ? "ÁNO" : "",
      "AI surovina": i.isAiExtracted ? "ÁNO" : "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nákupný zoznam");
    XLSX.writeFile(wb, `nakupny-zoznam-${from}-${to}.xlsx`);
    toast({ title: "Excel exportovaný" });
  };

  const weekLabel = `${format(weekStart, "d. MMM", { locale: sk })} – ${format(weekEnd, "d. MMM yyyy", { locale: sk })}`;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Nákupný zoznam
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Konsolidovaný zoznam ingrediencií z denných menu pre vybraný týždeň.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Tlačiť
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!items?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Excel
          </Button>
        </div>
      </div>

      {/* Week selector */}
      <Card className="print:shadow-none print:border-none">
        <CardContent className="py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="print:hidden"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-serif font-semibold text-sm">{weekLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekOffset((o) => o + 1)}
            className="print:hidden"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Shopping list table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !items?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              Pre tento týždeň nie sú žiadne menu s ingredienciami.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Pridajte jedlá s ingredienciami do denného menu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SummaryCards
            itemCount={items.length}
            totalCost={totalCost}
            missingPriceCount={missingPriceCount}
          />

          {/* Table */}
          <Card className="print:shadow-none">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediencia</TableHead>
                    <TableHead className="text-right">Množstvo</TableHead>
                    <TableHead>Jednotka</TableHead>
                    <TableHead className="text-right">Cena/j</TableHead>
                    <TableHead className="text-right">Celkom</TableHead>
                    <TableHead className="hidden sm:table-cell">Jedlá</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow
                      key={item.ingredientId}
                      className={item.isMissingPrice ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-1.5">
                          {item.ingredientName}
                          {item.isAiExtracted && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 gap-0.5">
                                  <Bot className="h-2.5 w-2.5" />
                                  AI
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>Automaticky pridané AI pipeline</TooltipContent>
                            </Tooltip>
                          )}
                          {item.isMissingPrice && (
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                              </TooltipTrigger>
                              <TooltipContent>Chýba základná cena</TooltipContent>
                            </Tooltip>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.totalQuantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      <TableCell className="text-right">
                        {item.isMissingPrice ? (
                          <span className="text-destructive text-xs">—</span>
                        ) : (
                          `${item.basePrice.toFixed(2)} €`
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.isMissingPrice ? (
                          <span className="text-destructive text-xs">—</span>
                        ) : (
                          `${item.estimatedCost.toFixed(2)} €`
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <DishBadges dishNames={item.dishNames} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
