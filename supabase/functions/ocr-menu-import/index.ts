const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OcrMenuItem {
  name: string;
  category: string;
  slot: string;
  grammage: string;
  price: number | null;
  allergens: number[];
}

interface OcrDay {
  dayName: string;
  dateStr: string;
  items: OcrMenuItem[];
}

async function callAI(apiKey: string, messages: any[]) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: false,
    }),
  });
  return response;
}

function parseJsonFromAI(content: string): any {
  let jsonStr = content;
  const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1];
  jsonStr = jsonStr.trim();
  return JSON.parse(jsonStr);
}

function cleanStructuredDays(parsed: any): OcrDay[] {
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
  return days;
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

    const structuredMode = mode === "structured";

    // === PASS 1: Raw OCR extraction ===
    const rawOcrPrompt = `Extrahuj CELÝ text z tohto ${isPdf ? "PDF dokumentu" : isImage ? "obrázka" : "dokumentu"} presne tak, ako je napísaný.
Zachovaj pôvodnú štruktúru vrátane riadkov, čísel, cien, alergénov.
Neupravuj, neopravuj preklepy, len prepíš text čo najvernejšie.
Vráť IBA surový text, žiadne JSON, žiadne vysvetlenia.`;

    const userContent: any[] = [{ type: "text", text: rawOcrPrompt }];

    if (imageUrl) {
      userContent.unshift({ type: "image_url", image_url: { url: imageUrl } });
    } else if (isImage || isPdf || isDocx) {
      userContent.unshift({
        type: "image_url",
        image_url: {
          url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
        },
      });
    } else {
      try {
        const text = atob(fileBase64);
        userContent[0].text += `\n\nDocument content:\n${text.slice(0, 8000)}`;
      } catch {
        userContent.unshift({
          type: "image_url",
          image_url: {
            url: `data:${mimeType || "application/octet-stream"};base64,${fileBase64}`,
          },
        });
      }
    }

    console.log("OCR Pass 1: Raw text extraction...");
    const pass1Response = await callAI(LOVABLE_API_KEY, [{ role: "user", content: userContent }]);

    if (!pass1Response.ok) {
      if (pass1Response.status === 429) {
        return new Response(JSON.stringify({ dishes: [], days: [], error: "Príliš veľa požiadaviek. Skúste znovu o chvíľu." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await pass1Response.text();
      console.error("AI OCR Pass 1 error:", pass1Response.status, errText);
      return new Response(JSON.stringify({ dishes: [], days: [], error: `AI chyba: ${pass1Response.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pass1Data = await pass1Response.json();
    const rawText = pass1Data.choices?.[0]?.message?.content || "";
    console.log(`OCR Pass 1 done: ${rawText.length} chars extracted`);

    if (!rawText.trim()) {
      return new Response(JSON.stringify({ dishes: [], days: [], error: "OCR nerozpoznal žiadny text" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === PASS 2: AI correction + structuring ===
    const correctionPrompt = structuredMode
      ? `Si expert na slovenské reštauračné menu. Dostaneš surový OCR text z jedálneho lístka.
Tvoja úloha:
1. OPRAV preklepy a chyby z OCR (napr. "poIievka" → "polievka", "rezeft" → "rezeň", "0,50" cena → oprav na správnu)
2. ROZPOZNAJ štruktúru menu podľa dní (Pondelok-Piatok)
3. KATEGORIZUJ jedlá správne

Pre KAŽDÝ DEŇ vráť objekt s:
- "dayName": názov dňa (Pondelok, Utorok, Streda, Štvrtok, Piatok)
- "dateStr": dátum ak je uvedený, inak ""
- "items": pole jedál, kde každé jedlo má:
  - "name": OPRAVENÝ názov jedla (bez cien, gramáže, alergénov, čísiel menu)
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
- OPRAV slovenské diakritické znaky (č, š, ž, ť, ď, ň, ľ, á, é, í, ó, ú, ý, ô, ä)

Vráť IBA JSON pole dní:
[{"dayName":"Pondelok","dateStr":"17.2.","items":[{"name":"Cesnaková polievka","category":"polievka","slot":"Polievka","grammage":"300ml","price":1.50,"allergens":[1,3]}]}]

Surový OCR text:
${rawText}`
      : `Si expert na slovenské reštauračné menu. Dostaneš surový OCR text z jedálneho lístka.
Tvoja úloha:
1. OPRAV preklepy a chyby z OCR
2. EXTRAHUJ iba názvy jedál (bez cien, gramáží, alergénov)
3. OPRAV slovenské diakritické znaky

Vráť IBA JSON pole opravených názvov jedál, napr.:
["Slepačia polievka s rezancami", "Vyprážaný rezeň so zemiakovým šalátom"]

Surový OCR text:
${rawText}`;

    console.log("OCR Pass 2: AI correction + structuring...");
    const pass2Response = await callAI(LOVABLE_API_KEY, [
      { role: "system", content: "Si odborník na slovenské jedlá a reštauračné menu. Oprav OCR chyby a štruktúruj dáta presne podľa inštrukcií." },
      { role: "user", content: correctionPrompt },
    ]);

    if (!pass2Response.ok) {
      if (pass2Response.status === 429) {
        return new Response(JSON.stringify({ dishes: [], days: [], error: "Príliš veľa požiadaviek. Skúste znovu o chvíľu." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI OCR Pass 2 error:", pass2Response.status);
      // Fallback: return raw text as single dish list
      return new Response(JSON.stringify({ dishes: rawText.split("\n").filter(Boolean), days: [], error: "Korekcia zlyhala, vrátené surové dáta" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pass2Data = await pass2Response.json();
    const correctedContent = pass2Data.choices?.[0]?.message?.content || "";

    let parsed: any;
    try {
      parsed = parseJsonFromAI(correctedContent);
    } catch {
      console.error("Failed to parse corrected response:", correctedContent.slice(0, 500));
      return new Response(JSON.stringify({ dishes: [], days: [], error: "AI vrátila neplatný formát po korekcii", raw: correctedContent.slice(0, 300) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (structuredMode) {
      const days = cleanStructuredDays(parsed);
      const totalItems = days.reduce((s, d) => s + d.items.length, 0);
      console.log(`OCR Pass 2 done: ${days.length} days, ${totalItems} items (corrected)`);

      return new Response(JSON.stringify({ days, dishes: [], rawOcrText: rawText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      let dishes: string[] = [];
      if (Array.isArray(parsed)) {
        dishes = parsed.filter((d: any) => typeof d === "string" && d.trim().length > 0);
      }
      return new Response(JSON.stringify({ dishes, days: [], rawOcrText: rawText }), {
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
