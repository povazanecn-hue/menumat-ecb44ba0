import { useState, useEffect } from "react";
import { useRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Store, Percent, CalendarOff, Receipt } from "lucide-react";
import { MemberManagement } from "@/components/settings/MemberManagement";

interface RestaurantSettings {
  default_margin: number;
  vat_rate: number;
  non_repeat_days: number;
  primary_template?: string;
  secondary_template?: string;
}

export default function Settings() {
  const { restaurantId, restaurantName, refetch } = useRestaurant();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [settings, setSettings] = useState<RestaurantSettings>({
    default_margin: 100,
    vat_rate: 20,
    non_repeat_days: 14,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("name, address, settings")
        .eq("id", restaurantId)
        .single();
      if (data) {
        setName(data.name);
        setAddress(data.address ?? "");
        const s = (data.settings as Record<string, unknown>) ?? {};
        setSettings({
          default_margin: (s.default_margin as number) ?? 100,
          vat_rate: (s.vat_rate as number) ?? 20,
          non_repeat_days: (s.non_repeat_days as number) ?? 14,
          primary_template: s.primary_template as string | undefined,
          secondary_template: s.secondary_template as string | undefined,
        });
      }
      setLoading(false);
    })();
  }, [restaurantId]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({
        name,
        address: address || null,
        settings: settings as unknown as import("@/integrations/supabase/types").Json,
      })
      .eq("id", restaurantId);
    setSaving(false);

    if (error) {
      toast({ title: "Chyba", description: "Nepodarilo sa uložiť nastavenia.", variant: "destructive" });
    } else {
      toast({ title: "Uložené", description: "Nastavenia boli úspešne uložené." });
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Načítavam nastavenia…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Nastavenia</h1>
        <p className="text-muted-foreground text-sm mt-1">Profil reštaurácie a predvolené hodnoty</p>
      </div>

      {/* Restaurant Profile */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Store className="h-5 w-5 text-primary" />
            Profil reštaurácie
          </CardTitle>
          <CardDescription>Základné údaje o vašej prevádzke</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Názov reštaurácie</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Klub Koliesko" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresa</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Hlavná 1, Bratislava" />
          </div>
        </CardContent>
      </Card>

      {/* Pricing Defaults */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Percent className="h-5 w-5 text-primary" />
            Cenová politika
          </CardTitle>
          <CardDescription>Predvolená marža a DPH sadzba</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Predvolená marža</Label>
              <span className="text-sm font-semibold text-primary tabular-nums">{settings.default_margin}%</span>
            </div>
            <Slider
              min={50}
              max={300}
              step={5}
              value={[settings.default_margin]}
              onValueChange={([v]) => setSettings((s) => ({ ...s, default_margin: v }))}
            />
            <p className="text-xs text-muted-foreground">
              Rozsah 50 – 300 %. Odporúčaná cena = náklady × (1 + marža/100).
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="vat">
                <span className="flex items-center gap-1.5">
                  <Receipt className="h-4 w-4" />
                  Predvolená DPH sadzba
                </span>
              </Label>
              <span className="text-sm font-semibold text-primary tabular-nums">{settings.vat_rate}%</span>
            </div>
            <div className="flex gap-2">
              {[10, 20, 23].map((rate) => (
                <Button
                  key={rate}
                  size="sm"
                  variant={settings.vat_rate === rate ? "default" : "outline"}
                  onClick={() => setSettings((s) => ({ ...s, vat_rate: rate }))}
                >
                  {rate}%
                </Button>
              ))}
              <Input
                id="vat"
                type="number"
                min={0}
                max={100}
                className="w-20"
                value={settings.vat_rate}
                onChange={(e) => setSettings((s) => ({ ...s, vat_rate: Number(e.target.value) }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Non-repeat rule */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarOff className="h-5 w-5 text-primary" />
            Pravidlo neopakovania
          </CardTitle>
          <CardDescription>Minimálny počet dní, kým sa jedlo môže zopakovať v dennom menu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Počet dní</Label>
            <span className="text-sm font-semibold text-primary tabular-nums">{settings.non_repeat_days} dní</span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[settings.non_repeat_days]}
            onValueChange={([v]) => setSettings((s) => ({ ...s, non_repeat_days: v }))}
          />
          <p className="text-xs text-muted-foreground">
            Predvolená hodnota 14 dní. Generátor menu a výber jedál bude upozorňovať na porušenie.
          </p>
        </CardContent>
      </Card>

      {/* Member Management (owner only) */}
      <MemberManagement />

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Ukladám…" : "Uložiť nastavenia"}
        </Button>
      </div>
    </div>
  );
}
