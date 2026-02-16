import { useState, useMemo } from "react";
import { Search, BookOpen, Lock, Unlock, Clock, Trash2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useRestaurant } from "@/hooks/useRestaurant";
import { useRecipes, useDeleteRecipe, RecipeWithDish } from "@/hooks/useRecipes";
import { RecipeDetailDialog } from "@/components/recipes/RecipeDetailDialog";
import { DISH_CATEGORIES } from "@/lib/constants";

export default function Recipes() {
  const { restaurantId } = useRestaurant();
  const { data: recipes = [], isLoading } = useRecipes(restaurantId);
  const deleteRecipe = useDeleteRecipe();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<{ dishId: string; dishName: string } | null>(null);
  const [deleting, setDeleting] = useState<RecipeWithDish | null>(null);

  const filtered = useMemo(() => {
    if (!search) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.dish?.name?.toLowerCase().includes(q) ||
        r.instructions?.toLowerCase().includes(q)
    );
  }, [recipes, search]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRecipe.mutateAsync(deleting.id);
      toast({ title: "Recept vymazaný" });
      setDeleting(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const totalTime = (r: RecipeWithDish) => {
    const prep = r.prep_time_minutes ?? 0;
    const cook = r.cook_time_minutes ?? 0;
    return prep + cook > 0 ? `${prep + cook} min` : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Recepty</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {recipes.length} receptov v databáze
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hľadať v receptoch..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card/60 backdrop-blur-md">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-8" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {recipes.length === 0
                ? "Zatiaľ nemáte žiadne recepty. Pridajte recept cez detail jedla."
                : "Žiadne recepty nezodpovedajú hľadaniu."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((recipe) => (
            <Card key={recipe.id} className="bg-card/60 backdrop-blur-md border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                {/* R icon */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary font-serif font-bold text-sm shrink-0 border border-primary/20">
                  R
                </div>

                {/* Dish info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{recipe.dish?.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {DISH_CATEGORIES[recipe.dish?.category] ?? recipe.dish?.category}
                    </Badge>
                    {recipe.is_locked && (
                      <Badge variant="default" className="text-[10px] gap-1 px-1.5 shrink-0">
                        <Lock className="h-3 w-3" /> Uzamknutý
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
                    {totalTime(recipe) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {totalTime(recipe)}
                      </span>
                    )}
                    {recipe.servings && <span>{recipe.servings} porcií</span>}
                    {recipe.instructions && (
                      <span className="truncate max-w-[200px]">
                        {recipe.instructions.slice(0, 60)}…
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      setEditTarget({
                        dishId: recipe.dish_id,
                        dishName: recipe.dish?.name ?? "",
                      })
                    }
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleting(recipe)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit recipe dialog */}
      {editTarget && (
        <RecipeDetailDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          dishId={editTarget.dishId}
          dishName={editTarget.dishName}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať recept?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať recept pre <strong>{deleting?.dish?.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Vymazať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
