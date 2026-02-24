import { useState } from "react";
import { Wand2, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dish } from "@/hooks/useDishes";
import { DISH_CATEGORIES } from "@/lib/constants";

interface AiMenuSlots {
  soups: number;
  mains: number;
  desserts: number;
}

interface CategorySlot {
  category: string;
  count: number;
}

interface AiMenuResult {
  soups: string[];
  mains: string[];
  desserts: string[];
  extras?: Record<string, string[]>;
}

interface AiMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishes: Dish[];
  recentUsage: Record<string, string>;
  nonRepeatDays: number;
  onApply: (dishIds: string[]) => void;
  isApplying: boolean;
}

const EXTRA_CATEGORIES = [
  { value: "predjedlo", label: "Predjedlo" },
  { value: "salat", label: "Šalát" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "pasta", label: "Pasta" },
  { value: "napoj", label: "Nápoj" },
  { value: "ine", label: "Iné" },
];

export function AiMenuDialog({
  open,
  onOpenChange,
  dishes,
  recentUsage,
  nonRepeatDays,
  onApply,
  isApplying,
}: AiMenuDialogProps) {
  const [slots, setSlots] = useState<AiMenuSlots>({ soups: 1, mains: 3, desserts: 1 });
  const [extraSlots, setExtraSlots] = useState<CategorySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiMenuResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addExtraSlot = () => {
    const usedCategories = extraSlots.map((s) => s.category);
    const available = EXTRA_CATEGORIES.find((c) => !usedCategories.includes(c.value));
    if (available) {
      setExtraSlots([...extraSlots, { category: available.value, count: 1 }]);
    }
  };

  const removeExtraSlot = (index: number) => {
    setExtraSlots(extraSlots.filter((_, i) => i !== index));
  };

  const updateExtraSlot = (index: number, field: "category" | "count", value: string | number) => {
    setExtraSlots(extraSlots.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            dishes: dishes.map((d) => ({
              id: d.id,
              name: d.name,
              category: d.category,
              final_price: d.final_price,
              recommended_price: d.recommended_price,
              is_daily_menu: d.is_daily_menu,
            })),
            recentUsage,
            slots,
            extraSlots: extraSlots.filter((s) => s.count > 0),
            nonRepeatDays,
          }),
        }
      );

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || "Chyba pri generovaní");
        return;
      }

      if (data.repeated) {
        setError(
          `⚠️ Opakované jedlá: ${data.warnings?.join("; ") || "Niektoré jedlá sa opakujú kvôli nedostatku unikátnych jedál."}`
        );
      }

      setResult(data.menu);
    } catch (e: any) {
      setError(e.message || "Nepodarilo sa spojiť s AI");
    } finally {
      setLoading(false);
    }
  };

  const allSelectedIds = result
    ? [
        ...(result.soups || []),
        ...(result.mains || []),
        ...(result.desserts || []),
        ...Object.values(result.extras || {}).flat(),
      ]
    : [];

  const getDishName = (id: string) => dishes.find((d) => d.id === id)?.name ?? id;

  const handleApply = () => {
    onApply(allSelectedIds);
    setResult(null);
    onOpenChange(false);
  };

  const usedExtraCategories = extraSlots.map((s) => s.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Generátor menu
          </DialogTitle>
        </DialogHeader>

        {/* Slot configuration */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nastavte počet jedál podľa kategórie. AI vyberie jedlá z databázy s
            ohľadom na {nonRepeatDays}-dňové pravidlo neopakovania.
          </p>

          {/* Core slots */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Polievky</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={slots.soups}
                onChange={(e) =>
                  setSlots((s) => ({ ...s, soups: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Hlavné jedlá</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={slots.mains}
                onChange={(e) =>
                  setSlots((s) => ({ ...s, mains: Number(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label className="text-xs">Dezerty</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={slots.desserts}
                onChange={(e) =>
                  setSlots((s) => ({ ...s, desserts: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          {/* Extra category slots */}
          {extraSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Voliteľné kategórie
              </Label>
              {extraSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={slot.category}
                    onValueChange={(v) => updateExtraSlot(index, "category", v)}
                  >
                    <SelectTrigger className="flex-1 h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXTRA_CATEGORIES.filter(
                        (c) => c.value === slot.category || !usedExtraCategories.includes(c.value)
                      ).map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={slot.count}
                    onChange={(e) => updateExtraSlot(index, "count", Number(e.target.value))}
                    className="w-16 h-9"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive shrink-0"
                    onClick={() => removeExtraSlot(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {extraSlots.length < EXTRA_CATEGORIES.length && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={addExtraSlot}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Pridať kategóriu (pizza, šalát, burger...)
            </Button>
          )}

          {!result && (
            <Button
              onClick={handleGenerate}
              disabled={loading || dishes.length === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generujem...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Vygenerovať menu
                </>
              )}
            </Button>
          )}

          {dishes.length === 0 && (
            <p className="text-xs text-destructive">
              Najprv pridajte jedlá do databázy.
            </p>
          )}

          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Result preview */}
          {result && (
            <div className="space-y-3 border rounded-lg p-3">
              <h4 className="font-serif text-sm font-semibold">Navrhované menu</h4>

              {result.soups?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Polievky
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.soups.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs">
                        {getDishName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.mains?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Hlavné jedlá
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.mains.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs">
                        {getDishName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.desserts?.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    Dezerty
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.desserts.map((id) => (
                      <Badge key={id} variant="outline" className="text-xs">
                        {getDishName(id)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra categories */}
              {result.extras &&
                Object.entries(result.extras).map(([cat, ids]) =>
                  ids.length > 0 ? (
                    <div key={cat}>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {DISH_CATEGORIES[cat] ?? cat}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ids.map((id) => (
                          <Badge key={id} variant="outline" className="text-xs">
                            {getDishName(id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
            </div>
          )}
        </div>

        {result && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setResult(null)}>
              Generovať znova
            </Button>
            <Button onClick={handleApply} disabled={isApplying || allSelectedIds.length === 0}>
              {isApplying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Použiť ({allSelectedIds.length} jedál)
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
