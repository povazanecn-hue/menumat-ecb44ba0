// EU allergen list (1–14)
export const ALLERGENS = [
  { id: 1, name: "Obilniny obsahujúce lepok", short: "Lepok" },
  { id: 2, name: "Kôrovce", short: "Kôrovce" },
  { id: 3, name: "Vajcia", short: "Vajcia" },
  { id: 4, name: "Ryby", short: "Ryby" },
  { id: 5, name: "Arašidy", short: "Arašidy" },
  { id: 6, name: "Sójové bôby", short: "Sója" },
  { id: 7, name: "Mlieko", short: "Mlieko" },
  { id: 8, name: "Orechy", short: "Orechy" },
  { id: 9, name: "Zeler", short: "Zeler" },
  { id: 10, name: "Horčica", short: "Horčica" },
  { id: 11, name: "Sezamové semená", short: "Sezam" },
  { id: 12, name: "Oxid siričitý a siričitany", short: "Siričitany" },
  { id: 13, name: "Vlčí bôb", short: "Lupina" },
  { id: 14, name: "Mäkkýše", short: "Mäkkýše" },
] as const;

export const DISH_CATEGORIES: Record<string, string> = {
  polievka: "Polievka",
  hlavne_jedlo: "Hlavné jedlo",
  dezert: "Dezert",
  predjedlo: "Predjedlo",
  salat: "Šalát",
  pizza: "Pizza",
  burger: "Burger",
  pasta: "Pasta",
  napoj: "Nápoj",
  ine: "Iné",
};
