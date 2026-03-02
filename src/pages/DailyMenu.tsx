import { useState, useCallback, useMemo } from "react";
import { addDays, addWeeks, format, isToday, parseISO } from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Wand2, FileUp, Printer, RefreshCw, Loader2, Plus, ShoppingCart } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useAutoRecipePipeline } from "@/hooks/useAutoRecipePipeline";
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
import { MenuCreationWizard, type WizardConfig } from "@/components/daily-menu/MenuCreationWizard";
import { buildPrintDays, printWeeklyA4 } from "@/lib/weeklyPrintExport";
import { supabase } from "@/integrations/supabase/client";
import { useShoppingList } from "@/hooks/useShoppingList";
import * as XLSX from "xlsx";

const DAY_NAME_TO_INDEX: Record<string, number> = {
  pondelok: 0, utorok: 1, streda: 2, štvrtok: 3, piatok: 4,
};

export default function DailyMenu() {
  const { toast } = useToast();
  const { settings, restaurantName, restaurantId } = useRestaurant();
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
  const [wizardOpen, setWizardOpen] = useState(false);

  const weekdays = getWeekdays(weekStart);
  const { data: menus = [], isLoading } = useWeekMenus(weekStart);
  const { data: recentUsage = {} } = useRecentDishUsage(nonRepeatDays);
  const { data: allDishes = [] } = useDishes();

  // Shopping list for quick-export
  const weekFrom = format(weekStart, "yyyy-MM-dd");
  const weekTo = format(addDays(weekStart, 6), "yyyy-MM-dd");
  const { data: shoppingItems } = useShoppingList(weekFrom, weekTo);

  const upsertMenu = useUpsertMenu();
  const addMenuItem = useAddMenuItem();
  const removeMenuItem = useRemoveMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const updateStatus = useUpdateMenuStatus();

  // AI Regeneration
  const { loading: regenerating, regenerateSideDish, regenerateDish, regenerateDay, regenerateWeek } =
    useMenuRegenerate({ dishes: allDishes, recentUsage, nonRepeatDays });

  // Auto-recipe pipeline
  const { runPipeline, running: pipelineRunning, progress: pipelineProgress } = useAutoRecipePipeline();

  // ── Wizard confirm handler ──
  const handleWizardConfirm = async (config: WizardConfig) => {
    // Save wizard config as restaurant default
    if (restaurantId) {
      try {
        await supabase
          .from("restaurants")
          .update({
            settings: {
              ...settings,
              non_repeat_days: config.nonRepeatDays,
              wizard_defaults: {
                slots: config.slots,
                extraSlots: config.extraSlots,
                selectedDays: config.selectedDays,
              },
            } as any,
          })
          .eq("id", restaurantId);
      } catch {
        // non-critical
      }
    }

    // Update week start to wizard's week
    setWeekStart(config.weekStart);

    const dates = config.selectedDays.map((d) => addDays(config.weekStart, d));

    if (config.mode === "manual") {
      // Create empty draft menus for selected days
      for (const date of dates) {
        const dateKey = formatDateKey(date);
        await upsertMenu.mutateAsync(dateKey);
      }
      toast({ title: `${dates.length} prázdnych menu vytvorených` });
    } else if (config.mode === "ai") {
      // Call AI for each day
      let totalAdded = 0;
      const pipelineDishIds: string[] = [];
      const pipelineDishNames: string[] = [];
      for (const date of dates) {
        try {
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-menu`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                dishes: allDishes.map((d) => ({
                  id: d.id, name: d.name, category: d.category,
                  final_price: d.final_price, recommended_price: d.recommended_price,
                  is_daily_menu: d.is_daily_menu,
                })),
                recentUsage,
                slots: config.slots,
                extraSlots: config.extraSlots,
                nonRepeatDays: config.nonRepeatDays,
              }),
            }
          );
          const data = await resp.json();
          if (!resp.ok) {
            toast({ title: "AI chyba", description: data.error, variant: "destructive" });
            continue;
          }
          if (data.repeated) {
            toast({
              title: "⚠️ Opakované jedlá",
              description: data.warnings?.join("; ") || "Niektoré jedlá sa opakujú kvôli nedostatku unikátnych jedál v databáze.",
            });
          }
          const menu = data.menu;
          const dateKey = formatDateKey(date);
          const menuId = await upsertMenu.mutateAsync(dateKey);

          const allIds = [
            ...(menu.soups || []),
            ...(menu.mains || []),
            ...(menu.desserts || []),
            ...Object.values(menu.extras || {}).flat(),
          ] as string[];

          let sortOrder = 1;
          for (const dishId of allIds) {
            await addMenuItem.mutateAsync({ menuId, dishId, sortOrder });
            sortOrder++;
            totalAdded++;
          }

          // Collect unique dish IDs for pipeline
          for (const dishId of allIds) {
            if (!pipelineDishIds.includes(dishId)) {
              pipelineDishIds.push(dishId);
              const dish = allDishes.find(d => d.id === dishId);
              pipelineDishNames.push(dish?.name || "");
            }
          }

          // Add used dishes to recentUsage to prevent repeats in next day
          for (const dishId of allIds) {
            (recentUsage as Record<string, string>)[dishId] = dateKey;
          }
        } catch (e: any) {
          toast({ title: "Chyba", description: e.message, variant: "destructive" });
        }
      }
      toast({ title: `AI vytvorilo ${totalAdded} jedál pre ${dates.length} dní` });

      // Trigger auto-recipe pipeline in background
      if (pipelineDishIds.length > 0) {
        toast({ title: "🔄 Spúšťam pipeline", description: "Hľadám recepty, suroviny a ceny na pozadí..." });
        runPipeline(pipelineDishIds, pipelineDishNames);
      }
    } else if (config.mode === "import") {
      // Create empty menus then open import dialog for first day
      for (const date of dates) {
        await upsertMenu.mutateAsync(formatDateKey(date));
      }
      setImportDate(dates[0]);
      toast({ title: `${dates.length} menu pripravených — otváram import` });
    }
  };

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
      await updateMenuItem.mutateAsync({ id: itemId, dish_id: result.dish_id, side_dish: result.side_dish || null });
      const newDish = allDishes.find(d => d.id === result.dish_id);
      toast({ title: `Nahradené: ${newDish?.name ?? "nové jedlo"}` });
    }
  };

  const handleRegenerateDay = async (date: Date) => {
    const result = await regenerateDay();
    if (!result) return;
    const dateKey = formatDateKey(date);
    const menuId = await upsertMenu.mutateAsync(dateKey);
    const menu = getMenuForDate(date);
    if (menu?.menu_items) {
      for (const item of menu.menu_items) await removeMenuItem.mutateAsync(item.id);
    }
    const allIds = [...(result.soups || []), ...(result.mains || []), ...(result.desserts || [])];
    let sortOrder = 1;
    for (const dishId of allIds) { await addMenuItem.mutateAsync({ menuId, dishId, sortOrder }); sortOrder++; }
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
      const menu = getMenuForDate(targetDate);
      if (menu?.menu_items) { for (const item of menu.menu_items) await removeMenuItem.mutateAsync(item.id); }
      const allIds = [...(day.soups || []), ...(day.mains || []), ...(day.desserts || [])];
      let sortOrder = 1;
      for (const dishId of allIds) { await addMenuItem.mutateAsync({ menuId, dishId, sortOrder }); sortOrder++; totalAdded++; }
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
        await addMenuItem.mutateAsync({ menuId, dishId: dish.id, sortOrder });
        toast({ title: `${dish.name} pridané` });
      } catch (e: any) {
        toast({ title: "Chyba", description: e.message, variant: "destructive" });
      }
    },
    [pickerDate, upsertMenu, addMenuItem, toast]
  );

  const handleRemoveItem = async (itemId: string) => {
    try { await removeMenuItem.mutateAsync(itemId); toast({ title: "Jedlo odstránené" }); }
    catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
  };

  const handleUpdateSideDish = async (itemId: string, sideDish: string) => {
    try { await updateMenuItem.mutateAsync({ id: itemId, side_dish: sideDish || null }); }
    catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
  };

  const handleReorderItems = async (reorderedIds: { id: string; sort_order: number }[]) => {
    try { await Promise.all(reorderedIds.map(({ id, sort_order }) => updateMenuItem.mutateAsync({ id, sort_order }))); }
    catch (e: any) { toast({ title: "Chyba pri radení", description: e.message, variant: "destructive" }); }
  };

  const handleUpdateExtras = async (itemId: string, extras: string) => {
    try { await updateMenuItem.mutateAsync({ id: itemId, extras: extras || null }); }
    catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
  };

  const handlePublish = async (menuId: string) => {
    try { await updateStatus.mutateAsync({ id: menuId, status: "published" }); toast({ title: "Menu publikované" }); }
    catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
  };

  const handlePublishAll = async () => {
    const drafts = menus.filter((m) => m.status === "draft" && m.menu_items.length > 0);
    if (drafts.length === 0) { toast({ title: "Žiadne menu na publikovanie" }); return; }
    try {
      await Promise.all(drafts.map((m) => updateStatus.mutateAsync({ id: m.id, status: "published" })));
      toast({ title: `${drafts.length} menu publikovaných` });
    } catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
  };

  // AI generation (single day from card)
  const handleAiApply = async (dishIds: string[]) => {
    if (!aiDate) return;
    setAiApplying(true);
    try {
      const dateKey = formatDateKey(aiDate);
      const menuId = await upsertMenu.mutateAsync(dateKey);
      const menu = getMenuForDate(aiDate);
      let sortOrder = (menu?.menu_items?.length ?? 0) + 1;
      for (const dishId of dishIds) { await addMenuItem.mutateAsync({ menuId, dishId, sortOrder }); sortOrder++; }
      toast({ title: `${dishIds.length} jedál pridaných cez AI` });
    } catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
    finally { setAiApplying(false); }
  };

  const handleImportApply = async (dishIds: string[]) => {
    if (!importDate) return;
    setImportApplying(true);
    try {
      const dateKey = formatDateKey(importDate);
      const menuId = await upsertMenu.mutateAsync(dateKey);
      const menu = getMenuForDate(importDate);
      let sortOrder = (menu?.menu_items?.length ?? 0) + 1;
      for (const dishId of dishIds) { await addMenuItem.mutateAsync({ menuId, dishId, sortOrder }); sortOrder++; }
      toast({ title: `${dishIds.length} jedál importovaných` });
    } catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
    finally { setImportApplying(false); }
  };

  const handleWeeklyImport = async (days: ImportDayResult[]) => {
    setImportApplying(true);
    try {
      let totalAdded = 0;
      for (const day of days) {
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
          await addMenuItem.mutateAsync({ menuId, dishId: item.matchedDish!.id, sortOrder, overridePrice: item.price ?? undefined });
          sortOrder++; totalAdded++;
        }
      }
      toast({ title: `${totalAdded} jedál importovaných do ${days.length} dní` });
    } catch (e: any) { toast({ title: "Chyba", description: e.message, variant: "destructive" }); }
    finally { setImportApplying(false); }
  };

  const handleWeeklyPrint = () => {
    const printDays = buildPrintDays(menus, weekdays);
    printWeeklyA4(printDays, restaurantName || "Reštaurácia", weekLabel);
  };

  const handleQuickExportShoppingList = () => {
    if (!shoppingItems?.length) {
      toast({ title: "Žiadne suroviny", description: "Menu nemá priradené ingrediencie." });
      return;
    }
    const rows = shoppingItems.map((i) => ({
      Ingrediencia: i.ingredientName,
      Množstvo: i.totalQuantity,
      Jednotka: i.unit,
      "Cena/j (€)": i.basePrice,
      "Odhadovaná cena (€)": i.estimatedCost,
      "Použité v jedlách": i.dishNames.join(", "),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nákupný zoznam");
    XLSX.writeFile(wb, `nakupny-zoznam-${weekFrom}-${weekTo}.xlsx`);
    toast({ title: "Nákupný zoznam exportovaný" });
  };

  const weekLabel = `${format(weekdays[0], "d. MMM", { locale: sk })} – ${format(weekdays[4], "d. MMM yyyy", { locale: sk })}`;

  const pickerMenu = pickerDate ? getMenuForDate(pickerDate) : undefined;
  const pickerAlreadyAdded = pickerMenu?.menu_items.map((i) => i.dish.id) ?? [];

  const hasAnyItems = menus.some(m => m.menu_items.length > 0);

  return (
    <div className="space-y-6">
      {/* Pipeline progress banner */}
      {pipelineRunning && pipelineProgress && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Spracovávam {pipelineProgress.current}/{pipelineProgress.total}
            {pipelineProgress.currentDishName && `: ${pipelineProgress.currentDishName}`}
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Denné menu</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Týždenný prehľad pondelok – piatok
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* NEW: Wizard trigger buttons */}
          <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nové menu
          </Button>
          {hasAnyItems && (
            <>
              <Button variant="outline" onClick={handleQuickExportShoppingList} title="Exportovať nákupný zoznam">
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Nákup
              </Button>
              <Button variant="outline" onClick={handleWeeklyPrint} title="Tlač týždňa na A4">
                <Printer className="h-4 w-4 mr-1.5" />
                Tlač A4
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setImportDate(weekdays[0])} title="Import z Excel">
            <FileUp className="h-4 w-4 mr-1.5" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={() => setWizardOpen(true)}
            disabled={regenerating}
            title="AI sprievodca tvorbou menu na celý týždeň"
          >
            {regenerating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5" />}
            AI Týždeň
          </Button>
          <Button onClick={handlePublishAll} variant="default">
            Publikovať všetky koncepty
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 min-w-[200px] justify-center">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{weekLabel}</span>
        </div>
        <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart(new Date()))}>
          Dnes
        </Button>
      </div>

      {/* Empty state with wizard CTA */}
      {!isLoading && !hasAnyItems && menus.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Wand2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-foreground">Žiadne menu pre tento týždeň</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Spustite sprievodcu tvorbou menu — nastavte dni, počty jedál a režim generovania.
          </p>
          <Button onClick={() => setWizardOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Vytvoriť menu
          </Button>
        </div>
      )}

      {/* Day cards */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Načítavam menu...</div>
      ) : (hasAnyItems || menus.length > 0) ? (
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
              onUpdateSideDish={handleUpdateSideDish}
              onUpdateExtras={handleUpdateExtras}
              onReorderItems={handleReorderItems}
            />
          ))}
        </div>
      ) : null}

      {/* Dish picker */}
      <DishPickerDialog
        open={!!pickerDate}
        onOpenChange={(open) => !open && setPickerDate(null)}
        onSelect={handleAddDish}
        recentUsage={recentUsage}
        alreadyAdded={pickerAlreadyAdded}
        nonRepeatDays={nonRepeatDays}
      />

      {/* AI generator (single day) */}
      <AiMenuDialog
        open={!!aiDate}
        onOpenChange={(open) => !open && setAiDate(null)}
        dishes={allDishes}
        recentUsage={recentUsage}
        nonRepeatDays={nonRepeatDays}
        onApply={handleAiApply}
        isApplying={aiApplying}
      />

      {/* Import dialog */}
      <ImportMenuDialog
        open={!!importDate}
        onOpenChange={(open) => !open && setImportDate(null)}
        dishes={allDishes}
        onApply={handleImportApply}
        onApplyWeekly={handleWeeklyImport}
        isApplying={importApplying}
      />

      {/* Menu Creation Wizard */}
      <MenuCreationWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        defaultNonRepeatDays={nonRepeatDays}
        defaultWeekStart={weekStart}
        wizardDefaults={settings.wizard_defaults}
        onConfirm={handleWizardConfirm}
      />
    </div>
  );
}
