import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, GripVertical, FolderPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useDishes, Dish } from "@/hooks/useDishes";
import {
  usePermanentMenu,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAddPermanentItem,
  useRemovePermanentItem,
  PermanentCategoryWithItems,
} from "@/hooks/usePermanentMenu";
import { DISH_CATEGORIES } from "@/lib/constants";

export default function PermanentMenu() {
  const { data: categories = [], isLoading } = usePermanentMenu();
  const { data: allDishes = [] } = useDishes();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const addItem = useAddPermanentItem();
  const removeItem = useRemovePermanentItem();
  const { toast } = useToast();

  const [newCatName, setNewCatName] = useState("");
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<PermanentCategoryWithItems | null>(null);
  const [deletingCat, setDeletingCat] = useState<PermanentCategoryWithItems | null>(null);
  const [addingToCat, setAddingToCat] = useState<string | null>(null);
  const [dishSearch, setDishSearch] = useState("");

  // All dish IDs already in permanent menu
  const usedDishIds = useMemo(() => {
    const ids = new Set<string>();
    categories.forEach((cat) => cat.items.forEach((item) => ids.add(item.dish_id)));
    return ids;
  }, [categories]);

  const filteredDishes = useMemo(() => {
    return allDishes
      .filter((d) => d.is_permanent_offer || !usedDishIds.has(d.id))
      .filter((d) => d.name.toLowerCase().includes(dishSearch.toLowerCase()));
  }, [allDishes, usedDishIds, dishSearch]);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await createCategory.mutateAsync({
        name: newCatName.trim(),
        sortOrder: categories.length,
      });
      toast({ title: "Kategória vytvorená" });
      setNewCatName("");
      setCatFormOpen(false);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat || !newCatName.trim()) return;
    try {
      await updateCategory.mutateAsync({ id: editingCat.id, name: newCatName.trim() });
      toast({ title: "Kategória aktualizovaná" });
      setEditingCat(null);
      setNewCatName("");
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCat) return;
    try {
      await deleteCategory.mutateAsync(deletingCat.id);
      toast({ title: "Kategória vymazaná" });
      setDeletingCat(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleAddDish = async (dish: Dish) => {
    if (!addingToCat) return;
    const cat = categories.find((c) => c.id === addingToCat);
    try {
      await addItem.mutateAsync({
        categoryId: addingToCat,
        dishId: dish.id,
        sortOrder: (cat?.items.length ?? 0),
      });
      toast({ title: `${dish.name} pridané` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
      toast({ title: "Jedlo odstránené" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Jedálny lístok</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trvalá ponuka jedál organizovaná v kategóriách
          </p>
        </div>
        <Button onClick={() => { setNewCatName(""); setCatFormOpen(true); }}>
          <FolderPlus className="h-4 w-4 mr-1" />
          Nová kategória
        </Button>
      </div>

      {/* Categories */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Načítavam jedálny lístok...</div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Zatiaľ nemáte žiadne kategórie. Vytvorte prvú kategóriu (napr. Pizza, Šaláty, Burgre).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card key={cat.id} className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-serif text-lg">{cat.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setAddingToCat(cat.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingCat(cat);
                      setNewCatName(cat.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingCat(cat)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cat.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">
                    Žiadne jedlá v tejto kategórii.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {cat.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted/50 transition-colors"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                        <span className="font-medium flex-1">{item.dish.name}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {DISH_CATEGORIES[item.dish.category] ?? item.dish.category}
                        </Badge>
                        {item.dish.final_price != null && (
                          <span className="font-semibold text-sm">
                            {item.dish.final_price.toFixed(2)} €
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Category Dialog */}
      <Dialog
        open={catFormOpen || !!editingCat}
        onOpenChange={(open) => {
          if (!open) { setCatFormOpen(false); setEditingCat(null); }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingCat ? "Upraviť kategóriu" : "Nová kategória"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Názov kategórie</Label>
              <Input
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="napr. Pizza, Šaláty, Burgre"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setCatFormOpen(false); setEditingCat(null); }}
              >
                Zrušiť
              </Button>
              <Button
                onClick={editingCat ? handleUpdateCategory : handleCreateCategory}
                disabled={!newCatName.trim()}
              >
                {editingCat ? "Uložiť" : "Vytvoriť"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Dish to Category Dialog */}
      <Dialog
        open={!!addingToCat}
        onOpenChange={(open) => !open && setAddingToCat(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Pridať jedlo do kategórie</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hľadať jedlo..."
                value={dishSearch}
                onChange={(e) => setDishSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {filteredDishes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Žiadne dostupné jedlá.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredDishes.map((dish) => (
                  <button
                    key={dish.id}
                    onClick={() => handleAddDish(dish)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md border border-border text-sm hover:bg-muted/50 transition-colors text-left"
                    disabled={usedDishIds.has(dish.id)}
                  >
                    <span className="flex-1 font-medium">{dish.name}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {DISH_CATEGORIES[dish.category] ?? dish.category}
                    </Badge>
                    {usedDishIds.has(dish.id) && (
                      <Badge variant="outline" className="text-[10px]">Pridané</Badge>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deletingCat} onOpenChange={(open) => !open && setDeletingCat(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať kategóriu?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať kategóriu <strong>{deletingCat?.name}</strong> a všetky jej položky?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
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
