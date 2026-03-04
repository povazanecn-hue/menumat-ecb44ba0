import { format, startOfWeek, addDays, subDays } from "date-fns";
import { sk } from "date-fns/locale";

export interface WeekDay {
  label: string;
  date: string;
  dateObj: Date;
  status: "none" | "draft" | "published";
  itemCount: number;
}

export interface CostTrendPoint {
  date: string;
  label: string;
  avgCost: number;
  avgPrice: number;
  marginPercent: number;
}

export interface DashboardAlert {
  id: string;
  type: "warning" | "info" | "destructive";
  icon: React.ElementType;
  title: string;
  description: string;
  action?: { label: string; path: string };
}

export function getWeekDays(): { days: Date[]; monday: string; friday: string } {
  const now = new Date();
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const days = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  return {
    days,
    monday: format(days[0], "yyyy-MM-dd"),
    friday: format(days[4], "yyyy-MM-dd"),
  };
}

export function buildCostTrend(dishes: any[]): CostTrendPoint[] {
  const now = new Date();
  const points: CostTrendPoint[] = [];

  for (let w = 3; w >= 0; w--) {
    const end = subDays(now, w * 7);
    const start = subDays(end, 6);
    const label = format(start, "d.M.", { locale: sk });
    const dateStr = format(end, "yyyy-MM-dd");

    const eligible = dishes.filter(
      (d: any) => d.created_at && d.created_at.slice(0, 10) <= dateStr
    );

    if (eligible.length === 0) {
      points.push({ date: dateStr, label, avgCost: 0, avgPrice: 0, marginPercent: 0 });
      continue;
    }

    const totalCost = eligible.reduce((s: number, d: any) => s + (d.cost * (1 + (d.vat_rate ?? 20) / 100)), 0);
    const totalPrice = eligible.reduce((s: number, d: any) => s + (d.final_price ?? d.recommended_price ?? 0), 0);
    const avgCost = totalCost / eligible.length;
    const avgPrice = totalPrice / eligible.length;
    const marginPercent = avgCost > 0 ? Math.round(((avgPrice - avgCost) / avgCost) * 100) : 0;

    points.push({
      date: dateStr,
      label,
      avgCost: Math.round(avgCost * 100) / 100,
      avgPrice: Math.round(avgPrice * 100) / 100,
      marginPercent,
    });
  }

  return points;
}

export const FORMAT_LABELS: Record<string, string> = {
  tv: "TV FullHD",
  pdf: "PDF / Tlač",
  excel: "Excel",
  webflow: "Web embed",
};

export const STATUS_CONFIG = {
  none: { color: "hsl(var(--muted))", label: "Žiadne" },
  draft: { color: "hsl(var(--accent))", label: "Rozpracované" },
  published: { color: "hsl(var(--primary))", label: "Publikované" },
};
