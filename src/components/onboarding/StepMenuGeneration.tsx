import { Sparkles, UtensilsCrossed, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

type MenuMode = "ai" | "manual" | "import" | null;

interface Props {
  selectedMode: MenuMode;
  setSelectedMode: (m: MenuMode) => void;
}

const modes = [
  {
    id: "ai" as const,
    icon: Sparkles,
    title: "AI generovanie",
    desc: "Nechajte AI navrhnúť menu z vašej databázy jedál — stačí pár kliknutí",
  },
  {
    id: "manual" as const,
    icon: UtensilsCrossed,
    title: "Manuálna tvorba",
    desc: "Vyberte jedlá ručne do polievok, hlavných jedál a dezertov",
  },
  {
    id: "import" as const,
    icon: FileSpreadsheet,
    title: "Import z Excelu",
    desc: "Nahrajte existujúci jedálniček z Excel alebo CSV súboru",
  },
];

export function StepMenuGeneration({ selectedMode, setSelectedMode }: Props) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1 mb-2">
        <h2 className="font-serif text-xl font-bold text-foreground">Vytvorte prvé menu</h2>
        <p className="text-sm text-muted-foreground">
          Vyberte spôsob, akým chcete vytvoriť denné menu
        </p>
      </div>
      <div className="grid gap-2">
        {modes.map((m) => {
          const isSelected = selectedMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedMode(isSelected ? null : m.id)}
              className={`flex items-start gap-3 rounded-lg p-3 text-left transition-all border ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-secondary/50 hover:border-primary/40"
              }`}
            >
              <m.icon className={`h-5 w-5 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <p className={`text-sm font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        Môžete preskočiť — menu vytvoríte kedykoľvek z dashboardu
      </p>
    </div>
  );
}
