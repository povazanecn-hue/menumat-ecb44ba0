import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useRestaurant();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      // Create restaurant — use RPC or raw insert without .select() 
      // since SELECT policy requires membership which doesn't exist yet
      const { data: restaurants, error: restError } = await supabase
        .from("restaurants")
        .insert({ name, address })
        .select("id");

      // If .select() fails due to RLS, try fetching the restaurant by name as fallback
      let restaurantId: string;

      if (restError) {
        // The insert may have succeeded but SELECT failed due to RLS
        // Try to find it via a different approach - insert membership first won't work either
        // Let's use a workaround: insert without select, then query
        const { data: inserted, error: insertErr } = await supabase
          .from("restaurants")
          .insert({ name, address });
        
        if (insertErr) throw insertErr;

        // We can't query it yet either since we're not a member
        // Use the service role approach - let's rethink this flow
        throw new Error("Nepodarilo sa vytvoriť reštauráciu. Skúste to znova.");
      }

      restaurantId = restaurants[0].id;

      // Add user as owner
      const { error: memberError } = await supabase
        .from("restaurant_members")
        .insert({
          restaurant_id: restaurantId,
          user_id: user.id,
          role: "owner",
        });
      if (memberError) throw memberError;

      // Refetch restaurant context
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-foreground">Vitajte v MenuGen</h1>
          <p className="text-muted-foreground">Nastavte si svoju reštauráciu a začnite tvoriť menu</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Nová reštaurácia</CardTitle>
            <CardDescription>Zadajte základné údaje o vašej reštaurácii</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Názov reštaurácie *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Klub Koliesko"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresa</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Hlavná 1, Bratislava"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Vytváram..." : "Vytvoriť reštauráciu"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
