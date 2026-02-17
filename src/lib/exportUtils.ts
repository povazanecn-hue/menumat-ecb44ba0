import { DISH_CATEGORIES, ALLERGENS } from "@/lib/constants";
import * as XLSX from "xlsx";

interface ExportDish {
  name: string;
  category: string;
  allergens: number[];
  grammage: string | null;
  final_price: number | null;
  recommended_price: number;
  cost: number;
  vat_rate: number;
}

interface ExportMenuItem {
  sort_order: number;
  override_price: number | null;
  dish: ExportDish;
}

interface ExportMenu {
  id: string;
  menu_date: string;
  status: string;
  menu_items: ExportMenuItem[];
}

// ─── Group items by category ───
function groupItems(items: ExportMenuItem[]) {
  const groups: Record<string, ExportMenuItem[]> = {};
  for (const item of [...items].sort((a, b) => a.sort_order - b.sort_order)) {
    const cat = item.dish.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

function getPrice(item: ExportMenuItem): string {
  const p = item.override_price ?? item.dish.final_price ?? item.dish.recommended_price;
  return `${p.toFixed(2)} €`;
}

function getAllergenStr(ids: number[]): string {
  if (!ids.length) return "";
  return ids.join(", ");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const days = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
  return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

// ─── TV FullHD Export (1920×1080) — persistent live URL ───
export async function exportTV(menu: ExportMenu, template: string = "country"): Promise<{ url: string }> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();

  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-tv`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ menuId: menu.id, template }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Chyba pri generovaní TV displeja");
  }

  const result = await resp.json();
  return { url: result.url };
}

// ─── PDF / Print ───
export function exportPDF(menu: ExportMenu, template: string = "country", showFinancials: boolean = false) {
  // Generate a local HTML for printing (no server needed)
  const groups = groupItems(menu.menu_items);
  const dateLabel = formatDate(menu.menu_date);

  const bgColor = template === "modern" ? "#1a1a2e" : template === "minimal" ? "#ffffff" : "#f5f0e8";
  const textColor = template === "modern" ? "#e0e0e0" : template === "minimal" ? "#222" : "#3b2a1a";
  const accentColor = template === "modern" ? "#e94560" : template === "minimal" ? "#333" : "#8b5e3c";
  const headerFont = template === "modern" ? "Arial, sans-serif" : "'Playfair Display', Georgia, serif";
  const bodyFont = template === "modern" ? "Arial, sans-serif" : "'Source Sans 3', sans-serif";

  let rows = "";
  for (const [cat, items] of Object.entries(groups)) {
    rows += `<div style="margin-bottom:18px;">
      <div style="font-family:${headerFont};font-size:20px;font-weight:700;color:${accentColor};margin-bottom:6px;text-transform:uppercase;letter-spacing:2px;">${DISH_CATEGORIES[cat] || cat}</div>`;
    for (const item of items) {
      const costVal = item.dish.cost;
      const priceVal = item.override_price ?? item.dish.final_price ?? item.dish.recommended_price;
      const marginPct = costVal > 0 ? (((priceVal - costVal) / costVal) * 100).toFixed(0) + "%" : "—";
      rows += `<div style="display:flex;justify-content:space-between;align-items:baseline;font-family:${bodyFont};font-size:16px;padding:4px 0;border-bottom:1px dotted ${accentColor}40;">
        <span><strong>${item.dish.name}</strong>${item.dish.grammage ? ` <span style="font-size:13px;color:${textColor}99;">(${item.dish.grammage})</span>` : ""}${item.dish.allergens.length ? ` <span style="font-size:12px;color:${textColor}80;">A: ${getAllergenStr(item.dish.allergens)}</span>` : ""}</span>
        <span style="white-space:nowrap;margin-left:24px;">
          ${showFinancials ? `<span style="font-size:12px;color:${textColor}80;margin-right:12px;">N: ${costVal.toFixed(2)}€ | M: ${marginPct}</span>` : ""}
          <span style="font-weight:700;">${getPrice(item)}</span>
        </span>
      </div>`;
    }
    rows += `</div>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;} @page{size:A4;margin:20mm;}</style></head>
<body style="background:${bgColor};color:${textColor};padding:40px;">
<div style="text-align:center;margin-bottom:24px;">
  <div style="font-family:${headerFont};font-size:32px;font-weight:700;">DENNÉ MENU</div>
  <div style="font-family:${bodyFont};font-size:18px;margin-top:6px;">${dateLabel}</div>
</div>
${rows}
</body></html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

// ─── Excel kitchen export ───
export function exportExcel(menu: ExportMenu, showFinancials: boolean = false) {
  const dateLabel = formatDate(menu.menu_date);
  const sorted = [...menu.menu_items].sort((a, b) => a.sort_order - b.sort_order);

  const wsData = [
    ["DENNÉ MENU", dateLabel],
    [],
    showFinancials
      ? ["#", "Kategória", "Názov jedla", "Gramáž", "Alergény", "Náklad (€)", "Marža", "Cena (€)"]
      : ["#", "Kategória", "Názov jedla", "Gramáž", "Alergény", "Cena (€)"],
  ];

  sorted.forEach((item, i) => {
    const costVal = item.dish.cost;
    const priceVal = item.override_price ?? item.dish.final_price ?? item.dish.recommended_price;
    const marginPct = costVal > 0 ? (((priceVal - costVal) / costVal) * 100).toFixed(0) + "%" : "—";
    const baseRow = [
      String(i + 1),
      DISH_CATEGORIES[item.dish.category] || item.dish.category,
      item.dish.name,
      item.dish.grammage || "",
      getAllergenStr(item.dish.allergens),
    ];
    if (showFinancials) {
      baseRow.push(costVal.toFixed(2), marginPct);
    }
    baseRow.push(getPrice(item));
    wsData.push(baseRow);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = showFinancials
    ? [{ wch: 4 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 10 }]
    : [{ wch: 4 }, { wch: 16 }, { wch: 40 }, { wch: 12 }, { wch: 16 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, "Menu");
  XLSX.writeFile(wb, `menu-kitchen-${menu.menu_date}.xlsx`);
}

// ─── Webflow / Web embed (idempotent publish) ───
export async function exportWebEmbed(menu: ExportMenu): Promise<{ url: string; embedSnippet: string }> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();

  const resp = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/publish-embed`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ menuId: menu.id }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || "Chyba pri publikovaní embed");
  }

  const result = await resp.json();

  // Copy embed snippet to clipboard
  navigator.clipboard.writeText(result.embedSnippet).catch(() => {});

  return result;
}

