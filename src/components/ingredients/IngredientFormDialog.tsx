import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ingredient } from "@/hooks/useIngredients";

const UNITS = ["g", "kg", "ml", "l", "ks"] as const;

interface IngredientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient?: Ingredient | null;
  onSubmit: (data: IngredientFormData) => void;
  submitting?: boolean;
}

export interface IngredientFormData {
  name: string;
  unit: string;
  base_price: number;
}

const defaultForm: IngredientFormData = {
  name: "",
  unit: "g",
  base_price: 0,
};

export function IngredientFormDialog({
  open,
  onOpenChange,
  ingredient,
  onSubmit,
  submitting,
}: IngredientFormDialogProps) {
  const [form, setForm] = useState<IngredientFormData>(defaultForm);

  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name,
        unit: ingredient.unit,
        base_price: ingredient.base_price,
      });
    } else {
      setForm(defaultForm);
    }
  }, [ingredient, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {ingredient ? "Upraviť ingredienciu" : "Nová ingrediencia"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ing-name">Názov *</Label>
            <Input
              id="ing-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Múka pšeničná"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jednotka</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ing-price">Základná cena (€)</Label>
              <Input
                id="ing-price"
                type="number"
                step="0.01"
                min={0}
                value={form.base_price}
                onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ukladám..." : ingredient ? "Uložiť zmeny" : "Vytvoriť"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
