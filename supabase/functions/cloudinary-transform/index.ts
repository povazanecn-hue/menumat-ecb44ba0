const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TransformRequest {
  action:
    | "enhance"         // Auto-enhance quality
    | "upscale"         // AI upscale
    | "background"      // AI background replace/remove
    | "transform"       // Resize/crop/overlay
    | "ocr"             // OCR text extraction
    | "analyze"         // AI image analysis
    | "generative_fill" // AI generative fill
    | "effects";        // Artistic effects
  // Source image - either a Cloudinary public_id or an external URL
  image_url?: string;
  public_id?: string;
  // Action-specific params
  options?: Record<string, any>;
}

function getCloudinaryUrl(cloudName: string, publicId: string, transformations: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
    const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
      return new Response(
        JSON.stringify({ error: "Cloudinary credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: TransformRequest = await req.json();
    const { action, image_url, public_id, options = {} } = body;

    // If we have an external URL, upload it first to get a public_id
    let activePublicId = public_id;
    if (image_url && !public_id) {
      const uploadResult = await uploadFromUrl(CLOUD_NAME, API_KEY, API_SECRET, image_url);
      activePublicId = uploadResult.public_id;
    }

    if (!activePublicId && action !== "analyze") {
      return new Response(
        JSON.stringify({ error: "No image provided (image_url or public_id required)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: any;

    switch (action) {
      case "enhance": {
        // Auto-enhance: improve quality, auto color, auto brightness
        const effects = options.effects || "e_improve,e_auto_color,e_auto_brightness";
        const quality = options.quality || "auto:best";
        const format = options.format || "auto";
        const transformations = `${effects}/q_${quality}/f_${format}`;
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      case "upscale": {
        const factor = options.factor || 2;
        const transformations = `e_upscale/q_auto:best/f_auto`;
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      case "background": {
        // AI background replace or remove
        const bgAction = options.remove
          ? "e_background_removal"
          : `e_gen_background_replace:prompt_${encodeURIComponent(options.prompt || "rustic wooden restaurant interior")}`;
        const transformations = `${bgAction}/q_auto:best/f_auto`;
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      case "transform": {
        // General transformations: resize, crop, overlay, watermark
        const parts: string[] = [];
        if (options.width) parts.push(`w_${options.width}`);
        if (options.height) parts.push(`h_${options.height}`);
        if (options.crop) parts.push(`c_${options.crop}`);
        if (options.gravity) parts.push(`g_${options.gravity}`);
        if (options.overlay) parts.push(`l_${options.overlay}`);
        if (options.effect) parts.push(options.effect);
        if (options.radius) parts.push(`r_${options.radius}`);
        if (options.border) parts.push(`bo_${options.border}`);
        parts.push("q_auto:best", "f_auto");
        const transformations = parts.join(",");
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      case "ocr": {
        // Use Cloudinary OCR add-on
        const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
        // For OCR we need to use the OCR detection
        const ocrResult = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: image_url || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${activePublicId}`,
              upload_preset: options.upload_preset,
              ocr: "adv_ocr",
              api_key: API_KEY,
              timestamp: Math.floor(Date.now() / 1000),
            }),
          }
        );

        // Alternative: use the resource info endpoint for OCR
        const authHeader = "Basic " + btoa(`${API_KEY}:${API_SECRET}`);
        const detailResp = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload/${activePublicId}?ocr=adv_ocr`,
          {
            headers: { Authorization: authHeader },
          }
        );
        const detailData = await detailResp.json();
        result = {
          public_id: activePublicId,
          ocr_data: detailData.info?.ocr?.adv_ocr ?? null,
          raw: detailData,
        };
        break;
      }

      case "analyze": {
        // AI image analysis using Cloudinary's AI Vision
        const authHeader = "Basic " + btoa(`${API_KEY}:${API_SECRET}`);
        const targetId = activePublicId || "sample";
        const analyzeResp = await fetch(
          `https://api.cloudinary.com/v2/${CLOUD_NAME}/analysis/analyze/uri`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              source: {
                uri: image_url || `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${targetId}`,
              },
              analysis_type: "captioning",
              parameters: {
                ...(options.prompt ? { prompt: options.prompt } : {}),
              },
            }),
          }
        );
        result = await analyzeResp.json();
        break;
      }

      case "generative_fill": {
        // Extend image with AI-generated content
        const w = options.width || 1920;
        const h = options.height || 1080;
        const transformations = `c_pad,w_${w},h_${h},g_center,b_gen_fill/q_auto:best/f_auto`;
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      case "effects": {
        // Artistic effects
        const effectName = options.effect || "art:hokusai";
        const transformations = `e_${effectName}/q_auto:best/f_auto`;
        result = {
          url: getCloudinaryUrl(CLOUD_NAME, activePublicId!, transformations),
          transformations,
          public_id: activePublicId,
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cloudinary-transform error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/** Upload an external URL to Cloudinary and return the result */
async function uploadFromUrl(
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  url: string
): Promise<{ public_id: string; secure_url: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "menugen";
  const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

  // Generate SHA-1 signature
  const encoder = new TextEncoder();
  const data = encoder.encode(toSign);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("file", url);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Cloudinary upload failed: ${resp.status} - ${errText}`);
  }

  return await resp.json();
}
