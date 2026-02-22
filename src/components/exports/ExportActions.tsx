import { useState, useEffect } from "react";
import { Monitor, Printer, FileSpreadsheet, Globe, Loader2, ExternalLink, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { exportTV, exportPDF, exportExcel, exportWebEmbed } from "@/lib/exportUtils";
import { useSaveExport, type ExportFormat } from "@/hooks/useExports";
import { useTemplateSettings } from "@/hooks/useTemplates";
import { useCanViewFinancials } from "@/hooks/useUserRole";

interface ExportActionsProps {
  menu: any;
  onTemplateChange?: (template: string) => void;
  onShowFinancialsChange?: (show: boolean) => void;
}

const TEMPLATES = [
  { value: "country", label: "Vidiecky / Rustikálny" },
  { value: "minimal", label: "Minimalistický" },
  { value: "modern", label: "Moderný" },
];

export function ExportActions({ menu, onTemplateChange, onShowFinancialsChange }: ExportActionsProps) {
  const { data: templateSettings } = useTemplateSettings();
  const canViewFinancials = useCanViewFinancials();
  const [template, setTemplate] = useState("country");
  const [loading, setLoading] = useState<string | null>(null);
  const [embedResult, setEmbedResult] = useState<{ url: string; embedSnippet: string } | null>(null);
  const [tvResult, setTvResult] = useState<{ url: string } | null>(null);
  const [showFinancials, setShowFinancials] = useState(false);
  const saveExport = useSaveExport();

  useEffect(() => {
    if (templateSettings?.primary_template) {
      setTemplate(templateSettings.primary_template);
    }
  }, [templateSettings]);

  // Reset results when menu changes
  useEffect(() => {
    setEmbedResult(null);
    setTvResult(null);
  }, [menu?.id]);

  const handleExport = async (format: ExportFormat) => {
    if (!menu) return;
    setLoading(format);
    try {
      let fileUrl: string | undefined;

      switch (format) {
        case "tv": {
          const result = await exportTV(menu, template);
          setTvResult(result);
          fileUrl = result.url;
          toast({
            title: "TV displej publikovaný",
            description: "Live URL je pripravená pre váš smart TV.",
          });
          break;
        }
        case "pdf":
          exportPDF(menu, template);
          break;
        case "excel":
          exportExcel(menu);
          break;
        case "webflow": {
          const result = await exportWebEmbed(menu);
          setEmbedResult(result);
          fileUrl = result.url;
          toast({
            title: "Web embed publikovaný",
            description: "Embed kód skopírovaný do schránky. URL je naživo.",
          });
          break;
        }
      }
      await saveExport.mutateAsync({
        menuId: menu.id,
        format,
        templateName: format === "excel" ? undefined : template,
        fileUrl,
      });
      if (format !== "webflow" && format !== "tv") {
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
        <CardTitle className="font-serif text-lg">Export akcie</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Šablóna</label>
          <Select value={template} onValueChange={(v) => { setTemplate(v); onTemplateChange?.(v); }}>
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

        {/* Financial visibility toggle - only for owner/manager */}
        {canViewFinancials && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              {showFinancials ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="show-financials" className="text-sm cursor-pointer">
                Zobraziť náklady a maržu
              </Label>
            </div>
            <Switch
              id="show-financials"
              checked={showFinancials}
              onCheckedChange={(checked) => {
                setShowFinancials(checked);
                onShowFinancialsChange?.(checked);
              }}
            />
          </div>
        )}

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

        {/* TV Live URL result */}
        {tvResult && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">TV FullHD displej (1920×1080)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Live URL — otvorte v prehliadači na smart TV</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={tvResult.url}
                  className="text-xs h-8 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => window.open(tvResult.url, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(tvResult.url);
                    toast({ title: "URL skopírovaná" });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Stránka sa automaticky obnovuje každých 60 sekúnd. Rovnaký dátum = rovnaká URL.
            </p>
          </div>
        )}

        {/* Embed result with live URL */}
        {embedResult && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Web embed publikovaný</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Live URL</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={embedResult.url}
                  className="text-xs h-8 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => window.open(embedResult.url, "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Embed kód (iframe)</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={embedResult.embedSnippet}
                  className="text-xs h-8 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(embedResult.embedSnippet);
                    toast({ title: "Embed kód skopírovaný" });
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Rovnaký dátum = rovnaká URL. Opätovné publikovanie aktualizuje obsah bez vytvárania duplicít.
            </p>
          </div>
        )}

        {disabled && (
          <p className="text-xs text-muted-foreground text-center">
            Vyberte menu s jedlami pre export.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
