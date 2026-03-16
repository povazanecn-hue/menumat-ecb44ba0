import { useState } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
] as const;

export interface MenuSlots {
  mains: number;
  soups: number;
  desserts: number;
  drinks: number;
}

interface Props {
  selectedDays: string[];
  setSelectedDays: (days: string[]) => void;
  slots: MenuSlots;
  setSlots: (slots: MenuSlots) => void;
}

function Counter({ label, value, onChange, min = 0, max = 10 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground/90">{label}</span>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded border-border/60"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-8 text-center font-mono text-sm text-foreground font-semibold">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7 rounded border-border/60"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function StepMenuStructure({ selectedDays, setSelectedDays, slots, setSlots }: Props) {
  const [activeDay, setActiveDay] = useState(selectedDays[0] || "mon");

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
      setActiveDay(day);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="font-serif text-xl font-bold text-foreground">Nastavenie Menu</h2>
        <p className="text-sm text-muted-foreground">Vyberte dni a počty jedál</p>
      </div>

      {/* Day tabs */}
      <div className="flex flex-wrap gap-1.5">
        {DAYS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => toggleDay(d.key)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
              selectedDays.includes(d.key)
                ? d.key === activeDay
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-primary/20 text-primary border-primary/30"
                : "bg-card/30 text-muted-foreground border-border/60 hover:border-primary/30"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Slot config */}
      <div className="rounded-lg border border-border bg-card/30 p-4 space-y-3">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Jedlá na {DAYS.find((d) => d.key === activeDay)?.label || "deň"}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Counter label="Hlavné Jedlá" value={slots.mains} onChange={(v) => setSlots({ ...slots, mains: v })} min={1} max={10} />
          <Counter label="Polievky" value={slots.soups} onChange={(v) => setSlots({ ...slots, soups: v })} min={0} max={5} />
          <Counter label="Dezerty" value={slots.desserts} onChange={(v) => setSlots({ ...slots, desserts: v })} min={0} max={5} />
          <Counter label="Nápoje" value={slots.drinks} onChange={(v) => setSlots({ ...slots, drinks: v })} min={0} max={5} />
        </div>
      </div>

      {/* Preview slots */}
      {selectedDays.length > 0 && (
        <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 space-y-1.5">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Náhľad slotov — {DAYS.find((d) => d.key === activeDay)?.label}
          </p>
          <div className="space-y-0.5 text-xs text-foreground/70">
            {Array.from({ length: slots.soups }, (_, i) => (
              <div key={`s${i}`} className="flex items-center gap-2 py-0.5">
                <span className="w-2 h-2 rounded-full bg-primary/40" />
                Polievka {i + 1}
              </div>
            ))}
            {Array.from({ length: slots.mains }, (_, i) => (
              <div key={`m${i}`} className="flex items-center gap-2 py-0.5">
                <span className="w-2 h-2 rounded-full bg-primary/70" />
                Hlavné jedlo {i + 1}
              </div>
            ))}
            {Array.from({ length: slots.desserts }, (_, i) => (
              <div key={`d${i}`} className="flex items-center gap-2 py-0.5">
                <span className="w-2 h-2 rounded-full bg-accent/50" />
                Dezert {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
