import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface PopularDishesProps {
  dishes?: { id: string; name: string; count: number }[];
  isLoading: boolean;
}

export function PopularDishes({ dishes, isLoading }: PopularDishesProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!dishes || dishes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Zatiaľ žiadne dáta o používaní jedál.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {dishes.map((dish, idx) => (
        <div
          key={dish.id}
          className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2 hover:border-primary/20 transition-colors"
        >
          <span className="font-mono text-xs text-muted-foreground w-5 text-right">
            {idx + 1}.
          </span>
          <span className="flex-1 text-sm truncate">{dish.name}</span>
          <Badge variant="secondary" className="font-mono text-xs gap-1">
            <Flame className="h-3 w-3 text-primary" />
            {dish.count}×
          </Badge>
        </div>
      ))}
    </div>
  );
}
