
# Implementacia noveho MENUMAT loga so ziarenim

## Zhrnutie
Nahradime sucasne ChefHat ikony + textovy "MENUMAT" novym uploadnutym logom (`logo.png`) na vsetkych miestach v aplikacii. Logo dostane jemny glow efekt (ziarenie) na pozadi.

## Co sa zmeni

### 1. Skopirovanie loga do projektu
- Skopirujem `user-uploads://logo.png` do `src/assets/logo-menumat.png`

### 2. Vytvorenie zdielaneho LogoBrand komponentu
- Novy subor `src/components/LogoBrand.tsx`
- Prijima props pre velkost (`sm`, `md`, `lg`) a volitelne `glow` (boolean)
- Pouziva `<img>` s importovanym logom
- Glow efekt: absolutne poziciovany rozmazany element za logom s primary farbou

### 3. Nahradenie loga na 5 miestach

| Miesto | Subor | Aktualne | Nove |
|--------|-------|----------|------|
| Landing hero | `src/pages/Landing.tsx` | ChefHat v kruhu + "MENU" text | LogoBrand `lg` s glow |
| Auth stranka | `src/pages/Auth.tsx` | ChefHat + "MENUMAT" | LogoBrand `md` s glow |
| Onboarding | `src/pages/Onboarding.tsx` | ChefHat + "MENUMAT" | LogoBrand `md` s glow |
| Sidebar header | `src/components/AppSidebar.tsx` | ChefHat + "MENUMAT" text | LogoBrand `sm` |
| Top bar | `src/components/TopActionBar.tsx` | "MENUMAT" text | LogoBrand `sm` |

### 4. Glow efekt (technicke detaily)
```text
+----------------------------------+
|  [blur glow layer: primary/25]   |
|     +------------------------+   |
|     |   logo-menumat.png     |   |
|     +------------------------+   |
+----------------------------------+
```
- CSS: `absolute inset-0 bg-primary/20 blur-xl rounded-full` za logom
- Na Landing stranke: vacsi glow s `blur-2xl` a jemna animacia (`animate-pulse`)
- Na Auth/Onboarding: stredny glow
- V Sidebar/TopBar: bez glow (priestorove obmedzenia)

## Technicke poznamky
- Logo sa importuje cez ES6 modul: `import logo from "@/assets/logo-menumat.png"`
- Existujuci `bg-gold-gradient` text v Landing hero sa odstrani (nahradi ho logo)
- Zachovame "smart nastroj prevadzok buducnosti" subtext pod logom na Landing stranke
- Komponent LogoBrand bude mat `alt="MENUMAT logo"` pre pristupnost
