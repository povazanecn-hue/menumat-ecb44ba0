import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { useDishes, useCreateDish, useUpdateDish, useDeleteDish, Dish } from "@/hooks/useDishes";
import { useDishRecipeIds } from "@/hooks/useRecipes";
import { useRestaurant } from "@/hooks/useRestaurant";
import { DishFormDialog, DishFormData } from "@/components/dishes/DishFormDialog";
import { RecipeDetailDialog } from "@/components/recipes/RecipeDetailDialog";
import { DISH_CATEGORIES, ALLERGENS } from "@/lib/constants";

export default function Dishes() {
  const { data: dishes = [], isLoading } = useDishes();
  const { restaurantId } = useRestaurant();
  const { data: recipeIds = new Set() } = useDishRecipeIds(restaurantId);
  const createDish = useCreateDish();
  const updateDish = useUpdateDish();
  const deleteDish = useDeleteDish();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [deletingDish, setDeletingDish] = useState<Dish | null>(null);
  const [recipeTarget, setRecipeTarget] = useState<{ id: string; name: string } | null>(null);
  const filtered = useMemo(() => {
    return dishes.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === "all" || d.category === categoryFilter;
      const matchTag =
        tagFilter === "all" ||
        (tagFilter === "daily" && d.is_daily_menu) ||
        (tagFilter === "permanent" && d.is_permanent_offer);
      return matchSearch && matchCategory && matchTag;
    });
  }, [dishes, search, categoryFilter, tagFilter]);

  const handleCreate = async (data: DishFormData) => {
    try {
      await createDish.mutateAsync(data);
      toast({ title: "Jedlo vytvorené" });
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (data: DishFormData) => {
    if (!editingDish) return;
    try {
      await updateDish.mutateAsync({ id: editingDish.id, ...data });
      toast({ title: "Jedlo aktualizované" });
      setEditingDish(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingDish) return;
    try {
      await deleteDish.mutateAsync(deletingDish.id);
      toast({ title: "Jedlo vymazané" });
      setDeletingDish(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const formatPrice = (price: number | null) =>
    price != null ? `${price.toFixed(2)} €` : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Jedlá</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {dishes.length} jedál v databáze
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nové jedlo
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hľadať podľa názvu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Kategória" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky kategórie</SelectItem>
            {Object.entries(DISH_CATEGORIES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Typ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky typy</SelectItem>
            <SelectItem value="daily">Denné menu</SelectItem>
            <SelectItem value="permanent">Stála ponuka</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Načítavam jedlá...</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {dishes.length === 0
                ? "Zatiaľ nemáte žiadne jedlá. Vytvorte prvé jedlo."
                : "Žiadne jedlá nezodpovedajú filtrom."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((dish) => (
            <Card key={dish.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                {/* Category badge */}
                <Badge variant="secondary" className="shrink-0 text-xs font-normal">
                  {DISH_CATEGORIES[dish.category] ?? dish.category}
                </Badge>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{dish.name}</span>
                    {dish.is_daily_menu && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">DM</Badge>
                    )}
                    {dish.is_permanent_offer && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">SP</Badge>
                    )}
                    {recipeIds.has(dish.id) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-primary/40 text-primary cursor-pointer hover:bg-primary/10"
                        onClick={() => setRecipeTarget({ id: dish.id, name: dish.name })}
                      >
                        <BookOpen className="h-3 w-3 mr-0.5" />R
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                    {dish.grammage && <span>{dish.grammage}</span>}
                    {dish.allergens.length > 0 && (
                      <span>Alergény: {dish.allergens.join(", ")}</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <div className="font-semibold text-sm">
                    {formatPrice(dish.final_price ?? dish.recommended_price)}
                  </div>
                  {dish.final_price != null && dish.recommended_price > 0 && (
                    <div className="text-[10px] text-muted-foreground line-through">
                      {formatPrice(dish.recommended_price)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Recept"
                    onClick={() => setRecipeTarget({ id: dish.id, name: dish.name })}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingDish(dish)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingDish(dish)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <DishFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        submitting={createDish.isPending}
      />

      {/* Edit Dialog */}
      <DishFormDialog
        open={!!editingDish}
        onOpenChange={(open) => !open && setEditingDish(null)}
        dish={editingDish}
        onSubmit={handleUpdate}
        submitting={updateDish.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDish} onOpenChange={(open) => !open && setDeletingDish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať jedlo?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať <strong>{deletingDish?.name}</strong>? Táto akcia je nevratná.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Vymazať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recipe Detail Dialog */}
      {recipeTarget && (
        <RecipeDetailDialog
          open={!!recipeTarget}
          onOpenChange={(open) => !open && setRecipeTarget(null)}
          dishId={recipeTarget.id}
          dishName={recipeTarget.name}
        />
      )}
    </div>
  );
}
