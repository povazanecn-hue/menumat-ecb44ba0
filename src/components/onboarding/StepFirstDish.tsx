import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DISH_CATEGORIES } from "@/lib/constants";
import { Database } from "@/integrations/supabase/types";

type DishCategory = Database["public"]["Enums"]["dish_category"];

interface Props {
  dishName: string;
  setDishName: (v: string) => void;
  dishCategory: DishCategory;
  setDishCategory: (v: DishCategory) => void;
  dishPrice: string;
  setDishPrice: (v: string) => void;
  dishSkipped: boolean;
  setDishSkipped: (v: boolean) => void;
}

export function StepFirstDish({
  dishName, setDishName, dishCategory, setDishCategory,
  dishPrice, setDishPrice, dishSkipped, setDishSkipped,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-4">
        <h2 className="font-serif text-xl font-bold text-foreground">Pridajte prvé jedlo</h2>
        <p className="text-sm text-muted-foreground">
          Rýchlo si vyskúšajte ako funguje databáza jedál
        </p>
      </div>
      {!dishSkipped && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="dish-name" className="text-foreground">Názov jedla *</Label>
            <Input
              id="dish-name"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="Hovädzí guláš s knedľou"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Kategória</Label>
              <Select value={dishCategory} onValueChange={(v) => setDishCategory(v as DishCategory)}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DISH_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dish-price" className="text-foreground">Cena (€)</Label>
              <Input
                id="dish-price"
                type="number"
                step="0.10"
                min={0}
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
                placeholder="6.90"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setDishSkipped(!dishSkipped);
          setDishName("");
        }}
        className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
      >
        {dishSkipped ? "Chcem pridať jedlo" : "Preskočiť tento krok"}
      </button>
    </div>
  );
}
