import { useState, useMemo } from "react";
import { format, startOfWeek, addWeeks } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAddProposal } from "@/hooks/useProposals";
import { useDishes, type Dish } from "@/hooks/useDishes";
import { useToast } from "@/hooks/use-toast";
import { Search, BookOpen, PenLine, Check } from "lucide-react";

const CATEGORIES = [
  { value: "polievka", label: "Polievka" },
  { value: "hlavne_jedlo", label: "Hlavné jedlo" },
  { value: "dezert", label: "Dezert" },
  { value: "predjedlo", label: "Predjedlo" },
  { value: "salat", label: "Šalát" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "pasta", label: "Pasta" },
  { value: "ine", label: "Iné" },
];

function getNextWeeks(count: number) {
  const weeks: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const monday = startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 });
    weeks.push({
      value: format(monday, "yyyy-MM-dd"),
      label: `Týždeň od ${format(monday, "d.M.yyyy")}`,
    });
  }
  return weeks;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWeek: string;
}

export function AddProposalDialog({ open, onOpenChange, defaultWeek }: Props) {
  const [mode, setMode] = useState<"database" | "manual">("database");
  const [dishName, setDishName] = useState("");
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [category, setCategory] = useState("hlavne_jedlo");
  const [weekStart, setWeekStart] = useState(defaultWeek);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const addMut = useAddProposal();
  const { toast } = useToast();
  const { data: dishes = [] } = useDishes();
  const weeks = getNextWeeks(6);

  const filteredDishes = useMemo(() => {
    let filtered = dishes;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
      );
    }
    return filtered.slice(0, 50);
  }, [dishes, search, categoryFilter]);

  const handleSelectDish = (dish: Dish) => {
    setSelectedDish(dish);
    setDishName(dish.name);
    setCategory(dish.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = mode === "database" ? selectedDish?.name || "" : dishName;
    if (!name.trim()) return;

    try {
      await addMut.mutateAsync({
        dish_name: name,
        dish_id: mode === "database" ? selectedDish?.id : undefined,
        category,
        target_week_start: weekStart,
        note: note || undefined,
      });
      toast({ title: "Návrh pridaný" });
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Chyba", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setDishName("");
    setSelectedDish(null);
    setNote("");
    setSearch("");
    setCategoryFilter("all");
  };

  const categoryLabel = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat)?.label || cat;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nový návrh jedla</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setSelectedDish(null); setDishName(""); }}>
          <TabsList className="w-full">
            <TabsTrigger value="database" className="flex-1 gap-1.5">
              <BookOpen className="h-4 w-4" />
              Z databázy
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex-1 gap-1.5">
              <PenLine className="h-4 w-4" />
              Ručne
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "database" ? (
            <div className="space-y-3">
              {selectedDish ? (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{selectedDish.name}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel(selectedDish.category)}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedDish(null); setDishName(""); }}>
                    Zmeniť
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Hľadať jedlo..."
                        className="pl-9"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Všetky</SelectItem>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-1 space-y-0.5">
                      {filteredDishes.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                          Žiadne jedlá nenájdené
                        </p>
                      ) : (
                        filteredDishes.map((dish) => (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => handleSelectDish(dish)}
                            className="w-full flex items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                          >
                            <span className="truncate font-medium">{dish.name}</span>
                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                              {categoryLabel(dish.category)}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Názov jedla *</Label>
                <Input
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="napr. Hovädzia polievka s haluškami"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kategória</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Cieľový týždeň *</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {weeks.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Poznámka</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Voliteľná poznámka..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button
              type="submit"
              disabled={addMut.isPending || (mode === "database" && !selectedDish) || (mode === "manual" && !dishName.trim())}
            >
              {addMut.isPending ? "Ukladám…" : "Pridať"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
