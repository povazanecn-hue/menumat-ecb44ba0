import { Check, ChefHat, Calendar, Palette } from "lucide-react";
import type { MenuSlots } from "./StepMenuStructure";

interface Props {
  restaurantName: string;
  selectedDays: string[];
  slots: MenuSlots;
  templateId: string;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Pondelok", tue: "Utorok", wed: "Streda", thu: "Štvrtok",
  fri: "Piatok", sat: "Sobota", sun: "Nedeľa",
};

const TEMPLATE_LABELS: Record<string, string> = {
  classic: "Klasická Reštaurácia",
  modern: "Moderný Bistro",
  minimal: "Minimalistická Kaviareň",
  luxury: "Luxusná Reštaurácia",
};

export function StepFinish({ restaurantName, selectedDays, slots, templateId }: Props) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mb-3">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground">Všetko pripravené!</h2>
        <p className="text-sm text-muted-foreground">Skontrolujte nastavenia a vstúpte do dashboardu</p>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-3">
          <ChefHat className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Reštaurácia</p>
            <p className="text-sm font-medium text-foreground">{restaurantName || "—"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-3">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Dni</p>
            <p className="text-sm font-medium text-foreground">
              {selectedDays.map((d) => DAY_LABELS[d] || d).join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-3">
          <ChefHat className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Štruktúra menu</p>
            <p className="text-sm font-medium text-foreground font-mono">
              {slots.soups} polievky · {slots.mains} hlavné · {slots.desserts} dezerty · {slots.drinks} nápoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/30 px-4 py-3">
          <Palette className="h-4 w-4 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Šablóna</p>
            <p className="text-sm font-medium text-foreground">{TEMPLATE_LABELS[templateId] || templateId}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
