import { useState, useCallback } from "react";
import { addWeeks, format, isToday, parseISO } from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Wand2, FileUp, Printer, RefreshCw, Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Dish, useDishes } from "@/hooks/useDishes";
import {
  useWeekMenus,
  useUpsertMenu,
  useAddMenuItem,
  useRemoveMenuItem,
  useUpdateMenuItem,
  useUpdateMenuStatus,
  useRecentDishUsage,
  getWeekStart,
  getWeekdays,
  formatDateKey,
  MenuWithItems,
} from "@/hooks/useMenus";
import { useMenuRegenerate } from "@/hooks/useMenuRegenerate";
import { DayMenuCard } from "@/components/daily-menu/DayMenuCard";
import { DishPickerDialog } from "@/components/daily-menu/DishPickerDialog";
import { AiMenuDialog } from "@/components/daily-menu/AiMenuDialog";
import { ImportMenuDialog, type ImportDayResult } from "@/components/daily-menu/ImportMenuDialog";
import { buildPrintDays, printWeeklyA4 } from "@/lib/weeklyPrintExport";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  pondelok: 0, utorok: 1, streda: 2, štvrtok: 3, piatok: 4,
};

export default function DailyMenu() {
  const { toast } = useToast();
  const { settings, restaurantName } = useRestaurant();
  const nonRepeatDays = settings.non_repeat_days;
  const [searchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      try { return getWeekStart(parseISO(dateParam)); } catch { /* ignore */ }
    }
    return getWeekStart(new Date());
  });
  const [pickerDate, setPickerDate] = useState<Date | null>(null);
  const [aiDate, setAiDate] = useState<Date | null>(null);
  const [aiApplying, setAiApplying] = useState(false);
  const [importDate, setImportDate] = useState<Date | null>(null);
  const [importApplying, setImportApplying] = useState(false);

  const weekdays = getWeekdays(weekStart);
  const { data: menus = [], isLoading } = useWeekMenus(weekStart);
  const { data: recentUsage = {} } = useRecentDishUsage(nonRepeatDays);
  const { data: allDishes = [] } = useDishes();

  const upsertMenu = useUpsertMenu();
  const addMenuItem = useAddMenuItem();
  const removeMenuItem = useRemoveMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const updateStatus = useUpdateMenuStatus();

  // AI Regeneration
  const { loading: regenerating, regenerateSideDish, regenerateDish, regenerateDay, regenerateWeek } =
    useMenuRegenerate({ dishes: allDishes, recentUsage, nonRepeatDays });

  const handleRegenerateSideDish = async (itemId: string, dishName: string) => {
    const result = await regenerateSideDish(dishName);
    if (result?.side_dish) {
      await updateMenuItem.mutateAsync({ id: itemId, side_dish: result.side_dish });
      toast({ title: `Príloha: ${result.side_dish}` });
    }
  };

  const handleRegenerateDish = async (date: Date, itemId: string, dishId: string, dishName: string, category: string) => {
    const result = await regenerateDish(dishId, dishName, category);
    if (result?.dish_id) {
      await updateMenuItem.mutateAsync({
        id: itemId,
        dish_id: result.dish_id,
        side_dish: result.side_dish || null,
      });
      const newDish = allDishes.find(d => d.id === result.dish_id);
      toast({ title: `Nahradené: ${newDish?.name ?? "nové jedlo"}` });
    }
  };

  const handleRegenerateDay = async (date: Date) => {
    const result = await regenerateDay();
    if (!result) return;
    const dateKey = formatDateKey(date);
    const menuId = await upsertMenu.mutateAsync(dateKey);
    // Remove existing items first
    const menu = getMenuForDate(date);
    if (menu?.menu_items) {
      for (const item of menu.menu_items) {
        await removeMenuItem.mutateAsync(item.id);
      }
    }
    // Add new items
    const allIds = [...(result.soups || []), ...(result.mains || []), ...(result.desserts || [])];
    let sortOrder = 1;
    for (const dishId of allIds) {
      await addMenuItem.mutateAsync({ menuId, dishId, sortOrder });
      sortOrder++;
    }
    toast({ title: `Deň pregenerovaný (${allIds.length} jedál)` });
  };

  const handleRegenerateWeek = async () => {
    const result = await regenerateWeek();
    if (!result?.days) return;
    let totalAdded = 0;
    for (let i = 0; i < Math.min(result.days.length, 5); i++) {
      const day = result.days[i];
      const targetDate = weekdays[i];
      const dateKey = formatDateKey(targetDate);
      const menuId = await upsertMenu.mutateAsync(dateKey);
      // Remove existing
      const menu = getMenuForDate(targetDate);
      if (menu?.menu_items) {
        for (const item of menu.menu_items) {
          await removeMenuItem.mutateAsync(item.id);
        }
      }
      const allIds = [...(day.soups || []), ...(day.mains || []), ...(day.desserts || [])];
      let sortOrder = 1;
      for (const dishId of allIds) {
        await addMenuItem.mutateAsync({ menuId, dishId, sortOrder });
        sortOrder++;
        totalAdded++;
      }
    }
    toast({ title: `Týždeň pregenerovaný (${totalAdded} jedál)` });
  };

  const getMenuForDate = (date: Date): MenuWithItems | undefined => {
    const key = formatDateKey(date);
    return menus.find((m) => m.menu_date === key);
  };

  const handleAddDish = useCallback(
    async (dish: Dish) => {
      if (!pickerDate) return;
      try {
        const dateKey = formatDateKey(pickerDate);
        const menuId = await upsertMenu.mutateAsync(dateKey);
        const menu = getMenuForDate(pickerDate);
        const sortOrder = (menu?.menu_items?.length ?? 0) + 1;
        await addMenuItem.mutateAsync({
          menuId,
          dishId: dish.id,
          sortOrder,
        });
        toast({ title: `${dish.name} pridané` });
      } catch (e: any) {
        toast({ title: "Chyba", description: e.message, variant: "destructive" });
      }
    },
    [pickerDate, upsertMenu, addMenuItem, toast]
  );

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeMenuItem.mutateAsync(itemId);
      toast({ title: "Jedlo odstránené" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handlePublish = async (menuId: string) => {
    try {
      await updateStatus.mutateAsync({ id: menuId, status: "published" });
      toast({ title: "Menu publikované" });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  const handlePublishAll = async () => {
    const drafts = menus.filter(
      (m) => m.status === "draft" && m.menu_items.length > 0
    );
    if (drafts.length === 0) {
      toast({ title: "Žiadne menu na publikovanie" });
      return;
    }
    try {
      await Promise.all(
        drafts.map((m) =>
          updateStatus.mutateAsync({ id: m.id, status: "published" })
        )
      );
      toast({ title: `${drafts.length} menu publikovaných` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    }
  };

  // AI generation
  const handleAiApply = async (dishIds: string[]) => {
    if (!aiDate) return;
    setAiApplying(true);
    try {
      const dateKey = formatDateKey(aiDate);
      const menuId = await upsertMenu.mutateAsync(dateKey);
      const menu = getMenuForDate(aiDate);
      let sortOrder = (menu?.menu_items?.length ?? 0) + 1;
      for (const dishId of dishIds) {
        await addMenuItem.mutateAsync({ menuId, dishId, sortOrder });
        sortOrder++;
      }
      toast({ title: `${dishIds.length} jedál pridaných cez AI` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    } finally {
      setAiApplying(false);
    }
  };

  // Simple import: apply dish IDs from flat list
  const handleImportApply = async (dishIds: string[]) => {
    if (!importDate) return;
    setImportApplying(true);
    try {
      const dateKey = formatDateKey(importDate);
      const menuId = await upsertMenu.mutateAsync(dateKey);
      const menu = getMenuForDate(importDate);
      let sortOrder = (menu?.menu_items?.length ?? 0) + 1;
      for (const dishId of dishIds) {
        await addMenuItem.mutateAsync({ menuId, dishId, sortOrder });
        sortOrder++;
      }
      toast({ title: `${dishIds.length} jedál importovaných` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    } finally {
      setImportApplying(false);
    }
  };

  // Weekly Koliesko import: apply structured multi-day data
  const handleWeeklyImport = async (days: ImportDayResult[]) => {
    setImportApplying(true);
    try {
      let totalAdded = 0;
      for (const day of days) {
        // Map day name to weekday date
        const dayIndex = DAY_NAME_TO_INDEX[day.dayName.toLowerCase()];
        if (dayIndex === undefined) continue;
        const targetDate = weekdays[dayIndex];
        if (!targetDate) continue;

        const matchedItems = day.items.filter(i => i.matchedDish);
        if (matchedItems.length === 0) continue;

        const dateKey = formatDateKey(targetDate);
        const menuId = await upsertMenu.mutateAsync(dateKey);
        const existingMenu = getMenuForDate(targetDate);
        let sortOrder = (existingMenu?.menu_items?.length ?? 0) + 1;

        for (const item of matchedItems) {
          await addMenuItem.mutateAsync({
            menuId,
            dishId: item.matchedDish!.id,
            sortOrder,
            overridePrice: item.price ?? undefined,
          });
          sortOrder++;
          totalAdded++;
        }
      }
      toast({ title: `${totalAdded} jedál importovaných do ${days.length} dní` });
    } catch (e: any) {
      toast({ title: "Chyba", description: e.message, variant: "destructive" });
    } finally {
      setImportApplying(false);
    }
  };

  // Weekly A4 print
  const handleWeeklyPrint = () => {
    const printDays = buildPrintDays(menus, weekdays);
    printWeeklyA4(printDays, restaurantName || "Reštaurácia", weekLabel);
  };

  const weekLabel = `${format(weekdays[0], "d. MMM", { locale: sk })} – ${format(
    weekdays[4],
    "d. MMM yyyy",
    { locale: sk }
  )}`;

  const pickerMenu = pickerDate ? getMenuForDate(pickerDate) : undefined;
  const pickerAlreadyAdded = pickerMenu?.menu_items.map((i) => i.dish.id) ?? [];

  const hasAnyItems = menus.some(m => m.menu_items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Denné menu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Týždenný prehľad pondelok – piatok
          </p>
        </div>
        <div className="flex gap-2">
          {hasAnyItems && (
            <Button variant="outline" onClick={handleWeeklyPrint} title="Tlač týždňa na A4">
              <Printer className="h-4 w-4 mr-1.5" />
              Tlač A4
            </Button>
          )}
          <Button variant="outline" onClick={() => setImportDate(weekdays[0])} title="Import z Excel">
            <FileUp className="h-4 w-4 mr-1.5" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerateWeek}
            disabled={regenerating}
            title="Pregenerovať celý týždeň cez AI"
          >
            {regenerating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            AI Týždeň
          </Button>
          <Button onClick={handlePublishAll} variant="default">
            Publikovať všetky koncepty
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((w) => addWeeks(w, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-[200px] justify-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{weekLabel}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((w) => addWeeks(w, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekStart(getWeekStart(new Date()))}
        >
          Dnes
        </Button>
      </div>

      {/* Day cards */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Načítavam menu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {weekdays.map((date) => (
            <DayMenuCard
              key={formatDateKey(date)}
              date={date}
              menu={getMenuForDate(date)}
              onAddDish={() => setPickerDate(date)}
              onRemoveItem={handleRemoveItem}
              onPublish={handlePublish}
              onAiGenerate={() => setAiDate(date)}
              onImport={() => setImportDate(date)}
              isToday={isToday(date)}
              regenerating={regenerating}
              onRegenerateDish={(itemId, dishId, dishName, category) =>
                handleRegenerateDish(date, itemId, dishId, dishName, category)
              }
              onRegenerateSideDish={handleRegenerateSideDish}
              onRegenerateDay={() => handleRegenerateDay(date)}
            />
          ))}
        </div>
      )}

      {/* Dish picker */}
      <DishPickerDialog
        open={!!pickerDate}
        onOpenChange={(open) => !open && setPickerDate(null)}
        onSelect={handleAddDish}
        recentUsage={recentUsage}
        alreadyAdded={pickerAlreadyAdded}
        nonRepeatDays={nonRepeatDays}
      />

      {/* AI generator */}
      <AiMenuDialog
        open={!!aiDate}
        onOpenChange={(open) => !open && setAiDate(null)}
        dishes={allDishes}
        recentUsage={recentUsage}
        nonRepeatDays={nonRepeatDays}
        onApply={handleAiApply}
        isApplying={aiApplying}
      />

      {/* Excel/CSV Import — supports both flat + weekly Koliesko format */}
      <ImportMenuDialog
        open={!!importDate}
        onOpenChange={(open) => !open && setImportDate(null)}
        dishes={allDishes}
        onApply={handleImportApply}
        onApplyWeekly={handleWeeklyImport}
        isApplying={importApplying}
      />
    </div>
  );
}
