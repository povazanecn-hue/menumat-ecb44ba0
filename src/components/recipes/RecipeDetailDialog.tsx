import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Clock, Users } from "lucide-react";
import { useRecipeByDish, useUpsertRecipe } from "@/hooks/useRecipes";
import { useToast } from "@/hooks/use-toast";

interface RecipeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishId: string;
  dishName: string;
}

export function RecipeDetailDialog({
  open,
  onOpenChange,
  dishId,
  dishName,
}: RecipeDetailDialogProps) {
  const { data: recipe, isLoading } = useRecipeByDish(open ? dishId : null);
  const upsertRecipe = useUpsertRecipe();
  const { toast } = useToast();

  const [instructions, setInstructions] = useState("");
  const [prepTime, setPrepTime] = useState<number | "">("");
  const [cookTime, setCookTime] = useState<number | "">("");
  const [servings, setServings] = useState<number | "">(1);
  const [isLocked, setIsLocked] = useState(false);
  const [sourceMetadata, setSourceMetadata] = useState("");

  useEffect(() => {
    if (recipe) {
      setInstructions(recipe.instructions ?? "");
      setPrepTime(recipe.prep_time_minutes ?? "");
      setCookTime(recipe.cook_time_minutes ?? "");
      setServings(recipe.servings ?? 1);
      setIsLocked(recipe.is_locked);
      setSourceMetadata(recipe.source_metadata ?? "");
    } else if (!isLoading) {
      setInstructions("");
      setPrepTime("");
      setCookTime("");
      setServings(1);
      setIsLocked(false);
      setSourceMetadata("");
    }
  }, [recipe, isLoading]);

  const handleSave = async () => {
    try {
      await upsertRecipe.mutateAsync({
        dishId,
        data: {
          instructions: instructions || null,
          prep_time_minutes: prepTime === "" ? null : Number(prepTime),
          cook_time_minutes: cookTime === "" ? null : Number(cookTime),
          servings: servings === "" ? null : Number(servings),
          is_locked: isLocked,
          source_metadata: sourceMetadata || null,
        },
      });
      toast({ title: "Recept uložený" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            Recept: {dishName}
            {recipe && (
              <Badge
                variant={isLocked ? "default" : "secondary"}
                className="text-[10px] gap-1"
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                {isLocked ? "Uzamknutý" : "Odomknutý"}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Načítavam recept...</div>
        ) : (
          <div className="space-y-4">
            {/* Time & servings row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prep-time" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" /> Príprava (min)
                </Label>
                <Input
                  id="prep-time"
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cook-time" className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" /> Varenie (min)
                </Label>
                <Input
                  id="cook-time"
                  type="number"
                  min={0}
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings" className="flex items-center gap-1 text-xs">
                  <Users className="h-3 w-3" /> Porcie
                </Label>
                <Input
                  id="servings"
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(e.target.value === "" ? "" : Number(e.target.value))}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions">Postup</Label>
              <Textarea
                id="instructions"
                rows={10}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Napíšte postup prípravy jedla..."
                className="resize-y"
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="source" className="text-xs">Zdroj / poznámka</Label>
              <Input
                id="source"
                value={sourceMetadata}
                onChange={(e) => setSourceMetadata(e.target.value)}
                placeholder="Napr. rodinný recept, AI generovaný..."
              />
            </div>

            {/* Lock toggle */}
            <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30">
              <Switch
                id="recipe-lock"
                checked={isLocked}
                onCheckedChange={setIsLocked}
              />
              <div>
                <Label htmlFor="recipe-lock" className="text-sm font-medium cursor-pointer">
                  Uzamknúť recept
                </Label>
                <p className="text-xs text-muted-foreground">
                  Uzamknutý recept nebude prepísaný AI generátorom.
                </p>
              </div>
            </div>

            {/* AI confidence (read-only if exists) */}
            {recipe?.ai_confidence != null && (
              <div className="text-xs text-muted-foreground">
                AI dôveryhodnosť: {(recipe.ai_confidence * 100).toFixed(0)}%
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Zrušiť
              </Button>
              <Button onClick={handleSave} disabled={upsertRecipe.isPending}>
                {upsertRecipe.isPending ? "Ukladám..." : "Uložiť recept"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
