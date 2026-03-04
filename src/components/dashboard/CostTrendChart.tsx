import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis,
  Tooltip as RTooltip, Line,
} from "recharts";
import { CostTrendPoint } from "./types";

interface CostTrendChartProps {
  data?: CostTrendPoint[];
  isLoading: boolean;
}

export function CostTrendChart({ data, isLoading }: CostTrendChartProps) {
  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!data || data.every((d) => d.avgCost === 0 && d.avgPrice === 0)) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Nedostatok dát pre zobrazenie trendu.
      </div>
    );
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
          <RTooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as CostTrendPoint;
              return (
                <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md space-y-1">
                  <p className="font-medium">Týždeň od {d.label}</p>
                  <p>Priem. náklady: <strong>{d.avgCost.toFixed(2)} €</strong></p>
                  <p>Priem. cena: <strong>{d.avgPrice.toFixed(2)} €</strong></p>
                  <p>Marža: <strong>{d.marginPercent}%</strong></p>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="avgCost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Náklady" />
          <Line type="monotone" dataKey="avgPrice" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Cena" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
