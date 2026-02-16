const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractedDish {
  name: string;
  category: string;
  allergens: number[];
  grammage: string;
  price: number | null;
  is_daily_menu: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, mimeType } = await req.json();
    if (!fileBase64) {
      return new Response(JSON.stringify({ dishes: [], error: "No file provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent: any[] = [
      {
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
        },
      },
      {
        type: "text",
        text: `Analyzuj tento dokument, ktorý obsahuje jedálne lístky reštaurácie Koliesko.
Extrahuj VŠETKY UNIKÁTNE jedlá (bez duplicít). Pre každé jedlo urči:

1. "name" - názov jedla (vyčistený, bez cien, gramáže a alergénov)
2. "category" - jedna z: "polievka", "hlavne_jedlo", "dezert", "predjedlo", "salat", "pizza", "burger", "pasta", "napoj", "ine"
   - Polievky → "polievka"
   - Menu S/P/E/1/2/3 sú hlavné jedlá → "hlavne_jedlo"  
   - Dezerty → "dezert"
   - Šaláty (Poke Bowl, Caesar, atď.) → "salat"
   - Pasta/Risotto → "pasta"
   - Burgery → "burger"
3. "allergens" - pole čísel alergénov 1-14 (z textu ako "1,3,7")
4. "grammage" - gramáž ak je uvedená (napr. "150g", "300ml"), inak ""
5. "price" - cena v EUR ak je uvedená, inak null
6. "is_daily_menu" - true (všetky sú z denného menu)

DÔLEŽITÉ:
- Extrahuj IBA unikátne jedlá (rovnaké jedlo sa môže opakovať v rôznych týždňoch)
- Polievky sú samostatné jedlá
- Ignoruj hlavičky, dátumy, informácie o reštaurácii
- Vyčisti názvy: odstráň "**", čísla menu (S/, P/, E/, 1/, 2/, 3/, 4/), ceny, gramáže z názvu

Vráť IBA JSON pole objektov, bez vysvetlenia:
[{"name":"...","category":"...","allergens":[...],"grammage":"...","price":null,"is_daily_menu":true}]`,
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userContent }],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ dishes: [], error: `AI error: ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let dishes: ExtractedDish[] = [];
    try {
      let jsonStr = content;
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      const parsed = JSON.parse(jsonStr.trim());
      if (Array.isArray(parsed)) {
        dishes = parsed.filter(
          (d: any) => typeof d.name === "string" && d.name.trim().length > 0
        );
      }
    } catch {
      console.error("Failed to parse AI response:", content.slice(0, 500));
    }

    // Deduplicate by normalized name
    const seen = new Set<string>();
    const unique: ExtractedDish[] = [];
    for (const d of dishes) {
      const key = d.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(d);
      }
    }

    return new Response(JSON.stringify({ dishes: unique }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("import-dishes-from-doc error:", e);
    return new Response(
      JSON.stringify({ dishes: [], error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
