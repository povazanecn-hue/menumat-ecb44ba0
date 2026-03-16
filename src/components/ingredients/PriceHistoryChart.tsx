import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface SupplierPrice {
  id: string;
  supplier_name: string;
  price: number;
  is_promo: boolean;
  created_at: string;
  valid_from: string | null;
  valid_to: string | null;
}

interface PriceHistoryChartProps {
  prices: SupplierPrice[];
  unit: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
];

export function PriceHistoryChart({ prices, unit }: PriceHistoryChartProps) {
  const { chartData, suppliers } = useMemo(() => {
    if (!prices.length) return { chartData: [], suppliers: [] };

    const suppliers = [...new Set(prices.map(p => p.supplier_name))];
    const sorted = [...prices].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Group by date (day granularity)
    const dateMap = new Map<string, Record<string, number>>();
    for (const p of sorted) {
      const day = format(new Date(p.created_at), "yyyy-MM-dd");
      if (!dateMap.has(day)) dateMap.set(day, {});
      dateMap.get(day)![p.supplier_name] = p.price;
    }

    // Forward-fill: carry last known price for each supplier
    const allDates = Array.from(dateMap.keys()).sort();
    const lastKnown: Record<string, number> = {};
    const chartData = allDates.map(date => {
      const entry: Record<string, any> = { date: format(new Date(date), "d.M.") };
      const vals = dateMap.get(date)!;
      for (const s of suppliers) {
        if (vals[s] !== undefined) lastKnown[s] = vals[s];
        if (lastKnown[s] !== undefined) entry[s] = lastKnown[s];
      }
      return entry;
    });

    return { chartData, suppliers };
  }, [prices]);

  if (chartData.length < 2) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Nedostatok dát pre graf (min. 2 záznamy).
      </p>
    );
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(v) => `${v}€`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value.toFixed(2)} €/${unit}`, undefined]}
          />
          {suppliers.map((s, i) => (
            <Line
              key={s}
              type="monotone"
              dataKey={s}
              name={s}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
