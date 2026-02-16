import { useState, useCallback } from "react";
import { addWeeks, format, isToday } from "date-fns";
import { sk } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dish } from "@/hooks/useDishes";
import {
  useWeekMenus,
  useUpsertMenu,
  useAddMenuItem,
  useRemoveMenuItem,
  useUpdateMenuStatus,
  useRecentDishUsage,
  getWeekStart,
  getWeekdays,
  formatDateKey,
  MenuWithItems,
} from "@/hooks/useMenus";
import { DayMenuCard } from "@/components/daily-menu/DayMenuCard";
import { DishPickerDialog } from "@/components/daily-menu/DishPickerDialog";

export default function DailyMenu() {
  const { toast } = useToast();
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [pickerDate, setPickerDate] = useState<Date | null>(null);

  const weekdays = getWeekdays(weekStart);
  const { data: menus = [], isLoading } = useWeekMenus(weekStart);
  const { data: recentUsage = {} } = useRecentDishUsage(14);

  const upsertMenu = useUpsertMenu();
  const addMenuItem = useAddMenuItem();
  const removeMenuItem = useRemoveMenuItem();
  const updateStatus = useUpdateMenuStatus();

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

  const weekLabel = `${format(weekdays[0], "d. MMM", { locale: sk })} – ${format(
    weekdays[4],
    "d. MMM yyyy",
    { locale: sk }
  )}`;

  const pickerMenu = pickerDate ? getMenuForDate(pickerDate) : undefined;
  const pickerAlreadyAdded = pickerMenu?.menu_items.map((i) => i.dish.id) ?? [];

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
        <Button onClick={handlePublishAll} variant="default">
          Publikovať všetky koncepty
        </Button>
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
              isToday={isToday(date)}
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
        nonRepeatDays={14}
      />
    </div>
  );
}
