import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle } from "lucide-react";
import { Dish } from "@/hooks/useDishes";
import * as XLSX from "xlsx";

interface ImportMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishes: Dish[];
  onApply: (dishIds: string[]) => Promise<void>;
  isApplying: boolean;
}

interface ParsedRow {
  rawName: string;
  matchedDish: Dish | null;
  similarity: number;
}

/** Simple normalized string similarity (Dice coefficient on bigrams) */
function similarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.length < 2 || nb.length < 2) return 0;

  const bigrams = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.substring(i, i + 2);
      set.set(bg, (set.get(bg) ?? 0) + 1);
    }
    return set;
  };

  const bg1 = bigrams(na);
  const bg2 = bigrams(nb);
  let intersection = 0;
  for (const [bg, count] of bg1) {
    intersection += Math.min(count, bg2.get(bg) ?? 0);
  }
  return (2 * intersection) / (na.length - 1 + nb.length - 1);
}

function findBestMatch(name: string, dishes: Dish[]): { dish: Dish | null; score: number } {
  let best: Dish | null = null;
  let bestScore = 0;

  for (const dish of dishes) {
    const score = similarity(name, dish.name);
    if (score > bestScore) {
      bestScore = score;
      best = dish;
    }
  }

  // Also check if rawName is a substring or vice versa
  if (bestScore < 0.4) {
    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const nName = norm(name);
    for (const dish of dishes) {
      const nDish = norm(dish.name);
      if (nDish.includes(nName) || nName.includes(nDish)) {
        const subScore = 0.6;
        if (subScore > bestScore) {
          bestScore = subScore;
          best = dish;
        }
      }
    }
  }

  return { dish: bestScore >= 0.35 ? best : null, score: bestScore };
}

export function ImportMenuDialog({ open, onOpenChange, dishes, onApply, isApplying }: ImportMenuDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRows([]);
    setFileName(null);
  };

  const handleFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const isCSV = file.name.endsWith(".csv");

      let names: string[] = [];

      if (isCSV) {
        const text = await file.text();
        names = text
          .split(/\r?\n/)
          .map((line) => {
            // Take first column (or the whole line)
            const cols = line.split(/[,;\t]/);
            return cols[0]?.trim() ?? "";
          })
          .filter((n) => n.length > 0 && !/^(nazov|name|jedlo|dish|#)/i.test(n));
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

        // Find column with dish names (first non-empty string column, skip header-like rows)
        for (const row of json) {
          const vals = Object.values(row);
          const first = vals[0];
          if (typeof first === "string" && first.trim().length > 0) {
            const trimmed = first.trim();
            if (!/^(nazov|name|jedlo|dish|#|č\.|poradové)/i.test(trimmed)) {
              names.push(trimmed);
            }
          }
        }
      }

      // Match each name against existing dishes
      const parsed: ParsedRow[] = names.map((rawName) => {
        const { dish, score } = findBestMatch(rawName, dishes);
        return { rawName, matchedDish: dish, similarity: score };
      });

      setRows(parsed);
    },
    [dishes]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const toggleRow = (index: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === index ? { ...r, matchedDish: r.matchedDish ? null : findBestMatch(r.rawName, dishes).dish } : r
      )
    );
  };

  const handleManualMatch = (index: number, dish: Dish) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, matchedDish: dish, similarity: 1 } : r)));
  };

  const matchedRows = rows.filter((r) => r.matchedDish !== null);

  const handleApply = async () => {
    const ids = matchedRows.map((r) => r.matchedDish!.id);
    await onApply(ids);
    resetState();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import z Excel / CSV
          </DialogTitle>
          <DialogDescription>
            Nahrajte súbor s názvami jedál. Systém ich automaticky priradí k existujúcim jedlám v databáze.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          /* Drop zone */
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">Pretiahnite súbor sem</p>
            <p className="text-xs text-muted-foreground mt-1">alebo kliknite pre výber (.xlsx, .xls, .csv)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        ) : (
          /* Parsed results */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Súbor: <span className="font-medium text-foreground">{fileName}</span>
              </span>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  {matchedRows.length} priradených
                </Badge>
                {rows.length - matchedRows.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <X className="h-3 w-3" />
                    {rows.length - matchedRows.length} nepriradených
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1.5">
                {rows.map((row, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      row.matchedDish
                        ? "border-primary/30 bg-primary/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    {row.matchedDish ? (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{row.rawName}</p>
                      {row.matchedDish && (
                        <p className="text-xs text-muted-foreground truncate">
                          → {row.matchedDish.name}{" "}
                          <span className="text-muted-foreground/60">
                            ({Math.round(row.similarity * 100)}%)
                          </span>
                        </p>
                      )}
                      {!row.matchedDish && (
                        <p className="text-xs text-destructive/80">Nenájdené v databáze</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => toggleRow(i)}
                    >
                      {row.matchedDish ? "Odstrániť" : "Preskočiť"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                resetState();
              }}
            >
              Nahrať iný súbor
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
            Zrušiť
          </Button>
          {matchedRows.length > 0 && (
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying
                ? "Pridávam…"
                : `Pridať ${matchedRows.length} jedál`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
