import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface OliviaInsightsProps {
  context?: {
    avgMargin: number;
    noPricedCount: number;
    dishCount: number;
    alerts: { title: string }[];
  };
}

export function OliviaInsights({ context }: OliviaInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setInsights(null);

    try {
      const response = await supabase.functions.invoke("olivia-chat", {
        body: {
          messages: [
            {
              role: "user",
              content:
                "Analyzuj aktuálny stav mojej reštaurácie a daj mi 3 stručné odporúčania na zlepšenie. Zameraj sa na marže, ceny a efektívnosť menu. Buď konkrétna a stručná (max 4-5 viet celkovo).",
            },
          ],
          currentPage: "/dashboard",
          pageContext: context,
        },
      });

      if (response.error) {
        setInsights("Nepodarilo sa získať analýzu. Skúste to neskôr.");
        return;
      }

      // Parse SSE stream
      const text = typeof response.data === "string" ? response.data : new TextDecoder().decode(response.data as ArrayBuffer);
      let result = "";
      for (const line of text.split("\n")) {
        if (line.startsWith("data: ") && line !== "data: [DONE]") {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) result += delta;
          } catch {
            // skip malformed lines
          }
        }
      }
      setInsights(result || "Žiadne odporúčania neboli vygenerované.");
    } catch {
      setInsights("Chyba pri komunikácii s AI. Skúste to neskôr.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Olivia AI</span>
      </div>

      {!insights && !loading && (
        <Button
          variant="outline"
          size="sm"
          onClick={analyze}
          className="w-full border-primary/30 text-primary hover:bg-primary/10"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Analyzovať reštauráciu
        </Button>
      )}

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}

      {insights && (
        <>
          <div className="text-sm prose prose-sm prose-invert max-w-none [&>p]:text-muted-foreground [&>ul]:text-muted-foreground [&>ol]:text-muted-foreground [&_strong]:text-foreground">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={analyze}
            className="text-xs text-muted-foreground"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Znovu analyzovať
          </Button>
        </>
      )}
    </div>
  );
}
