import { useState, useMemo } from "react";
import { format, startOfWeek, addWeeks, parseISO } from "date-fns";
import { sk } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useProposals, useAssignProposal, useMarkProposalUsed } from "@/hooks/useProposals";
import { useCanManageMenu } from "@/hooks/useUserRole";
import { AddProposalDialog } from "@/components/nastenka/AddProposalDialog";
import { ClipboardCheck, Plus, Calendar, Archive } from "lucide-react";

const WEEKDAYS = ["Po", "Ut", "St", "Št", "Pi"];

function getWeekMonday(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function getWeekDates(mondayStr: string): string[] {
  const monday = parseISO(mondayStr);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return format(d, "yyyy-MM-dd");
  });
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  pending: { label: "Čakajúce", variant: "secondary" },
  planned: { label: "Naplánované", variant: "default" },
  used: { label: "Použité", variant: "outline" },
};

export default function Nastenka() {
  const canManage = useCanManageMenu();
  const thisMonday = getWeekMonday(new Date());
  const nextMonday = getWeekMonday(addWeeks(new Date(), 1));
  const [selectedWeek, setSelectedWeek] = useState(nextMonday);
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState("active");

  const { data: proposals = [], isLoading } = useProposals();
  const assignMut = useAssignProposal();
  const markUsedMut = useMarkProposalUsed();

  const [selectedDays, setSelectedDays] = useState<Record<string, string[]>>({});

  const activeProposals = useMemo(
    () => proposals.filter((p) => p.status !== "used"),
    [proposals]
  );
  const historyProposals = useMemo(
    () => proposals.filter((p) => p.status === "used"),
    [proposals]
  );

  const grouped = useMemo(() => {
    const list = tab === "active" ? activeProposals : historyProposals;
    const map: Record<string, typeof list> = {};
    list.forEach((p) => {
      const key = p.target_week_start;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [tab, activeProposals, historyProposals]);

  const toggleDay = (proposalId: string, date: string) => {
    setSelectedDays((prev) => {
      const current = prev[proposalId] || [];
      return {
        ...prev,
        [proposalId]: current.includes(date)
          ? current.filter((d) => d !== date)
          : [...current, date],
      };
    });
  };

  const handleAssign = async (proposalId: string) => {
    const dates = selectedDays[proposalId] || [];
    if (!dates.length) return;
    await assignMut.mutateAsync({ proposal_id: proposalId, dates });
    setSelectedDays((prev) => {
      const next = { ...prev };
      delete next[proposalId];
      return next;
    });
  };

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      polievka: "Polievka",
      hlavne_jedlo: "Hlavné",
      dezert: "Dezert",
      predjedlo: "Predjedlo",
      salat: "Šalát",
      pizza: "Pizza",
      burger: "Burger",
      pasta: "Pasta",
      napoj: "Nápoj",
      ine: "Iné",
    };
    return map[cat] || cat;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            Nástenka
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Návrhy jedál pre nadchádzajúce týždne
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Pridať návrh
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            Aktívne ({activeProposals.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Archive className="h-4 w-4" />
            História ({historyProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-6">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Načítavam…</p>
          ) : grouped.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Žiadne aktívne návrhy</p>
          ) : (
            grouped.map(([weekStart, items]) => (
              <Card key={weekStart}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Týždeň od {format(parseISO(weekStart), "d. MMMM yyyy", { locale: sk })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((p) => {
                    const st = STATUS_MAP[p.status] || STATUS_MAP.pending;
                    const weekDates = getWeekDates(p.target_week_start);
                    const selected = selectedDays[p.id] || [];

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-2 rounded-lg border border-border p-3 bg-secondary/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{p.dish_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {categoryLabel(p.category)}
                            </Badge>
                            <Badge variant={st.variant} className="text-xs">
                              {st.label}
                            </Badge>
                          </div>
                          {canManage && p.status === "planned" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markUsedMut.mutate(p.id)}
                              disabled={markUsedMut.isPending}
                            >
                              Označiť použité
                            </Button>
                          )}
                        </div>

                        {p.note && (
                          <p className="text-xs text-muted-foreground">{p.note}</p>
                        )}

                        {canManage && p.status === "pending" && (
                          <div className="flex items-center gap-3 mt-1">
                            {weekDates.map((date, i) => (
                              <label
                                key={date}
                                className="flex items-center gap-1 text-xs cursor-pointer"
                              >
                                <Checkbox
                                  checked={selected.includes(date)}
                                  onCheckedChange={() => toggleDay(p.id, date)}
                                />
                                {WEEKDAYS[i]}
                              </label>
                            ))}
                            <Button
                              size="sm"
                              disabled={!selected.length || assignMut.isPending}
                              onClick={() => handleAssign(p.id)}
                            >
                              Naplánovať
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-6">
          {grouped.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Žiadna história</p>
          ) : (
            grouped.map(([weekStart, items]) => (
              <Card key={weekStart}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Týždeň od {format(parseISO(weekStart), "d. MMMM yyyy", { locale: sk })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{p.dish_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabel(p.category)}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs">Použité</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AddProposalDialog open={showAdd} onOpenChange={setShowAdd} defaultWeek={selectedWeek} />
    </div>
  );
}
