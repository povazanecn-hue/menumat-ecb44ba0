import { useState } from "react";
import { Monitor, Printer, FileSpreadsheet, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { exportTV, exportPDF, exportExcel, exportWebEmbed } from "@/lib/exportUtils";
import { useSaveExport, type ExportFormat } from "@/hooks/useExports";

interface ExportActionsProps {
  menu: any;
}

const TEMPLATES = [
  { value: "country", label: "Vidiecky / Rustikálny" },
  { value: "minimal", label: "Minimalistický" },
  { value: "modern", label: "Moderný" },
];

export function ExportActions({ menu }: ExportActionsProps) {
  const [template, setTemplate] = useState("country");
  const [loading, setLoading] = useState<string | null>(null);
  const saveExport = useSaveExport();

  const handleExport = async (format: ExportFormat) => {
    if (!menu) return;
    setLoading(format);
    try {
      switch (format) {
        case "tv":
          exportTV(menu, template);
          break;
        case "pdf":
          exportPDF(menu, template);
          break;
        case "excel":
          exportExcel(menu);
          break;
        case "webflow":
          exportWebEmbed(menu);
          toast({ title: "Embed kód skopírovaný do schránky" });
          break;
      }
      await saveExport.mutateAsync({
        menuId: menu.id,
        format,
        templateName: format === "excel" ? undefined : template,
      });
      if (format !== "webflow") {
        toast({ title: "Export úspešný", description: `Formát: ${format.toUpperCase()}` });
      }
    } catch (e: any) {
      toast({ title: "Chyba exportu", description: e.message, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  const disabled = !menu || !menu.menu_items?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg">Export akccie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Šablóna</label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={disabled || loading === "tv"}
            onClick={() => handleExport("tv")}
            className="flex flex-col items-center gap-1.5 h-auto py-4"
          >
            {loading === "tv" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Monitor className="h-5 w-5" />}
            <span className="text-xs">TV FullHD</span>
          </Button>

          <Button
            variant="outline"
            disabled={disabled || loading === "pdf"}
            onClick={() => handleExport("pdf")}
            className="flex flex-col items-center gap-1.5 h-auto py-4"
          >
            {loading === "pdf" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Printer className="h-5 w-5" />}
            <span className="text-xs">PDF / Tlač</span>
          </Button>

          <Button
            variant="outline"
            disabled={disabled || loading === "excel"}
            onClick={() => handleExport("excel")}
            className="flex flex-col items-center gap-1.5 h-auto py-4"
          >
            {loading === "excel" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
            <span className="text-xs">Excel kuchyňa</span>
          </Button>

          <Button
            variant="outline"
            disabled={disabled || loading === "webflow"}
            onClick={() => handleExport("webflow")}
            className="flex flex-col items-center gap-1.5 h-auto py-4"
          >
            {loading === "webflow" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
            <span className="text-xs">Web embed</span>
          </Button>
        </div>

        {disabled && (
          <p className="text-xs text-muted-foreground text-center">
            Vyberte menu s jedlami pre export.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
