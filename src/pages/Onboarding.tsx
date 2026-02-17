import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useToast } from "@/hooks/use-toast";
import { LogoBrand } from "@/components/LogoBrand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { DISH_CATEGORIES } from "@/lib/constants";
import { getVatForCategory } from "@/lib/unitNormalization";
import kolieskoKresba from "@/assets/textures/koliesko-bg.jpg";
import {
  Store, MapPin, ChefHat, CalendarDays, FileOutput,
  ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2,
  Mic, MicOff, Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type DishCategory = Database["public"]["Enums"]["dish_category"];

const STEPS = [
  { id: "restaurant", title: "Reštaurácia", icon: Store },
  { id: "dish", title: "Prvé jedlo", icon: ChefHat },
  { id: "menu", title: "Prvé menu", icon: CalendarDays },
  { id: "export", title: "Prvý export", icon: FileOutput },
] as const;

type StepId = typeof STEPS[number]["id"];

// AI tip fetcher (non-streaming, fast)
async function fetchAiTip(stepId: StepId, context: string): Promise<string> {
  try {
    const resp = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/olivia-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Onboarding krok "${stepId}". Kontext: ${context}. Daj krátky tip (max 2 vety, po slovensky, priateľsky).`,
            },
          ],
        }),
      }
    );
    if (!resp.ok || !resp.body) return "";
    // Parse SSE stream quickly
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, idx);
        buf = buf.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const j = line.slice(6).trim();
        if (j === "[DONE]") break;
        try {
          const p = JSON.parse(j);
          const c = p.choices?.[0]?.delta?.content;
          if (c) result += c;
        } catch { break; }
      }
    }
    return result;
  } catch {
    return "";
  }
}

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch, restaurantId } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [aiTip, setAiTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);

  // Step 1: Restaurant
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submittingRestaurant, setSubmittingRestaurant] = useState(false);
  const [restaurantCreated, setRestaurantCreated] = useState(false);
  const [createdRestaurantId, setCreatedRestaurantId] = useState<string | null>(null);

  // Step 2: First dish
  const [dishName, setDishName] = useState("");
  const [dishCategory, setDishCategory] = useState<DishCategory>("hlavne_jedlo");
  const [dishPrice, setDishPrice] = useState("");
  const [submittingDish, setSubmittingDish] = useState(false);
  const [dishCreated, setDishCreated] = useState(false);

  // Step 3: Menu
  const [menuCreated, setMenuCreated] = useState(false);
  const [submittingMenu, setSubmittingMenu] = useState(false);

  // Voice (ElevenLabs check)
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    // Check for microphone API availability
    setVoiceSupported(!!navigator.mediaDevices?.getUserMedia);
  }, []);

  const userRole = (user?.user_metadata?.app_role as string) || "owner";

  // Fetch AI tip for current step
  const loadTip = useCallback(async (stepIdx: number) => {
    setTipLoading(true);
    setAiTip("");
    const contexts: Record<number, string> = {
      0: `Nový používateľ "${user?.email}" vytvára reštauráciu.`,
      1: `Reštaurácia "${name}" vytvorená. Teraz pridáva prvé jedlo.`,
      2: `Jedlo "${dishName}" pridané. Teraz vytvára denné menu na dnes.`,
      3: `Menu vytvorené. Teraz exportuje prvýkrát (TV/PDF/Excel).`,
    };
    const tip = await fetchAiTip(STEPS[stepIdx].id, contexts[stepIdx] || "");
    setAiTip(tip);
    setTipLoading(false);
  }, [user, name, dishName]);

  useEffect(() => {
    loadTip(step);
  }, [step]);

  // Step 1: Create restaurant
  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingRestaurant(true);
    try {
      const { data, error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: name,
        _address: address || null,
        _role: userRole as any,
      });
      if (error) throw error;
      await refetch();
      setCreatedRestaurantId(data as string);
      setRestaurantCreated(true);
      toast({ title: "✅ Reštaurácia vytvorená!" });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingRestaurant(false);
    }
  };

  // Step 2: Create first dish
  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const rid = createdRestaurantId || restaurantId;
    if (!rid) return;
    setSubmittingDish(true);
    try {
      const { error } = await supabase.from("dishes").insert({
        name: dishName,
        category: dishCategory,
        restaurant_id: rid,
        vat_rate: getVatForCategory(dishCategory),
        final_price: dishPrice ? Number(dishPrice) : null,
        is_daily_menu: true,
      });
      if (error) throw error;
      setDishCreated(true);
      toast({ title: "✅ Jedlo pridané!" });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingDish(false);
    }
  };

  // Step 3: Create today's menu
  const handleCreateMenu = async () => {
    const rid = createdRestaurantId || restaurantId;
    if (!rid) return;
    setSubmittingMenu(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase.from("menus").insert({
        menu_date: today,
        restaurant_id: rid,
        status: "draft",
      });
      if (error) throw error;
      setMenuCreated(true);
      toast({ title: "✅ Denné menu vytvorené!" });
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmittingMenu(false);
    }
  };

  // Step 4: Go to exports
  const handleGoToExports = () => {
    navigate("/exports");
  };

  const handleSkipToApp = () => {
    navigate("/dashboard");
  };

  const canGoNext = () => {
    if (step === 0) return restaurantCreated;
    if (step === 1) return dishCreated;
    if (step === 2) return menuCreated;
    return true;
  };

  const progress = ((step + (canGoNext() ? 1 : 0)) / STEPS.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const [slideDir, setSlideDir] = useState(1);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setSlideDir(1);
      setStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (step > 0) {
      setSlideDir(-1);
      setStep((s) => s - 1);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat opacity-[0.25]"
        style={{ backgroundImage: `url(${kolieskoKresba})` }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-background/40 via-background/70 to-background" />

      <div className="relative z-[1] mb-6">
        <LogoBrand size="xl" showSubtitle />
      </div>

      <div className="relative z-[1] w-full max-w-lg space-y-5">
        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step || (i === step && canGoNext());
            const active = i === step;
            return (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className={`flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : active
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px w-6 ${done ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        <Progress value={progress} className="h-1.5" />

        {/* AI Tip */}
        <AnimatePresence mode="wait">
          {(aiTip || tipLoading) && (
            <motion.div
              key={`tip-${step}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3"
            >
              <Bot className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-foreground/80">
                {tipLoading ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Olivia premýšľa...
                  </span>
                ) : (
                  aiTip
                )}
              </div>
              <Sparkles className="h-4 w-4 text-primary/40 shrink-0" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step content */}
        <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md p-6 shadow-2xl shadow-black/40 overflow-hidden min-h-[260px]">
          <AnimatePresence mode="wait" custom={slideDir}>
            <motion.div
              key={step}
              custom={slideDir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              {/* ===== STEP 0: Restaurant ===== */}
              {step === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Store className="h-5 w-5 text-primary" />
                    <h3 className="font-serif text-lg font-semibold">Nová reštaurácia</h3>
                    <Badge variant="secondary" className="text-[10px]">Krok 1/4</Badge>
                  </div>
                  {restaurantCreated ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                      <p className="font-serif text-lg font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">Reštaurácia je pripravená!</p>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateRestaurant} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="r-name">Názov reštaurácie *</Label>
                        <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Klub Koliesko" required />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="r-addr" className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Adresa
                        </Label>
                        <Input id="r-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Hlavná 1, Bratislava" />
                      </div>
                      <Button type="submit" className="w-full bg-gold-gradient" disabled={submittingRestaurant}>
                        {submittingRestaurant ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Vytváram...</> : "Vytvoriť reštauráciu"}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* ===== STEP 1: First dish ===== */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <h3 className="font-serif text-lg font-semibold">Prvé jedlo</h3>
                    <Badge variant="secondary" className="text-[10px]">Krok 2/4</Badge>
                  </div>
                  {dishCreated ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                      <p className="font-serif text-lg font-semibold">{dishName}</p>
                      <p className="text-sm text-muted-foreground">
                        {DISH_CATEGORIES[dishCategory]} • {dishPrice ? `${dishPrice} €` : "Cena neskôr"}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateDish} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="d-name">Názov jedla *</Label>
                        <Input id="d-name" value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="Hovädzí guláš" required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Kategória</Label>
                          <Select value={dishCategory} onValueChange={(v) => setDishCategory(v as DishCategory)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(DISH_CATEGORIES).map(([k, l]) => (
                                <SelectItem key={k} value={k}>{l}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="d-price">Cena (€)</Label>
                          <Input id="d-price" type="number" step="0.01" min={0} value={dishPrice} onChange={(e) => setDishPrice(e.target.value)} placeholder="6.50" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full bg-gold-gradient" disabled={submittingDish}>
                        {submittingDish ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Pridávam...</> : "Pridať jedlo"}
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* ===== STEP 2: First menu ===== */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    <h3 className="font-serif text-lg font-semibold">Prvé denné menu</h3>
                    <Badge variant="secondary" className="text-[10px]">Krok 3/4</Badge>
                  </div>
                  {menuCreated ? (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <CheckCircle2 className="h-12 w-12 text-primary" />
                      <p className="font-serif text-lg font-semibold">Menu na dnes vytvorené</p>
                      <p className="text-sm text-muted-foreground">
                        Jedlá môžete pridať neskôr v sekcii Denné menu.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-2">
                      <p className="text-sm text-muted-foreground">
                        Vytvorte prvý draft denného menu na dnešok. Jedlá a polievky pridáte neskôr
                        cez AI generátor alebo manuálne.
                      </p>
                      <div className="rounded-lg border border-border bg-secondary/30 p-4 text-center">
                        <p className="text-sm font-medium text-foreground mb-1">
                          📅 {new Date().toLocaleDateString("sk-SK", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-xs text-muted-foreground">Draft menu</p>
                      </div>
                      <Button onClick={handleCreateMenu} className="w-full bg-gold-gradient" disabled={submittingMenu}>
                        {submittingMenu ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Vytváram...</> : "Vytvoriť menu na dnes"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ===== STEP 3: Export ===== */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileOutput className="h-5 w-5 text-primary" />
                    <h3 className="font-serif text-lg font-semibold">Prvý export</h3>
                    <Badge variant="secondary" className="text-[10px]">Krok 4/4</Badge>
                  </div>
                  <div className="space-y-4 py-2">
                    <p className="text-sm text-muted-foreground">
                      Výborne! 🎉 Vaša reštaurácia je nastavená. Teraz môžete exportovať menu:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "📺 TV FullHD", desc: "1920×1080 pre obrazovky" },
                        { label: "🖨️ PDF / Tlač", desc: "Pre vytlačenie" },
                        { label: "📊 Excel", desc: "Pre kuchyňu" },
                        { label: "🌐 Web embed", desc: "Pre webovú stránku" },
                      ].map((item) => (
                        <div key={item.label} className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleGoToExports} className="flex-1 bg-gold-gradient">
                        Otvoriť Export centrum
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                      <Button variant="outline" onClick={handleSkipToApp} className="flex-1">
                        Ísť na Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation + voice */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            disabled={step === 0}
            onClick={goBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Späť
          </Button>

          <div className="flex items-center gap-2">
            {voiceSupported && (
              <Button
                variant="outline"
                size="icon"
                className={`h-8 w-8 ${voiceActive ? "border-primary text-primary" : "text-muted-foreground"}`}
                onClick={() => setVoiceActive(!voiceActive)}
                title={voiceActive ? "Vypnúť hlas" : "Zapnúť hlasové ovládanie"}
              >
                {voiceActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSkipToApp} className="text-muted-foreground text-xs">
              Preskočiť
            </Button>
          </div>

          {step < STEPS.length - 1 && (
            <Button
              size="sm"
              disabled={!canGoNext()}
              onClick={goNext}
              className="bg-gold-gradient"
            >
              Ďalej <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === STEPS.length - 1 && <div />}
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50">
          Powered by <span className="font-semibold text-primary/70">N-[vision]</span> | <span className="font-semibold text-primary/70">N-oLiMiT gastro</span>
        </p>
      </div>
    </div>
  );
}
