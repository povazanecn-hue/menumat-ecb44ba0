/**
 * Unit normalization engine for consistent cost calculations.
 * Converts between metric units (g↔kg, ml↔l) and handles pcs.
 *
 * Convention: ingredient.base_price is always per ingredient.unit.
 * dish_ingredient.quantity + unit may differ → we normalize to ingredient's unit.
 */

/** Supported unit families */
type UnitFamily = "mass" | "volume" | "piece" | "unknown";

interface UnitInfo {
  family: UnitFamily;
  /** multiplier to convert TO the base unit of the family (g for mass, ml for volume) */
  toBase: number;
  label: string;
}

const UNIT_MAP: Record<string, UnitInfo> = {
  // Mass
  g:  { family: "mass", toBase: 1, label: "g" },
  kg: { family: "mass", toBase: 1000, label: "kg" },
  dag: { family: "mass", toBase: 10, label: "dag" },
  mg: { family: "mass", toBase: 0.001, label: "mg" },
  // Volume
  ml: { family: "volume", toBase: 1, label: "ml" },
  l:  { family: "volume", toBase: 1000, label: "l" },
  cl: { family: "volume", toBase: 10, label: "cl" },
  dl: { family: "volume", toBase: 100, label: "dl" },
  // Pieces
  ks:  { family: "piece", toBase: 1, label: "ks" },
  pcs: { family: "piece", toBase: 1, label: "pcs" },
};

function getUnitInfo(unit: string): UnitInfo {
  const key = unit.toLowerCase().trim();
  return UNIT_MAP[key] ?? { family: "unknown", toBase: 1, label: unit };
}

/**
 * Convert a quantity from one unit to another within the same family.
 * Returns null if units are incompatible.
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const from = getUnitInfo(fromUnit);
  const to = getUnitInfo(toUnit);

  if (from.family !== to.family) return null;
  if (from.family === "unknown") return null;

  // Convert: fromUnit → base → toUnit
  const inBase = quantity * from.toBase;
  return inBase / to.toBase;
}

/**
 * Calculate the cost of a dish ingredient line.
 * 
 * @param recipeQty - quantity in the recipe (e.g. 500)
 * @param recipeUnit - unit in the recipe (e.g. "g")
 * @param ingredientBasePrice - price per ingredient unit (e.g. 5.00 €/kg)
 * @param ingredientUnit - the ingredient's native unit (e.g. "kg")
 * @returns cost in € or null if units are incompatible
 */
export function calculateIngredientLineCost(
  recipeQty: number,
  recipeUnit: string,
  ingredientBasePrice: number,
  ingredientUnit: string
): number | null {
  const normalizedQty = convertUnits(recipeQty, recipeUnit, ingredientUnit);
  if (normalizedQty === null) return null;
  return normalizedQty * ingredientBasePrice;
}

/**
 * Get all supported units for display in selects.
 */
export const SUPPORTED_UNITS = Object.entries(UNIT_MAP).map(([key, info]) => ({
  value: key,
  label: info.label,
  family: info.family,
}));

/**
 * Check if two units are compatible (same family).
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const a = getUnitInfo(unitA);
  const b = getUnitInfo(unitB);
  return a.family === b.family && a.family !== "unknown";
}

/** VAT rates by dish category (Slovak market defaults) */
const CATEGORY_VAT: Record<string, number> = {
  polievka: 10,
  hlavne_jedlo: 10,
  dezert: 10,
  predjedlo: 10,
  salat: 10,
  pizza: 10,
  burger: 10,
  pasta: 10,
  napoj: 20,
  ine: 20,
};

/**
 * Get the default VAT rate for a dish category.
 * Food = 10%, Drinks/Other = 20%.
 */
export function getVatForCategory(category: string): number {
  return CATEGORY_VAT[category] ?? 20;
}
