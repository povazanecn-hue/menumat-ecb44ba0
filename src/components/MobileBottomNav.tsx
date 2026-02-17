import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  FileOutput,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Carrot,
  BookOpen,
  ShoppingCart,
  Palette,
  Settings,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";

const PRIMARY_TABS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Menu", path: "/daily-menu", icon: CalendarDays },
  { label: "Jedlá", path: "/dishes", icon: UtensilsCrossed },
  { label: "Export", path: "/exports", icon: FileOutput },
  { label: "Viac", path: "__more__", icon: MoreHorizontal },
];

const MORE_ITEMS = [
  { label: "Ingrediencie", path: "/ingredients", icon: Carrot },
  { label: "Recepty", path: "/recipes", icon: BookOpen },
  { label: "Jedálny lístok", path: "/permanent-menu", icon: ClipboardList },
  { label: "Nástenka", path: "/nastenka", icon: ClipboardCheck },
  { label: "Nákupný zoznam", path: "/shopping-list", icon: ShoppingCart },
  { label: "Šablóny", path: "/templates", icon: Palette },
  { label: "Nastavenia", path: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const isMoreActive = MORE_ITEMS.some((item) => isActive(item.path));

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {PRIMARY_TABS.map((tab) => {
          if (tab.path === "__more__") {
            return (
              <Sheet key="more" open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                      isMoreActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <tab.icon className="h-5 w-5" />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="pb-8 rounded-t-2xl">
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {MORE_ITEMS.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          setMoreOpen(false);
                          navigate(item.path);
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-colors",
                          isActive(item.path)
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            );
          }

          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-primary" />
              )}
              <tab.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
