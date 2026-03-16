import { useEffect, useState, useCallback } from "react";
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
  ChefHat,
  Carrot,
  BookOpen,
  UtensilsCrossed,
  ShoppingCart,
  FileOutput,
  Palette,
  Settings,
  MessageSquare,
  Plus,
  Search,
} from "lucide-react";
import { useDishes } from "@/hooks/useDishes";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Denné menu", icon: CalendarDays, path: "/daily-menu" },
  { label: "Jedlá", icon: ChefHat, path: "/dishes" },
  { label: "Suroviny", icon: Carrot, path: "/ingredients" },
  { label: "Recepty", icon: BookOpen, path: "/recipes" },
  { label: "Stály jedálniček", icon: UtensilsCrossed, path: "/permanent-menu" },
  { label: "Nákupný zoznam", icon: ShoppingCart, path: "/shopping-list" },
  { label: "Nástenka", icon: MessageSquare, path: "/nastenka" },
  { label: "Exporty", icon: FileOutput, path: "/exports" },
  { label: "Šablóny", icon: Palette, path: "/templates" },
  { label: "Nastavenia", icon: Settings, path: "/settings" },
];

const QUICK_ACTIONS = [
  { label: "Vytvoriť nové jedlo", icon: Plus, path: "/dishes", action: "new-dish" },
  { label: "Vytvoriť denné menu", icon: Plus, path: "/daily-menu", action: "new-menu" },
  { label: "Nový export", icon: FileOutput, path: "/exports", action: "new-export" },
  { label: "Pridať surovinu", icon: Plus, path: "/ingredients", action: "new-ingredient" },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { data: dishes } = useDishes();
  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (path: string) => {
      onOpenChange(false);
      setSearch("");
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filteredDishes = (dishes ?? []).slice(0, 8);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Hľadať stránky, jedlá, akcie…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Žiadne výsledky.</CommandEmpty>

        <CommandGroup heading="Rýchle akcie">
          {QUICK_ACTIONS.map((a) => (
            <CommandItem
              key={a.action}
              onSelect={() => handleSelect(a.path)}
              className="gap-2"
            >
              <a.icon className="h-4 w-4 text-primary" />
              {a.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigácia">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              onSelect={() => handleSelect(item.path)}
              className="gap-2"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>

        {filteredDishes.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Jedlá">
              {filteredDishes.map((dish) => (
                <CommandItem
                  key={dish.id}
                  value={`dish-${dish.name}`}
                  onSelect={() => handleSelect("/dishes")}
                  className="gap-2"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  {dish.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

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

  return { open, setOpen };
}
