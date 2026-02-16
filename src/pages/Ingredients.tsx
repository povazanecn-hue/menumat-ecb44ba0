import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ChevronDown, ChevronRight, DollarSign, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useCreateSupplierPrice,
  useDeleteSupplierPrice,
  useApplySupplierPrice,
  IngredientWithSuppliers,
} from "@/hooks/useIngredients";
import { IngredientFormDialog, IngredientFormData } from "@/components/ingredients/IngredientFormDialog";
import { SupplierPriceDialog, SupplierPriceFormData } from "@/components/ingredients/SupplierPriceDialog";
import { SupplierPriceTable } from "@/components/ingredients/SupplierPriceTable";
import { WebPriceSearchDialog } from "@/components/ingredients/WebPriceSearchDialog";

export default function Ingredients() {
  const { data: ingredients = [], isLoading } = useIngredients();
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();
  const createSupplierPrice = useCreateSupplierPrice();
  const deleteSupplierPrice = useDeleteSupplierPrice();
  const applySupplierPrice = useApplySupplierPrice();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IngredientWithSuppliers | null>(null);
  const [deleting, setDeleting] = useState<IngredientWithSuppliers | null>(null);
  const [supplierTarget, setSupplierTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [webSearchTarget, setWebSearchTarget] = useState<IngredientWithSuppliers | null>(null);

  const filtered = useMemo(() => {
    return ingredients.filter((i) =>
      i.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [ingredients, search]);

  const handleCreate = async (data: IngredientFormData) => {
    try {
      await createIngredient.mutateAsync(data);
      toast({ title: "Ingrediencia vytvorená" });
      setFormOpen(false);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleUpdate = async (data: IngredientFormData) => {
    if (!editing) return;
    try {
      await updateIngredient.mutateAsync({ id: editing.id, ...data });
      toast({ title: "Ingrediencia aktualizovaná" });
      setEditing(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteIngredient.mutateAsync(deleting.id);
      toast({ title: "Ingrediencia vymazaná" });
      setDeleting(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleAddSupplierPrice = async (data: SupplierPriceFormData) => {
    try {
      await createSupplierPrice.mutateAsync(data);
      toast({ title: "Cena dodávateľa pridaná" });
      setSupplierTarget(null);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteSupplierPrice = async (id: string) => {
    try {
      await deleteSupplierPrice.mutateAsync(id);
      toast({ title: "Cena dodávateľa odstránená" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleUsePrice = async (ingredientId: string, price: number) => {
    try {
      await applySupplierPrice.mutateAsync({ ingredientId, price });
      toast({ title: `Základná cena aktualizovaná na ${price.toFixed(2)} €` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handleWebPriceAdd = async (supplier: string, price: number, confidence: string) => {
    if (!webSearchTarget) return;
    try {
      await createSupplierPrice.mutateAsync({
        ingredient_id: webSearchTarget.id,
        supplier_name: supplier,
        price,
        is_promo: false,
        confidence,
      });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const noPricedCount = ingredients.filter((i) => i.base_price === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Ingrediencie</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ingredients.length} ingrediencií v databáze
            {noPricedCount > 0 && (
              <span className="text-destructive ml-2">
                ({noPricedCount} bez ceny)
              </span>
            )}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nová ingrediencia
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hľadať ingredienciu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-card/60 backdrop-blur-md">
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <Skeleton className="h-7 w-7 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-8" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/60 backdrop-blur-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {ingredients.length === 0
                ? "Zatiaľ nemáte žiadne ingrediencie. Vytvorte prvú ingredienciu."
                : "Žiadne ingrediencie nezodpovedajú hľadaniu."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ing) => {
            const isExpanded = expandedId === ing.id;
            const supplierCount = ing.supplier_prices.length;

            return (
              <Card key={ing.id} className="bg-card/60 backdrop-blur-md border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : ing.id)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      {/* Name + unit */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{ing.name}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {ing.unit}
                          </Badge>
                          {ing.base_price === 0 && (
                            <Badge variant="destructive" className="text-[10px] shrink-0">
                              Bez ceny
                            </Badge>
                          )}
                        </div>
                        {supplierCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {supplierCount} dodávateľ{supplierCount > 1 ? "ov" : ""}
                          </span>
                        )}
                      </div>

                      {/* Base price */}
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-sm">
                          {ing.base_price.toFixed(2)} € / {ing.unit}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setWebSearchTarget(ing);
                          }}
                          title="Hľadať ceny na webe"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupplierTarget(ing.id);
                          }}
                          title="Pridať cenu dodávateľa"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(ing);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleting(ing);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: supplier prices */}
                    <CollapsibleContent className="pt-3 mt-3 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Ceny dodávateľov
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSupplierTarget(ing.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Pridať cenu
                        </Button>
                      </div>
                      <SupplierPriceTable
                        prices={ing.supplier_prices}
                        onDelete={handleDeleteSupplierPrice}
                        onUsePrice={(price) => handleUsePrice(ing.id, price)}
                        currentBasePrice={ing.base_price}
                      />
                    </CollapsibleContent>
                  </CardContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <IngredientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        submitting={createIngredient.isPending}
      />

      {/* Edit Dialog */}
      <IngredientFormDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        ingredient={editing}
        onSubmit={handleUpdate}
        submitting={updateIngredient.isPending}
      />

      {/* Supplier Price Dialog */}
      {supplierTarget && (
        <SupplierPriceDialog
          open={!!supplierTarget}
          onOpenChange={(open) => !open && setSupplierTarget(null)}
          ingredientId={supplierTarget}
          onSubmit={handleAddSupplierPrice}
          submitting={createSupplierPrice.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vymazať ingredienciu?</AlertDialogTitle>
            <AlertDialogDescription>
              Naozaj chcete vymazať <strong>{deleting?.name}</strong>? Táto akcia je nevratná.
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

      {/* Web Price Search Dialog */}
      {webSearchTarget && (
        <WebPriceSearchDialog
          open={!!webSearchTarget}
          onOpenChange={(open) => !open && setWebSearchTarget(null)}
          ingredientName={webSearchTarget.name}
          onAddPrice={handleWebPriceAdd}
        />
      )}
    </div>
  );
}
