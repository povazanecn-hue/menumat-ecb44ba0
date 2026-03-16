import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { ingredientName, currentPrice, unit } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Si odborník na gastronómiu a nákup surovín pre reštaurácie na Slovensku. 
Používateľ ti dá názov ingrediencie, jej aktuálnu cenu a jednotku.
Navrhni 3 lacnejšie alternatívy/náhrady, ktoré sa dajú použiť v receptúrach.
Pre každú alternatívu uveď:
- názov
- odhadovanú cenu za rovnakú jednotku
- prečo je to dobrá náhrada
- percentuálnu úsporu

Odpovedaj v slovenčine. Buď konkrétny a praktický.`;

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
          {
            role: "user",
            content: `Ingrediencia: ${ingredientName}\nAktuálna cena: ${currentPrice}€ / ${unit}\n\nNavrhni lacnejšie alternatívy.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_alternatives",
              description: "Return 3 cheaper ingredient alternatives",
              parameters: {
                type: "object",
                properties: {
                  alternatives: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Name of alternative ingredient" },
                        estimated_price: { type: "number", description: "Estimated price per same unit" },
                        reason: { type: "string", description: "Why this is a good substitute" },
                        saving_percent: { type: "number", description: "Percentage saved compared to original" },
                      },
                      required: ["name", "estimated_price", "reason", "saving_percent"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["alternatives"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_alternatives" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, skúste to neskôr." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Nedostatok kreditov pre AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const alternatives = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(alternatives), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-ingredient-alternative error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
