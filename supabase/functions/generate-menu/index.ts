const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dishes, recentUsage, slots, extraSlots, nonRepeatDays } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build dish list for context
    const dishList = dishes.map((d: any) =>
      `ID:${d.id} | ${d.name} | category:${d.category} | price:${d.final_price ?? d.recommended_price}€ | daily_menu:${d.is_daily_menu}`
    ).join("\n");

    // Build recent usage for non-repeat context
    const usageList = Object.entries(recentUsage || {})
      .map(([id, date]) => `ID:${id} last used:${date}`)
      .join("\n");

    // Build extra category slots description
    const extraSlotsDesc = (extraSlots || [])
      .filter((s: any) => s.count > 0)
      .map((s: any) => `- ${s.category}: ${s.count}`)
      .join("\n");

    const extraSlotsJsonFormat = (extraSlots || [])
      .filter((s: any) => s.count > 0)
      .map((s: any) => `"${s.category}": ["dish_id_1"]`)
      .join(", ");

    const systemPrompt = `You are a restaurant daily menu generator for a Slovak restaurant.
Your job is to select dishes from the available dish database to fill the requested slots.

RULES:
1. Select exactly the requested number of dishes per category.
2. NEVER select a dish that was used in the last ${nonRepeatDays || 14} days (check recentUsage).
3. Only select dishes marked as is_daily_menu=true if available, otherwise use any dish of the correct category.
4. Category mapping: polievka=soups, hlavne_jedlo=mains, dezert=desserts.
5. For extra category slots, match the dish category exactly.
6. Return ONLY a valid JSON object with dish IDs grouped by category.
7. Do not add any explanation, only the JSON.

REQUESTED SLOTS:
- Soups (polievka): ${slots.soups}
- Mains (hlavne_jedlo): ${slots.mains}
- Desserts (dezert): ${slots.desserts}
${extraSlotsDesc ? `\nEXTRA CATEGORY SLOTS:\n${extraSlotsDesc}` : ""}

AVAILABLE DISHES:
${dishList}

RECENTLY USED (do NOT pick these):
${usageList || "None"}

Return format:
{
  "soups": ["dish_id_1"],
  "mains": ["dish_id_1", "dish_id_2"],
  "desserts": ["dish_id_1"]${extraSlotsJsonFormat ? `,\n  "extras": {${extraSlotsJsonFormat}}` : ""}
}`;

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
          { role: "user", content: "Generate the daily menu now. Return only JSON." },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Príliš veľa požiadaviek. Skúste neskôr." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Nedostatok kreditov. Dobite si kredity v nastaveniach." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Chyba AI služby" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
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
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ menu: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-menu error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
