import { useState, useMemo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileUp, CheckCircle, AlertTriangle, Loader2, X } from "lucide-react";
import * as XLSX from "xlsx";
import { IngredientWithSuppliers } from "@/hooks/useIngredients";

interface SupplierPriceImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: IngredientWithSuppliers[];
  onImport: (rows: ImportRow[]) => Promise<void>;
  importing?: boolean;
}

export interface ImportRow {
  ingredient_name: string;
  matched_ingredient_id: string | null;
  supplier_name: string;
  price: number;
  is_promo: boolean;
  valid_from: string | null;
  valid_to: string | null;
}

type ColumnMapping = {
  ingredient: string;
  supplier: string;
  price: string;
  is_promo: string;
  valid_from: string;
  valid_to: string;
};

const NONE = "__none__";

function fuzzyMatch(name: string, ingredients: IngredientWithSuppliers[]): IngredientWithSuppliers | null {
  const n = name.toLowerCase().trim();
  if (!n) return null;
  // Exact match first
  const exact = ingredients.find(i => i.name.toLowerCase() === n);
  if (exact) return exact;
  // Includes match
  const includes = ingredients.find(i => n.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(n));
  return includes || null;
}

export function SupplierPriceImportDialog({
  open,
  onOpenChange,
  ingredients,
  onImport,
  importing,
}: SupplierPriceImportDialogProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    ingredient: NONE,
    supplier: NONE,
    price: NONE,
    is_promo: NONE,
    valid_from: NONE,
    valid_to: NONE,
  });
  const [defaultSupplier, setDefaultSupplier] = useState("");
  const [defaultPromo, setDefaultPromo] = useState(false);

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({ ingredient: NONE, supplier: NONE, price: NONE, is_promo: NONE, valid_from: NONE, valid_to: NONE });
    setDefaultSupplier("");
    setDefaultPromo(false);
  };

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
        if (json.length === 0) return;

        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setRawRows(json);

        // Auto-map columns by common names
        const autoMap = { ...mapping };
        for (const col of cols) {
          const lc = col.toLowerCase();
          if (lc.includes("ingredien") || lc.includes("názov") || lc.includes("nazov") || lc.includes("name") || lc.includes("surovina") || lc.includes("položka") || lc.includes("polozka") || lc.includes("produkt"))
            autoMap.ingredient = col;
          else if (lc.includes("dodávateľ") || lc.includes("dodavatel") || lc.includes("supplier") || lc.includes("zdroj"))
            autoMap.supplier = col;
          else if (lc.includes("cena") || lc.includes("price") || lc.includes("€"))
            autoMap.price = col;
          else if (lc.includes("akci") || lc.includes("promo"))
            autoMap.is_promo = col;
          else if (lc.includes("od") || lc.includes("from") || lc.includes("platnosť od") || lc.includes("platnost od"))
            autoMap.valid_from = col;
          else if (lc.includes("do") || lc.includes("to") || lc.includes("platnosť do") || lc.includes("platnost do"))
            autoMap.valid_to = col;
        }
        setMapping(autoMap);
        setStep("map");
      } catch {
        // Silent fail
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const parsedRows = useMemo<ImportRow[]>(() => {
    if (mapping.ingredient === NONE || mapping.price === NONE) return [];

    return rawRows
      .map((row) => {
        const name = String(row[mapping.ingredient] || "").trim();
        const priceStr = String(row[mapping.price] || "0").replace(",", ".").replace(/[^\d.]/g, "");
        const price = parseFloat(priceStr) || 0;
        if (!name || price <= 0) return null;

        const supplierRaw = mapping.supplier !== NONE ? String(row[mapping.supplier] || "").trim() : "";
        const supplier = supplierRaw || defaultSupplier || "Neznámy";

        const promoRaw = mapping.is_promo !== NONE ? String(row[mapping.is_promo] || "").toLowerCase() : "";
        const is_promo = promoRaw ? ["áno", "ano", "yes", "true", "1", "x"].includes(promoRaw) : defaultPromo;

        const valid_from = mapping.valid_from !== NONE ? String(row[mapping.valid_from] || "") || null : null;
        const valid_to = mapping.valid_to !== NONE ? String(row[mapping.valid_to] || "") || null : null;

        const matched = fuzzyMatch(name, ingredients);

        return {
          ingredient_name: name,
          matched_ingredient_id: matched?.id ?? null,
          supplier_name: supplier,
          price,
          is_promo,
          valid_from,
          valid_to,
        } as ImportRow;
      })
      .filter(Boolean) as ImportRow[];
  }, [rawRows, mapping, ingredients, defaultSupplier, defaultPromo]);

  const matchedCount = parsedRows.filter(r => r.matched_ingredient_id).length;
  const unmatchedCount = parsedRows.filter(r => !r.matched_ingredient_id).length;

  const handleImport = async () => {
    const validRows = parsedRows.filter(r => r.matched_ingredient_id);
    if (validRows.length === 0) return;
    await onImport(validRows);
    reset();
  };

  const getIngredientName = (id: string) => ingredients.find(i => i.id === id)?.name ?? "?";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Import cenníka dodávateľa</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <FileUp className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Nahrajte Excel alebo CSV súbor s cenníkom dodávateľa.<br />
              Súbor by mal obsahovať stĺpce: názov ingrediencie, cena, prípadne dodávateľ.
            </p>
            <Label
              htmlFor="supplier-file-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
            >
              <FileUp className="h-4 w-4" />
              Vybrať súbor
            </Label>
            <input
              id="supplier-file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Nájdených <strong>{rawRows.length}</strong> riadkov a <strong>{headers.length}</strong> stĺpcov. Priraďte stĺpce:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "ingredient" as const, label: "Ingrediencia *", required: true },
                { key: "price" as const, label: "Cena *", required: true },
                { key: "supplier" as const, label: "Dodávateľ", required: false },
                { key: "is_promo" as const, label: "Akcia (áno/nie)", required: false },
                { key: "valid_from" as const, label: "Platnosť od", required: false },
                { key: "valid_to" as const, label: "Platnosť do", required: false },
              ].map(({ key, label, required }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={mapping[key]}
                    onValueChange={(v) => setMapping(m => ({ ...m, [key]: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!required && <SelectItem value={NONE}>— Nepoužiť —</SelectItem>}
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {mapping.supplier === NONE && (
              <div className="space-y-1">
                <Label className="text-xs">Predvolený dodávateľ (pre všetky riadky)</Label>
                <Input
                  value={defaultSupplier}
                  onChange={(e) => setDefaultSupplier(e.target.value)}
                  placeholder="Napr. Lidl, Metro..."
                  className="h-8 text-sm"
                />
              </div>
            )}

            {mapping.is_promo === NONE && (
              <div className="flex items-center gap-2">
                <Switch checked={defaultPromo} onCheckedChange={setDefaultPromo} />
                <Label className="text-xs">Všetky sú akciové ceny</Label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={reset}>Späť</Button>
              <Button
                size="sm"
                disabled={mapping.ingredient === NONE || mapping.price === NONE}
                onClick={() => setStep("preview")}
              >
                Náhľad ({parsedRows.length} riadkov)
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="default" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                {matchedCount} priradených
              </Badge>
              {unmatchedCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {unmatchedCount} nepriradených (preskočí sa)
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-md max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Ingrediencia</TableHead>
                    <TableHead className="text-xs">Priradená</TableHead>
                    <TableHead className="text-xs">Dodávateľ</TableHead>
                    <TableHead className="text-xs text-right">Cena €</TableHead>
                    <TableHead className="text-xs">Akcia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, i) => (
                    <TableRow key={i} className={!row.matched_ingredient_id ? "opacity-50" : ""}>
                      <TableCell className="text-xs py-1.5">{row.ingredient_name}</TableCell>
                      <TableCell className="text-xs py-1.5">
                        {row.matched_ingredient_id ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {getIngredientName(row.matched_ingredient_id)}
                          </span>
                        ) : (
                          <span className="text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" /> Nenájdená
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs py-1.5">{row.supplier_name}</TableCell>
                      <TableCell className="text-xs py-1.5 text-right font-mono">{row.price.toFixed(2)}</TableCell>
                      <TableCell className="text-xs py-1.5">
                        {row.is_promo && <Badge variant="secondary" className="text-[10px]">Akcia</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                Späť
              </Button>
              <Button
                size="sm"
                disabled={matchedCount === 0 || importing}
                onClick={handleImport}
              >
                {importing ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Importujem...</>
                ) : (
                  <>Importovať {matchedCount} cien</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
