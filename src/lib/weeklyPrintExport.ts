/**
 * Weekly A4 print export — all days on one page.
 * Matches the Koliesko LCD layout style: numbered menu items with grammage, allergens, price.
 */

import { DISH_CATEGORIES } from "@/lib/constants";
import { MenuWithItems } from "@/hooks/useMenus";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

interface PrintDay {
  dayName: string;
  dateStr: string;
  items: {
    slot: string;
    name: string;
    grammage: string;
    price: string;
    allergens: string;
    isHighlight: boolean; // soup or dessert
  }[];
}

const SLOT_ORDER: Record<string, number> = {
  polievka: 0,
  hlavne_jedlo: 1,
  predjedlo: 2,
  pizza: 3,
  burger: 4,
  salat: 5,
  pasta: 6,
  dezert: 7,
  napoj: 8,
  ine: 9,
};

const SLOT_LABELS: Record<string, string> = {
  polievka: "🍲",
  burger: "B",
  salat: "S",
  pasta: "P",
  dezert: "🍰",
};

function getSlotLabel(category: string, index: number): string {
  if (category === "polievka") return "🍲";
  if (category === "dezert") return "🍰";
  if (category === "burger") return "B";
  if (category === "salat") return "S";
  if (category === "pasta") return "P";
  return String(index);
}

export function buildPrintDays(menus: MenuWithItems[], weekDates: Date[]): PrintDay[] {
  return weekDates.map((date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const menu = menus.find(m => m.menu_date === dateKey);
    const items = menu?.menu_items ?? [];

    // Sort by sort_order
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

    // Group by category
    const soups = sorted.filter(i => i.dish.category === "polievka");
    const mains = sorted.filter(i => i.dish.category === "hlavne_jedlo");
    const burgers = sorted.filter(i => i.dish.category === "burger");
    const salads = sorted.filter(i => i.dish.category === "salat");
    const pastas = sorted.filter(i => i.dish.category === "pasta");
    const desserts = sorted.filter(i => i.dish.category === "dezert");
    const others = sorted.filter(i => !["polievka", "hlavne_jedlo", "burger", "salat", "pasta", "dezert"].includes(i.dish.category));

    const printItems: PrintDay["items"] = [];

    // Soups
    for (const s of soups) {
      printItems.push({
        slot: "🍲",
        name: s.dish.name,
        grammage: s.dish.grammage || "",
        price: formatPrice(s),
        allergens: formatAllergens(s.dish.allergens),
        isHighlight: true,
      });
    }

    // Mains (numbered)
    let mainNum = 1;
    for (const m of mains) {
      printItems.push({
        slot: String(mainNum),
        name: m.dish.name,
        grammage: m.dish.grammage || "",
        price: formatPrice(m),
        allergens: formatAllergens(m.dish.allergens),
        isHighlight: false,
      });
      mainNum++;
    }

    // Burger
    for (const b of burgers) {
      printItems.push({
        slot: "B",
        name: b.dish.name,
        grammage: b.dish.grammage || "",
        price: formatPrice(b),
        allergens: formatAllergens(b.dish.allergens),
        isHighlight: false,
      });
    }

    // Salad
    for (const s of salads) {
      printItems.push({
        slot: "S",
        name: s.dish.name,
        grammage: s.dish.grammage || "",
        price: formatPrice(s),
        allergens: formatAllergens(s.dish.allergens),
        isHighlight: false,
      });
    }

    // Pasta
    for (const p of pastas) {
      printItems.push({
        slot: "P",
        name: p.dish.name,
        grammage: p.dish.grammage || "",
        price: formatPrice(p),
        allergens: formatAllergens(p.dish.allergens),
        isHighlight: false,
      });
    }

    // Others
    for (const o of others) {
      printItems.push({
        slot: "•",
        name: o.dish.name,
        grammage: o.dish.grammage || "",
        price: formatPrice(o),
        allergens: formatAllergens(o.dish.allergens),
        isHighlight: false,
      });
    }

    // Desserts
    for (const d of desserts) {
      printItems.push({
        slot: "🍰",
        name: d.dish.name,
        grammage: d.dish.grammage || "",
        price: formatPrice(d),
        allergens: formatAllergens(d.dish.allergens),
        isHighlight: true,
      });
    }

    return {
      dayName: format(date, "EEEE", { locale: sk }),
      dateStr: format(date, "d.M.", { locale: sk }),
      items: printItems,
    };
  });
}

function formatPrice(item: { override_price: number | null; dish: { final_price: number | null; recommended_price: number } }): string {
  const p = item.override_price ?? item.dish.final_price ?? item.dish.recommended_price;
  return p > 0 ? `${p.toFixed(2)} €` : "";
}

function formatAllergens(a: number[]): string {
  return a.length > 0 ? a.join(",") : "";
}

