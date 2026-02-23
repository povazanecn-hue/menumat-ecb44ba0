import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChefHat, MapPin, Store } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const userRole = (user?.user_metadata?.app_role as string) || "owner";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: name,
        _address: address || null,
        _role: userRole as any,
      });
      if (error) throw error;

      await refetch();
      toast({ title: "Reštaurácia vytvorená!", description: `${name} je pripravená.` });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <ChefHat className="h-8 w-8 text-primary" />
        <h1 className="font-serif text-2xl font-bold tracking-wide text-primary">MENUMAT</h1>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl font-bold text-foreground">Vitajte v MENUMAT</h2>
          <p className="text-muted-foreground text-sm">Nastavte si svoju reštauráciu a začnite tvoriť menu</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 mb-6">
            <Store className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-lg font-semibold text-foreground">Nová reštaurácia</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-foreground">Názov reštaurácie *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Klub Koliesko"
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
                placeholder="Hlavná 1, Bratislava"
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Vytváram..." : "Vytvoriť reštauráciu"}
            </Button>
          </form>
        </div>
      </div>

      <p className="mt-8 text-[10px] text-muted-foreground/50">
        Powered by N-[vision] | N-oLiMiT gastro
      </p>
    </div>
  );
}
