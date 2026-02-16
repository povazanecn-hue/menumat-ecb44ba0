import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed, Carrot, CalendarDays, FileOutput } from "lucide-react";

const stats = [
  { label: "Jedlá", value: "0", icon: UtensilsCrossed, desc: "v databáze" },
  { label: "Ingrediencie", value: "0", icon: Carrot, desc: "registrovaných" },
  { label: "Dnešné menu", value: "—", icon: CalendarDays, desc: "stav" },
  { label: "Exporty", value: "0", icon: FileOutput, desc: "tento týždeň" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Prehľad vašej reštaurácie</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-serif">{s.value}</div>
              <p className="text-xs text-muted-foreground">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
