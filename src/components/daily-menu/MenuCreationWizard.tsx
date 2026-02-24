import { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Utensils,
  Wand2,
  ShieldCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
  FileUp,
  PenLine,
  Check,
} from "lucide-react";
import { addDays, format, startOfWeek, addWeeks } from "date-fns";
import { sk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DISH_CATEGORIES } from "@/lib/constants";
import type { WizardDefaults } from "@/hooks/useRestaurant";

// ── Types ──
export interface WizardSlots {
  soups: number;
  mains: number;
  desserts: number;
}

export interface CategorySlot {
  category: string;
  count: number;
}

export type WizardMode = "ai" | "manual" | "import";

export interface WizardConfig {
  /** Which weekdays are selected (0=Mon, 6=Sun) */
  selectedDays: number[];
  weekStart: Date;
  slots: WizardSlots;
  extraSlots: CategorySlot[];
  mode: WizardMode;
  nonRepeatDays: number;
}

interface MenuCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultNonRepeatDays: number;
  defaultWeekStart: Date;
  wizardDefaults?: WizardDefaults;
  onConfirm: (config: WizardConfig) => Promise<void>;
}

const STEPS = [
  { label: "Dni", icon: CalendarDays },
  { label: "Sloty", icon: Utensils },
  { label: "Režim", icon: Wand2 },
  { label: "Pravidlá", icon: ShieldCheck },
  { label: "Náhľad", icon: Eye },
] as const;

const DAY_LABELS = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];

const EXTRA_CATEGORIES = [
  { value: "predjedlo", label: "Predjedlo" },
  { value: "salat", label: "Šalát" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "pasta", label: "Pasta" },
  { value: "napoj", label: "Nápoj" },
  { value: "ine", label: "Iné" },
];

const MODE_OPTIONS: { value: WizardMode; label: string; desc: string; icon: typeof Wand2 }[] = [
  { value: "ai", label: "AI generátor", desc: "AI vyberie jedlá z databázy podľa pravidiel", icon: Wand2 },
  { value: "manual", label: "Manuálny", desc: "Prázdne dni — jedlá pridáte ručne", icon: PenLine },
  { value: "import", label: "Import", desc: "Naimportujte z Excel / CSV súboru", icon: FileUp },
];

