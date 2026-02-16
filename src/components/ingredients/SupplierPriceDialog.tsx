import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SUPPLIERS = ["Lidl", "Kaufland", "Billa", "Metro", "Hoppe", "Wiesbauer", "Iné"] as const;

interface SupplierPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredientId: string;
  onSubmit: (data: SupplierPriceFormData) => void;
  submitting?: boolean;
}

export interface SupplierPriceFormData {
  ingredient_id: string;
  supplier_name: string;
  price: number;
  is_promo: boolean;
  valid_from: string | null;
  valid_to: string | null;
  confidence: string;
}

export function SupplierPriceDialog({
  open,
  onOpenChange,
  ingredientId,
  onSubmit,
  submitting,
}: SupplierPriceDialogProps) {
  const [supplier, setSupplier] = useState("Lidl");
  const [customSupplier, setCustomSupplier] = useState("");
  const [price, setPrice] = useState(0);
  const [isPromo, setIsPromo] = useState(false);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ingredient_id: ingredientId,
      supplier_name: supplier === "Iné" ? customSupplier : supplier,
      price,
      is_promo: isPromo,
      valid_from: validFrom || null,
      valid_to: validTo || null,
      confidence: "manual",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Pridať cenu dodávateľa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Dodávateľ</Label>
            <Select value={supplier} onValueChange={setSupplier}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPLIERS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplier === "Iné" && (
              <Input
                placeholder="Názov dodávateľa"
                value={customSupplier}
                onChange={(e) => setCustomSupplier(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-price">Cena (€)</Label>
            <Input
              id="sp-price"
              type="number"
              step="0.01"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="sp-promo" checked={isPromo} onCheckedChange={setIsPromo} />
            <Label htmlFor="sp-promo" className="text-sm">Akciová cena</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sp-from">Platnosť od</Label>
              <Input
                id="sp-from"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-to">Platnosť do</Label>
              <Input
                id="sp-to"
                type="date"
                value={validTo}
                onChange={(e) => setValidTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ukladám..." : "Pridať cenu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
