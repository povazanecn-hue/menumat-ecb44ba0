import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, Sparkles, Rocket, ChevronRight, ChevronLeft } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { OliviaOnboardingTip } from "@/components/onboarding/OliviaOnboardingTip";
import { OliviaGreeting } from "@/components/OliviaGreeting";
import { StepWelcome } from "@/components/onboarding/StepWelcome";
import { StepRestaurant } from "@/components/onboarding/StepRestaurant";
import { StepAiDemo } from "@/components/onboarding/StepAiDemo";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "welcome", label: "Uvítanie", icon: Rocket },
  { id: "restaurant", label: "Prevádzka", icon: Store },
  { id: "demo", label: "AI ukážka", icon: Sparkles },
] as const;

const OLIVIA_TIPS: Record<string, string> = {
  welcome: "Ahoj! Som Olivia, vaša AI asistentka. Prevediem vás rýchlym nastavením — bude to hotové za minútku.",
  restaurant: "Zadajte názov vašej reštaurácie. Adresa je voliteľná, ale pomôže pri fakturácii a exportoch.",
  demo: "Takto jednoducho AI vygeneruje vaše denné menu. Po dokončení to vyskúšajte sami na dashboarde!",
};

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
  const [restaurantCreated, setRestaurantCreated] = useState(false);

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
      setRestaurantCreated(true);
      await refetch();
      toast({ title: "Reštaurácia vytvorená!", description: `${name} je pripravená.` });
      setStep(2);
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 0) setStep(1);
    else if (step === 1) handleCreateRestaurant();
    else navigate("/dashboard");
  };

  const currentStepId = STEPS[step]?.id ?? "demo";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-6">
        <LogoBrand size="md" glow />
      </div>

      <div className="w-full max-w-lg space-y-5">
        <OnboardingStepper steps={[...STEPS]} currentStep={step} />

        <OliviaOnboardingTip tip={OLIVIA_TIPS[currentStepId]} step={step} />

        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <StepWelcome />}
              {step === 1 && (
                <StepRestaurant name={name} setName={setName} address={address} setAddress={setAddress} />
              )}
              {step === 2 && <StepAiDemo />}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                disabled={step === 2 && restaurantCreated}
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
                : step === 0
                  ? "Začať"
                  : step === 1
                    ? "Vytvoriť prevádzku"
                    : "Prejsť na Dashboard"
              }
              {!submitting && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-muted-foreground/70">
        Powered by N-[vision] | N-oLiMiT gastro
      </p>
      <OliviaGreeting />
    </div>
  );
}
