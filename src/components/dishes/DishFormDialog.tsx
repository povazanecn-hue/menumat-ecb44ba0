import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ALLERGENS, DISH_CATEGORIES } from "@/lib/constants";
import { Dish } from "@/hooks/useDishes";
import { Database } from "@/integrations/supabase/types";

type DishCategory = Database["public"]["Enums"]["dish_category"];

interface DishFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish?: Dish | null;
  onSubmit: (data: DishFormData) => void;
  submitting?: boolean;
}

export interface DishFormData {
  name: string;
  category: DishCategory;
  subtype: string | null;
  allergens: number[];
  grammage: string | null;
  vat_rate: number;
  cost: number;
  recommended_price: number;
  final_price: number | null;
  is_daily_menu: boolean;
  is_permanent_offer: boolean;
}

const defaultForm: DishFormData = {
  name: "",
  category: "hlavne_jedlo",
  subtype: null,
  allergens: [],
  grammage: null,
  vat_rate: 20,
  cost: 0,
  recommended_price: 0,
  final_price: null,
  is_daily_menu: false,
  is_permanent_offer: false,
};

export function DishFormDialog({ open, onOpenChange, dish, onSubmit, submitting }: DishFormDialogProps) {
  const [form, setForm] = useState<DishFormData>(defaultForm);

  useEffect(() => {
    if (dish) {
      setForm({
        name: dish.name,
        category: dish.category,
        subtype: dish.subtype,
        allergens: dish.allergens,
        grammage: dish.grammage,
        vat_rate: dish.vat_rate,
        cost: dish.cost,
        recommended_price: dish.recommended_price,
        final_price: dish.final_price,
        is_daily_menu: dish.is_daily_menu,
        is_permanent_offer: dish.is_permanent_offer,
      });
    } else {
      setForm(defaultForm);
    }
  }, [dish, open]);

  const toggleAllergen = (id: number) => {
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(id)
        ? f.allergens.filter((a) => a !== id)
        : [...f.allergens, id].sort((a, b) => a - b),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {dish ? "Upraviť jedlo" : "Nové jedlo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="dish-name">Názov *</Label>
            <Input
              id="dish-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Hovädzí guláš"
              required
            />
          </div>

          {/* Category + Subtype */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategória</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as DishCategory }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DISH_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-subtype">Podtyp</Label>
              <Input
                id="dish-subtype"
                value={form.subtype ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subtype: e.target.value || null }))}
                placeholder="napr. bezmäsité"
              />
            </div>
          </div>

          {/* Grammage + VAT */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dish-grammage">Gramáž</Label>
              <Input
                id="dish-grammage"
                value={form.grammage ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, grammage: e.target.value || null }))}
                placeholder="300g / 0.33l"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-vat">DPH (%)</Label>
              <Input
                id="dish-vat"
                type="number"
                min={0}
                max={100}
                value={form.vat_rate}
                onChange={(e) => setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))}
              />
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dish-cost">Náklady (€)</Label>
              <Input
                id="dish-cost"
                type="number"
                step="0.01"
                min={0}
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-rec">Dopor. cena (€)</Label>
              <Input
                id="dish-rec"
                type="number"
                step="0.01"
                min={0}
                value={form.recommended_price}
                onChange={(e) => setForm((f) => ({ ...f, recommended_price: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dish-final">Finálna cena (€)</Label>
              <Input
                id="dish-final"
                type="number"
                step="0.01"
                min={0}
                value={form.final_price ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    final_price: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="—"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="daily-menu"
                checked={form.is_daily_menu}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_daily_menu: v }))}
              />
              <Label htmlFor="daily-menu" className="text-sm">Denné menu</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="permanent-offer"
                checked={form.is_permanent_offer}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_permanent_offer: v }))}
              />
              <Label htmlFor="permanent-offer" className="text-sm">Stála ponuka</Label>
            </div>
          </div>

          {/* Allergens */}
          <div className="space-y-2">
            <Label>Alergény (EU 1–14)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALLERGENS.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-2 text-sm cursor-pointer rounded-md border border-border px-2 py-1.5 hover:bg-secondary transition-colors"
                >
                  <Checkbox
                    checked={form.allergens.includes(a.id)}
                    onCheckedChange={() => toggleAllergen(a.id)}
                  />
                  <span className="font-medium text-muted-foreground w-5">{a.id}.</span>
                  <span>{a.short}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Ukladám..." : dish ? "Uložiť zmeny" : "Vytvoriť jedlo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
