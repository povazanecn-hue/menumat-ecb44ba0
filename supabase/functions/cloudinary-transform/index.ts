const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TransformRequest {
  action:
    | "enhance"
    | "upscale"
    | "background"
    | "transform"
    | "ocr"
    | "analyze"
    | "generative_fill"
    | "effects"
    | "upload";
  image_url?: string;
  public_id?: string;
  options?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { CLOUD_NAME, API_KEY, API_SECRET } = getCredentials();
    const body: TransformRequest = await req.json();
    const { action, image_url, public_id, options = {} } = body;

    // Upload external URL to Cloudinary if needed
    let activePublicId = public_id;
    if (image_url && !public_id && action !== "upload") {
      const uploaded = await uploadFromUrl(CLOUD_NAME, API_KEY, API_SECRET, image_url);
      activePublicId = uploaded.public_id;
    }

    if (!activePublicId && action !== "analyze" && action !== "upload") {
      return jsonError("No image provided (image_url or public_id required)", 400);
    }

    const result = await handleAction(action, activePublicId!, CLOUD_NAME, API_KEY, API_SECRET, image_url, options);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cloudinary-transform error:", e);
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
});

// ── Credentials ──────────────────────────────────────────────────────

function getCredentials() {
  const CLOUD_NAME = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const API_KEY = Deno.env.get("CLOUDINARY_API_KEY");
  const API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error("Cloudinary credentials not configured");
  }
  return { CLOUD_NAME, API_KEY, API_SECRET };
}

// ── Action router ────────────────────────────────────────────────────

async function handleAction(
  action: string,
  publicId: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  imageUrl: string | undefined,
  options: Record<string, any>
) {
  switch (action) {
    case "enhance":
      return buildTransformResult(cloudName, publicId,
        `${options.effects || "e_viesus_correct"}/q_${options.quality || "auto:best"}/f_${options.format || "auto"}`
      );

    case "upscale":
      return buildTransformResult(cloudName, publicId, "e_upscale/q_auto:best/f_auto");

    case "background":
      return buildTransformResult(cloudName, publicId,
        options.remove
          ? "e_background_removal/q_auto:best/f_auto"
          : `e_gen_background_replace:prompt_${encodeURIComponent(options.prompt || "rustic wooden restaurant interior")}/q_auto:best/f_auto`
      );

    case "transform":
      return buildResizeResult(cloudName, publicId, options);

    case "ocr":
      return await handleOcr(cloudName, apiKey, apiSecret, publicId, imageUrl);

    case "analyze":
      return await handleAnalyze(cloudName, apiKey, apiSecret, publicId, imageUrl, options);

    case "generative_fill":
      return buildTransformResult(cloudName, publicId,
        `c_pad,w_${options.width || 1920},h_${options.height || 1080},g_center,b_gen_fill/q_auto:best/f_auto`
      );

    case "effects":
      return buildTransformResult(cloudName, publicId,
        `e_${options.effect || "art:hokusai"}/q_auto:best/f_auto`
      );

    case "upload": {
      if (!imageUrl) throw new Error("image_url is required for upload action");
      const folder = options.folder || "design-menumat-app";
      const prefix = options.public_id_prefix || "";
      const uploaded = await uploadFromUrl(cloudName, apiKey, apiSecret, imageUrl, folder, prefix);
      return { url: uploaded.secure_url, public_id: uploaded.public_id };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// ── Transform URL builders ───────────────────────────────────────────

function cdnUrl(cloudName: string, publicId: string, transformations: string) {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`;
}

function buildTransformResult(cloudName: string, publicId: string, transformations: string) {
  return { url: cdnUrl(cloudName, publicId, transformations), transformations, public_id: publicId };
}

function buildResizeResult(cloudName: string, publicId: string, options: Record<string, any>) {
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
  return buildTransformResult(cloudName, publicId, parts.join(","));
}

// ── OCR (Google OCR add-on) ──────────────────────────────────────────

async function handleOcr(
  cloudName: string, apiKey: string, apiSecret: string,
  publicId: string, imageUrl?: string
) {
  // Re-upload with ocr detection enabled
  const timestamp = Math.floor(Date.now() / 1000);
  const ocrPublicId = `menugen/ocr_${timestamp}`;
  const toSign = `ocr=adv_ocr&overwrite=true&public_id=${ocrPublicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = await sha1Hex(toSign);

  const sourceUrl = imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

  const form = new FormData();
  form.append("file", sourceUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("public_id", ocrPublicId);
  form.append("ocr", "adv_ocr");
  form.append("overwrite", "true");

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(`OCR upload failed: ${resp.status} - ${JSON.stringify(data)}`);

  return {
    public_id: publicId,
    ocr_data: data.info?.ocr?.adv_ocr ?? null,
    text: extractOcrText(data.info?.ocr?.adv_ocr),
  };
}

function extractOcrText(ocrData: any): string {
  if (!ocrData?.data) return "";
  try {
    return ocrData.data
      .map((page: any) => page.fullTextAnnotation?.text || "")
      .join("\n")
      .trim();
  } catch {
    return "";
  }
}

// ── AI Vision / Content Analysis ─────────────────────────────────────

async function handleAnalyze(
  cloudName: string, apiKey: string, apiSecret: string,
  publicId: string | undefined, imageUrl: string | undefined,
  options: Record<string, any>
) {
  const authHeader = "Basic " + btoa(`${apiKey}:${apiSecret}`);
  const uri = imageUrl || `https://res.cloudinary.com/${cloudName}/image/upload/${publicId || "sample"}`;

  // Use ai_vision_general for prompted analysis, captioning as fallback
  const model = options.prompt ? "ai_vision_general" : "captioning";
  const body: Record<string, any> = {
    source: { uri },
  };
  if (options.prompt) {
    body.prompts = [options.prompt];
  }

  const resp = await fetch(`https://api.cloudinary.com/v2/analysis/${cloudName}/analyze/${model}`, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Analyze API error: ${resp.status} - ${JSON.stringify(data)}`);
  }
  return data;
}

// ── Upload helper ────────────────────────────────────────────────────

async function uploadFromUrl(
  cloudName: string, apiKey: string, apiSecret: string, url: string,
  folder = "menugen", publicIdPrefix = ""
): Promise<{ public_id: string; secure_url: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const actualFolder = folder;
  const signParts = [`folder=${actualFolder}`];
  let publicId: string | undefined;
  if (publicIdPrefix) {
    publicId = `${actualFolder}/${publicIdPrefix}_${timestamp}`;
    signParts.push(`public_id=${publicId}`);
  }
  signParts.push(`timestamp=${timestamp}`);
  const signature = await sha1Hex(signParts.join("&") + apiSecret);

  const form = new FormData();
  form.append("file", url);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp.toString());
  form.append("signature", signature);
  form.append("folder", actualFolder);
  if (publicId) form.append("public_id", publicId);

  const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Cloudinary upload failed: ${resp.status} - ${errText}`);
  }
  return await resp.json();
}

// ── Utilities ────────────────────────────────────────────────────────

async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
