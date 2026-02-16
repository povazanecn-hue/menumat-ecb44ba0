/**
 * Koliesko-format Excel/CSV parser.
 *
 * Recognises the weekly structure:
 *   Day header row  →  "Pondelok | 26.1. | ... | Polievka : | 300ml | …"
 *   Menu rows       →  "Menu 1 | 9.80 € | 180g | Dish description … | A*1,3,7"
 *   Dezert row      →  "Dezert | 4.10 € | 200g | Description … | A*1,3,7"
 *   Blank separator rows between days
 *
 * Returns an array of parsed days, each with structured menu items.
 */

import * as XLSX from "xlsx";

export interface KolieskoMenuItem {
  slot: string;          // "Polievka", "Menu 1", "Menu 2", "Menu B", "Dezert", etc.
  price: number | null;
  grammage: string;      // "300ml", "180g", etc.
  name: string;          // Full dish description
  allergens: number[];   // [1,3,7]
}

export interface KolieskoDay {
  dayName: string;       // "Pondelok"
  dateStr: string;       // "26.1."
  soup: KolieskoMenuItem | null;
  items: KolieskoMenuItem[];
}

const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];
const MENU_SLOT_RE = /^(Menu\s*\d+|Menu\s*[BSPbsp]|Dezert)/i;
const ALLERGEN_RE = /[Aa]\*?\s*([\d,.\s]+)/;

function parsePrice(raw: unknown): number | null {
  if (raw == null) return null;
  const s = String(raw).replace(/[€\s]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseAllergens(raw: unknown): number[] {
  if (raw == null) return [];
  const s = String(raw);
  const m = s.match(ALLERGEN_RE);
  if (!m) {
    // Try bare numbers like "1,3,7"
    const nums = s.match(/\d+/g);
    if (nums && nums.every(n => parseInt(n) <= 14)) {
      return nums.map(Number).filter(n => n >= 1 && n <= 14);
    }
    return [];
  }
  return (m[1].match(/\d+/g) ?? []).map(Number).filter(n => n >= 1 && n <= 14);
}

function cleanGrammage(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim();
}

function cleanDishName(raw: unknown): string {
  if (raw == null) return "";
  return String(raw).trim().replace(/\s+/g, " ");
}

/** Check if a row is a day header */
function isDayHeader(cells: unknown[]): { dayName: string; dateStr: string; soupName: string; soupAllergens: number[] } | null {
  const first = String(cells[0] ?? "").trim();
  if (!DAY_NAMES.some(d => first.toLowerCase().startsWith(d.toLowerCase()))) return null;

  const dayName = DAY_NAMES.find(d => first.toLowerCase().startsWith(d.toLowerCase())) || first;
  const dateStr = String(cells[1] ?? "").trim();

  // Find soup name — usually after "Polievka :" marker
  let soupName = "";
  let soupAllergens: number[] = [];
  const allText = cells.map(c => String(c ?? "")).join(" ");

  // Look for soup name in cells after "Polievka"
  let foundPolievka = false;
  for (let i = 0; i < cells.length; i++) {
    const cellStr = String(cells[i] ?? "").trim();
    if (/polievka/i.test(cellStr)) {
      foundPolievka = true;
      continue;
    }
    if (foundPolievka && cellStr.length > 2 && !/^\d+ml$/i.test(cellStr) && !/^\+/.test(cellStr) && !/polievka/i.test(cellStr) && !/^\d+$/.test(cellStr)) {
      if (!soupName) soupName = cellStr;
    }
    // Allergens in last cells
    const aMatch = cellStr.match(ALLERGEN_RE);
    if (aMatch) soupAllergens = parseAllergens(cellStr);
  }

  return { dayName, dateStr, soupName, soupAllergens };
}

/** Check if row is a menu item */
function isMenuRow(cells: unknown[]): KolieskoMenuItem | null {
  const first = String(cells[0] ?? "").trim();
  if (!MENU_SLOT_RE.test(first)) return null;

  const slot = first;
  const price = parsePrice(cells[1]);
  const grammage = cleanGrammage(cells[2]);

  // Dish name is usually in cell 3, but can span multiple cells
  let name = "";
  let allergens: number[] = [];

  for (let i = 3; i < cells.length; i++) {
    const cellStr = String(cells[i] ?? "").trim();
    if (!cellStr) continue;
    const aMatch = cellStr.match(ALLERGEN_RE);
    if (aMatch) {
      allergens = parseAllergens(cellStr);
    } else if (cellStr.length > 1) {
      if (name) name += " ";
      name += cellStr;
    }
  }

  // Also check last cell for bare allergens
  if (allergens.length === 0) {
    const lastCell = String(cells[cells.length - 1] ?? "");
    allergens = parseAllergens(lastCell);
  }

  name = name.trim();
  if (!name && !price) return null; // Empty row

  return { slot, price, grammage, name, allergens };
}

export function parseKolieskoExcel(buffer: ArrayBuffer): KolieskoDay[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const days: KolieskoDay[] = [];
  let currentDay: KolieskoDay | null = null;

  for (const row of rows) {
    if (!row || row.length === 0) continue;

    // Check for day header
    const dayHeader = isDayHeader(row);
    if (dayHeader) {
      if (currentDay) days.push(currentDay);

      // Find grammage for soup (usually "300ml")
      let soupGrammage = "";
      for (const cell of row) {
        const s = String(cell ?? "");
        if (/^\d+ml$/i.test(s.trim())) {
          soupGrammage = s.trim();
          break;
        }
      }

      currentDay = {
        dayName: dayHeader.dayName,
        dateStr: dayHeader.dateStr,
        soup: dayHeader.soupName ? {
          slot: "Polievka",
          price: null, // Soup price is usually "+0.50€" surcharge
          grammage: soupGrammage,
          name: dayHeader.soupName,
          allergens: dayHeader.soupAllergens,
        } : null,
        items: [],
      };

      // Check for price hint like "+0,50€"
      for (const cell of row) {
        const s = String(cell ?? "");
        const priceMatch = s.match(/\+?\s*(\d[,.]?\d+)\s*€/);
        if (priceMatch && currentDay.soup) {
          currentDay.soup.price = parseFloat(priceMatch[1].replace(",", "."));
        }
      }

      continue;
    }

    // Check for menu item row
    const menuItem = isMenuRow(row);
    if (menuItem && currentDay) {
      currentDay.items.push(menuItem);
    }
  }

  if (currentDay) days.push(currentDay);
  return days;
}

/** Parse CSV in Koliesko format */
export function parseKolieskoCSV(text: string): KolieskoDay[] {
  const lines = text.split(/\r?\n/);
  const rows: unknown[][] = lines.map(line => line.split(/[;\t]/).map(c => c.trim()));

  const days: KolieskoDay[] = [];
  let currentDay: KolieskoDay | null = null;

  for (const row of rows) {
    if (!row || row.every(c => !c || String(c).trim() === "")) continue;

    const dayHeader = isDayHeader(row);
    if (dayHeader) {
      if (currentDay) days.push(currentDay);
      currentDay = {
        dayName: dayHeader.dayName,
        dateStr: dayHeader.dateStr,
        soup: dayHeader.soupName ? {
          slot: "Polievka",
          price: null,
          grammage: "300ml",
          name: dayHeader.soupName,
          allergens: dayHeader.soupAllergens,
        } : null,
        items: [],
      };
      continue;
    }

    const menuItem = isMenuRow(row);
    if (menuItem && currentDay) {
      currentDay.items.push(menuItem);
    }
  }

  if (currentDay) days.push(currentDay);
  return days;
}
