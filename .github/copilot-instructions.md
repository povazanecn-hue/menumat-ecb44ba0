# MENUMAT — Copilot/Codex Instructions

## Project Overview
Restaurant management app with AI assistant (Olivia).
Features: daily menu, permanent menu, recipes, ingredients, templates, social export.

## Tech Stack
- React 18 + TypeScript (strict) + Vite
- Tailwind CSS + shadcn/ui + Radix UI primitives
- Supabase (Postgres + Auth + Edge Functions)
- React Router v6, TanStack Query v5
- React Hook Form + Zod validation
- Framer Motion (animations), dnd-kit (drag&drop)
- Bun package manager

## Code Style
- TypeScript strict mode always
- Components: functional, named exports
- Styles: Tailwind utility classes, cn() helper for conditionals
- Forms: React Hook Form + Zod schema
- Data fetching: TanStack Query + Supabase client from src/integrations/

## Project Structure
src/pages/        — page components (one per route)
src/components/   — shared + feature-specific components
src/hooks/        — custom React hooks
src/integrations/ — Supabase client setup
supabase/         — DB migrations, edge functions

## AI Context
Always read .ai-context/current-sprint.md before starting work.
Update it after completing a session.

## Key Rules
- NEVER commit .env or API keys
- Always update .ai-context/current-sprint.md after session
- Branch: main = Lovable sync, feature/* = Copilot/Claude changes → PR