export function printWeeklyA4(days: PrintDay[], restaurantName: string, weekLabel: string) {
  const html = `<!DOCTYPE html>
<html lang="sk">
<head>
<meta charset="utf-8">
<title>Týždenné menu — ${restaurantName}</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 8pt;
    line-height: 1.3;
    color: #2c1810;
    background: #fff;
  }
  .header {
    text-align: center;
    padding: 4px 0 6px;
    border-bottom: 2px solid #8b5e3c;
    margin-bottom: 6px;
  }
  .header h1 {
    font-size: 14pt;
    font-family: Georgia, serif;
    color: #8b5e3c;
    text-transform: uppercase;
    letter-spacing: 3px;
  }
  .header .week {
    font-size: 9pt;
    color: #666;
    margin-top: 2px;
  }
  .days-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
  }
  .day-col {
    border: 1px solid #d4c4a8;
    border-radius: 4px;
    overflow: hidden;
  }
  .day-header {
    background: #8b5e3c;
    color: #fff;
    padding: 3px 6px;
    font-weight: 700;
    font-size: 8.5pt;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .day-header .date {
    font-weight: 400;
    font-size: 7.5pt;
    opacity: 0.8;
  }
  .day-items {
    padding: 3px 4px;
  }
  .menu-row {
    display: flex;
    gap: 3px;
    padding: 2px 0;
    border-bottom: 1px dotted #e0d5c0;
    align-items: flex-start;
  }
  .menu-row:last-child { border-bottom: none; }
  .menu-row.highlight {
    background: #faf5ee;
    margin: 0 -4px;
    padding: 2px 4px;
  }
  .slot {
    font-weight: 700;
    min-width: 16px;
    text-align: center;
    color: #8b5e3c;
    font-size: 8pt;
    flex-shrink: 0;
  }
  .dish-info {
    flex: 1;
    min-width: 0;
  }
  .dish-name {
    font-size: 7.5pt;
    line-height: 1.25;
    word-break: break-word;
  }
  .dish-meta {
    font-size: 6.5pt;
    color: #999;
  }
  .price {
    font-weight: 700;
    font-size: 8.5pt;
    white-space: nowrap;
    flex-shrink: 0;
    text-align: right;
    min-width: 38px;
  }
  .footer {
    text-align: center;
    margin-top: 4px;
    font-size: 6.5pt;
    color: #aaa;
    border-top: 1px solid #e0d5c0;
    padding-top: 3px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="header">
  <h1>${restaurantName} — Denné Menu</h1>
  <div class="week">${weekLabel}</div>
</div>
<div class="days-grid">
${days.map(day => `
  <div class="day-col">
    <div class="day-header">
      ${day.dayName} <span class="date">${day.dateStr}</span>
    </div>
    <div class="day-items">
      ${day.items.length === 0 ? '<div style="text-align:center;padding:8px;color:#ccc;font-style:italic;">—</div>' :
        day.items.map(item => `
        <div class="menu-row${item.isHighlight ? ' highlight' : ''}">
          <div class="slot">${item.slot}</div>
          <div class="dish-info">
            <div class="dish-name">${item.grammage ? `<b>${item.grammage}</b> ` : ''}${escapeHtml(item.name)}</div>
            ${item.allergens ? `<div class="dish-meta">* alergény: ${item.allergens}</div>` : ''}
          </div>
          <div class="price">${item.price}</div>
        </div>`).join('')}
    </div>
  </div>`).join('')}
</div>
<div class="footer">
  Vytvorené v MenuGen • ${new Date().toLocaleDateString("sk-SK")}
</div>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Export weekly menu to Excel — all days in one sheet */
export async function exportWeeklyExcel(days: PrintDay[], restaurantName: string, weekLabel: string) {
  const XLSX_mod = await import("xlsx");
  
  const wsData: string[][] = [
    [`${restaurantName} — Denné Menu`, weekLabel],
    [],
    ["Deň", "Dátum", "Pozícia", "Gramáž", "Názov jedla", "Alergény", "Cena"],
  ];

  for (const day of days) {
    for (const item of day.items) {
      wsData.push([
        day.dayName,
        day.dateStr,
        item.slot,
        item.grammage,
        item.name,
        item.allergens ? `A: ${item.allergens}` : "",
        item.price,
      ]);
    }
    wsData.push([]); // separator
  }

  const wb = XLSX_mod.utils.book_new();
  const ws = XLSX_mod.utils.aoa_to_sheet(wsData);
  ws["!cols"] = [
    { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 60 }, { wch: 14 }, { wch: 10 },
  ];
  XLSX_mod.utils.book_append_sheet(wb, ws, "Týždenné Menu");
  XLSX_mod.writeFile(wb, `menu-tyzdenne-${weekLabel.replace(/\s/g, "_")}.xlsx`);
}
