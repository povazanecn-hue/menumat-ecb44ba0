import { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, FileSpreadsheet, FileText, Image, Check, X, AlertTriangle, Loader2, Sparkles, Calendar, Camera, Wand2, RefreshCw, ChevronDown, Eye } from "lucide-react";
import { Dish } from "@/hooks/useDishes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCloudinary } from "@/hooks/useCloudinary";
import * as XLSX from "xlsx";
import { parseKolieskoExcel, parseKolieskoCSV, type KolieskoDay, type KolieskoMenuItem } from "@/lib/kolieskoImport";

interface ImportMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishes: Dish[];
  onApply: (dishIds: string[]) => Promise<void>;
  /** New: apply structured weekly import with per-day items */
  onApplyWeekly?: (days: ImportDayResult[]) => Promise<void>;
  isApplying: boolean;
}

export interface ImportDayResult {
  dayName: string;
  dateStr: string;
  items: {
    rawName: string;
    matchedDish: Dish | null;
    similarity: number;
    slot: string;
    grammage: string;
    price: number | null;
    allergens: number[];
  }[];
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

export function ImportMenuDialog({ open, onOpenChange, dishes, onApply, onApplyWeekly, isApplying }: ImportMenuDialogProps) {
  const { toast } = useToast();
  const cloudinary = useCloudinary();
  // Simple mode (flat list)
  const [rows, setRows] = useState<ParsedRow[]>([]);
  // Koliesko mode (structured weekly)
  const [weeklyData, setWeeklyData] = useState<ImportDayResult[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgressMessage, setOcrProgressMessage] = useState<string>("AI spracováva dokument...");
  const [importMode, setImportMode] = useState<"koliesko" | "excel" | "ocr">("koliesko");
  const [useEnhance, setUseEnhance] = useState(true);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);
  const [pendingOcrData, setPendingOcrData] = useState<{ base64: string; mimeType: string; fileName: string } | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showOcrComparison, setShowOcrComparison] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setRows([]);
    setWeeklyData(null);
    setFileName(null);
    setIsOcrProcessing(false);
    setOcrProgressMessage("AI spracováva dokument...");
    setOriginalPreview(null);
    setEnhancedPreview(null);
    setPendingOcrData(null);
    setRawOcrText(null);
    setShowOcrComparison(false);
  };

  const matchNames = (names: string[]) => {
    const parsed: ParsedRow[] = names.map((rawName) => {
      const { dish, score } = findBestMatch(rawName, dishes);
      return { rawName, matchedDish: dish, similarity: score };
    });
    setRows(parsed);
  };

  // Koliesko structured import
  const handleKolieskoFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      try {
        let parsedDays: KolieskoDay[];
        if (file.name.endsWith(".csv")) {
          const text = await file.text();
          parsedDays = parseKolieskoCSV(text);
        } else {
          const buffer = await file.arrayBuffer();
          parsedDays = parseKolieskoExcel(buffer);
        }

        if (parsedDays.length === 0) {
          toast({ title: "Nerozpoznaný formát", description: "Súbor neobsahuje rozpoznateľnú štruktúru dní.", variant: "destructive" });
          resetState();
          return;
        }

        // Map each day's items to dishes
        const results: ImportDayResult[] = parsedDays.map((day) => {
          const allItems = [
            ...(day.soup ? [day.soup] : []),
            ...day.items,
          ];

          return {
            dayName: day.dayName,
            dateStr: day.dateStr,
            items: allItems.map((item) => {
              const { dish, score } = findBestMatch(item.name, dishes);
              return {
                rawName: item.name,
                matchedDish: dish,
                similarity: score,
                slot: item.slot,
                grammage: item.grammage,
                price: item.price,
                allergens: item.allergens,
              };
            }).filter(i => i.rawName.length > 0),
          };
        });

        setWeeklyData(results);

        const totalItems = results.reduce((s, d) => s + d.items.length, 0);
        const matched = results.reduce((s, d) => s + d.items.filter(i => i.matchedDish).length, 0);
        toast({
          title: `${parsedDays.length} dní rozpoznaných`,
          description: `${matched}/${totalItems} jedál priradených z databázy.`,
        });
      } catch (e: any) {
        console.error("Koliesko parse error:", e);
        toast({ title: "Chyba pri spracovaní", description: e.message, variant: "destructive" });
        resetState();
      }
    },
    [dishes, toast]
  );

  // Simple Excel/CSV handler
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

  // OCR handler — uses structured mode to extract weekly data with categories
  const handleOcrFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setIsOcrProcessing(true);

      try {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const CHUNK = 8192;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
          binary += String.fromCharCode(...slice);
        }
        const base64 = btoa(binary);

        const isImage = /^image\/(jpeg|jpg|png|webp)/.test(file.type);
        let enhancedUrl: string | null = null;

        // Step 1: Cloudinary enhance for images
        if (useEnhance && isImage) {
          setOcrProgressMessage("Vylepšujem kvalitu fotky (Cloudinary)...");
          const dataUrl = `data:${file.type};base64,${base64}`;
          setOriginalPreview(dataUrl);
          try {
            const result = await cloudinary.enhance(dataUrl);
            if (result?.url) {
              enhancedUrl = result.url;
              setEnhancedPreview(enhancedUrl);
              // Pause – show preview and wait for user to continue
              setPendingOcrData({ base64, mimeType: file.type, fileName: file.name });
              setIsOcrProcessing(false);
              return;
            }
          } catch (enhanceErr) {
            console.warn("Cloudinary enhance failed, falling back to direct OCR:", enhanceErr);
          }
        } else if (isImage) {
          setOriginalPreview(`data:${file.type};base64,${base64}`);
        }

        // Step 2: AI OCR (direct, no enhance or enhance failed)
        setOcrProgressMessage("AI rozpoznáva jedlá...");

        const ocrBody: Record<string, any> = {
          mimeType: file.type || "application/octet-stream",
          fileName: file.name,
          mode: "structured",
        };

        if (enhancedUrl) {
          ocrBody.imageUrl = enhancedUrl;
        } else {
          ocrBody.fileBase64 = base64;
        }

        const { data, error } = await supabase.functions.invoke("ocr-menu-import", {
          body: ocrBody,
        });

        if (error) throw error;
        if (data?.error) {
          toast({ title: "Chyba OCR", description: data.error, variant: "destructive" });
          resetState();
          return;
        }

        // Check for structured days first
        const ocrDays: { dayName: string; dateStr: string; items: { name: string; category: string; slot: string; grammage: string; price: number | null; allergens: number[] }[] }[] = data?.days || [];
        if (data?.rawOcrText) setRawOcrText(data.rawOcrText);

        if (ocrDays.length > 0) {
          // Map OCR results to ImportDayResult with fuzzy matching
          const results: ImportDayResult[] = ocrDays.map((day) => ({
            dayName: day.dayName,
            dateStr: day.dateStr,
            items: day.items.map((item) => {
              const { dish, score } = findBestMatch(item.name, dishes);
              return {
                rawName: item.name,
                matchedDish: dish,
                similarity: score,
                slot: item.slot || "Menu",
                grammage: item.grammage || "",
                price: item.price,
                allergens: item.allergens || [],
              };
            }).filter(i => i.rawName.length > 0),
          }));

          setWeeklyData(results);

          const totalItems = results.reduce((s, d) => s + d.items.length, 0);
          const matched = results.reduce((s, d) => s + d.items.filter(i => i.matchedDish).length, 0);
          toast({
            title: `OCR: ${ocrDays.length} dní rozpoznaných`,
            description: `${matched}/${totalItems} jedál priradených z databázy.`,
          });
        } else {
          // Fallback: flat list of dish names
          const dishNames: string[] = data?.dishes || [];
          if (dishNames.length === 0) {
            toast({ title: "Žiadne jedlá nenájdené", description: "AI nerozpoznalo žiadne názvy jedál v dokumente.", variant: "destructive" });
            resetState();
            return;
          }
          matchNames(dishNames);
          toast({ title: `OCR úspešný`, description: `AI rozpoznalo ${dishNames.length} jedál z dokumentu.` });
        }
      } catch (e: any) {
        console.error("OCR error:", e);
        toast({ title: "Chyba pri OCR spracovaní", description: e.message || "Nepodarilo sa spracovať súbor", variant: "destructive" });
        resetState();
      } finally {
        setIsOcrProcessing(false);
      }
    },
    [dishes, toast]
  );

  /** Continue OCR after user reviewed enhanced preview */
  const continueOcrAfterPreview = useCallback(async () => {
    if (!pendingOcrData) return;
    setIsOcrProcessing(true);
    setOcrProgressMessage("AI rozpoznáva jedlá...");
    setOriginalPreview(null);
    setEnhancedPreview(null);

    const { base64, mimeType, fileName: fName } = pendingOcrData;
    const imageUrl = enhancedPreview;

    try {
      const ocrBody: Record<string, any> = {
        mimeType: mimeType || "application/octet-stream",
        fileName: fName,
        mode: "structured",
      };
      if (imageUrl) {
        ocrBody.imageUrl = imageUrl;
      } else {
        ocrBody.fileBase64 = base64;
      }

      const { data, error } = await supabase.functions.invoke("ocr-menu-import", { body: ocrBody });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Chyba OCR", description: data.error, variant: "destructive" });
        resetState();
        return;
      }

      const ocrDays = data?.days || [];
      if (data?.rawOcrText) setRawOcrText(data.rawOcrText);
      if (ocrDays.length > 0) {
        const results: ImportDayResult[] = ocrDays.map((day: any) => ({
          dayName: day.dayName,
          dateStr: day.dateStr,
          items: day.items.map((item: any) => {
            const { dish, score } = findBestMatch(item.name, dishes);
            return { rawName: item.name, matchedDish: dish, similarity: score, slot: item.slot || "Menu", grammage: item.grammage || "", price: item.price, allergens: item.allergens || [] };
          }).filter((i: any) => i.rawName.length > 0),
        }));
        setWeeklyData(results);
        const totalItems = results.reduce((s, d) => s + d.items.length, 0);
        const matched = results.reduce((s, d) => s + d.items.filter(i => i.matchedDish).length, 0);
        toast({ title: `OCR: ${ocrDays.length} dní rozpoznaných`, description: `${matched}/${totalItems} jedál priradených.` });
      } else {
        const dishNames: string[] = data?.dishes || [];
        if (dishNames.length === 0) {
          toast({ title: "Žiadne jedlá nenájdené", variant: "destructive" });
          resetState();
          return;
        }
        matchNames(dishNames);
        toast({ title: `OCR úspešný`, description: `${dishNames.length} jedál.` });
      }
      setPendingOcrData(null);
    } catch (e: any) {
      toast({ title: "Chyba OCR", description: e.message, variant: "destructive" });
      resetState();
    } finally {
      setIsOcrProcessing(false);
    }
  }, [pendingOcrData, enhancedPreview, dishes, toast]);

  const handleFile = useCallback(
    (file: File) => {
      const ext = file.name.toLowerCase().split(".").pop() || "";
      if (importMode === "koliesko" && ["xlsx", "xls", "csv"].includes(ext)) {
        handleKolieskoFile(file);
      } else if (["xlsx", "xls", "csv"].includes(ext)) {
        handleExcelFile(file);
      } else {
        handleOcrFile(file);
      }
    },
    [importMode, handleKolieskoFile, handleExcelFile, handleOcrFile]
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

  // Weekly matched stats
  const weeklyMatchedCount = weeklyData?.reduce((s, d) => s + d.items.filter(i => i.matchedDish).length, 0) ?? 0;
  const weeklyTotalCount = weeklyData?.reduce((s, d) => s + d.items.length, 0) ?? 0;
  const weeklyUnmatched = weeklyTotalCount - weeklyMatchedCount;

  const handleApply = async () => {
    const ids = matchedRows.map((r) => r.matchedDish!.id);
    await onApply(ids);
    resetState();
    onOpenChange(false);
  };

  const handleApplyWeekly = async () => {
    if (weeklyData && onApplyWeekly) {
      await onApplyWeekly(weeklyData);
      resetState();
      onOpenChange(false);
    }
  };

  const hasResults = rows.length > 0 || weeklyData !== null;
  const showEnhancePreview = pendingOcrData !== null && enhancedPreview !== null && !isOcrProcessing;
  const currentAccept = importMode === "ocr" ? OCR_ACCEPT : EXCEL_ACCEPT;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetState();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import menu
          </DialogTitle>
          <DialogDescription>
            Importujte jedlá z Excel/CSV (Koliesko formát alebo jednoduchý zoznam) alebo naskenujte PDF/obrázok.
          </DialogDescription>
        </DialogHeader>

        {showEnhancePreview ? (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground text-center">Porovnanie: Originál vs Vylepšené</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-wider">Originál</p>
                <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
                  {originalPreview && (
                    <img src={originalPreview} alt="Originál" className="w-full h-48 object-contain" />
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-primary text-center font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  Vylepšené
                </p>
                <div className="border border-primary/30 rounded-lg overflow-hidden bg-muted/20">
                  <img src={enhancedPreview} alt="Vylepšené" className="w-full h-48 object-contain" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={resetState}>
                <X className="h-3.5 w-3.5 mr-1" />
                Zrušiť
              </Button>
              <Button size="sm" onClick={continueOcrAfterPreview}>
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Pokračovať na AI OCR
              </Button>
            </div>
          </div>
        ) : !hasResults && !isOcrProcessing ? (
          <div className="space-y-4">
            <Tabs value={importMode} onValueChange={(v) => setImportMode(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="koliesko" className="flex-1 gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Koliesko formát
                </TabsTrigger>
                <TabsTrigger value="excel" className="flex-1 gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  Jednoduchý zoznam
                </TabsTrigger>
                <TabsTrigger value="ocr" className="flex-1 gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  PDF / OCR
                </TabsTrigger>
              </TabsList>

              <TabsContent value="koliesko" className="mt-3">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Koliesko týždenný Excel</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rozpozná štruktúru: Pondelok–Piatok, Polievka, Menu 1-5, B, S, P, Dezert
                  </p>
                  <Badge variant="secondary" className="mt-2">Auto-mapovanie</Badge>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={EXCEL_ACCEPT}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="excel" className="mt-3">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">Jednoduchý zoznam jedál</p>
                  <p className="text-xs text-muted-foreground mt-1">Názvy jedál v prvom stĺpci (.xlsx, .xls, .csv)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={EXCEL_ACCEPT}
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="ocr" className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera capture button */}
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors relative"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Odfotiť menu</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {cameraFacing === "environment" ? "Zadná kamera" : "Predná kamera"}
                    </p>
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCameraFacing((f) => f === "environment" ? "user" : "environment");
                      }}
                      title="Prepnúť kameru"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <input
                      ref={cameraInputRef}
                      key={cameraFacing}
                      type="file"
                      accept="image/*"
                      capture={cameraFacing}
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>
                  {/* File upload button */}
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Nahrať súbor</p>
                    <p className="text-[10px] text-muted-foreground mt-1">PDF, Word, JPG, PNG</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={OCR_ACCEPT}
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <Badge variant="secondary" className="gap-1 mx-auto flex w-fit">
                  <Sparkles className="h-3 w-3" />
                  AI OCR
                </Badge>
                <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <Label htmlFor="enhance-toggle" className="text-xs cursor-pointer">
                      Vylepšiť kvalitu fotky (Cloudinary)
                    </Label>
                  </div>
                  <Switch
                    id="enhance-toggle"
                    checked={useEnhance}
                    onCheckedChange={setUseEnhance}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {useEnhance
                    ? "Obrázky sa automaticky vylepšia (ostrenie, kontrast) pre lepšie rozpoznávanie."
                    : "Priamy upload do AI bez predspracovania."}
                </p>
              </TabsContent>
            </Tabs>
          </div>
        ) : isOcrProcessing ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">{ocrProgressMessage}</p>
          <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        ) : weeklyData ? (
          /* ─── Koliesko weekly results ─── */
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Súbor: <span className="font-medium text-foreground">{fileName}</span>
              </span>
              <div className="flex gap-2">
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  {weeklyMatchedCount} priradených
                </Badge>
                {weeklyUnmatched > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <X className="h-3 w-3" />
                    {weeklyUnmatched} nepriradených
                  </Badge>
                )}
              </div>
            </div>

            {/* OCR Comparison: Raw vs Corrected */}
            {rawOcrText && (
              <Collapsible open={showOcrComparison} onOpenChange={setShowOcrComparison}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <Eye className="h-3.5 w-3.5" />
                    {showOcrComparison ? "Skryť" : "Zobraziť"} porovnanie OCR textu
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showOcrComparison ? "rotate-180" : ""}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-destructive/80 font-medium uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Surový OCR text
                      </p>
                      <ScrollArea className="h-36 rounded-md border border-destructive/20 bg-destructive/5 p-2">
                        <pre className="text-[10px] whitespace-pre-wrap text-foreground/70 font-mono leading-relaxed">
                          {rawOcrText}
                        </pre>
                      </ScrollArea>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-primary font-medium uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI opravený výsledok
                      </p>
                      <ScrollArea className="h-36 rounded-md border border-primary/20 bg-primary/5 p-2">
                        <div className="space-y-1.5">
                          {weeklyData.map((day, di) => (
                            <div key={di}>
                              <p className="text-[10px] font-bold text-primary">{day.dayName} {day.dateStr}</p>
                              {day.items.map((item, ii) => (
                                <p key={ii} className="text-[10px] text-foreground/80 pl-2">
                                  <span className="text-primary/60">{item.slot}:</span>{" "}
                                  {item.rawName}
                                  {item.price != null && <span className="text-muted-foreground"> {item.price.toFixed(2)}€</span>}
                                  {item.allergens.length > 0 && (
                                    <span className="text-amber-500/80"> ({item.allergens.join(",")})</span>
                                  )}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="space-y-4">
                {weeklyData.map((day, di) => (
                  <div key={di} className="space-y-1">
                    <div className="flex items-center gap-2 sticky top-0 bg-background z-10 py-1">
                      <Badge variant="outline" className="font-semibold capitalize">
                        {day.dayName} {day.dateStr}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {day.items.filter(i => i.matchedDish).length}/{day.items.length} jedál
                      </span>
                    </div>
                    {day.items.map((item, ii) => (
                      <div
                        key={ii}
                        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                          item.matchedDish
                            ? "border-primary/30 bg-primary/5"
                            : "border-destructive/30 bg-destructive/5"
                        }`}
                      >
                        <span className="font-bold text-xs text-primary w-6 text-center shrink-0">{item.slot}</span>
                        {item.matchedDish ? (
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-xs">
                            {item.grammage && <span className="font-semibold">{item.grammage} </span>}
                            {item.rawName}
                          </p>
                          {item.matchedDish && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              → {item.matchedDish.name}{" "}
                              <span className="opacity-60">({Math.round(item.similarity * 100)}%)</span>
                            </p>
                          )}
                          {!item.matchedDish && (
                            <p className="text-[10px] text-destructive/80">Nenájdené v databáze</p>
                          )}
                        </div>
                        {item.price != null && item.price > 0 && (
                          <span className="text-xs font-semibold shrink-0">{item.price.toFixed(2)} €</span>
                        )}
                        {item.allergens.length > 0 && (
                          <Badge variant="outline" className="text-[9px] shrink-0 gap-0.5 px-1 py-0 h-4 border-amber-500/40 text-amber-600 dark:text-amber-400">
                            A: {item.allergens.join(",")}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button variant="outline" size="sm" className="w-full" onClick={resetState}>
              Nahrať iný súbor
            </Button>
          </div>
        ) : (
          /* ─── Simple flat results ─── */
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
                          <span className="text-muted-foreground/60">({Math.round(row.similarity * 100)}%)</span>
                        </p>
                      )}
                      {!row.matchedDish && (
                        <p className="text-xs text-destructive/80">Nenájdené v databáze</p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0" onClick={() => toggleRow(i)}>
                      {row.matchedDish ? "Odstrániť" : "Preskočiť"}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Button variant="outline" size="sm" className="w-full" onClick={resetState}>
              Nahrať iný súbor
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetState(); onOpenChange(false); }}>
            Zrušiť
          </Button>
          {weeklyData && weeklyMatchedCount > 0 && (
            <Button onClick={handleApplyWeekly} disabled={isApplying}>
              {isApplying ? "Importujem…" : `Importovať ${weeklyMatchedCount} jedál (${weeklyData.length} dní)`}
            </Button>
          )}
          {!weeklyData && matchedRows.length > 0 && (
            <Button onClick={handleApply} disabled={isApplying}>
              {isApplying ? "Pridávam…" : `Pridať ${matchedRows.length} jedál`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
