import { useState, useMemo } from "react";
import { Trash2, Tag, ArrowDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SupplierPrice } from "@/hooks/useIngredients";

interface SupplierPriceTableProps {
  prices: SupplierPrice[];
  onDelete: (id: string) => void;
  onUsePrice: (price: number) => void;
  currentBasePrice: number;
}

export function SupplierPriceTable({
  prices,
  onDelete,
  onUsePrice,
  currentBasePrice,
}: SupplierPriceTableProps) {
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [promoOnly, setPromoOnly] = useState(false);
  const [cheapestOnly, setCheapestOnly] = useState(false);

  const suppliers = useMemo(
    () => [...new Set(prices.map((p) => p.supplier_name))],
    [prices]
  );

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let result = prices.filter((p) => {
      if (supplierFilter !== "all" && p.supplier_name !== supplierFilter) return false;
      if (promoOnly && !p.is_promo) return false;
      // validity check
      if (p.valid_to && p.valid_to < today) return false;
      return true;
    });

    if (cheapestOnly && result.length > 0) {
      const min = Math.min(...result.map((p) => p.price));
      result = result.filter((p) => p.price === min);
    }

    return result.sort((a, b) => a.price - b.price);
  }, [prices, supplierFilter, promoOnly, cheapestOnly, today]);

  const cheapestPrice = prices.length > 0
    ? Math.min(...prices.filter((p) => !p.valid_to || p.valid_to >= today).map((p) => p.price))
    : null;

  if (prices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-2">
        Žiadne ceny dodávateľov. Pridajte prvú cenu.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Dodávateľ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetci</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch id="promo-filter" checked={promoOnly} onCheckedChange={setPromoOnly} className="scale-75" />
          <Label htmlFor="promo-filter" className="text-xs">Akcie</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id="cheapest-filter" checked={cheapestOnly} onCheckedChange={setCheapestOnly} className="scale-75" />
          <Label htmlFor="cheapest-filter" className="text-xs">Najlacnejšie</Label>
        </div>
      </div>

      {/* Price rows */}
      <div className="space-y-1">
        {filtered.map((sp) => {
          const isCheapest = sp.price === cheapestPrice;
          const isExpired = sp.valid_to ? sp.valid_to < today : false;

          return (
            <div
              key={sp.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                isCheapest
                  ? "border-primary/40 bg-primary/5"
                  : "border-border"
              } ${isExpired ? "opacity-50" : ""}`}
            >
              <span className="font-medium min-w-[80px]">{sp.supplier_name}</span>
              {sp.is_promo && (
                <Badge variant="secondary" className="text-[10px] gap-1 px-1.5">
                  <Tag className="h-3 w-3" />
                  Akcia
                </Badge>
              )}
              {isCheapest && (
                <Badge className="text-[10px] gap-1 px-1.5 bg-primary/10 text-primary border-primary/20">
                  <ArrowDown className="h-3 w-3" />
                  Najlacnejšie
                </Badge>
              )}
              <span className="flex-1" />
              {sp.valid_from && (
                <span className="text-[10px] text-muted-foreground">
                  {sp.valid_from}
                </span>
              )}
              {sp.valid_to && (
                <span className="text-[10px] text-muted-foreground">
                  – {sp.valid_to}
                </span>
              )}
              <span className="font-semibold min-w-[60px] text-right">
                {sp.price.toFixed(2)} €
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => onUsePrice(sp.price)}
                disabled={sp.price === currentBasePrice}
              >
                <Check className="h-3 w-3" />
                Použiť
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(sp.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
