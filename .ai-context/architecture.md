# Architektura — MENUMAT

## Overview
Restaurant management app s AI asistentom Olivia.
Umoznuje spravovat denné menu, recepty, suroviny, exportovat na socialne siete.

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Supabase (Postgres + Auth + Storage + Edge Functions)
- React Router v6, TanStack Query v5
- React Hook Form + Zod, Framer Motion, dnd-kit
- Bun

## Pages (Routes)
| Stranka       | Popis                              |
|---------------|------------------------------------|
| Landing       | Uvitacia stranka                   |
| Auth          | Prihlasenie / registracia          |
| Onboarding    | Nastavenie restauracie             |
| Dashboard     | Hlavny prehlad                     |
| DailyMenu     | Generovanie denneho menu           |
| PermanentMenu | Stalý jedálnicek                   |
| Dishes        | Sprava jedál                       |
| Ingredients   | Sprava surovín                     |
| Recipes       | Recepty                            |
| Templates     | Sablony pre export                 |
| Exports       | Export na sociálne siete           |
| ShoppingList  | Nakupny zoznam                     |
| Nastenka      | Nástenka / komunikacia             |
| Settings      | Nastavenia uctu a restauracie      |

## Komponenty
AppLayout / AppSidebar — hlavny layout a navigacia
OliviaAssistant        — AI asistent (Olivia)
ProtectedRoute         — ochrana rout (Supabase auth)
TopActionBar           — akcie v hlavicke
+ feature subdir pre kazdu sekciu

## Data Flow
User → React page → TanStack Query hook → Supabase client → Postgres
Edge Functions: generovanie menu (AI), exporty

## Supabase
supabase/migrations/   — DB schema
supabase/functions/    — Edge Functions
supabase/config.toml   — lokalna konfiguracia

## Environment Variables
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=