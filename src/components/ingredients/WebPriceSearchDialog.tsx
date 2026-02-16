import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Globe, Loader2, ExternalLink, Plus } from "lucide-react";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { useToast } from "@/hooks/use-toast";

interface WebPriceSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredientName: string;
  onAddPrice: (supplier: string, price: number) => void;
}

interface SearchResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

const SEARCH_SITES = [
  { label: "Všetky", value: "" },
  { label: "Lidl", value: "site:lidl.sk" },
  { label: "Kaufland", value: "site:kaufland.sk" },
  { label: "Billa", value: "site:billa.sk" },
  { label: "Metro", value: "site:metro.sk" },
];

export function WebPriceSearchDialog({
  open,
  onOpenChange,
  ingredientName,
  onAddPrice,
}: WebPriceSearchDialogProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState(`${ingredientName} cena`);
  const [siteFilter, setSiteFilter] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [manualPrice, setManualPrice] = useState<Record<number, string>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setResults([]);

    try {
      const fullQuery = siteFilter ? `${query} ${siteFilter}` : query;
      const response = await firecrawlApi.search(fullQuery, {
        limit: 8,
        lang: "sk",
        country: "SK",
        scrapeOptions: { formats: ["markdown"] },
      });

      if (response.success && response.data) {
        setResults(response.data);
      } else {
        toast({
          title: "Chyba vyhľadávania",
          description: response.error || "Nepodarilo sa vyhľadať",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodarilo sa pripojiť k vyhľadávaniu",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const extractSupplierName = (url: string): string => {
    try {
      const hostname = new URL(url).hostname.replace("www.", "");
      const map: Record<string, string> = {
        "lidl.sk": "Lidl",
        "kaufland.sk": "Kaufland",
        "billa.sk": "Billa",
        "metro.sk": "Metro",
        "hoppe.sk": "Hoppe",
        "wiesbauer.sk": "Wiesbauer",
      };
      return map[hostname] || hostname;
    } catch {
      return "Web";
    }
  };

  const handleAddFromResult = (index: number, url: string) => {
    const price = parseFloat(manualPrice[index] || "0");
    if (price <= 0) {
      toast({ title: "Zadajte platnú cenu", variant: "destructive" });
      return;
    }
    const supplier = extractSupplierName(url);
    onAddPrice(supplier, price);
    toast({ title: `Cena ${price.toFixed(2)} € od ${supplier} pridaná` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Vyhľadať ceny na webe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="search-query" className="sr-only">Hľadať</Label>
              <Input
                id="search-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Hľadať ingredienciu..."
                required
              />
            </div>
            <Select value={siteFilter} onValueChange={setSiteFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Obchod" />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_SITES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Vyhľadávam ceny na webe...
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {results.length} výsledkov — zadajte nájdenú cenu a pridajte ju k dodávateľovi
            </p>
            {results.map((result, idx) => (
              <Card key={idx} className="border-border">
                <CardContent className="py-3 px-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {result.title || result.url}
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {extractSupplierName(result.url)}
                      </Badge>
                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Extracted markdown preview */}
                  {result.markdown && (
                    <details className="text-xs">
                      <summary className="text-muted-foreground cursor-pointer hover:text-foreground">
                        Zobraziť obsah stránky
                      </summary>
                      <pre className="mt-1 bg-muted p-2 rounded text-[10px] overflow-auto max-h-32 whitespace-pre-wrap">
                        {result.markdown.slice(0, 1500)}
                      </pre>
                    </details>
                  )}

                  {/* Add price action */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Cena €"
                      className="w-24 h-8 text-sm"
                      value={manualPrice[idx] || ""}
                      onChange={(e) =>
                        setManualPrice((prev) => ({ ...prev, [idx]: e.target.value }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleAddFromResult(idx, result.url)}
                    >
                      <Plus className="h-3 w-3" />
                      Pridať cenu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isSearching && results.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Vyhľadajte cenu ingrediencie na webe pomocou vyhľadávacieho poľa vyššie.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