export function MenuCreationWizard({
  open,
  onOpenChange,
  defaultNonRepeatDays,
  defaultWeekStart,
  wizardDefaults,
  onConfirm,
}: MenuCreationWizardProps) {
  const [step, setStep] = useState(0);
  const [applying, setApplying] = useState(false);

  // Step 1 — Days
  const [selectedDays, setSelectedDays] = useState<number[]>(() =>
    wizardDefaults?.selectedDays ?? [0, 1, 2, 3, 4]
  );
  const [weekStart, setWeekStart] = useState(() => defaultWeekStart);

  // Step 2 — Slots
  const [slots, setSlots] = useState<WizardSlots>(() =>
    wizardDefaults?.slots ?? { soups: 1, mains: 4, desserts: 1 }
  );
  const [extraSlots, setExtraSlots] = useState<CategorySlot[]>(() =>
    wizardDefaults?.extraSlots ?? []
  );

  // Step 3 — Mode
  const [mode, setMode] = useState<WizardMode>("ai");

  // Step 4 — Rules
  const [nonRepeatDays, setNonRepeatDays] = useState(defaultNonRepeatDays);

  // Sync defaults when they change (e.g. after restaurant loads)
  useEffect(() => {
    if (wizardDefaults?.selectedDays) setSelectedDays(wizardDefaults.selectedDays);
    if (wizardDefaults?.slots) setSlots(wizardDefaults.slots);
    if (wizardDefaults?.extraSlots) setExtraSlots(wizardDefaults.extraSlots);
  }, [wizardDefaults]);

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
    );
  };

  const addExtraSlot = () => {
    const used = extraSlots.map((s) => s.category);
    const available = EXTRA_CATEGORIES.find((c) => !used.includes(c.value));
    if (available) setExtraSlots([...extraSlots, { category: available.value, count: 1 }]);
  };

  const removeExtraSlot = (i: number) => setExtraSlots(extraSlots.filter((_, idx) => idx !== i));

  const updateExtraSlot = (i: number, field: "category" | "count", v: string | number) =>
    setExtraSlots(extraSlots.map((s, idx) => (idx === i ? { ...s, [field]: v } : s)));

  // Computed dates for selected days
  const selectedDates = useMemo(
    () => selectedDays.map((d) => addDays(weekStart, d)),
    [weekStart, selectedDays]
  );

  const totalDishesPerDay = slots.soups + slots.mains + slots.desserts + extraSlots.reduce((s, e) => s + e.count, 0);

  const canProceed = () => {
    if (step === 0) return selectedDays.length > 0;
    if (step === 1) return totalDishesPerDay > 0;
    return true;
  };

  const handleConfirm = async () => {
    setApplying(true);
    try {
      await onConfirm({
        selectedDays,
        weekStart,
        slots,
        extraSlots: extraSlots.filter((s) => s.count > 0),
        mode,
        nonRepeatDays,
      });
      onOpenChange(false);
      // Reset
      setStep(0);
    } catch {
      // error handled upstream
    } finally {
      setApplying(false);
    }
  };

  const usedExtraCats = extraSlots.map((s) => s.category);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!applying) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-serif text-xl">Sprievodca tvorbou menu</DialogTitle>
        </DialogHeader>

        {/* ── Stepper ── */}
        <div className="px-6 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                {s.label}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* ── Sticky summary ── */}
        {step > 0 && (
          <div className="px-6 py-2 bg-muted/50 border-b border-border flex flex-wrap gap-2 text-xs">
            <Badge variant="outline" className="text-xs">
              {selectedDays.length} dní
            </Badge>
            <Badge variant="outline" className="text-xs">
              {slots.soups}P + {slots.mains}H + {slots.desserts}D
              {extraSlots.length > 0 && ` + ${extraSlots.reduce((s, e) => s + e.count, 0)} extra`}
            </Badge>
            {step > 2 && (
              <Badge variant="outline" className="text-xs">
                {MODE_OPTIONS.find((m) => m.value === mode)?.label}
              </Badge>
            )}
            {step > 3 && (
              <Badge variant="outline" className="text-xs">
                {nonRepeatDays}d neopak.
              </Badge>
            )}
          </div>
        )}

        {/* ── Step content ── */}
        <div className="px-6 py-4 min-h-[250px]">
          {/* STEP 0: Days scope */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vyberte dni a týždeň, pre ktorý chcete vytvoriť menu.
              </p>

              {/* Week picker */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setWeekStart((w) => addWeeks(w, -1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[180px] text-center">
                  {format(weekStart, "d. MMM", { locale: sk })} – {format(addDays(weekStart, 6), "d. MMM yyyy", { locale: sk })}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Day toggles */}
              <div className="flex justify-center gap-2">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-10 h-10 rounded-full text-xs font-medium transition-all ${
                      selectedDays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Quick presets */}
              <div className="flex justify-center gap-2">
                <Button
                  variant={selectedDays.length === 5 && selectedDays[0] === 0 ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedDays([0, 1, 2, 3, 4])}
                >
                  Po – Pi
                </Button>
                <Button
                  variant={selectedDays.length === 7 ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                >
                  Celý týždeň
                </Button>
              </div>

              {selectedDays.length === 0 && (
                <p className="text-xs text-destructive text-center">Vyberte aspoň jeden deň.</p>
              )}
            </div>
          )}

          {/* STEP 1: Slot structure */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nastavte štruktúru menu — počet jedál podľa kategórie pre každý deň.
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Polievky (1–3)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3}
                    value={slots.soups}
                    onChange={(e) => setSlots((s) => ({ ...s, soups: Math.min(3, Math.max(1, Number(e.target.value))) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hlavné jedlá (1–8)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8}
                    value={slots.mains}
                    onChange={(e) => setSlots((s) => ({ ...s, mains: Math.min(8, Math.max(1, Number(e.target.value))) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Dezerty (0–2)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={2}
                    value={slots.desserts}
                    onChange={(e) => setSlots((s) => ({ ...s, desserts: Math.min(2, Math.max(0, Number(e.target.value))) }))}
                  />
                </div>
              </div>

              {/* Extra category slots */}
              {extraSlots.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Voliteľné kategórie
                  </Label>
                  {extraSlots.map((slot, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select
                        value={slot.category}
                        onValueChange={(v) => updateExtraSlot(i, "category", v)}
                      >
                        <SelectTrigger className="flex-1 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXTRA_CATEGORIES.filter(
                            (c) => c.value === slot.category || !usedExtraCats.includes(c.value)
                          ).map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={slot.count}
                        onChange={(e) => updateExtraSlot(i, "count", Number(e.target.value))}
                        className="w-16 h-9"
                      />
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeExtraSlot(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {extraSlots.length < EXTRA_CATEGORIES.length && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={addExtraSlot}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Pridať kategóriu (pizza, šalát, burger…)
                </Button>
              )}

              <div className="text-center text-xs text-muted-foreground">
                Spolu <span className="font-semibold text-foreground">{totalDishesPerDay}</span> jedál / deň × <span className="font-semibold text-foreground">{selectedDays.length}</span> dní = <span className="font-semibold text-primary">{totalDishesPerDay * selectedDays.length}</span> položiek
              </div>
            </div>
          )}

          {/* STEP 2: Mode selection */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Zvoľte spôsob vytvorenia menu.
              </p>
              <div className="grid gap-3">
                {MODE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = mode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setMode(opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`p-2 rounded-full ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 ml-auto text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Rules */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Nastavte pravidlá generovania menu.
              </p>

              <div className="space-y-3">
                <Label className="text-sm">Pravidlo neopakovania jedál</Label>
                <p className="text-xs text-muted-foreground">
                  To isté jedlo sa nemôže zopakovať v menu skôr ako za <span className="font-semibold text-foreground">{nonRepeatDays}</span> dní.
                </p>
                <Slider
                  value={[nonRepeatDays]}
                  onValueChange={(v) => setNonRepeatDays(v[0])}
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1 deň</span>
                  <span>30 dní</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Ochrana cien</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI nikdy neprepíše finálnu manuálne nastavenú cenu bez vášho explicitného súhlasu.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Skontrolujte nastavenie a potvrďte vytvorenie menu.
              </p>

              {/* Skeleton preview */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {selectedDates.map((date, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-3 space-y-2">
                      <div className="text-xs font-semibold capitalize">
                        {format(date, "EEEE", { locale: sk })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(date, "d. MMM", { locale: sk })}
                      </div>
                      {/* Skeleton slots */}
                      {Array.from({ length: slots.soups }).map((_, j) => (
                        <div key={`s${j}`} className="h-3 rounded bg-primary/20 animate-pulse" />
                      ))}
                      {Array.from({ length: slots.mains }).map((_, j) => (
                        <div key={`m${j}`} className="h-3 rounded bg-muted animate-pulse" />
                      ))}
                      {Array.from({ length: slots.desserts }).map((_, j) => (
                        <div key={`d${j}`} className="h-3 rounded bg-accent/20 animate-pulse" />
                      ))}
                      {extraSlots.map((es, j) =>
                        Array.from({ length: es.count }).map((_, k) => (
                          <div key={`e${j}${k}`} className="h-3 rounded bg-muted/60 animate-pulse" />
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Summary */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-1.5">
                <div className="text-sm font-medium">Zhrnutie</div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Týždeň:</span>
                  <span className="text-foreground">
                    {format(weekStart, "d. MMM", { locale: sk })} – {format(addDays(weekStart, 6), "d. MMM", { locale: sk })}
                  </span>
                  <span>Počet dní:</span>
                  <span className="text-foreground">{selectedDays.length}</span>
                  <span>Štruktúra:</span>
                  <span className="text-foreground">
                    {slots.soups}P + {slots.mains}H + {slots.desserts}D
                    {extraSlots.length > 0 && ` + ${extraSlots.map((e) => `${e.count}×${DISH_CATEGORIES[e.category] ?? e.category}`).join(", ")}`}
                  </span>
                  <span>Režim:</span>
                  <span className="text-foreground">{MODE_OPTIONS.find((m) => m.value === mode)?.label}</span>
                  <span>Neopakovanie:</span>
                  <span className="text-foreground">{nonRepeatDays} dní</span>
                  <span>Celkom položiek:</span>
                  <span className="text-primary font-semibold">{totalDishesPerDay * selectedDays.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer navigation ── */}
        <div className="px-6 pb-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
            disabled={applying}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Zrušiť" : "Späť"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Ďalej
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={applying}>
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Vytváram…
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Vytvoriť menu
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
