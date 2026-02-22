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