import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wand2,
  ImageUp,
  Sparkles,
  ScanText,
  Palette,
  Maximize,
  Eraser,
  Loader2,
  ExternalLink,
  Copy,
} from "lucide-react";
import { useCloudinary, CloudinaryAction } from "@/hooks/useCloudinary";
import { useToast } from "@/hooks/use-toast";

const EFFECTS = [
  { id: "art:hokusai", label: "Hokusai (umelecký)" },
  { id: "art:zorro", label: "Zorro (kontrastný)" },
  { id: "art:primavera", label: "Primavera (jarný)" },
  { id: "art:eucalyptus", label: "Eucalyptus (zelený)" },
  { id: "art:athena", label: "Athena (klasický)" },
  { id: "cartoonify", label: "Cartoon" },
  { id: "oil_paint:80", label: "Olejomaľba" },
  { id: "pixelate:10", label: "Pixelizácia" },
  { id: "vignette:60", label: "Vinetácia" },
  { id: "sepia:80", label: "Sépia" },
  { id: "grayscale", label: "Čiernobiely" },
];

const BG_PROMPTS = [
  "rustic wooden restaurant interior with warm candlelight",
  "elegant fine dining table setting with white tablecloth",
  "cozy countryside kitchen with herbs hanging",
  "modern minimalist restaurant with concrete walls",
  "outdoor garden terrace with fairy lights",
  "vintage wine cellar with brick walls",
];

export function CloudinaryToolsCard() {
  const { toast } = useToast();
  const {
    loading,
    enhance,
    upscale,
    replaceBackground,
    removeBackground,
    resize,
    generativeFill,
    ocr,
    analyze,
    applyEffect,
  } = useCloudinary();

  const [imageUrl, setImageUrl] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);
  const [selectedEffect, setSelectedEffect] = useState("art:hokusai");
  const [bgPrompt, setBgPrompt] = useState(BG_PROMPTS[0]);
  const [resizeW, setResizeW] = useState("1920");
  const [resizeH, setResizeH] = useState("1080");

  const handleResult = (result: any) => {
    if (!result) return;
    if (result.url) {
      setResultUrl(result.url);
      setResultData(null);
    } else {
      setResultUrl(null);
      setResultData(result);
    }
  };

  const copyUrl = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
      toast({ title: "URL skopírovaná" });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Cloudinary AI Nástroje
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image URL input */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            URL obrázka na spracovanie
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg alebo verejná URL"
            className="text-sm"
          />
        </div>

        {/* Action buttons grid */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await enhance(imageUrl))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1.5" />}
            Auto-Enhance
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await upscale(imageUrl))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Maximize className="h-3.5 w-3.5 mr-1.5" />}
            AI Upscale
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await removeBackground(imageUrl))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Eraser className="h-3.5 w-3.5 mr-1.5" />}
            Odstrániť pozadie
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await ocr(imageUrl))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ScanText className="h-3.5 w-3.5 mr-1.5" />}
            OCR (čítanie textu)
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="justify-start text-xs col-span-2"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await analyze(imageUrl, "Describe this restaurant menu image in detail"))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            AI Analýza obrázka
          </Button>
        </div>

        {/* AI Background Replace */}
        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            AI výmena pozadia
          </Label>
          <Select value={bgPrompt} onValueChange={setBgPrompt}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BG_PROMPTS.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {p.slice(0, 50)}...
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={bgPrompt}
            onChange={(e) => setBgPrompt(e.target.value)}
            className="text-xs min-h-[60px]"
            placeholder="Popis nového pozadia..."
          />
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={loading || !imageUrl}
            onClick={async () => handleResult(await replaceBackground(imageUrl, bgPrompt))}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5 mr-1.5" />}
            Nahradiť pozadie
          </Button>
        </div>

        {/* Effects */}
        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Umelecké efekty
          </Label>
          <div className="flex gap-2">
            <Select value={selectedEffect} onValueChange={setSelectedEffect}>
              <SelectTrigger className="flex-1 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EFFECTS.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={loading || !imageUrl}
              onClick={async () => handleResult(await applyEffect(imageUrl, selectedEffect))}
            >
              <Palette className="h-3.5 w-3.5 mr-1" />
              Aplikovať
            </Button>
          </div>
        </div>

        {/* Resize / Generative Fill */}
        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Resize / AI Generative Fill (TV 1920×1080)
          </Label>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-[10px]">Šírka</Label>
              <Input value={resizeW} onChange={(e) => setResizeW(e.target.value)} className="text-xs" />
            </div>
            <div className="flex-1">
              <Label className="text-[10px]">Výška</Label>
              <Input value={resizeH} onChange={(e) => setResizeH(e.target.value)} className="text-xs" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs shrink-0"
              disabled={loading || !imageUrl}
              onClick={async () =>
                handleResult(await generativeFill(imageUrl, parseInt(resizeW), parseInt(resizeH)))
              }
            >
              <Maximize className="h-3.5 w-3.5 mr-1" />
              Fill
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs shrink-0"
              disabled={loading || !imageUrl}
              onClick={async () =>
                handleResult(await resize(imageUrl, parseInt(resizeW), parseInt(resizeH)))
              }
            >
              Resize
            </Button>
          </div>
        </div>

        {/* Result display */}
        {(resultUrl || resultData) && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Výsledok</Label>
              {resultUrl && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyUrl}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a href={resultUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              )}
            </div>
            {resultUrl && (
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={resultUrl} alt="Výsledok" className="w-full h-auto max-h-64 object-contain bg-secondary/20" />
              </div>
            )}
            {resultData && (
              <pre className="text-[10px] bg-secondary/30 rounded-lg p-3 overflow-auto max-h-48 text-foreground/80">
                {JSON.stringify(resultData, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
