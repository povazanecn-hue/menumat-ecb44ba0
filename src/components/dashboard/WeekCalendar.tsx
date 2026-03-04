import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format, isSameDay } from "date-fns";
import {
  Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { WeekDay, STATUS_CONFIG } from "./types";

interface WeekCalendarProps {
  weekDays?: WeekDay[];
  isLoading: boolean;
}

export function WeekCalendar({ weekDays, isLoading }: WeekCalendarProps) {
  const navigate = useNavigate();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!weekDays) return null;

  const chartData = weekDays.map((d) => ({
    ...d,
    value: d.status === "none" ? 0.3 : d.itemCount || 1,
    fill: STATUS_CONFIG[d.status].color,
  }));

  const isToday = (d: WeekDay) => isSameDay(d.dateObj, new Date());

  return (
    <div className="space-y-3">
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={32}>
            <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <RTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as WeekDay & { fill: string };
                return (
                  <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
                    <p className="font-medium">{d.date} ({d.label})</p>
                    <p className="text-muted-foreground">
                      {STATUS_CONFIG[d.status].label}
                      {d.itemCount > 0 && ` — ${d.itemCount} jedál`}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.fill}
                  opacity={entry.status === "none" ? 0.3 : 1}
                  stroke={isToday(weekDays[i]) ? "hsl(var(--primary))" : "none"}
                  strokeWidth={isToday(weekDays[i]) ? 2.5 : 0}
                  cursor="pointer"
                  onClick={() => navigate(`/daily-menu?date=${format(weekDays[i].dateObj, "yyyy-MM-dd")}`)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between px-2">
        {weekDays.map((d) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-[10px] leading-none",
              isToday(d) ? "font-bold text-primary" : "text-muted-foreground"
            )}>
              {d.date}
            </span>
            <div className={cn(
              "h-2 w-2 rounded-full",
              d.status === "published" && "bg-primary",
              d.status === "draft" && "bg-accent",
              d.status === "none" && "bg-muted-foreground/20"
            )} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 justify-center text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-primary" /> Publikované
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" /> Rozpracované
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/20" /> Žiadne
        </span>
      </div>
    </div>
  );
}
