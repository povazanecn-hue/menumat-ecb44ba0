import { Check, ChefHat, Calendar, TrendingUp, Palette } from "lucide-react";
import type { MenuSlots } from "@/store/useOnboardingStore";

interface Props {
  restaurantName: string;
  selectedDays: string[];
  slots: MenuSlots;
  defaultMargin: number;
  vatRate: number;
  templateId: string;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Po", tue: "Ut", wed: "St", thu: "Št",
  fri: "Pi", sat: "So", sun: "Ne",
};

const TEMPLATE_LABELS: Record<string, string> = {
  classic: "Klasická",
  modern: "Moderná",
  minimal: "Minimalistická",
  luxury: "Luxusná",
};

export function StepSummary({ restaurantName, selectedDays, slots, defaultMargin, vatRate, templateId }: Props) {
  const totalDishes = (slots.soups + slots.mains + slots.desserts + slots.drinks) * selectedDays.length;

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-3 animate-pulse">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">Súhrn nastavení</h2>
        <p className="text-sm text-muted-foreground">Skontrolujte konfiguráciu pred náhľadom</p>
      </div>

      <div className="space-y-2">
        <SummaryRow icon={<ChefHat className="h-4 w-4 text-primary" />} label="Reštaurácia" value={restaurantName || "—"} />
        <SummaryRow
          icon={<Calendar className="h-4 w-4 text-primary" />}
          label="Prevádzkové dni"
          value={selectedDays.map((d) => DAY_LABELS[d] || d).join(", ") || "—"}
        />
        <SummaryRow
          icon={<ChefHat className="h-4 w-4 text-primary" />}
          label="Jedlá/deň"
          value={`${slots.soups} pol · ${slots.mains} hl · ${slots.desserts} dez · ${slots.drinks} náp`}
          mono
        />
        <SummaryRow
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
          label="Marža / DPH"
          value={`${defaultMargin}% / ${vatRate}%`}
          mono
        />
        <SummaryRow
          icon={<Palette className="h-4 w-4 text-primary" />}
          label="Šablóna"
          value={TEMPLATE_LABELS[templateId] || templateId}
        />
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
        <p className="text-xs text-muted-foreground">Celkový počet slotov za týždeň</p>
        <p className="font-mono text-2xl font-bold text-primary">{totalDishes}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">jedál</p>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-2.5">
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-foreground truncate ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
    </div>
  );
}
