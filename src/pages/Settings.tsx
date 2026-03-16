import { useState, useEffect } from "react";
import { useRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { GlassPanel, GlassRow } from "@/components/ui/glass-panel";
import { Skeleton } from "@/components/ui/skeleton";

interface RestaurantSettings {
  default_margin: number;
  vat_rate: number;
  non_repeat_days: number;
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
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nastavenia"
        subtitle="Prevádzka, role, integrácie"
        actions={[
          { label: "Audit log", onClick: () => {}, variant: "outline" },
          { label: "Uložiť zmeny", onClick: handleSave, variant: "primary" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Prevádzkové dáta — left 3 cols */}
        <GlassPanel title="Prevádzkové dáta" className="lg:col-span-3">
          <div className="space-y-2">
            <GlassRow label="Názov prevádzky" value={name || "—"} />
            <GlassRow label="DPH" value={`${settings.vat_rate}%`} />
            <GlassRow label="Mena" value="EUR" />
            <GlassRow label="Jazyk" value="SK" />
          </div>
        </GlassPanel>

        {/* Používatelia a práva — right 2 cols */}
        <GlassPanel title="Používatelia a práva" className="lg:col-span-2">
          <div className="space-y-2">
            <GlassRow label="Olivia AI asistent" badge="system" badgeStyle="bg-muted text-muted-foreground" />
            <GlassRow label="Manager" badge="full access" badgeStyle="bg-muted text-muted-foreground" />
            <GlassRow label="Kuchár" badge="menu + recepty" badgeStyle="bg-muted text-muted-foreground" />
            <GlassRow label="Obsluha" badge="read only" badgeStyle="bg-muted text-muted-foreground" />
          </div>
        </GlassPanel>
      </div>

      {/* Integrácie */}
      <GlassPanel title="Integrácie">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <GlassRow label="Cloudinary AI" badge="connected" badgeStyle="bg-primary/20 text-primary" />
          <GlassRow label="Import z Word" badge="enabled" badgeStyle="bg-primary/20 text-primary" />
        </div>
      </GlassPanel>
    </div>
  );
}
