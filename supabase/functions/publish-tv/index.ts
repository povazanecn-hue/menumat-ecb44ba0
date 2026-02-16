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
  const months = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

type Template = "country" | "minimal" | "modern";

function getTemplateStyles(template: Template) {
  switch (template) {
    case "modern":
      return {
        bg: "linear-gradient(135deg, #0f0c29 0%, #1a1a2e 50%, #16213e 100%)",
        textColor: "#e8e8e8",
        accentColor: "#e94560",
        accentGlow: "rgba(233, 69, 96, 0.3)",
        headerFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        categoryBorder: "#e94560",
        dotColor: "rgba(233, 69, 96, 0.25)",
        priceColor: "#e94560",
        headerBg: "rgba(233, 69, 96, 0.08)",
        cardBg: "rgba(255,255,255,0.03)",
        footerColor: "rgba(255,255,255,0.25)",
      };
    case "minimal":
      return {
        bg: "#ffffff",
        textColor: "#1a1a1a",
        accentColor: "#111111",
        accentGlow: "rgba(0, 0, 0, 0.05)",
        headerFont: "'Georgia', serif",
        bodyFont: "'Helvetica Neue', 'Arial', sans-serif",
        categoryBorder: "#111111",
        dotColor: "rgba(0, 0, 0, 0.12)",
        priceColor: "#111111",
        headerBg: "transparent",
        cardBg: "rgba(0,0,0,0.02)",
        footerColor: "rgba(0,0,0,0.25)",
      };
    default: // country
      return {
        bg: "linear-gradient(170deg, #1c1108 0%, #170f0a 40%, #1e1610 100%)",
        textColor: "#f2e4cb",
        accentColor: "#d8b469",
        accentGlow: "rgba(216, 180, 105, 0.2)",
        headerFont: "'Playfair Display', Georgia, serif",
        bodyFont: "'Source Sans 3', 'Segoe UI', sans-serif",
        categoryBorder: "#d8b469",
        dotColor: "rgba(216, 180, 105, 0.2)",
        priceColor: "#d8b469",
        headerBg: "rgba(216, 180, 105, 0.06)",
        cardBg: "rgba(216, 180, 105, 0.04)",
        footerColor: "rgba(216, 180, 105, 0.3)",
      };
  }
}

