import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Percent } from "lucide-react";

interface Props {
  defaultMargin: number;
  setDefaultMargin: (v: number) => void;
  vatRate: number;
  setVatRate: (v: number) => void;
}

const MARGIN_LABELS: Record<number, string> = {
  50: "Nízka",
  100: "Štandardná",
  150: "Vyššia",
  200: "Premium",
  300: "Luxus",
};

function getMarginLabel(v: number) {
  if (v <= 50) return "Nízka";
  if (v <= 100) return "Štandardná";
  if (v <= 150) return "Vyššia";
  if (v <= 200) return "Premium";
  return "Luxus";
}

export function StepPricing({ defaultMargin, setDefaultMargin, vatRate, setVatRate }: Props) {
  const exampleCost = 2.5;
  const recommended = exampleCost * (1 + defaultMargin / 100);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1 mb-2">
        <h2 className="font-serif text-xl font-bold text-foreground">Ceny & Marže</h2>
        <p className="text-sm text-muted-foreground">Nastavte predvolenú maržu a DPH sadzbu</p>
      </div>

      {/* Margin slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Predvolená marža
          </Label>
          <span className="text-sm font-mono font-semibold text-primary">{defaultMargin}%</span>
        </div>

        <Slider
          value={[defaultMargin]}
          onValueChange={([v]) => setDefaultMargin(v)}
          min={50}
          max={300}
          step={10}
          className="w-full"
        />

        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>50%</span>
          <span>100%</span>
          <span>150%</span>
          <span>200%</span>
          <span>300%</span>
        </div>

        {/* Live calc example */}
        <div className="rounded-lg border border-border bg-card/40 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Príklad kalkulácie</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground">Náklady</p>
              <p className="font-mono text-sm font-semibold text-foreground">{exampleCost.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Marža {defaultMargin}%</p>
              <p className="font-mono text-sm font-semibold text-primary">{getMarginLabel(defaultMargin)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Cena</p>
              <p className="font-mono text-sm font-semibold text-foreground">{recommended.toFixed(2)} €</p>
            </div>
          </div>
        </div>
      </div>

      {/* VAT */}
      <div className="space-y-1.5">
        <Label className="text-foreground flex items-center gap-1.5">
          <Percent className="h-3.5 w-3.5 text-primary" />
          DPH sadzba
        </Label>
        <Select value={String(vatRate)} onValueChange={(v) => setVatRate(Number(v))}>
          <SelectTrigger className="bg-secondary border-border text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10% — Znížená</SelectItem>
            <SelectItem value="20">20% — Štandardná</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
