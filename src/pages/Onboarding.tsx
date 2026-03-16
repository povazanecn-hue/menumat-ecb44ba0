import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, Sparkles, Palette, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { StepRestaurant } from "@/components/onboarding/StepRestaurant";
import { StepMenuStructure, type MenuSlots } from "@/components/onboarding/StepMenuStructure";
import { StepMenuStyle } from "@/components/onboarding/StepMenuStyle";
import { StepFinish } from "@/components/onboarding/StepFinish";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "info", label: "Základné Údaje", icon: Store },
  { id: "structure", label: "Menu & Špeciality", icon: Sparkles },
  { id: "style", label: "Ceny & Marže", icon: Palette },
  { id: "finish", label: "Dokončenie", icon: Check },
] as const;

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 – Restaurant info
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 – Menu structure
  const [selectedDays, setSelectedDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);
  const [slots, setSlots] = useState<MenuSlots>({ mains: 5, soups: 2, desserts: 2, drinks: 2 });

  // Step 3 – Style
  const [selectedTemplate, setSelectedTemplate] = useState("classic");

  const [restaurantCreated, setRestaurantCreated] = useState(false);
  const userRole = (user?.user_metadata?.app_role as string) || "owner";

  const handleCreateRestaurant = async () => {
    if (!user || !name.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: name,
        _address: address || null,
        _role: userRole as any,
      });
      if (error) throw error;
      setRestaurantCreated(true);
      await refetch();
      toast({ title: "Reštaurácia vytvorená!", description: `${name} je pripravená.` });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return selectedDays.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step === 0) {
      // Create restaurant at step 1 transition
      if (!restaurantCreated) {
        await handleCreateRestaurant();
      }
      setStep(1);
    } else if (step < 3) {
      setStep(step + 1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-1/4 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[700px] rounded-full bg-primary/[0.05] blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg">
        <div className="mb-6">
          <LogoBrand size="md" glow />
        </div>

        <div className="w-full space-y-5">
          <OnboardingStepper steps={[...STEPS]} currentStep={step} />

          {/* Glass card */}
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
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
                  <StepMenuStructure
                    selectedDays={selectedDays}
                    setSelectedDays={setSelectedDays}
                    slots={slots}
                    setSlots={setSlots}
                  />
                )}
                {step === 2 && (
                  <StepMenuStyle
                    selectedTemplate={selectedTemplate}
                    setSelectedTemplate={setSelectedTemplate}
                  />
                )}
                {step === 3 && (
                  <StepFinish
                    restaurantName={name}
                    selectedDays={selectedDays}
                    slots={slots}
                    templateId={selectedTemplate}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/60">
              {step > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step - 1)}
                  className="text-muted-foreground hover:text-foreground"
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
                className="min-w-[140px] rounded-full bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground font-semibold"
              >
                {submitting
                  ? "Spracovávam..."
                  : step === 3
                    ? "Prejsť na Dashboard"
                    : "Pokračovať"
                }
                {!submitting && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground/50">
          Powered by N-[vision] | N-oLiMiT gastro
        </p>
      </div>
    </div>
  );
}
