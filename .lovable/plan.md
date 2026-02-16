

# Redizajn vsetkych stranok Menu Master

## Suhrn zmien

Uzivatel chce:
1. **Priehladnejsie okna/karty** - vidiet pozadie cez ne
2. **Vyraznejsi napis MENU MASTER** - svietiaci, glowing efekt
3. **Moderne prevedenie** so zachovanim rustikalnych prvkov

---

## Stranka 1: Landing (/)

**Pozadie:** Koliesko kresba 65% opacity (bez zmeny)

**Zmeny:**
- Logo "MENU MASTER" - vacsie, s vyraznym zlatym glowing efektom (`text-shadow` + `drop-shadow` animacia)
- Hero karta s jedlom - jemne zaoblene okraje, subtilny glow border
- Feature karty - `bg-card/60 backdrop-blur-md` namiesto plneho `bg-card`
- "Ako to funguje" sekcia - `bg-card/40 backdrop-blur-sm` namiesto `bg-card/50`
- CTA tlacidla - silnejsi glow shadow na hover

---

## Stranka 2: Auth (/auth)

**Pozadie:** Koliesko kresba 65% opacity

**Zmeny:**
- Logo hore - vacsie (text-2xl), silny glow efekt, pulsujuci drop-shadow
- Formularove okno - `bg-card/60 backdrop-blur-md` namiesto `bg-card/80`
- Okno bude viac priehladne, pozadie cez neho priesvita
- Separator "alebo" - `bg-transparent` namiesto `bg-background`
- Tlacidla OAuth - `bg-secondary/60` s backdrop-blur

---

## Stranka 3: Onboarding (/onboarding)

**Pozadie:** Koliesko kresba 65% opacity

**Zmeny:**
- Logo "MENU MASTER" - vacsie (text-3xl), glow efekt s animaciou
- Karta "Nova restauracia" - `bg-card/60 backdrop-blur-md` namiesto `bg-card/85`
- Nadpis "Vitajte v Menu Master" - svetlejsi s text-shadow glow
- Input polia - `bg-secondary/50` namiesto `bg-secondary`

---

## Stranka 4: Dashboard a vsetky chranene stranky (AppLayout)

**Pozadie:** Drevene textury (wood-bg + wood-planks) - zostava

**Zmeny:**
- TopActionBar - `bg-card/50 backdrop-blur-md` namiesto `bg-card/80`
- Logo v top bare - glow efekt, vacsi drop-shadow
- Sidebar - `bg-sidebar-background/90` s backdrop-blur
- Vsetky Card komponenty na Dashboard - pridany `bg-card/70 backdrop-blur-sm` cez dedicnu triedu

---

## Globalny glow efekt pre logo

Nova CSS utilita v `index.css`:
```css
.logo-glow {
  text-shadow: 
    0 0 10px hsl(40 55% 55% / 0.6),
    0 0 30px hsl(40 55% 55% / 0.3),
    0 0 60px hsl(40 55% 55% / 0.15);
}

.icon-glow {
  filter: drop-shadow(0 0 12px hsl(40 55% 55% / 0.7))
          drop-shadow(0 0 30px hsl(40 55% 55% / 0.3));
}
```

---

## Technicke detaily

### Subory na upravu:
1. `src/index.css` - pridanie `.logo-glow` a `.icon-glow` utilit
2. `src/pages/Landing.tsx` - vacsie logo + glow, priehladnejsie karty
3. `src/pages/Auth.tsx` - vacsie logo + glow, priehladnejsie okno formulara
4. `src/pages/Onboarding.tsx` - vacsie logo + glow, priehladnejsie okno
5. `src/components/TopActionBar.tsx` - glow logo, priehladnejsi bar
6. `src/components/AppSidebar.tsx` - glow logo v sidebar headeri
7. `src/pages/Dashboard.tsx` - priehladnejsie karty (volitelne)

### Princip zmien:
- Vsetky okna/kontajnery: znizenie opacity pozadia na 50-60% + `backdrop-blur-md`
- Vsetky loga: aplikovanie `.logo-glow` a `.icon-glow` tried
- Ziadne zmeny v logike, len vizualne CSS upravy

