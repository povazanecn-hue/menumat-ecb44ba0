# MenuMaestro — AI Context

## Project Identity
- **Repo:** povazanecn-hue/menumat-menumaestro-aktual
- **URL:** https://github.com/povazanecn-hue/menumat-menumaestro-aktual
- **Live app:** https://menumaestro.lovable.app (Lovable hosted)
- **Local:** D:\Dev\GitHub\menumat-menumaestro-aktual

## What is this?
Restaurant menu generator (MenuMaestro / MENUMAT).
- Users input restaurant info + dishes → AI generates a branded PDF menu
- Multi-language support, multiple visual templates
- Target: small restaurants, food trucks, cafés

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **AI:** Google Gemini API (menu text generation)
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions)
- **PDF:** jsPDF / React-PDF
- **Hosting:** Lovable (Netlify-based, auto-deploy from main)
- **Sync:** Lovable pushes to main, Claude/Codex work on feature/* branches → PR

## Repo Structure
- `src/pages/` — 17 pages (Index, MenuCreator, Templates, Preview, Export...)
- `src/components/` — UI components (MenuEditor, TemplateSelector, PDFPreview...)
- `src/integrations/supabase/` — Supabase client + types
- `.ai-context/` — AI shared memory (this folder)
- `CLAUDE.md` — auto-loaded by Claude Code
- `.github/copilot-instructions.md` — auto-loaded by Codex/Copilot

## Active AI Tools
- **Lovable** — primary frontend builder, syncs to main branch
- **Claude Code** — architecture, backend, complex logic (feature/* → PR)
- **Codex** — code review, refactoring, small fixes (feature/* → PR)

## Branch Strategy
- `main` — Lovable production sync (source of truth for UI)
- `feature/*` — Claude Code / Codex changes (must PR into main, owner approves)

## Security Note
⚠️ .env was committed with live Supabase keys — needs cleanup (see KNOWN_ISSUES.md)
