import { useState } from "react";
import { format, startOfWeek, addWeeks } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAddProposal } from "@/hooks/useProposals";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { value: "polievka", label: "Polievka" },
  { value: "hlavne_jedlo", label: "Hlavné jedlo" },
  { value: "dezert", label: "Dezert" },
  { value: "predjedlo", label: "Predjedlo" },
  { value: "salat", label: "Šalát" },
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "pasta", label: "Pasta" },
  { value: "ine", label: "Iné" },
];

function getNextWeeks(count: number) {
  const weeks: { value: string; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const monday = startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 });
    weeks.push({
      value: format(monday, "yyyy-MM-dd"),
      label: `Týždeň od ${format(monday, "d.M.yyyy")}`,
    });
  }
  return weeks;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWeek: string;
}

export function AddProposalDialog({ open, onOpenChange, defaultWeek }: Props) {
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState("hlavne_jedlo");
  const [weekStart, setWeekStart] = useState(defaultWeek);
  const [note, setNote] = useState("");
  const addMut = useAddProposal();
  const { toast } = useToast();
  const weeks = getNextWeeks(6);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMut.mutateAsync({
        dish_name: dishName,
        category,
        target_week_start: weekStart,
        note: note || undefined,
      });
      toast({ title: "Návrh pridaný" });
      setDishName("");
      setNote("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Chyba", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nový návrh jedla</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Názov jedla *</Label>
            <Input
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="napr. Hovädzia polievka s haluškami"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Kategória</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Cieľový týždeň *</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {weeks.map((w) => (
                  <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Poznámka</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Voliteľná poznámka..."
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button type="submit" disabled={addMut.isPending}>
              {addMut.isPending ? "Ukladám…" : "Pridať"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
