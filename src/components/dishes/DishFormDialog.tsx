import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ALLERGENS, DISH_CATEGORIES } from "@/lib/constants";
import { Dish } from "@/hooks/useDishes";
import { Database } from "@/integrations/supabase/types";
import { TrendingUp, AlertTriangle, Lock } from "lucide-react";

type DishCategory = Database["public"]["Enums"]["dish_category"];

interface DishFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dish?: Dish | null;
  onSubmit: (data: DishFormData) => void;
  submitting?: boolean;
  defaultMargin?: number;
  defaultVat?: number;
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

export function DishFormDialog({ open, onOpenChange, dish, onSubmit, submitting, defaultMargin = 100, defaultVat = 20 }: DishFormDialogProps) {
  const [form, setForm] = useState<DishFormData>(defaultForm);
  const [margin, setMargin] = useState(defaultMargin);

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
      // Reverse-calculate margin from existing data
      if (dish.cost > 0 && dish.recommended_price > 0) {
        const costWithVat = dish.cost * (1 + dish.vat_rate / 100);
        const calcMargin = Math.round(((dish.recommended_price / costWithVat) - 1) * 100);
        setMargin(Math.max(50, Math.min(300, calcMargin)));
      } else {
        setMargin(defaultMargin);
      }
    } else {
      setForm({ ...defaultForm, vat_rate: defaultVat });
      setMargin(defaultMargin);
    }
  }, [dish, open, defaultMargin, defaultVat]);

  // Auto-calculate recommended price when cost, margin, or VAT changes
  const costWithVat = useMemo(() => {
    return form.cost * (1 + form.vat_rate / 100);
  }, [form.cost, form.vat_rate]);

  const calculatedRecommended = useMemo(() => {
    return Math.round(costWithVat * (1 + margin / 100) * 100) / 100;
  }, [costWithVat, margin]);

  // Sync recommended price whenever calculation changes
  useEffect(() => {
    if (form.cost > 0) {
      setForm((f) => ({ ...f, recommended_price: calculatedRecommended }));
    }
  }, [calculatedRecommended]);

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

  const finalDisplay = form.final_price ?? calculatedRecommended;
  const profitMarginPercent = costWithVat > 0
    ? Math.round(((finalDisplay - costWithVat) / costWithVat) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="dish-subtype">Extra doplnok</Label>
              <Input
                id="dish-subtype"
                value={form.subtype ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subtype: e.target.value || null }))}
                placeholder="napr. Tatárská omáčka, Uhorkový šalátik"
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

          <Separator />

          {/* === PRICING ENGINE === */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold font-serif">Cenový engine</Label>
            </div>

            {/* Cost input */}
            <div className="space-y-2">
              <Label htmlFor="dish-cost">Náklady na jedlo (€)</Label>
              <Input
                id="dish-cost"
                type="number"
                step="0.01"
                min={0}
                value={form.cost}
                onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) }))}
              />
            </div>

            {/* Margin slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Marža</Label>
                <span className="text-sm font-bold text-primary tabular-nums">{margin}%</span>
              </div>
              <Slider
                min={50}
                max={300}
                step={5}
                value={[margin]}
                onValueChange={([v]) => setMargin(v)}
              />
              <p className="text-xs text-muted-foreground">
                Rozsah 50 – 300 %. Ťahajte posuvník pre zmenu marže.
              </p>
            </div>

            {/* 3-column pricing display */}
            <div className="grid grid-cols-3 gap-3">
              {/* Cost with VAT */}
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Náklady s DPH
                  </p>
                  <p className="text-lg font-bold tabular-nums text-muted-foreground">
                    {costWithVat.toFixed(2)} €
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {form.cost.toFixed(2)} + {form.vat_rate}% DPH
                  </p>
                </CardContent>
              </Card>

              {/* Recommended price */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-primary mb-1">
                    Odporúčaná cena
                  </p>
                  <p className="text-lg font-bold tabular-nums text-primary">
                    {calculatedRecommended.toFixed(2)} €
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    marža {margin}%
                  </p>
                </CardContent>
              </Card>

              {/* Final manual price */}
              <Card className="border-accent/30 bg-accent/5">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Lock className="h-3 w-3 text-accent" />
                    <p className="text-[10px] uppercase tracking-wider text-accent">
                      Finálna cena
                    </p>
                  </div>
                  <Input
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
                    placeholder={calculatedRecommended.toFixed(2)}
                    className="text-center text-lg font-bold h-8 border-accent/30"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {form.final_price != null ? "manuálna" : "= odporúčaná"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profit indicator */}
            {form.cost > 0 && (
              <div className="flex items-center gap-2 text-xs">
                {profitMarginPercent < 30 ? (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Nízka marža: {profitMarginPercent}%
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] border-primary/20 text-primary">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Efektívna marža: {profitMarginPercent}%
                  </Badge>
                )}
                <span className="text-muted-foreground">
                  Zisk: {(finalDisplay - costWithVat).toFixed(2)} € / porcia
                </span>
              </div>
            )}
          </div>

          <Separator />

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
