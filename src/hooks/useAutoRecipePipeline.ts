import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PipelineProgress {
  current: number;
  total: number;
  currentDishName?: string;
}

/**
 * Hook to trigger auto-recipe pipeline for generated menu items.
 * After completion, invalidates shopping-list queries and shows toast with link.
 */
export function useAutoRecipePipeline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);

  const runPipeline = useCallback(
    async (dishIds: string[], dishNames: string[]) => {
      if (dishIds.length === 0) return;
      setRunning(true);
      setProgress({ current: 0, total: dishIds.length });

      let processed = 0;

      for (let i = 0; i < dishIds.length; i++) {
        setProgress({
          current: i + 1,
          total: dishIds.length,
          currentDishName: dishNames[i],
        });

        try {
          const resp = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-recipe-pipeline`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                dish_id: dishIds[i],
                dish_name: dishNames[i],
              }),
            }
          );

          if (resp.ok) {
            processed++;
          }
        } catch {
          // continue with next dish
        }
      }

      // Invalidate all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["shopping-list"] }),
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
        queryClient.invalidateQueries({ queryKey: ["ingredients"] }),
        queryClient.invalidateQueries({ queryKey: ["dishes"] }),
      ]);

      setRunning(false);
      setProgress(null);

      toast({
        title: `✅ Pipeline dokončený (${processed}/${dishIds.length})`,
        description: "Recepty, suroviny a ceny boli spracované. Nákupný zoznam aktualizovaný.",
      });

      // Show follow-up toast with navigation
      setTimeout(() => {
        toast({
          title: "🛒 Nákupný zoznam pripravený",
          description: "Kliknite pre otvorenie nákupného zoznamu.",
        });
      }, 1500);
    },
    [queryClient, toast]
  );

  const openShoppingList = useCallback(() => {
    navigate("/shopping-list");
  }, [navigate]);

  return {
    runPipeline,
    running,
    progress,
    openShoppingList,
  };
}
