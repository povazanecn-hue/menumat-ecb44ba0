import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, Plus, ShieldAlert } from "lucide-react";
import { useDishes, Dish } from "@/hooks/useDishes";
import { DISH_CATEGORIES } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DishPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (dish: Dish) => void;
  /** Map of dish_id -> last used date for non-repeat warnings */
  recentUsage?: Record<string, string>;
  /** Already added dish IDs for the current day */
  alreadyAdded?: string[];
  nonRepeatDays?: number;
}

export function DishPickerDialog({
  open,
  onOpenChange,
  onSelect,
  recentUsage = {},
  alreadyAdded = [],
  nonRepeatDays = 14,
}: DishPickerDialogProps) {
  const { data: dishes = [] } = useDishes();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [confirmDish, setConfirmDish] = useState<Dish | null>(null);

  const filtered = useMemo(() => {
    return dishes
      .filter((d) => d.is_daily_menu)
      .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
      .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
      .filter((d) => !alreadyAdded.includes(d.id));
  }, [dishes, search, categoryFilter, alreadyAdded]);

  const isRecentlyUsed = (dishId: string) => !!recentUsage[dishId];

  const handleDishClick = (dish: Dish) => {
    if (isRecentlyUsed(dish.id)) {
      setConfirmDish(dish);
    } else {
      onSelect(dish);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Pridať jedlo do menu</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hľadať jedlo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky</SelectItem>
              {Object.entries(DISH_CATEGORIES).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0 mt-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {dishes.filter((d) => d.is_daily_menu).length === 0
                ? 'Žiadne jedlá označené ako "Denné menu". Pridajte jedlá v sekcii Jedlá.'
                : "Žiadne výsledky."}
            </p>
          ) : (
            filtered.map((dish) => {
              const recentDate = recentUsage[dish.id];
              return (
                <div
                  key={dish.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md border transition-colors cursor-pointer group ${
                    recentDate
                      ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                      : "border-border hover:bg-secondary/50"
                  }`}
                  onClick={() => handleDishClick(dish)}
                >
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {DISH_CATEGORIES[dish.category] ?? dish.category}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{dish.name}</span>
                    {dish.grammage && (
                      <span className="text-xs text-muted-foreground">{dish.grammage}</span>
                    )}
                  </div>
                  {recentDate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Použité {recentDate} (menej ako {nonRepeatDays} dní)
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="text-sm font-medium shrink-0">
                    {(dish.final_price ?? dish.recommended_price).toFixed(2)} €
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Confirmation dialog for recently used dishes */}
        <AlertDialog open={!!confirmDish} onOpenChange={(open) => !open && setConfirmDish(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Jedlo bolo nedávno použité
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{confirmDish?.name}</strong> bolo naposledy v menu dňa{" "}
                <strong>{confirmDish ? recentUsage[confirmDish.id] : ""}</strong> (menej ako{" "}
                {nonRepeatDays} dní). Naozaj ho chcete pridať?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušiť</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (confirmDish) {
                    onSelect(confirmDish);
                    setConfirmDish(null);
                    onOpenChange(false);
                  }
                }}
              >
                Pridať aj tak
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
