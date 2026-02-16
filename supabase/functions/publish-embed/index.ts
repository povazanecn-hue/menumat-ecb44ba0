import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DISH_CATEGORIES: Record<string, string> = {
  polievka: "Polievky",
  hlavne_jedlo: "Hlavné jedlá",
  dezert: "Dezerty",
  predjedlo: "Predjedlá",
  salat: "Šaláty",
  pizza: "Pizza",
  burger: "Burgery",
  pasta: "Pasta",
  napoj: "Nápoje",
  ine: "Iné",
};

interface MenuItem {
  sort_order: number;
  override_price: number | null;
  dish: {
    name: string;
    category: string;
    allergens: number[];
    grammage: string | null;
    final_price: number | null;
    recommended_price: number;
  };
}

function getPrice(item: MenuItem): string {
  const p = item.override_price ?? item.dish.final_price ?? item.dish.recommended_price;
  return `${p.toFixed(2)} €`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function generateEmbedHTML(menuDate: string, items: MenuItem[], restaurantName: string): string {
  const dateLabel = formatDate(menuDate);
  const groups: Record<string, MenuItem[]> = {};
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const cat = item.dish.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  let sections = "";
  for (const [cat, catItems] of Object.entries(groups)) {
    let rows = "";
    for (const item of catItems) {
      const allergens = item.dish.allergens.length
        ? `<span class="mg-allergens">A: ${item.dish.allergens.join(", ")}</span>`
        : "";
      const grammage = item.dish.grammage
        ? `<span class="mg-grammage">${item.dish.grammage}</span>`
        : "";
      rows += `
      <div class="mg-item">
        <div class="mg-item-info">
          <span class="mg-name">${item.dish.name}</span>
          ${grammage}
          ${allergens}
        </div>
        <span class="mg-price">${getPrice(item)}</span>
      </div>`;
    }
    sections += `
    <div class="mg-category">
      <h3 class="mg-category-title">${DISH_CATEGORIES[cat] || cat}</h3>
      ${rows}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Denné menu – ${dateLabel} | ${restaurantName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#faf8f5;color:#2c1810;padding:24px;max-width:720px;margin:0 auto}
.mg-header{text-align:center;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #d4c4a8}
.mg-title{font-size:28px;font-weight:700;color:#3b2a1a;margin-bottom:4px}
.mg-date{font-size:16px;color:#8b7355}
.mg-restaurant{font-size:14px;color:#a08b6d;margin-top:4px}
.mg-category{margin-bottom:24px}
.mg-category-title{font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#8b5e3c;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #e8dcc8}
.mg-item{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px dotted #e0d5c0}
.mg-item:last-child{border-bottom:none}
.mg-item-info{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;flex:1;min-width:0}
.mg-name{font-size:16px;font-weight:500}
.mg-grammage{font-size:13px;color:#8b7355}
.mg-allergens{font-size:12px;color:#a08b6d;font-style:italic}
.mg-price{font-size:16px;font-weight:700;white-space:nowrap;margin-left:16px}
.mg-footer{margin-top:32px;text-align:center;font-size:11px;color:#c4b49a}
</style>
</head>
<body>
<div class="mg-header">
  <div class="mg-title">Denné menu</div>
  <div class="mg-date">${dateLabel}</div>
  <div class="mg-restaurant">${restaurantName}</div>
</div>
${sections}
<div class="mg-footer">Generované cez MenuGen</div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token for RLS
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for storage operations
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { menuId } = await req.json();
    if (!menuId) {
      return new Response(JSON.stringify({ error: "menuId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch menu with items (using user's RLS context)
    const { data: menu, error: menuError } = await userClient
      .from("menus")
      .select("*, menu_items(*, dish:dishes(name, category, allergens, grammage, final_price, recommended_price))")
      .eq("id", menuId)
      .single();

    if (menuError || !menu) {
      return new Response(JSON.stringify({ error: "Menu not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get restaurant name
    const { data: restaurant } = await userClient
      .from("restaurants")
      .select("name")
      .eq("id", menu.restaurant_id)
      .single();

    const restaurantName = restaurant?.name ?? "Reštaurácia";

    // Generate the embed HTML
    const html = generateEmbedHTML(menu.menu_date, menu.menu_items as MenuItem[], restaurantName);

    // Idempotent key: restaurant_id/date hash ensures no duplicates
    const filePath = `${menu.restaurant_id}/${menu.menu_date}.html`;

    // Upload (upsert) to storage — same path overwrites existing file
    const { error: uploadError } = await serviceClient.storage
      .from("menu-embeds")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true, // idempotent: same day = same file, overwritten
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to publish embed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get public URL
    const { data: urlData } = serviceClient.storage
      .from("menu-embeds")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Generate iframe snippet
    const embedSnippet = `<iframe src="${publicUrl}" style="width:100%;max-width:720px;min-height:400px;border:none;" title="Denné menu – ${formatDate(menu.menu_date)}"></iframe>`;

    return new Response(
      JSON.stringify({
        url: publicUrl,
        embedSnippet,
        filePath,
        date: menu.menu_date,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("publish-embed error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
