const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OcrMenuItem {
  name: string;
  category: string; // polievka, hlavne_jedlo, dezert, etc.
  slot: string;     // "Polievka", "Menu 1", "Dezert", etc.
  grammage: string;
  price: number | null;
  allergens: number[];
}

interface OcrDay {
  dayName: string;
  dateStr: string;
  items: OcrMenuItem[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, mimeType, fileName, mode, imageUrl } = await req.json();
    if (!fileBase64 && !imageUrl) {
      return new Response(JSON.stringify({ dishes: [], error: "No file provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const isImage = mimeType?.startsWith("image/");
    const isPdf = mimeType === "application/pdf";
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      || mimeType === "application/msword"
      || fileName?.toLowerCase().endsWith(".docx")
      || fileName?.toLowerCase().endsWith(".doc");

    // Structured mode: extract weekly menu with days, categories, prices
    const structuredMode = mode === "structured";

    const structuredPrompt = `Analyzuj tento dokument, ktorý obsahuje denné menu reštaurácie (týždenný jedálny lístok).
Extrahuj VŠETKY jedlá rozdelené podľa DŇA (Pondelok-Piatok).

Pre KAŽDÝ DEŇ vráť objekt s:
- "dayName": názov dňa (Pondelok, Utorok, Streda, Štvrtok, Piatok)
- "dateStr": dátum ak je uvedený, inak ""
- "items": pole jedál, kde každé jedlo má:
  - "name": názov jedla (bez cien, gramáže, alergénov, čísiel menu)
  - "category": jedna z: "polievka", "hlavne_jedlo", "dezert", "predjedlo", "salat", "pizza", "burger", "pasta", "napoj", "ine"
  - "slot": typ pozície ("Polievka", "Menu 1", "Menu 2", "Menu 3", "Menu 4", "Menu 5", "Menu S", "Menu P", "Dezert", "Šalát", "Burger")
  - "grammage": gramáž ak je (napr. "150g", "300ml"), inak ""
  - "price": cena v EUR číslo ak je, inak null
  - "allergens": pole čísel alergénov 1-14

DÔLEŽITÉ pravidlá:
- Polievky majú category "polievka" a slot "Polievka"
- Hlavné jedlá majú category "hlavne_jedlo" a slot "Menu 1", "Menu 2" atď.
- Dezerty majú category "dezert" a slot "Dezert"
- Vyčisti názvy: odstráň čísla menu, ceny, gramáže z názvu jedla
- Ak dokument nemá dennú štruktúru, vráť jeden deň s dayName "Neznámy"

Vráť IBA JSON pole dní:
[{"dayName":"Pondelok","dateStr":"17.2.","items":[{"name":"Cesnaková polievka","category":"polievka","slot":"Polievka","grammage":"300ml","price":1.50,"allergens":[1,3]}]}]`;

    const simplePrompt = `Analyze this ${isPdf ? "PDF document" : isImage ? "image" : "document"} which contains a restaurant daily menu.
Extract ALL dish/food names from it. Ignore headers, prices, dates, allergens, and other non-dish text.

Return ONLY a JSON array of dish name strings, e.g.:
["Slepačia polievka s rezancami", "Vyprážaný rezeň so zemiakovým šalátom", "Čokoládový koláč"]

If you cannot read the document or find no dishes, return an empty array: []
Do not add any explanation, only the JSON array.`;

    const userContent: any[] = [
      {
        type: "text",
        text: structuredMode ? structuredPrompt : simplePrompt,
      },
    ];

    // If we have a pre-processed image URL (e.g. from Cloudinary enhance), use it directly
    if (imageUrl) {
      userContent.unshift({
        type: "image_url",
        image_url: { url: imageUrl },
      });
    } else if (isImage || isPdf || isDocx) {
      // For images, PDFs, and docx - include as inline data for vision model
      userContent.unshift({
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
        },
      });
    } else {
      // Try to decode text-based files
      try {
        const text = atob(fileBase64);
        userContent[0].text += `\n\nDocument content:\n${text.slice(0, 8000)}`;
      } catch {
        // Binary file - send as image data
        userContent.unshift({
          type: "image_url",
          image_url: {
            url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
          },
        });
      }
    }

    // Use Gemini 2.5 Flash for vision/OCR - good balance of speed and quality
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ dishes: [], days: [], error: "Príliš veľa požiadaviek. Skúste znovu o chvíľu." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI OCR error:", response.status, errText);
      return new Response(JSON.stringify({ dishes: [], days: [], error: `AI chyba: ${response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse response
    let jsonStr = content;
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];
    jsonStr = jsonStr.trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI OCR response:", content.slice(0, 500));
      return new Response(JSON.stringify({ dishes: [], days: [], error: "AI vrátila neplatný formát", raw: content.slice(0, 300) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (structuredMode) {
      // Validate and clean structured data
      const days: OcrDay[] = [];
      const arr = Array.isArray(parsed) ? parsed : (parsed.days || [parsed]);

      for (const day of arr) {
        if (!day.dayName && !day.items) continue;
        const cleanItems: OcrMenuItem[] = (day.items || [])
          .filter((item: any) => item.name && item.name.trim().length > 0)
          .map((item: any) => ({
            name: String(item.name).trim(),
            category: item.category || "hlavne_jedlo",
            slot: item.slot || "Menu",
            grammage: item.grammage || "",
            price: typeof item.price === "number" ? item.price : null,
            allergens: Array.isArray(item.allergens)
              ? item.allergens.filter((a: number) => a >= 1 && a <= 14)
              : [],
          }));

        if (cleanItems.length > 0) {
          days.push({
            dayName: day.dayName || "Neznámy",
            dateStr: day.dateStr || "",
            items: cleanItems,
          });
        }
      }

      const totalItems = days.reduce((s, d) => s + d.items.length, 0);
      console.log(`OCR structured: ${days.length} days, ${totalItems} items extracted`);

      return new Response(JSON.stringify({ days, dishes: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Simple mode - flat list of dish names
      let dishes: string[] = [];
      if (Array.isArray(parsed)) {
        dishes = parsed.filter((d: any) => typeof d === "string" && d.trim().length > 0);
      }

      return new Response(JSON.stringify({ dishes, days: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("ocr-menu-import error:", e);
    return new Response(
      JSON.stringify({ dishes: [], days: [], error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
