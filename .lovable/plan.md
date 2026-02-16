# Landing Page pre neprihlasených používateľov

## Prehľad

Vytvorím atraktívnu landing page v dark-gold rustickom štýle, ktorá sa zobrazí neprihlaseným návštevníkom na hlavnej URL (`/`). Prihlásení používatelia budú automaticky presmerovaní na dashboard.

## Čo sa zmení

### 1. Nová stránka: `src/pages/Landing.tsx`

Plnohodnotná landing page s nasledujúcimi sekciami:

- **Hero sekcia** -- veľký nadpis "MENU MASTER" s podnázvom v slovenčine, ChefHat ikona, gold gradient CTA tlačidlá "Začať zadarmo" a "Prihlásiť sa"
- **Funkcie sekcia** -- karty s ikonami (UtensilsCrossed, Calendar, FileText, TrendingUp) popisujúce kľúčové funkcie: auto databázy, generovanie menu, magic importy - exporty, inteligentný sklad,  export marketing,  Ai price power   
- **Ako to funguje** --  (Importuj a plň databázu -> Generujte menu -> Upravuj a rob marketing Exportuj rozne formáty - AI Recept book - AI Sklad - Marže - Cenotvorba,  AI Nákupné zoznamy, AI Agent surovín -  Dodavatelia a AI price check )
- **CTA sekcia** -- záverečná výzva na registráciu

Dizajn: tmavé pozadie s wood-grain textúrou, gold gradienty, Playfair Display nadpisy, jemné border-primary/20 karty s hover efektmi.

### 2. Úprava smerovania: `src/App.tsx`

- Route `/` zobrazí `Landing` stránku namiesto presmerovania na `/dashboard`
- Landing page interne skontroluje auth stav -- ak je používateľ prihlásený, presmeruje na `/dashboard`

## Technické detaily

- Landing page použije `useAuth()` hook na detekciu prihlásenia
- Navigácia cez `useNavigate()` a `Link` na `/auth`
- Žiadne databázové zmeny nie sú potrebné
- Plne responzívny layout (mobile-first grid)
- Konzistentné použitie existujúcich design tokenov (--primary, --background, --card, bg-gold-gradient)