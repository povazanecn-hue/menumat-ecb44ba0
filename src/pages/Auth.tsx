import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { LogoBrand } from "@/components/LogoBrand";
import { cn } from "@/lib/utils";

export default function Auth() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LogoBrand size="sm" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast({
          title: "E-mail odoslaný",
          description: "Skontrolujte si e-mail s odkazom na obnovenie hesla.",
        });
        setMode("login");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          toast({ title: "Chyba", description: "Heslá sa nezhodujú.", variant: "destructive" });
          return;
        }
        if (!acceptTerms) {
          toast({ title: "Chyba", description: "Musíte súhlasiť s podmienkami.", variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, restaurant_name: restaurantName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "Registrácia úspešná",
          description: "Skontrolujte si e-mail pre overenie účtu.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (active: boolean) =>
    cn(
      "flex-1 pb-3 text-center text-sm font-medium transition-all border-b-2",
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground/70"
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[600px] rounded-full bg-primary/[0.06] blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="mb-6">
          <LogoBrand size="md" glow />
        </div>

        <h1 className="font-serif text-2xl font-bold text-foreground mb-6">Vitajte v MENUMAT</h1>

        {/* Glass card */}
        <div className="w-full rounded-xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-2xl shadow-black/40">
          {/* Tabs */}
          {mode !== "forgot" && (
            <div className="flex mb-6">
              <button
                type="button"
                className={tabClass(mode === "login")}
                onClick={() => setMode("login")}
              >
                Prihlásenie
              </button>
              <button
                type="button"
                className={tabClass(mode === "register")}
                onClick={() => setMode("register")}
              >
                Registrácia
              </button>
            </div>
          )}

          {mode === "forgot" && (
            <div className="mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground mb-2">Obnovenie hesla</h2>
              <p className="text-sm text-muted-foreground">
                Zadajte e-mail a pošleme vám odkaz na obnovenie hesla.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="restaurantName" className="text-foreground/80 text-xs">Názov reštaurácie</Label>
                  <Input
                    id="restaurantName"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Moja Reštaurácia"
                    required
                    className="bg-card/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-foreground/80 text-xs">Meno majiteľa</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ján Novák"
                    required
                    className="bg-card/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground/80 text-xs">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vas@email.sk"
                required
                className="bg-card/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-foreground/80 text-xs">Heslo</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-card/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-foreground/80 text-xs">Potvrdenie hesla</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-card/30 border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                >
                  Zabudli ste heslo?
                </button>
              </div>
            )}

            {mode === "register" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">
                  Súhlasím s{" "}
                  <span className="text-primary underline-offset-2 hover:underline cursor-pointer">
                    obchodnými podmienkami
                  </span>
                </span>
              </label>
            )}

            <Button
              type="submit"
              className="w-full rounded-full bg-gradient-to-r from-[hsl(var(--gold-gradient-from))] to-[hsl(var(--gold-gradient-to))] text-primary-foreground font-semibold"
              disabled={submitting}
            >
              {submitting
                ? "Spracovávam..."
                : mode === "login"
                ? "Pokračovať"
                : mode === "register"
                ? "Vytvoriť účet"
                : "Odoslať odkaz"}
            </Button>
          </form>

          {/* Social login */}
          {mode !== "forgot" && (
            <div className="mt-5 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast({ title: "Chyba", description: error.message, variant: "destructive" });
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Pokračovať cez Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-border/60 bg-card/30 hover:bg-card/60 hover:border-primary/30 transition-all"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("apple", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) toast({ title: "Chyba", description: error.message, variant: "destructive" });
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Pokračovať cez Apple
              </Button>
            </div>
          )}

          {/* Bottom link */}
          <div className="mt-5 text-center">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
              >
                Späť na prihlásenie
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {mode === "login" ? (
                  <>Nemáte účet? <span className="text-primary hover:underline underline-offset-2">Zaregistrujte sa ›</span></>
                ) : (
                  <>Máte účet? <span className="text-primary hover:underline underline-offset-2">Prihláste sa ›</span></>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground/50">
          Powered by N-[vision] | N-oLiMiT gastro
        </p>
      </div>
    </div>
  );
}
