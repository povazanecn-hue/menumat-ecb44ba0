import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Carrot,
  BookOpen,
  ShoppingCart,
  FileOutput,
  Palette,
  Settings,
  ClipboardList,
  ClipboardCheck,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { useDishes } from "@/hooks/useDishes";
import { DISH_CATEGORIES } from "@/lib/constants";

const NAV_ITEMS = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard, keywords: "prehľad domov home" },
  { label: "Denné menu", url: "/daily-menu", icon: CalendarDays, keywords: "denne menu tyzdenne weekly" },
  { label: "Jedlá", url: "/dishes", icon: UtensilsCrossed, keywords: "jedla databaza dishes food" },
  { label: "Ingrediencie", url: "/ingredients", icon: Carrot, keywords: "suroviny ingredients" },
  { label: "Recepty", url: "/recipes", icon: BookOpen, keywords: "recepty recipes" },
  { label: "Jedálny lístok", url: "/permanent-menu", icon: ClipboardList, keywords: "stala ponuka permanent menu" },
  { label: "Nástenka", url: "/nastenka", icon: ClipboardCheck, keywords: "nastenka board navrhy" },
  { label: "Nákupný zoznam", url: "/shopping-list", icon: ShoppingCart, keywords: "nakupny zoznam shopping list" },
  { label: "Export centrum", url: "/exports", icon: FileOutput, keywords: "export pdf excel tv webflow" },
  { label: "Šablóny", url: "/templates", icon: Palette, keywords: "sablony templates design" },
  { label: "Nastavenia", url: "/settings", icon: Settings, keywords: "nastavenia settings profil" },
];

const QUICK_ACTIONS = [
  { label: "Nové jedlo", url: "/dishes", action: "new-dish", icon: Plus, keywords: "vytvorit pridať nové jedlo" },
  { label: "Vytvoriť denné menu", url: "/daily-menu", action: "new-menu", icon: CalendarDays, keywords: "vytvorit denne menu generovat" },
  { label: "Nový export", url: "/exports", action: "new-export", icon: FileOutput, keywords: "exportovat pdf excel tv" },
  { label: "Nová ingrediencia", url: "/ingredients", action: "new-ingredient", icon: Plus, keywords: "nová surovina ingrediencia" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: dishes = [] } = useDishes();

  // ⌘K / Ctrl+K handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      navigate(url);
    },
    [navigate]
  );

  // Top 20 dishes for quick search
  const topDishes = useMemo(() => dishes.slice(0, 20), [dishes]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Hľadať stránky, jedlá, akcie..." />
      <CommandList>
        <CommandEmpty>Žiadne výsledky.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Rýchle akcie">
          {QUICK_ACTIONS.map((item) => (
            <CommandItem
              key={item.action}
              value={`action ${item.label} ${item.keywords}`}
              onSelect={() => handleSelect(item.url)}
              className="gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span>{item.label}</span>
              <Zap className="ml-auto h-3 w-3 text-primary/40" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigácia">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.url}
              value={`nav ${item.label} ${item.keywords}`}
              onSelect={() => handleSelect(item.url)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Dishes search */}
        {topDishes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jedlá">
              {topDishes.map((dish) => (
                <CommandItem
                  key={dish.id}
                  value={`dish ${dish.name} ${DISH_CATEGORIES[dish.category] ?? ""}`}
                  onSelect={() => handleSelect("/dishes")}
                  className="gap-2"
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{dish.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {DISH_CATEGORIES[dish.category] ?? dish.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
