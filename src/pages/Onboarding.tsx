import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, UtensilsCrossed, CalendarDays, FileOutput, Rocket, ChevronRight, ChevronLeft } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { Database } from "@/integrations/supabase/types";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { OliviaOnboardingTip } from "@/components/onboarding/OliviaOnboardingTip";
import { StepRestaurant } from "@/components/onboarding/StepRestaurant";
import { StepFirstDish } from "@/components/onboarding/StepFirstDish";
import { StepMenuGeneration } from "@/components/onboarding/StepMenuGeneration";
import { StepExportPreview } from "@/components/onboarding/StepExportPreview";
import { StepDone } from "@/components/onboarding/StepDone";
import { motion, AnimatePresence } from "framer-motion";

type DishCategory = Database["public"]["Enums"]["dish_category"];

const STEPS = [
  { id: "restaurant", label: "Reštaurácia", icon: Store },
  { id: "dish", label: "Prvé jedlo", icon: UtensilsCrossed },
  { id: "menu", label: "Menu", icon: CalendarDays },
  { id: "exports", label: "Exporty", icon: FileOutput },
  { id: "done", label: "Hotovo", icon: Rocket },
] as const;

const OLIVIA_TIPS: Record<string, string> = {
  restaurant: "Vitajte v MENUMAT! Zadajte názov vašej reštaurácie — adresa je voliteľná, ale pomôže pri fakturácii a exportoch.",
  dish: "Pridajte prvé jedlo, aby ste videli ako funguje databáza. Kategória a cena sa dajú kedykoľvek upraviť.",
  menu: "Odporúčam AI generovanie — stačí mať aspoň 5 jedál v databáze a menu sa vytvorí za pár sekúnd.",
  exports: "MENUMAT podporuje 4 formáty exportu. TV zobrazenie je obľúbené v reštauráciách s obrazovkami.",
  done: "Skvelé! Všetko je pripravené. Na dashboarde uvidíte prehľad a upozornenia na chýbajúce dáta.",
};

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 0: Restaurant
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Step 1: First dish
  const [dishName, setDishName] = useState("");
  const [dishCategory, setDishCategory] = useState<DishCategory>("hlavne_jedlo");
  const [dishPrice, setDishPrice] = useState("");
  const [dishSkipped, setDishSkipped] = useState(false);

  // Step 2: Menu mode
  const [menuMode, setMenuMode] = useState<"ai" | "manual" | "import" | null>(null);

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

  const handleFinish = () => {
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
    else if (step === 3) setStep(4);
    else handleFinish();
  };

  const currentStepId = STEPS[step]?.id ?? "done";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6">
        <LogoBrand size="md" glow />
      </div>

      <div className="w-full max-w-lg space-y-5">
        <OnboardingStepper steps={[...STEPS]} currentStep={step} />

        {/* Olivia AI tip */}
        <OliviaOnboardingTip tip={OLIVIA_TIPS[currentStepId]} step={step} />

        {/* Card with step content */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <StepRestaurant name={name} setName={setName} address={address} setAddress={setAddress} />
              )}
              {step === 1 && (
                <StepFirstDish
                  dishName={dishName} setDishName={setDishName}
                  dishCategory={dishCategory} setDishCategory={setDishCategory}
                  dishPrice={dishPrice} setDishPrice={setDishPrice}
                  dishSkipped={dishSkipped} setDishSkipped={setDishSkipped}
                />
              )}
              {step === 2 && (
                <StepMenuGeneration selectedMode={menuMode} setSelectedMode={setMenuMode} />
              )}
              {step === 3 && <StepExportPreview />}
              {step === 4 && (
                <StepDone
                  restaurantName={name}
                  dishName={dishName}
                  dishSkipped={dishSkipped}
                  menuModeChosen={!!menuMode}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {step > 0 && step < 4 ? (
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
                : step === 4
                  ? "Prejsť na Dashboard"
                  : step === 0
                    ? "Vytvoriť reštauráciu"
                    : step === 1 && dishSkipped
                      ? "Preskočiť"
                      : step === 1
                        ? "Pridať jedlo"
                        : "Ďalej"
              }
              {step < 4 && !submitting && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-muted-foreground/70">
        Powered by N-[vision] | N-oLiMiT gastro
      </p>
    </div>
  );
}
