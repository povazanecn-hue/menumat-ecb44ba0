# MENUMAT — Menumaestro
**Claude Code context — citaj pred kazdou prácou**

## Co je tento projekt
Restaurant management app s AI asistentom Olivia.
Funkcie: denné menu, stály jedálniček, recepty, suroviny, šablóny, export na sociálne siete.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase (Postgres + Auth + Edge Functions)
- React Router v6, React Query v5, React Hook Form + Zod
- Framer Motion, dnd-kit, Recharts, xlsx
- Bun (package manager)

## Struktura
src/pages/       — routy (Auth, Landing, Dashboard, DailyMenu, Dishes, Ingredients,
                   Recipes, PermanentMenu, Templates, Exports, ShoppingList,
                   Settings, Nastenka, Onboarding)
src/components/  — AppLayout, AppSidebar, OliviaAssistant (AI), + subdir per feature
src/hooks/       — custom hooks
src/integrations/ — Supabase client
src/lib/         — utils
supabase/        — config, migrations, edge functions

## Kluče prikazy
```bash
bun dev          # development server
bun build        # production build
bun test         # testy (Vitest)
```

## Dolezite pravidla
- NIKDY necommituj .env (obsahuje ostre kluče!)
- TypeScript strict mode
- Po session aktualizuj .ai-context/current-sprint.md
- Vetvy: main = Lovable sync, feature/* = Claude/Codex zmeny → PR → merge

## Aktualny stav
Pozri .ai-context/current-sprint.md

---

## 🤖 Pravidlá pre AI asistentov

> Sekcia pridaná 2026-02-23 po audite repozitárov

### ✅ Povolené
- Upravovať kód vo všetkých priečinkoch podľa zadania
- Opravovať chyby, pridávať features
- Aktualizovať dokumentáciu a README

### ❌ ZAKÁZANÉ
- Commitovať `.env`, API kľúče, Supabase tokeny, ElevenLabs kľúče
- Meniť `main` branch priamo – vždy cez PR
- Mazať alebo meniť databázové migrácie bez potvrdenia
- Zmeniť Supabase schému bez explicitného zadania
- Pridávať npm závislosti bez schválenia majiteľom

### ⚠️ Citlivé oblasti
- `/supabase` – databázové migrácie (opatrne!)
- `.env` – NIKDY necommitovať
- Supabase RLS politiky – nemeniť bez zadania

## 🔄 Changelog pre AI (história zmien)

- **2026-02-23** – Pridaný `.env` do `.gitignore` (security fix)
- **2026-02-23** – Pridaný `.env.example` template
- **2026-02-23** – Doplnené AI pravidlá do CLAUDE.md
- **2026-02-21** – Posledná produkčná zmena

## 🤝 Súvisiace projekty

- `SmartAir` – SmartAir web (rovnaký majiteľ)
- `MENUGENERATOR` – starší experimentálny menu generátor
- DreamAir s.r.o. – sesterská firma Norberta Považanca


---

## 🔑 Správa tajomstiev – Doppler

Tento projekt používa **Doppler** na centrálnu správu API kľúčov.

### Spustenie projektu
```bash
# SPRÁVNE – kľúče sa načítajú automaticky
doppler run -- npm run dev

# NESPRÁVNE – nikdy nespúšťaj bez Doppleru ak nemáš .env
npm run dev
```

### Prvé nastavenie na novom PC
```bash
npm install -g @doppler/cli
doppler login
doppler setup   # v root priečinku projektu
```

### Pre AI asistentov
- Vždy použi `doppler run --` prefix pri spúšťaní príkazov
- Nikdy nevytváraj `.env` s reálnymi hodnotami
- Dokumentácia: pozri `DOPPLER.md` v tomto repozitári
- GitHub Secrets sú synchronizované automaticky z Doppler
