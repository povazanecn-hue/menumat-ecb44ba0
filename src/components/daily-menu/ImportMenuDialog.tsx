import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, FileText, Image, Check, X, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Dish } from "@/hooks/useDishes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
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

  if (bestScore < 0.4) {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

const EXCEL_ACCEPT = ".xlsx,.xls,.csv";
const OCR_ACCEPT = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp";

export function ImportMenuDialog({ open, onOpenChange, dishes, onApply, isApplying }: ImportMenuDialogProps) {
  const { toast } = useToast();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [importMode, setImportMode] = useState<"excel" | "ocr">("excel");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRows([]);
    setFileName(null);
    setIsOcrProcessing(false);
  };

  const matchNames = (names: string[]) => {
    const parsed: ParsedRow[] = names.map((rawName) => {
      const { dish, score } = findBestMatch(rawName, dishes);
      return { rawName, matchedDish: dish, similarity: score };
    });
    setRows(parsed);
  };

  // Excel/CSV handler
  const handleExcelFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      const isCSV = file.name.endsWith(".csv");
      let names: string[] = [];

      if (isCSV) {
        const text = await file.text();
        names = text
          .split(/\r?\n/)
          .map((line) => {
            const cols = line.split(/[,;\t]/);
            return cols[0]?.trim() ?? "";
          })
          .filter((n) => n.length > 0 && !/^(nazov|name|jedlo|dish|#)/i.test(n));
      } else {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { header: 1 });

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

      matchNames(names);
    },
    [dishes]
  );

  // OCR handler (PDF, DOCX, images)
  const handleOcrFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setIsOcrProcessing(true);

      try {
        // Convert file to base64
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const { data, error } = await supabase.functions.invoke("ocr-menu-import", {
          body: {
            fileBase64: base64,
            mimeType: file.type || "application/octet-stream",
            fileName: file.name,
          },
        });

        if (error) throw error;

        const dishNames: string[] = data?.dishes || [];
        if (dishNames.length === 0) {
          toast({
            title: "Žiadne jedlá nenájdené",
            description: "AI nerozpoznalo žiadne názvy jedál v dokumente. Skúste iný súbor.",
            variant: "destructive",
          });
          resetState();
          return;
        }

        matchNames(dishNames);
        toast({
          title: `OCR úspešný`,
          description: `AI rozpoznalo ${dishNames.length} jedál z dokumentu.`,
        });
      } catch (e: any) {
        console.error("OCR error:", e);
        toast({
          title: "Chyba pri OCR spracovaní",
          description: e.message || "Nepodarilo sa spracovať súbor",
          variant: "destructive",
        });
        resetState();
      } finally {
        setIsOcrProcessing(false);
      }
    },
    [dishes, toast]
  );

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop() || "";
      if (["xlsx", "xls", "csv"].includes(ext)) {
        handleExcelFile(file);
      } else {
        handleOcrFile(file);
      }
    },
    [handleExcelFile, handleOcrFile]
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

  const matchedRows = rows.filter((r) => r.matchedDish !== null);

  const handleApply = async () => {
    const ids = matchedRows.map((r) => r.matchedDish!.id);
    await onApply(ids);
    resetState();
    onOpenChange(false);
  };

  const currentAccept = importMode === "excel" ? EXCEL_ACCEPT : OCR_ACCEPT;

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
            Import menu
          </DialogTitle>
          <DialogDescription>
            Importujte jedlá z Excel/CSV alebo naskenujte PDF/obrázok pomocou AI OCR.
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 && !isOcrProcessing ? (
          <div className="space-y-4">
            {/* Mode tabs */}
            <Tabs value={importMode} onValueChange={(v) => setImportMode(v as "excel" | "ocr")}>
              <TabsList className="w-full">
                <TabsTrigger value="excel" className="flex-1 gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel / CSV
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1 gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  PDF / OCR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="excel" className="mt-3">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Pretiahnite Excel/CSV súbor sem</p>
                  <p className="text-xs text-muted-foreground mt-1">alebo kliknite pre výber (.xlsx, .xls, .csv)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={EXCEL_ACCEPT}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ocr" className="mt-3">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Pretiahnite PDF, Word alebo obrázok</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI automaticky rozpozná názvy jedál (.pdf, .docx, .jpg, .png)
                  </p>
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI OCR
                  </Badge>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={OCR_ACCEPT}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : isOcrProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">AI spracováva dokument...</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
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
              onClick={() => resetState()}
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
              {isApplying ? "Pridávam…" : `Pridať ${matchedRows.length} jedál`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
