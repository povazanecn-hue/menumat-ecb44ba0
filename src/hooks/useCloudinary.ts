import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export type CloudinaryAction =
  | "enhance"
  | "upscale"
  | "background"
  | "transform"
  | "ocr"
  | "analyze"
  | "generative_fill"
  | "effects";

interface CloudinaryOptions {
  action: CloudinaryAction;
  image_url?: string;
  public_id?: string;
  options?: Record<string, any>;
}

export function useCloudinary() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const transform = async (params: CloudinaryOptions) => {
    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-transform`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        toast({
          title: "Cloudinary chyba",
          description: data.error ?? "Neznáma chyba",
          variant: "destructive",
        });
        return null;
      }
      return data.result;
    } catch (e: any) {
      toast({
        title: "Chyba",
        description: e.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const enhance = (imageUrl: string, effects?: string) =>
    transform({ action: "enhance", image_url: imageUrl, options: effects ? { effects } : {} });

  const upscale = (imageUrl: string) =>
    transform({ action: "upscale", image_url: imageUrl });

  const replaceBackground = (imageUrl: string, prompt: string) =>
    transform({ action: "background", image_url: imageUrl, options: { prompt } });

  const removeBackground = (imageUrl: string) =>
    transform({ action: "background", image_url: imageUrl, options: { remove: true } });

  const resize = (imageUrl: string, width: number, height: number, crop = "fill") =>
    transform({ action: "transform", image_url: imageUrl, options: { width, height, crop } });

  const generativeFill = (imageUrl: string, width: number, height: number) =>
    transform({ action: "generative_fill", image_url: imageUrl, options: { width, height } });

  const ocr = (imageUrl: string) =>
    transform({ action: "ocr", image_url: imageUrl });

  const analyze = (imageUrl: string, prompt?: string) =>
    transform({ action: "analyze", image_url: imageUrl, options: prompt ? { prompt } : {} });

  const applyEffect = (imageUrl: string, effect: string) =>
    transform({ action: "effects", image_url: imageUrl, options: { effect } });

  return {
    loading,
    transform,
    enhance,
    upscale,
    replaceBackground,
    removeBackground,
    resize,
    generativeFill,
    ocr,
    analyze,
    applyEffect,
  };
}
