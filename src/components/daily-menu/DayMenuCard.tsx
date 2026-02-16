import { useState } from "react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Plus, Trash2, Check, GripVertical, Wand2, FileUp, RefreshCw, Loader2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DISH_CATEGORIES } from "@/lib/constants";
import { MenuWithItems } from "@/hooks/useMenus";

interface DayMenuCardProps {
  date: Date;
  menu?: MenuWithItems;
  onAddDish: () => void;
  onRemoveItem: (itemId: string) => void;
  onPublish: (menuId: string) => void;
  onAiGenerate?: () => void;
  onImport?: () => void;
  isToday: boolean;
  // Regeneration callbacks
  onRegenerateDish?: (itemId: string, dishId: string, dishName: string, category: string) => void;
  onRegenerateSideDish?: (itemId: string, dishName: string) => void;
  onRegenerateDay?: () => void;
  regenerating?: boolean;
  // Side dish update
  onUpdateSideDish?: (itemId: string, sideDish: string) => void;
  onUpdateExtras?: (itemId: string, extras: string) => void;
}

export function DayMenuCard({
  date,
  menu,
  onAddDish,
  onRemoveItem,
  onPublish,
  onAiGenerate,
  onImport,
  isToday,
  onRegenerateDish,
  onRegenerateSideDish,
  onRegenerateDay,
  regenerating,
  onUpdateSideDish,
  onUpdateExtras,
}: DayMenuCardProps) {
  const dayName = format(date, "EEEE", { locale: sk });
  const dateStr = format(date, "d. MMMM", { locale: sk });
  const items = menu?.menu_items ?? [];
  const isPublished = menu?.status === "published";
  const isDraft = !menu || menu.status === "draft";

  const soups = items.filter((i) => i.dish.category === "polievka");
  const mains = items.filter((i) => i.dish.category === "hlavne_jedlo");
  const desserts = items.filter((i) => i.dish.category === "dezert");
  const others = items.filter(
    (i) => !["polievka", "hlavne_jedlo", "dezert"].includes(i.dish.category)
  );

  const renderSection = (
    label: string,
    sectionItems: typeof items,
    emptyText: string
  ) => (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {sectionItems.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic pl-2">{emptyText}</p>
      ) : (
        sectionItems.map((item) => (
          <div key={item.id} className="pl-2 py-1 rounded hover:bg-secondary/50 group transition-colors">
            <div className="flex items-center gap-2">
              <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
              <span className="flex-1 text-sm truncate">{item.dish.name}</span>
              {item.dish.allergens.length > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  ({item.dish.allergens.join(",")})
                </span>
              )}
              <span className="text-sm font-medium shrink-0">
                {(item.override_price ?? item.dish.final_price ?? item.dish.recommended_price).toFixed(2)} €
              </span>

              {/* Regeneration dropdown */}
              {(onRegenerateDish || onRegenerateSideDish) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={regenerating}
                    >
                      {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onRegenerateSideDish && (
                      <DropdownMenuItem onClick={() => onRegenerateSideDish(item.id, item.dish.name)}>
                        <Utensils className="h-3.5 w-3.5 mr-2" />
                        Pregenerovať prílohu
                      </DropdownMenuItem>
                    )}
                    {onRegenerateDish && (
                      <DropdownMenuItem onClick={() => onRegenerateDish(item.id, item.dish.id, item.dish.name, item.dish.category)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Pregenerovať jedlo
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Side dish & extras display */}
            {((item as any).side_dish || (item as any).extras) && (
              <div className="ml-6 mt-0.5 flex gap-2 flex-wrap">
                {(item as any).side_dish && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary/80">
                    <Utensils className="h-2.5 w-2.5 mr-0.5" />
                    {(item as any).side_dish}
                  </Badge>
                )}
                {(item as any).extras && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent/80">
                    + {(item as any).extras}
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <Card
      className={`transition-all ${isToday ? "ring-2 ring-primary/40 shadow-lg shadow-primary/10" : "border-border hover:border-primary/20"} ${
        isPublished ? "bg-primary/5" : ""
      }`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="font-serif text-base capitalize">{dayName}</CardTitle>
          <p className="text-xs text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {onRegenerateDay && items.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onRegenerateDay}
              disabled={regenerating}
              title="Pregenerovať celý deň"
            >
              {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          )}
          {isPublished && (
            <Badge variant="default" className="text-[10px]">Publikované</Badge>
          )}
          {isDraft && items.length > 0 && (
            <Badge variant="outline" className="text-[10px]">Koncept</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {renderSection("Polievky", soups, "Žiadna polievka")}
        {renderSection("Hlavné jedlá", mains, "Žiadne hlavné jedlo")}
        {renderSection("Dezerty", desserts, "Žiadny dezert")}
        {others.length > 0 && renderSection("Ostatné", others, "")}

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" size="sm" className="flex-1" onClick={onAddDish}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Pridať
          </Button>
          {onAiGenerate && (
            <Button variant="outline" size="sm" onClick={onAiGenerate}>
              <Wand2 className="h-3.5 w-3.5 mr-1" />
              AI
            </Button>
          )}
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport} title="Import z Excel/CSV">
              <FileUp className="h-3.5 w-3.5" />
            </Button>
          )}
          {menu && items.length > 0 && isDraft && (
            <Button size="sm" variant="default" onClick={() => onPublish(menu.id)}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Publikovať
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
