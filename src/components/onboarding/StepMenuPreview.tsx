import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuSlots } from "@/store/useOnboardingStore";

interface Props {
  selectedDays: string[];
  slots: MenuSlots;
  restaurantName: string;
  previewDayIndex: number;
  setPreviewDayIndex: (i: number) => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Pondelok", tue: "Utorok", wed: "Streda", thu: "Štvrtok",
  fri: "Piatok", sat: "Sobota", sun: "Nedeľa",
};

const SAMPLE_SOUPS = ["Cesnaková krémová", "Hovädzia vývarová", "Paradajková s bazalkou", "Šošovicová", "Hríbová"];
const SAMPLE_MAINS = ["Vyprážaný rezeň s hranolkami", "Grilovaný losos s ryžou", "Bravčové medailónky", "Kuracia štvrť na paprike", "Hovädzí guláš", "Pečené kura s kaší", "Špagety Carbonara", "Rizoto s hubami"];
const SAMPLE_DESSERTS = ["Čokoládový fondant", "Panna cotta", "Jablkový závin", "Tiramisu", "Crème brûlée"];

function getDayItems(dayIndex: number, slots: MenuSlots) {
  const soups = Array.from({ length: slots.soups }, (_, i) => ({
    name: SAMPLE_SOUPS[(dayIndex * 2 + i) % SAMPLE_SOUPS.length],
    price: (1.5 + Math.random() * 0.8).toFixed(2),
  }));
  const mains = Array.from({ length: slots.mains }, (_, i) => ({
    name: SAMPLE_MAINS[(dayIndex * 3 + i) % SAMPLE_MAINS.length],
    price: (5.5 + Math.random() * 3).toFixed(2),
  }));
  const desserts = Array.from({ length: slots.desserts }, (_, i) => ({
    name: SAMPLE_DESSERTS[(dayIndex + i) % SAMPLE_DESSERTS.length],
    price: (2.5 + Math.random() * 1.5).toFixed(2),
  }));
  return { soups, mains, desserts };
}

export function StepMenuPreview({ selectedDays, slots, restaurantName, previewDayIndex, setPreviewDayIndex }: Props) {
  const currentDay = selectedDays[previewDayIndex] || selectedDays[0] || "mon";
  const items = getDayItems(previewDayIndex, slots);

  const goPrev = () => setPreviewDayIndex(Math.max(0, previewDayIndex - 1));
  const goNext = () => setPreviewDayIndex(Math.min(selectedDays.length - 1, previewDayIndex + 1));

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 mb-2">
          <Monitor className="h-5 w-5 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">TV Menu Náhľad</h2>
        <p className="text-sm text-muted-foreground">LCD 16:9 preview — posúvajte po dňoch</p>
      </div>

      {/* Day slider */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev} disabled={previewDayIndex <= 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1">
          {selectedDays.map((d, i) => (
            <button
              key={d}
              onClick={() => setPreviewDayIndex(i)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                i === previewDayIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {DAY_LABELS[d]?.slice(0, 2) || d}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext} disabled={previewDayIndex >= selectedDays.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 16:9 TV Frame */}
      <div className="relative w-full overflow-hidden rounded-xl border-2 border-border bg-gradient-to-br from-[hsl(22_38%_8%)] to-[hsl(20_27%_5%)] shadow-2xl shadow-black/60">
        <div className="aspect-video p-4 sm:p-6 flex flex-col">
          {/* Header */}
          <div className="text-center mb-3 sm:mb-4">
            <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {DAY_LABELS[currentDay] || currentDay}
            </p>
            <h3 className="font-serif text-sm sm:text-lg font-bold text-foreground">
              {restaurantName || "MENUMAT"}
            </h3>
            <div className="h-px w-16 mx-auto mt-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          </div>

          {/* Menu content */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 overflow-hidden text-[9px] sm:text-xs">
            {/* Soups */}
            <div>
              <p className="text-primary font-semibold uppercase tracking-wider text-[8px] sm:text-[10px] mb-1">Polievky</p>
              {items.soups.map((s, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-border/20">
                  <span className="text-foreground/80 truncate pr-1">{s.name}</span>
                  <span className="font-mono text-primary/80 shrink-0">{s.price} €</span>
                </div>
              ))}
            </div>

            {/* Mains */}
            <div>
              <p className="text-primary font-semibold uppercase tracking-wider text-[8px] sm:text-[10px] mb-1">Hlavné jedlá</p>
              {items.mains.map((m, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-border/20">
                  <span className="text-foreground/80 truncate pr-1">{m.name}</span>
                  <span className="font-mono text-primary/80 shrink-0">{m.price} €</span>
                </div>
              ))}
            </div>

            {/* Desserts */}
            <div>
              <p className="text-primary font-semibold uppercase tracking-wider text-[8px] sm:text-[10px] mb-1">Dezerty</p>
              {items.desserts.map((d, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-border/20">
                  <span className="text-foreground/80 truncate pr-1">{d.name}</span>
                  <span className="font-mono text-primary/80 shrink-0">{d.price} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-2 flex justify-between items-end text-[8px] sm:text-[10px] text-muted-foreground/50">
            <span>menumat.app</span>
            <span className="font-mono">{new Date().toLocaleDateString("sk-SK")}</span>
          </div>
        </div>

        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(0_0%_100%/0.01)_2px,hsl(0_0%_100%/0.01)_4px)]" />
      </div>

      <p className="text-center text-[10px] text-muted-foreground/60">
        Ukážkové dáta · Reálne menu sa vygeneruje po dokončení
      </p>
    </div>
  );
}
