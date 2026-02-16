const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, mimeType, fileName } = await req.json();
    if (!fileBase64) {
      return new Response(JSON.stringify({ dishes: [], error: "No file provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Use Gemini vision model for OCR on images/PDFs
    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    const userContent: any[] = [
      {
        type: "text",
        text: `Analyze this ${isPdf ? "PDF document" : isImage ? "image" : "document"} which contains a restaurant daily menu.
Extract ALL dish/food names from it. Ignore headers, prices, dates, allergens, and other non-dish text.

Return ONLY a JSON array of dish name strings, e.g.:
["Slepačia polievka s rezancami", "Vyprážaný rezeň so zemiakovým šalátom", "Čokoládový koláč"]

If you cannot read the document or find no dishes, return an empty array: []
Do not add any explanation, only the JSON array.`,
      },
    ];

    // For images and PDFs, include as inline data
    if (isImage || isPdf) {
      userContent.unshift({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
        },
      });
    } else {
      // For text-based files (docx converted to text on client), just pass as text
      try {
        const text = atob(fileBase64);
        userContent[0].text += `\n\nDocument content:\n${text.slice(0, 5000)}`;
      } catch {
        // binary file, try as image anyway
        userContent.unshift({
          type: "image_url",
          image_url: {
            url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
          },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI OCR error:", response.status, errText);
      return new Response(JSON.stringify({ dishes: [], error: `AI error: ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let dishes: string[] = [];
    try {
      let jsonStr = content;
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      const parsed = JSON.parse(jsonStr.trim());
      if (Array.isArray(parsed)) {
        dishes = parsed.filter((d: any) => typeof d === "string" && d.trim().length > 0);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    return new Response(JSON.stringify({ dishes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ocr-menu-import error:", e);
    return new Response(
      JSON.stringify({ dishes: [], error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
