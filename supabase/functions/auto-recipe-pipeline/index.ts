const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IngredientLine {
  name: string;
  quantity: number;
  unit: string;
  vat_category: string;
}

interface RecipeData {
  instructions: string;
  ingredients: IngredientLine[];
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  source_url: string | null;
}

const INGREDIENT_VAT_RATES: Record<string, number> = {
  maso: 10,
  ryby: 10,
  zelenina: 10,
  ovocie: 10,
  mliecne: 10,
  pecivo: 10,
  vajcia: 10,
  oleje: 20,
  korenie: 20,
  alkohol: 20,
  napoje: 20,
  ostatne: 20,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dish_id, dish_name, restaurant_id } = await req.json();
    if (!dish_id || !dish_name) {
      return new Response(JSON.stringify({ error: "dish_id and dish_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    // ── Phase A: Find recipe via Perplexity ──
    let recipeText = "";
    let sourceUrl: string | null = null;

    if (PERPLEXITY_API_KEY) {
      try {
        const pxResp = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content:
                  "Si kuchársky asistent. Nájdi overený recept zo slovenských alebo českých zdrojov (varecha.sk, toprecepty.sk, recepty.sk, knihy). Vráť kompletný recept s presným zoznamom surovín (množstvo + jednotka) a postupom prípravy. Odpovedaj po slovensky.",
              },
              {
                role: "user",
                content: `Nájdi recept na: "${dish_name}". Uveď presný zoznam surovín s množstvami a jednotkami, postup prípravy, čas prípravy a varenia, počet porcií.`,
              },
            ],
          }),
        });

        if (pxResp.ok) {
          const pxData = await pxResp.json();
          recipeText = pxData.choices?.[0]?.message?.content || "";
          // Try to extract source URL from citations
          if (pxData.citations?.length > 0) {
            sourceUrl = pxData.citations[0];
          }
        } else {
          console.error("Perplexity error:", pxResp.status);
        }
      } catch (e) {
        console.error("Perplexity failed:", e);
      }
    }

    // Fallback: use Gemini to generate recipe if Perplexity unavailable
    if (!recipeText) {
      const fallbackResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Si kuchársky asistent. Vytvor recept s presným zoznamom surovín (množstvo, jednotka) a postupom prípravy. Odpovedaj po slovensky.",
            },
            {
              role: "user",
              content: `Vytvor recept na: "${dish_name}". Uveď presný zoznam surovín s množstvami a jednotkami (g, kg, ml, l, ks), postup prípravy, čas prípravy a varenia, počet porcií.`,
            },
          ],
          stream: false,
        }),
      });

      if (fallbackResp.ok) {
        const fbData = await fallbackResp.json();
        recipeText = fbData.choices?.[0]?.message?.content || "";
      }
    }

    if (!recipeText) {
      return new Response(JSON.stringify({ error: "Nepodarilo sa nájsť recept", phase: "recipe_search" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Phase B: Extract structured data via Gemini ──
    const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extrahuj štruktúrované dáta z receptu. Vráť IBA JSON:
{
  "instructions": "postup prípravy ako text",
  "ingredients": [
    {"name": "názov suroviny", "quantity": 250, "unit": "g", "vat_category": "maso|ryby|zelenina|ovocie|mliecne|pecivo|vajcia|oleje|korenie|alkohol|napoje|ostatne"}
  ],
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "servings": 4
}

Pravidlá pre vat_category:
- maso: hovädzie, bravčové, kuracie, morčacie, králičie, zverina, údeniny, klobásy
- ryby: ryby, morské plody
- zelenina: všetka zelenina, huby, strukoviny
- ovocie: všetko ovocie, sušené ovocie
- mliecne: mlieko, maslo, smotana, syr, jogurt, tvaroh, kyslá smotana
- pecivo: múka, chlieb, pečivo, strúhanka, cestoviny, ryža, krúpy
- vajcia: vajcia
- oleje: olej, olivový olej, bravčová masť, kokosový olej
- korenie: soľ, korenie, bylinky, horčica, kečup, ocot, cukor, med
- alkohol: víno, pivo, rum, likér
- napoje: voda, džús, sirup
- ostatne: všetko ostatné

Jednotky normalizuj na: g, kg, ml, l, ks, lyžica, lyžička, šálka, štipka`,
          },
          {
            role: "user",
            content: `Recept na "${dish_name}":\n\n${recipeText.slice(0, 4000)}`,
          },
        ],
        stream: false,
      }),
    });

    if (!extractResp.ok) {
      return new Response(JSON.stringify({ error: "Chyba extrakcie surovín", phase: "extraction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractData = await extractResp.json();
    const extractContent = extractData.choices?.[0]?.message?.content || "";

    let recipe: RecipeData;
    try {
      let jsonStr = extractContent;
      const match = extractContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1];
      const parsed = JSON.parse(jsonStr.trim());
      recipe = {
        instructions: parsed.instructions || "",
        ingredients: parsed.ingredients || [],
        prep_time_minutes: parsed.prep_time_minutes || null,
        cook_time_minutes: parsed.cook_time_minutes || null,
        servings: parsed.servings || 4,
        source_url: sourceUrl,
      };
    } catch {
      return new Response(JSON.stringify({ error: "Neplatný formát extrakcie", phase: "parse", raw: extractContent.slice(0, 500) }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Phase C: Save to database ──
    const supabaseHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    };

    // C1: Check if recipe already exists and is locked
    const existingRecipeResp = await fetch(
      `${SUPABASE_URL}/rest/v1/recipes?dish_id=eq.${dish_id}&select=id,is_locked`,
      { headers: supabaseHeaders }
    );
    const existingRecipes = await existingRecipeResp.json();

    if (existingRecipes?.length > 0 && existingRecipes[0].is_locked) {
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true, 
        reason: "Recipe is locked" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // C2: Upsert recipe
    const recipePayload = {
      dish_id,
      instructions: recipe.instructions,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      servings: recipe.servings,
      source_metadata: recipe.source_url || "ai_generated",
      ai_confidence: PERPLEXITY_API_KEY && sourceUrl ? 0.85 : 0.6,
      is_locked: false,
      updated_at: new Date().toISOString(),
    };

    if (existingRecipes?.length > 0) {
      await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${existingRecipes[0].id}`, {
        method: "PATCH",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify(recipePayload),
      });
    } else {
      await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify(recipePayload),
      });
    }

    // C3: Get restaurant_id from dish
    let actualRestaurantId = restaurant_id;
    if (!actualRestaurantId) {
      const dishResp = await fetch(
        `${SUPABASE_URL}/rest/v1/dishes?id=eq.${dish_id}&select=restaurant_id`,
        { headers: supabaseHeaders }
      );
      const dishData = await dishResp.json();
      actualRestaurantId = dishData?.[0]?.restaurant_id;
    }

    if (!actualRestaurantId) {
      return new Response(JSON.stringify({ error: "Restaurant not found for dish" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // C4: For each ingredient, find or create, then link to dish
    // First delete existing dish_ingredients for this dish (to avoid duplicates on re-run)
    await fetch(`${SUPABASE_URL}/rest/v1/dish_ingredients?dish_id=eq.${dish_id}`, {
      method: "DELETE",
      headers: { ...supabaseHeaders, Prefer: "return=minimal" },
    });

    let ingredientsProcessed = 0;
    let pricesFound = 0;

    for (const ing of recipe.ingredients) {
      if (!ing.name || !ing.unit) continue;

      // Normalize unit for DB storage
      const normalizedUnit = normalizeUnit(ing.unit);

      // Check if ingredient already exists (case-insensitive match)
      const searchResp = await fetch(
        `${SUPABASE_URL}/rest/v1/ingredients?restaurant_id=eq.${actualRestaurantId}&name=ilike.${encodeURIComponent(ing.name)}&select=id,base_price`,
        { headers: supabaseHeaders }
      );
      const existingIngs = await searchResp.json();

      let ingredientId: string;

      if (existingIngs?.length > 0) {
        ingredientId = existingIngs[0].id;
      } else {
        // Create new ingredient
        const newIngResp = await fetch(`${SUPABASE_URL}/rest/v1/ingredients`, {
          method: "POST",
          headers: { ...supabaseHeaders, Prefer: "return=representation" },
          body: JSON.stringify({
            name: ing.name,
            unit: normalizedUnit,
            base_price: 0,
            restaurant_id: actualRestaurantId,
          }),
        });
        const newIngData = await newIngResp.json();
        ingredientId = newIngData?.[0]?.id;
        if (!ingredientId) continue;
      }

      // Link ingredient to dish
      await fetch(`${SUPABASE_URL}/rest/v1/dish_ingredients`, {
        method: "POST",
        headers: { ...supabaseHeaders, Prefer: "return=minimal" },
        body: JSON.stringify({
          dish_id,
          ingredient_id: ingredientId,
          quantity: ing.quantity || 0,
          unit: normalizedUnit,
        }),
      });

      ingredientsProcessed++;

      // C5: Try to find price via Firecrawl (only for new ingredients with no price)
      const hasPrice = existingIngs?.[0]?.base_price > 0;
      if (!hasPrice && FIRECRAWL_API_KEY) {
        try {
          const priceResult = await findIngredientPrice(
            ing.name,
            FIRECRAWL_API_KEY,
            LOVABLE_API_KEY,
            SUPABASE_URL,
            supabaseHeaders,
            ingredientId
          );
          if (priceResult) pricesFound++;
        } catch (e) {
          console.error(`Price search failed for ${ing.name}:`, e);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      recipe_found: true,
      source: sourceUrl || "ai_generated",
      ingredients_processed: ingredientsProcessed,
      prices_found: pricesFound,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-recipe-pipeline error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function normalizeUnit(unit: string): string {
  const map: Record<string, string> = {
    gram: "g", gramy: "g", gramov: "g",
    kilogram: "kg", kilogramy: "kg", kilogramov: "kg",
    mililiter: "ml", mililitrov: "ml", mililitre: "ml",
    liter: "l", litre: "l", litrov: "l",
    kus: "ks", kusy: "ks", kusov: "ks",
    lyžica: "lyžica", lyžice: "lyžica", polievková: "lyžica",
    lyžička: "lyžička", lyžičky: "lyžička", čajová: "lyžička",
    šálka: "šálka", šálky: "šálka",
    štipka: "štipka",
  };
  const lower = unit.toLowerCase().trim();
  return map[lower] || lower;
}

async function findIngredientPrice(
  ingredientName: string,
  firecrawlKey: string,
  lovableKey: string,
  supabaseUrl: string,
  supabaseHeaders: Record<string, string>,
  ingredientId: string
): Promise<boolean> {
  // Search for price using Firecrawl
  const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `${ingredientName} cena €`,
      limit: 3,
      lang: "sk",
      country: "SK",
      scrapeOptions: { formats: ["markdown"] },
    }),
  });

  if (!searchResp.ok) return false;
  const searchData = await searchResp.json();
  const results = searchData.data || [];

  if (results.length === 0) return false;

  // Extract price from first result using Gemini
  const firstResult = results[0];
  const markdown = (firstResult.markdown || firstResult.content || "").slice(0, 3000);
  const url = firstResult.url || "";

  // Determine supplier name from URL
  let supplierName = "Web";
  if (url.includes("lidl")) supplierName = "Lidl";
  else if (url.includes("kaufland")) supplierName = "Kaufland";
  else if (url.includes("billa")) supplierName = "Billa";
  else if (url.includes("tesco")) supplierName = "Tesco";
  else if (url.includes("metro")) supplierName = "Metro";

  const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `You extract product prices from web content. Given the ingredient name and page content, find the most relevant price in EUR. Return ONLY JSON: {"price": 1.23, "unit": "kg", "product": "name"}. If not found: {"price": null}.`,
        },
        {
          role: "user",
          content: `Ingredient: "${ingredientName}"\nURL: ${url}\n\nContent:\n${markdown}`,
        },
      ],
      stream: false,
    }),
  });

  if (!extractResp.ok) return false;
  const extractData = await extractResp.json();
  const content = extractData.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    let jsonStr = content;
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];
    parsed = JSON.parse(jsonStr.trim());
  } catch {
    return false;
  }

  if (!parsed.price || parsed.price <= 0) return false;

  // Save supplier price
  await fetch(`${supabaseUrl}/rest/v1/supplier_prices`, {
    method: "POST",
    headers: { ...supabaseHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({
      ingredient_id: ingredientId,
      supplier_name: supplierName,
      price: parsed.price,
      is_promo: false,
      confidence: "ai_extracted",
    }),
  });

  // Update ingredient base_price if it was 0
  await fetch(`${supabaseUrl}/rest/v1/ingredients?id=eq.${ingredientId}&base_price=eq.0`, {
    method: "PATCH",
    headers: { ...supabaseHeaders, Prefer: "return=minimal" },
    body: JSON.stringify({ base_price: parsed.price }),
  });

  return true;
}
