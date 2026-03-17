import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Store, Sparkles, TrendingUp, ClipboardCheck, Monitor, ChevronRight, ChevronLeft } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { OnboardingStepper } from "@/components/onboarding/OnboardingStepper";
import { StepRestaurant } from "@/components/onboarding/StepRestaurant";
import { StepMenuStructure } from "@/components/onboarding/StepMenuStructure";
import { StepPricing } from "@/components/onboarding/StepPricing";
import { StepSummary } from "@/components/onboarding/StepSummary";
import { StepMenuPreview } from "@/components/onboarding/StepMenuPreview";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "info", label: "Reštaurácia", icon: Store },
  { id: "structure", label: "Menu", icon: Sparkles },
  { id: "pricing", label: "Ceny", icon: TrendingUp },
  { id: "summary", label: "Súhrn", icon: ClipboardCheck },
  { id: "preview", label: "Náhľad", icon: Monitor },
] as const;

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();

  const store = useOnboardingStore();
  const step = store.currentStep;

  const userRole = (user?.user_metadata?.app_role as string) || "owner";

  const handleCreateRestaurant = async () => {
    if (!user || !store.restaurantName.trim()) return;
    store.setSubmitting(true);
    try {
      const { error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: store.restaurantName,
        _address: store.address || null,
        _role: userRole as any,
      });
      if (error) throw error;
      store.setRestaurantCreated(true);
      await refetch();
      toast({ title: "Reštaurácia vytvorená!", description: `${store.restaurantName} je pripravená.` });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      store.setSubmitting(false);
    }
  };

  const saveSettings = async () => {
    if (!store.restaurantCreated) return;
    try {
      // Save wizard defaults + margin + VAT to restaurant settings
      const { data: memberships } = await supabase
        .from("restaurant_members")
        .select("restaurant_id")
        .eq("user_id", user!.id)
        .limit(1);

      if (memberships && memberships.length > 0) {
        const rid = memberships[0].restaurant_id;
        await supabase.from("restaurants").update({
          settings: {
            default_margin: store.defaultMargin,
            vat_rate: store.vatRate,
            non_repeat_days: 14,
            wizard_defaults: {
              slots: store.slots,
              selectedDays: store.selectedDays.map((d) => {
                const map: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
                return map[d] ?? 1;
              }),
            },
          },
        }).eq("id", rid);
      }
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const canNext = () => {
    if (step === 0) return store.restaurantName.trim().length > 0;
    if (step === 1) return store.selectedDays.length > 0;
    return true;
  };

  const handleNext = async () => {
    if (step === 0 && !store.restaurantCreated) {
      await handleCreateRestaurant();
    }
    if (step === 3) {
      // Save settings before preview
      await saveSettings();
    }
    if (step < 4) {
      store.nextStep();
    } else {
      // Final step — go to dashboard
      await saveSettings();
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
                  <StepRestaurant
                    name={store.restaurantName}
                    setName={store.setRestaurantName}
                    address={store.address}
                    setAddress={store.setAddress}
                  />
                )}
                {step === 1 && (
                  <StepMenuStructure
                    selectedDays={store.selectedDays}
                    setSelectedDays={store.setSelectedDays}
                    slots={store.slots}
                    setSlots={store.setSlots}
                  />
                )}
                {step === 2 && (
                  <StepPricing
                    defaultMargin={store.defaultMargin}
                    setDefaultMargin={store.setDefaultMargin}
                    vatRate={store.vatRate}
                    setVatRate={store.setVatRate}
                  />
                )}
                {step === 3 && (
                  <StepSummary
                    restaurantName={store.restaurantName}
                    selectedDays={store.selectedDays}
                    slots={store.slots}
                    defaultMargin={store.defaultMargin}
                    vatRate={store.vatRate}
                    templateId={store.selectedTemplate}
                  />
                )}
                {step === 4 && (
                  <StepMenuPreview
                    selectedDays={store.selectedDays}
                    slots={store.slots}
                    restaurantName={store.restaurantName}
                    previewDayIndex={store.previewDayIndex}
                    setPreviewDayIndex={store.setPreviewDayIndex}
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
                  onClick={() => store.prevStep()}
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
                disabled={!canNext() || store.submitting}
                className="min-w-[140px] rounded-full bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground font-semibold"
              >
                {store.submitting
                  ? "Spracovávam..."
                  : step === 4
                    ? "Prejsť na Dashboard"
                    : "Pokračovať"
                }
                {!store.submitting && <ChevronRight className="h-4 w-4 ml-1" />}
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
