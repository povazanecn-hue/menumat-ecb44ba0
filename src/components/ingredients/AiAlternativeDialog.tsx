import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ArrowDown, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alternative {
  name: string;
  estimated_price: number;
  reason: string;
  saving_percent: number;
}

interface AiAlternativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredientName: string;
  currentPrice: number;
  unit: string;
}

export function AiAlternativeDialog({ open, onOpenChange, ingredientName, currentPrice, unit }: AiAlternativeDialogProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAlternatives = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-ingredient-alternative", {
        body: { ingredientName, currentPrice, unit },
      });
      if (error) throw error;
      setAlternatives(data.alternatives ?? []);
      setFetched(true);
    } catch (e: any) {
      toast({ title: "Chyba AI", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !fetched && !loading) {
      fetchAlternatives();
    }
    if (!isOpen) {
      setAlternatives([]);
      setFetched(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Náhrady: {ingredientName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Aktuálna cena: <span className="font-mono font-bold text-foreground">{currentPrice.toFixed(2)}€/{unit}</span>
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">AI hľadá alternatívy...</span>
          </div>
        ) : alternatives.length === 0 && fetched ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Žiadne alternatívy nájdené.</p>
        ) : (
          <div className="space-y-3">
            {alternatives.map((alt, i) => (
              <div key={i} className="rounded-lg border border-border bg-card/40 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{alt.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-foreground">{alt.estimated_price.toFixed(2)}€</span>
                    <span className={cn(
                      "text-xs font-mono font-medium px-2 py-0.5 rounded-full",
                      "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
                    )}>
                      <ArrowDown className="h-3 w-3 inline mr-0.5" />
                      {alt.saving_percent}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{alt.reason}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && fetched && (
          <Button variant="outline" className="w-full" onClick={fetchAlternatives}>
            <Sparkles className="h-4 w-4 mr-1" />
            Generovať znova
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
