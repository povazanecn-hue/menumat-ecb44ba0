import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Store, UtensilsCrossed, CalendarDays, Rocket, ChevronRight, ChevronLeft, Check, Sparkles } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { DISH_CATEGORIES } from "@/lib/constants";
import { Database } from "@/integrations/supabase/types";

type DishCategory = Database["public"]["Enums"]["dish_category"];

const STEPS = [
  { id: "restaurant", label: "Reštaurácia", icon: Store },
  { id: "dish", label: "Prvé jedlo", icon: UtensilsCrossed },
  { id: "menu", label: "Denné menu", icon: CalendarDays },
  { id: "done", label: "Hotovo", icon: Rocket },
] as const;

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Restaurant
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Step 2: First dish
  const [dishName, setDishName] = useState("");
  const [dishCategory, setDishCategory] = useState<DishCategory>("hlavne_jedlo");
  const [dishPrice, setDishPrice] = useState("");
  const [dishSkipped, setDishSkipped] = useState(false);

  const userRole = (user?.user_metadata?.app_role as string) || "owner";

  const handleCreateRestaurant = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: name,
        _address: address || null,
        _role: userRole as any,
      });
      if (error) throw error;
      setRestaurantId(data);
      await refetch();
      toast({ title: "Reštaurácia vytvorená!", description: `${name} je pripravená.` });
      setStep(1);
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDish = async () => {
    if (!restaurantId || !dishName.trim()) return;
    setSubmitting(true);
    try {
      const finalPrice = dishPrice ? Number(dishPrice) : null;
      const { error } = await supabase.from("dishes").insert({
        name: dishName,
        category: dishCategory,
        restaurant_id: restaurantId,
        final_price: finalPrice,
        is_daily_menu: true,
      });
      if (error) throw error;
      toast({ title: "Jedlo pridané!", description: dishName });
      setStep(2);
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    navigate("/dashboard");
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return dishSkipped || dishName.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 0) handleCreateRestaurant();
    else if (step === 1) {
      if (dishSkipped) setStep(2);
      else handleCreateDish();
    } else if (step === 2) setStep(3);
    else handleFinish();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6">
        <LogoBrand size="md" glow />
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : isDone
                        ? "bg-primary/20 text-primary"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          {/* Step 0: Restaurant */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <h2 className="font-serif text-xl font-bold text-foreground">Nová reštaurácia</h2>
                <p className="text-sm text-muted-foreground">Zadajte základné údaje vašej prevádzky</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Názov reštaurácie *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Koliesko Country Club"
                  required
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Adresa
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Banšelová 3, Bratislava"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          {/* Step 1: First dish */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <h2 className="font-serif text-xl font-bold text-foreground">Pridajte prvé jedlo</h2>
                <p className="text-sm text-muted-foreground">
                  Rýchlo si vyskúšajte ako funguje databáza jedál
                </p>
              </div>
              {!dishSkipped && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="dish-name" className="text-foreground">Názov jedla *</Label>
                    <Input
                      id="dish-name"
                      value={dishName}
                      onChange={(e) => setDishName(e.target.value)}
                      placeholder="Hovädzí guláš s knedľou"
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-foreground">Kategória</Label>
                      <Select value={dishCategory} onValueChange={(v) => setDishCategory(v as DishCategory)}>
                        <SelectTrigger className="bg-secondary border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(DISH_CATEGORIES).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dish-price" className="text-foreground">Cena (€)</Label>
                      <Input
                        id="dish-price"
                        type="number"
                        step="0.10"
                        min={0}
                        value={dishPrice}
                        onChange={(e) => setDishPrice(e.target.value)}
                        placeholder="6.90"
                        className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setDishSkipped(!dishSkipped);
                  setDishName("");
                }}
                className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
              >
                {dishSkipped ? "Chcem pridať jedlo" : "Preskočiť tento krok"}
              </button>
            </div>
          )}

          {/* Step 2: Menu intro */}
          {step === 2 && (
            <div className="space-y-5 text-center">
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-foreground">Denné menu na dosah</h2>
                <p className="text-sm text-muted-foreground">
                  MENUMAT vám pomôže vytvoriť menu za pár minút
                </p>
              </div>
              <div className="grid gap-3 text-left">
                {[
                  { icon: Sparkles, title: "AI generovanie", desc: "Nechajte AI navrhnúť menu z vašej databázy jedál" },
                  { icon: UtensilsCrossed, title: "Manuálna tvorba", desc: "Vyberte jedlá ručne do polievok, hlavných jedál a dezertov" },
                  { icon: CalendarDays, title: "Týždenný prehľad", desc: "Pondelok–Piatok na jednej obrazovke s drag & drop" },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-lg bg-secondary/50 p-3">
                    <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="space-y-5 text-center py-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-foreground">Všetko pripravené!</h2>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">{name}</strong> je nastavená. Začnite tvoriť menu.
                </p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>✓ Reštaurácia vytvorená</p>
                {!dishSkipped && dishName && <p>✓ Prvé jedlo pridané: {dishName}</p>}
                <p>✓ Dashboard a menu generátor čakajú</p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {step > 0 && step < 3 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                disabled={step === 1 && !!restaurantId}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Späť
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={handleNext}
              disabled={!canNext() || submitting}
              className="min-w-[140px]"
            >
              {submitting
                ? "Spracovávam..."
                : step === 3
                  ? "Prejsť na Dashboard"
                  : step === 0
                    ? "Vytvoriť reštauráciu"
                    : step === 1 && dishSkipped
                      ? "Preskočiť"
                      : step === 1
                        ? "Pridať jedlo"
                        : "Ďalej"
              }
              {step < 3 && !submitting && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-white/70">
        Powered by N-[vision] | N-oLiMiT gastro
      </p>
    </div>
  );
}
