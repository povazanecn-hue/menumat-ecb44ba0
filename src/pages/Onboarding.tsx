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
      const { error } = await supabase.rpc("create_restaurant_with_owner", {
        _name: name,
        _address: address || null,
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
