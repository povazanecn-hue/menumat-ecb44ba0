import { useState, useRef } from "react";
import { FileUp, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { DISH_CATEGORIES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedDish {
  name: string;
  category: string;
  allergens: number[];
  grammage: string;
  price: number | null;
  is_daily_menu: boolean;
  selected?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingDishNames: string[];
  onImported: () => void;
}

export function WordImportDialog({ open, onOpenChange, existingDishNames, onImported }: Props) {
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const fileRef = useRef<HTMLInputElement>(null);

  const [extracting, setExtracting] = useState(false);
  const [dishes, setDishes] = useState<ExtractedDish[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const existingNorm = new Set(existingDishNames.map(n => n.trim().toLowerCase()));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), "")
      );

      const { data, error } = await supabase.functions.invoke("import-dishes-from-doc", {
        body: { fileBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted: ExtractedDish[] = (data?.dishes || []).map((d: ExtractedDish) => ({
        ...d,
        selected: !existingNorm.has(d.name.trim().toLowerCase()),
      }));

      setDishes(extracted);
      setStep("preview");
      toast({ title: `${extracted.length} unikátnych jedál extrahovaných` });
    } catch (err: any) {
      toast({ title: "Chyba extrakcie", description: err.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const toggleDish = (idx: number) => {
    setDishes(prev => prev.map((d, i) => i === idx ? { ...d, selected: !d.selected } : d));
  };

  const toggleAll = (val: boolean) => {
    setDishes(prev => prev.map(d => ({ ...d, selected: val })));
  };

  const selectedCount = dishes.filter(d => d.selected).length;
  const duplicateCount = dishes.filter(d => existingNorm.has(d.name.trim().toLowerCase())).length;

  const handleImport = async () => {
    if (!restaurantId) return;
    const toImport = dishes.filter(d => d.selected);
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const validCategories = Object.keys(DISH_CATEGORIES) as Array<"polievka" | "hlavne_jedlo" | "dezert" | "predjedlo" | "salat" | "pizza" | "burger" | "pasta" | "napoj" | "ine">;
      const rows = toImport.map(d => ({
        restaurant_id: restaurantId,
        name: d.name.trim(),
        category: (validCategories.includes(d.category as any) ? d.category : "hlavne_jedlo") as "polievka" | "hlavne_jedlo" | "dezert" | "predjedlo" | "salat" | "pizza" | "burger" | "pasta" | "napoj" | "ine",
        allergens: d.allergens.filter(a => a >= 1 && a <= 14),
        grammage: d.grammage || null,
        final_price: d.price,
        is_daily_menu: d.is_daily_menu ?? true,
        is_permanent_offer: false,
        vat_rate: 20,
        cost: 0,
        recommended_price: d.price ?? 0,
      }));

      // Batch insert in chunks of 50
      for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const { error } = await supabase.from("dishes").insert(chunk);
        if (error) throw error;
      }

      toast({ title: `${toImport.length} jedál importovaných` });
      onImported();
      handleClose();
    } catch (err: any) {
      toast({ title: "Chyba importu", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setDishes([]);
    setStep("upload");
    setExtracting(false);
    setImporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import jedál z Word/PDF dokumentu</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <input
              ref={fileRef}
              type="file"
              accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  AI extrahuje jedlá...
                </>
              ) : (
                <>
                  <FileUp className="h-5 w-5 mr-2" />
                  Vybrať súbor (Word, PDF, obrázok)
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Nahrajte starý jedálny lístok vo formáte Word, PDF alebo obrázok. 
              AI automaticky extrahuje jedlá s kategóriami, alergénmi a cenami.
            </p>
          </div>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center justify-between px-1 py-2">
              <div className="text-sm text-muted-foreground">
                {selectedCount} vybraných z {dishes.length} jedál
                {duplicateCount > 0 && (
                  <span className="text-amber-500 ml-2">
                    ({duplicateCount} už existuje v DB)
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>
                  Vybrať všetky
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>
                  Zrušiť výber
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[50vh] border rounded-md">
              <div className="divide-y">
                {dishes.map((dish, idx) => {
                  const isDuplicate = existingNorm.has(dish.name.trim().toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 px-3 py-2 hover:bg-muted/50 ${
                        isDuplicate ? "opacity-60" : ""
                      }`}
                    >
                      <Checkbox
                        checked={dish.selected}
                        onCheckedChange={() => toggleDish(idx)}
                      />
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {DISH_CATEGORIES[dish.category] ?? dish.category}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dish.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {dish.grammage && <span>{dish.grammage}</span>}
                          {dish.allergens.length > 0 && (
                            <span>A: {dish.allergens.join(",")}</span>
                          )}
                          {isDuplicate && (
                            <span className="text-amber-500 font-medium">duplicita</span>
                          )}
                        </div>
                      </div>
                      {dish.price != null && (
                        <span className="text-sm font-semibold shrink-0">
                          {dish.price.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Zrušiť
              </Button>
              <Button onClick={handleImport} disabled={importing || selectedCount === 0}>
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Importujem...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Importovať {selectedCount} jedál
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
