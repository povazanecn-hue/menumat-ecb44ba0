import { Button } from "@/components/ui/button";
import { Plus, ChefHat, ShoppingCart, FileOutput } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QUICK_ACTIONS = [
  { label: "Nové menu", icon: Plus, path: "/daily-menu" },
  { label: "Pridať jedlo", icon: ChefHat, path: "/dishes" },
  { label: "Nákupný zoznam", icon: ShoppingCart, path: "/shopping-list" },
  { label: "Exportovať", icon: FileOutput, path: "/exports" },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      {QUICK_ACTIONS.map((a) => (
        <Button
          key={a.label}
          variant="outline"
          className="flex flex-col items-center gap-1.5 h-auto py-4"
          onClick={() => navigate(a.path)}
        >
          <a.icon className="h-5 w-5" />
          <span className="text-xs">{a.label}</span>
        </Button>
      ))}
    </div>
  );
}