function generateTvHTML(
  menuDate: string,
  items: MenuItem[],
  restaurantName: string,
  template: Template
): string {
  const s = getTemplateStyles(template);
  const dateLabel = formatDate(menuDate);

  const groups: Record<string, MenuItem[]> = {};
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const cat = item.dish.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  // Calculate layout — single or two columns based on item count
  const totalItems = items.length;
  const useTwoColumns = totalItems > 6;

  let sections = "";
  for (const [cat, catItems] of Object.entries(groups)) {
    let rows = "";
    for (const item of catItems) {
      const allergens = item.dish.allergens.length
        ? `<span class="allergens">A: ${item.dish.allergens.join(", ")}</span>`
        : "";
      const grammage = item.dish.grammage
        ? `<span class="grammage">(${item.dish.grammage})</span>`
        : "";
      rows += `
      <div class="item">
        <div class="item-left">
          <span class="dish-name">${item.dish.name}</span>
          ${grammage}
          ${allergens}
        </div>
        <div class="dots"></div>
        <span class="price">${getPrice(item)}</span>
      </div>`;
    }
    sections += `
    <div class="category">
      <h3 class="cat-title">${DISH_CATEGORIES[cat] || cat}</h3>
      ${rows}
    </div>`;
  }

  return `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920">
<title>Denné menu – ${dateLabel} | ${restaurantName}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  html, body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }

  body {
    background: ${s.bg};
    color: ${s.textColor};
    font-family: ${s.bodyFont};
    position: relative;
  }

  /* Subtle texture overlay for country */
  ${template === "country" ? `
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent, transparent 3px,
      rgba(216,180,105,0.015) 3px, rgba(216,180,105,0.015) 4px
    );
    pointer-events: none;
    z-index: 0;
  }
  ` : ""}

  .container {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    padding: 48px 72px;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .header {
    text-align: center;
    padding: 20px 0 28px;
    margin-bottom: 24px;
    border-bottom: 2px solid ${s.accentColor};
    background: ${s.headerBg};
    border-radius: 8px 8px 0 0;
    flex-shrink: 0;
  }

  .restaurant-name {
    font-family: ${s.headerFont};
    font-size: 24px;
    font-weight: 500;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: ${s.accentColor};
    opacity: 0.7;
    margin-bottom: 8px;
  }

  .menu-title {
    font-family: ${s.headerFont};
    font-size: 56px;
    font-weight: 800;
    letter-spacing: 3px;
    color: ${s.textColor};
    text-transform: uppercase;
  }

  .menu-date {
    font-family: ${s.bodyFont};
    font-size: 22px;
    margin-top: 8px;
    color: ${s.accentColor};
    font-weight: 500;
  }

  /* Content area */
  .content {
    flex: 1;
    ${useTwoColumns ? `
    columns: 2;
    column-gap: 56px;
    ` : `
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    `}
  }

  /* Category */
  .category {
    break-inside: avoid;
    margin-bottom: 24px;
  }

  .cat-title {
    font-family: ${s.headerFont};
    font-size: 26px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: ${s.accentColor};
    padding-bottom: 6px;
    margin-bottom: 10px;
    border-bottom: 1px solid ${s.dotColor};
  }

  /* Menu item row */
  .item {
    display: flex;
    align-items: baseline;
    padding: 7px 0;
    gap: 8px;
  }

  .item-left {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    flex-shrink: 0;
  }

  .dish-name {
    font-size: 24px;
    font-weight: 600;
  }

  .grammage {
    font-size: 17px;
    opacity: 0.55;
    font-weight: 400;
  }

  .allergens {
    font-size: 15px;
    opacity: 0.4;
    font-style: italic;
  }

  .dots {
    flex: 1;
    min-width: 20px;
    border-bottom: 2px dotted ${s.dotColor};
    margin-bottom: 5px;
  }

  .price {
    font-size: 26px;
    font-weight: 700;
    color: ${s.priceColor};
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Footer */
  .footer {
    flex-shrink: 0;
    text-align: center;
    padding-top: 16px;
    margin-top: auto;
    font-size: 14px;
    color: ${s.footerColor};
    letter-spacing: 1px;
  }

  /* Auto-refresh every 60s */
  meta[http-equiv="refresh"] { display: none; }
</style>
<meta http-equiv="refresh" content="60">
</head>
<body>
<div class="container">
  <div class="header">
    <div class="restaurant-name">${restaurantName}</div>
    <div class="menu-title">Denné menu</div>
    <div class="menu-date">${dateLabel}</div>
  </div>
  <div class="content">
    ${sections}
  </div>
  <div class="footer">
    Alergény sú označené číslami podľa EU nariadenia 1169/2011
  </div>
</div>
</body>
</html>`;
}

Deno.serve(async (req) => {
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { menuId, template = "country" } = await req.json();
    if (!menuId) {
      return new Response(JSON.stringify({ error: "menuId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch menu with items
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

    // Generate TV HTML
    const html = generateTvHTML(
      menu.menu_date,
      menu.menu_items as MenuItem[],
      restaurantName,
      template as Template
    );

    // Idempotent upload: restaurant_id/tv-YYYY-MM-DD.html
    const filePath = `${menu.restaurant_id}/tv-${menu.menu_date}.html`;

    const { error: uploadError } = await serviceClient.storage
      .from("menu-embeds")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to publish TV display" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = serviceClient.storage
      .from("menu-embeds")
      .getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        url: urlData.publicUrl,
        filePath,
        date: menu.menu_date,
        template,
        resolution: "1920x1080",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("publish-tv error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
