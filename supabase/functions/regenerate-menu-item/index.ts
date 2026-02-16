const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RegenerateRequest {
  // What to regenerate
  level: "side_dish" | "dish" | "day" | "week";
  // Context
  dishes: { id: string; name: string; category: string; is_daily_menu: boolean; final_price: number | null; recommended_price: number }[];
  recentUsage: Record<string, string>;
  nonRepeatDays: number;
  // For dish/side_dish level
  currentDishId?: string;
  currentDishName?: string;
  currentCategory?: string;
  // For day level
  currentDayItems?: { dishId: string; category: string }[];
  // For week level
  weekDays?: { dayName: string; items: { dishId: string; category: string }[] }[];
  // Day structure for day/week regeneration
  daySlots?: { soups: number; mains: number; desserts: number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body: RegenerateRequest = await req.json();
    const { level, dishes, recentUsage, nonRepeatDays, currentDishId, currentDishName, currentCategory, currentDayItems, weekDays, daySlots } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const recentIds = new Set(Object.keys(recentUsage || {}));
    const eligibleDishes = dishes.filter((d) => !recentIds.has(d.id));

    const dishList = eligibleDishes.map((d) =>
      `ID:${d.id} | ${d.name} | category:${d.category} | daily_menu:${d.is_daily_menu}`
    ).join("\n");

    let systemPrompt = "";
    let expectedFormat = "";

    if (level === "side_dish") {
      systemPrompt = `You are a Slovak restaurant menu assistant. 
The user wants to REGENERATE just the SIDE DISH (príloha) for the dish "${currentDishName}".
Suggest 1 side dish name in Slovak that pairs well with this dish.
Return ONLY JSON: {"side_dish": "názov prílohy"}
Examples of side dishes: ryža, hranolky, zemiakový šalát, knedľa, dusená zelenina, opekané zemiaky, šalát, zemiakové pyré, lokše.`;
      expectedFormat = '{"side_dish": "..."}';
    } else if (level === "dish") {
      systemPrompt = `You are a Slovak restaurant daily menu generator.
Replace ONE dish. Current dish: "${currentDishName}" (category: ${currentCategory}).
Select a DIFFERENT dish of the SAME category from the list below.
Do NOT pick any recently used dish.

AVAILABLE DISHES:
${dishList}

Return ONLY JSON: {"dish_id": "selected_id", "side_dish": "optional side dish suggestion or null"}`;
      expectedFormat = '{"dish_id": "...", "side_dish": "..."}';
    } else if (level === "day") {
      const slots = daySlots || { soups: 1, mains: 3, desserts: 1 };
      systemPrompt = `You are a Slovak restaurant daily menu generator.
Regenerate an ENTIRE DAY menu. Select dishes from the database.
DO NOT use recently used dishes.

SLOTS: ${slots.soups} soups, ${slots.mains} mains, ${slots.desserts} desserts.

AVAILABLE DISHES:
${dishList}

Return ONLY JSON: {"soups": ["id1"], "mains": ["id1","id2","id3"], "desserts": ["id1"]}`;
      expectedFormat = '{"soups": [...], "mains": [...], "desserts": [...]}';
    } else if (level === "week") {
      const slots = daySlots || { soups: 1, mains: 3, desserts: 1 };
      systemPrompt = `You are a Slovak restaurant weekly menu generator.
Generate menus for 5 days (Monday-Friday). Each day needs: ${slots.soups} soups, ${slots.mains} mains, ${slots.desserts} desserts.
DO NOT repeat any dish within the week. DO NOT use recently used dishes.

AVAILABLE DISHES:
${dishList}

Return ONLY JSON: {"days": [{"soups": ["id"], "mains": ["id","id"], "desserts": ["id"]}, ...]}
Exactly 5 day objects.`;
      expectedFormat = '{"days": [{...}, {...}, {...}, {...}, {...}]}';
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate now. Return only valid JSON in format: ${expectedFormat}` },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Príliš veľa požiadaviek. Skúste neskôr." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Chyba AI služby" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI vrátila neplatný formát", raw: content }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate dish IDs exist
    const allDishIds = new Set(dishes.map((d) => d.id));
    if (parsed.dish_id && !allDishIds.has(parsed.dish_id)) {
      parsed.dish_id = null;
    }
    if (parsed.soups) parsed.soups = parsed.soups.filter((id: string) => allDishIds.has(id));
    if (parsed.mains) parsed.mains = parsed.mains.filter((id: string) => allDishIds.has(id));
    if (parsed.desserts) parsed.desserts = parsed.desserts.filter((id: string) => allDishIds.has(id));
    if (parsed.days) {
      for (const day of parsed.days) {
        if (day.soups) day.soups = day.soups.filter((id: string) => allDishIds.has(id));
        if (day.mains) day.mains = day.mains.filter((id: string) => allDishIds.has(id));
        if (day.desserts) day.desserts = day.desserts.filter((id: string) => allDishIds.has(id));
      }
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("regenerate-menu-item error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
