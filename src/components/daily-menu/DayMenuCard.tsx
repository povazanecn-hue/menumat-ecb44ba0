import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Plus, Trash2, Check, GripVertical, Wand2, FileUp, RefreshCw, Loader2, Utensils, Pencil } from "lucide-react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  onRegenerateDish?: (itemId: string, dishId: string, dishName: string, category: string) => void;
  onRegenerateSideDish?: (itemId: string, dishName: string) => void;
  onRegenerateDay?: () => void;
  regenerating?: boolean;
  onUpdateSideDish?: (itemId: string, sideDish: string) => void;
  onUpdateExtras?: (itemId: string, extras: string) => void;
  onReorderItems?: (reorderedIds: { id: string; sort_order: number }[]) => void;
}

type MenuItem = MenuWithItems["menu_items"][number];

// ─── Sortable item ───
function SortableMenuItem({
  item,
  editingSideDishId,
  sideDishValue,
  setSideDishValue,
  sideDishInputRef,
  startEditSideDish,
  commitSideDish,
  cancelEditSideDish,
  onRemoveItem,
  onRegenerateDish,
  onRegenerateSideDish,
  onUpdateSideDish,
  regenerating,
}: {
  item: MenuItem;
  editingSideDishId: string | null;
  sideDishValue: string;
  setSideDishValue: (v: string) => void;
  sideDishInputRef: React.RefObject<HTMLInputElement>;
  startEditSideDish: (id: string, val: string) => void;
  commitSideDish: () => void;
  cancelEditSideDish: () => void;
  onRemoveItem: (id: string) => void;
  onRegenerateDish?: (itemId: string, dishId: string, dishName: string, category: string) => void;
  onRegenerateSideDish?: (itemId: string, dishName: string) => void;
  onUpdateSideDish?: (itemId: string, sideDish: string) => void;
  regenerating?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="pl-2 py-1 rounded hover:bg-secondary/50 group transition-colors">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="h-3 w-3 text-muted-foreground/40" />
        </button>
        <span className="flex-1 text-sm truncate">{item.dish.name}</span>
        {item.dish.allergens.length > 0 && (
          <span className="text-[10px] text-muted-foreground">
            ({item.dish.allergens.join(",")})
          </span>
        )}
        <span className="text-sm font-medium shrink-0">
          {(item.override_price ?? item.dish.final_price ?? item.dish.recommended_price).toFixed(2)} €
        </span>

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
      <div className="ml-6 mt-0.5 flex gap-2 flex-wrap items-center">
        {item.dish.subtype && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-secondary/50 text-secondary-foreground/70">
            {item.dish.subtype}
          </Badge>
        )}

        {editingSideDishId === item.id ? (
          <Input
            ref={sideDishInputRef}
            value={sideDishValue}
            onChange={(e) => setSideDishValue(e.target.value)}
            onBlur={commitSideDish}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitSideDish();
              if (e.key === "Escape") cancelEditSideDish();
            }}
            className="h-5 text-[10px] px-1.5 py-0 w-28 border-primary/30"
            placeholder="Príloha..."
          />
        ) : (item as any).side_dish ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 border-primary/30 text-primary/80 cursor-pointer hover:bg-primary/10"
            onClick={() => onUpdateSideDish && startEditSideDish(item.id, (item as any).side_dish || "")}
          >
            <Utensils className="h-2.5 w-2.5 mr-0.5" />
            {(item as any).side_dish}
            {onUpdateSideDish && <Pencil className="h-2 w-2 ml-1 opacity-50" />}
          </Badge>
        ) : onUpdateSideDish ? (
          <button
            onClick={() => startEditSideDish(item.id, "")}
            className="text-[10px] text-muted-foreground/50 hover:text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5"
          >
            <Utensils className="h-2.5 w-2.5" />
            príloha
          </button>
        ) : null}

        {(item as any).extras && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent/80">
            + {(item as any).extras}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───
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
  onReorderItems,
}: DayMenuCardProps) {
  const dayName = format(date, "EEEE", { locale: sk });
  const dateStr = format(date, "d. MMMM", { locale: sk });
  const items = menu?.menu_items ?? [];
  const isPublished = menu?.status === "published";
  const isDraft = !menu || menu.status === "draft";

  const [editingSideDishId, setEditingSideDishId] = useState<string | null>(null);
  const [sideDishValue, setSideDishValue] = useState("");
  const sideDishInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSideDishId && sideDishInputRef.current) {
      sideDishInputRef.current.focus();
    }
  }, [editingSideDishId]);

  const startEditSideDish = (itemId: string, currentValue: string) => {
    setEditingSideDishId(itemId);
    setSideDishValue(currentValue);
  };

  const commitSideDish = () => {
    if (editingSideDishId && onUpdateSideDish) {
      onUpdateSideDish(editingSideDishId, sideDishValue);
    }
    setEditingSideDishId(null);
    setSideDishValue("");
  };

  const cancelEditSideDish = () => {
    setEditingSideDishId(null);
    setSideDishValue("");
  };

  // Sort items by sort_order for display
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorderItems) return;

      const oldIndex = sortedItems.findIndex((i) => i.id === active.id);
      const newIndex = sortedItems.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...sortedItems];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const updates = reordered.map((item, idx) => ({ id: item.id, sort_order: idx + 1 }));
      onReorderItems(updates);
    },
    [sortedItems, onReorderItems]
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
      <CardContent className="space-y-1">
        {sortedItems.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic text-center py-3">Prázdne menu</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              {sortedItems.map((item) => (
                <SortableMenuItem
                  key={item.id}
                  item={item}
                  editingSideDishId={editingSideDishId}
                  sideDishValue={sideDishValue}
                  setSideDishValue={setSideDishValue}
                  sideDishInputRef={sideDishInputRef}
                  startEditSideDish={startEditSideDish}
                  commitSideDish={commitSideDish}
                  cancelEditSideDish={cancelEditSideDish}
                  onRemoveItem={onRemoveItem}
                  onRegenerateDish={onRegenerateDish}
                  onRegenerateSideDish={onRegenerateSideDish}
                  onUpdateSideDish={onUpdateSideDish}
                  regenerating={regenerating}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

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
