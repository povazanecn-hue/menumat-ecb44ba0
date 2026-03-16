

# Doplnenie: Automaticke generovanie nakupneho zoznamu po pipeline

## Sucasny stav

Nakupny zoznam (`/shopping-list`) uz existuje a funguje - agreguje suroviny z menu podla datumoveho rozsahu cez retazec: `menus -> menu_items -> dishes -> dish_ingredients -> ingredients`.

## Problem

Po dokonceni auto-recipe pipeline (jedlo -> recept -> suroviny) sa automaticky vytvoria zaznamy v `dish_ingredients`. Nakupny zoznam by sa mal okamzite aktualizovat, ale uzivatel o tom nevie a nema priamy pristup k vysledku.

## Riesenie

### 1. Automaticka notifikacia po pipeline

Po dokonceni `auto-recipe-pipeline` pre vsetky jedla v menu:
- Zobrazit toast s odkazom: "Suroviny pripravene. Otvorit nakupny zoznam?"
- Kliknutie presmeruje na `/shopping-list` s predvolenym tyzdnom

### 2. Rozsirenie nakupneho zoznamu

Pridat do `ShoppingList.tsx`:
- **Novy zdroj dat**: okrem tyzdnoveho rozsahu aj moznost vybrat konkretne menu (dropdown)
- **Indikator AI surovinam**: badge "AI" pri surovinnach ktore boli automaticky pridane pipeline
- **Chybajuce ceny**: zvyraznit polozky kde `base_price = 0` (surovina pridana AI ale bez najdenej ceny)
- **CTA na doplnenie cien**: odkaz na `/ingredients` pre polozky bez ceny

### 3. Quick-export po generovani

V `DailyMenu.tsx` po uspesnom generovani menu + pipeline:
- Pridat tlacidlo "Exportovat nakupny zoznam" priamo v menu view
- Spusti Excel export pre dany den/tyzden bez nutnosti navigacie na `/shopping-list`

## Technicke zmeny

| Subor | Zmena |
|-------|-------|
| `src/hooks/useAutoRecipePipeline.ts` | Po dokonceni pipeline invalidovat `shopping-list` query key + zobrazit toast s odkazom |
| `src/pages/ShoppingList.tsx` | Pridat filter na konkretne menu, AI badge, zvyraznenie chybajucich cien |
| `src/hooks/useShoppingList.ts` | Pridat variantu s menu ID namiesto date range |
| `src/pages/DailyMenu.tsx` | Quick-export tlacidlo nakupneho zoznamu |

## Tok dat (kompletna pipeline)

```text
AI generuje menu
    |
    v
auto-recipe-pipeline (recept + suroviny + ceny)
    |
    v
dish_ingredients zaznamy vytvorene
    |
    v
useShoppingList query sa invaliduje
    |
    v
Toast: "Nakupny zoznam aktualizovany" [Otvorit]
    |
    v
/shopping-list zobrazuje vsetky suroviny s cenami
    |
    v
Excel export / Tlac
```

Toto je posledny chybajuci clanok v retazci: generovanie -> recepty -> suroviny -> nakupny zoznam. Po implementacii bude cely flow automaticky od generovania az po nakup.

