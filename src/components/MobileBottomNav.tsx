import { LayoutDashboard, CalendarDays, UtensilsCrossed, FileOutput, MoreHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Carrot, BookOpen, ShoppingCart, Palette, Settings, ClipboardList, ClipboardCheck } from "lucide-react";

const mainTabs = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Menu", path: "/daily-menu", icon: CalendarDays },
  { label: "Jedlá", path: "/dishes", icon: UtensilsCrossed },
  { label: "Export", path: "/exports", icon: FileOutput },
];

const moreLinks = [
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

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreLinks.some((l) => location.pathname === l.path);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md sm:hidden pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around h-14">
          {mainTabs.map((tab) => (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                isActive(tab.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
              isMoreActive || moreOpen
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Viac</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-2 pb-[env(safe-area-inset-bottom)]">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-sm font-semibold text-foreground">Ďalšie sekcie</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 pb-4">
            {moreLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMoreOpen(false);
                }}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 text-xs transition-colors",
                  isActive(link.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <link.icon className="h-5 w-5" />
                <span className="leading-tight text-center">{link.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
