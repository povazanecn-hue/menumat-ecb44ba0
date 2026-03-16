

# MENUMAT Improvement Plan — Amber Premium Redesign

## Current State Analysis

The application is mature with all 14 screens implemented, functional database (16 tables, proper RLS), 14 Edge Functions, and AI assistant Olivia. The codebase is well-structured with proper hooks, components, and data flow.

**Key gaps identified:**
- Design system uses warm wood/gold tones instead of the specified Amber Premium palette
- Body font is Source Sans 3, not Inter; no JetBrains Mono for data
- Wood grain texture overlay on body is not part of Amber Premium
- Dashboard lacks dedicated KPI cards and popular dishes widget
- No command palette (CMD+K)
- Nastenka missing @mentions and comments
- Settings missing Integrations/Billing sections
- No global search

---

## Phase 1: Design System Migration (Amber Premium)

Update CSS variables and typography to match the Figma spec exactly.

**`src/index.css` changes:**
- Background: `#0F0F0F` (0 0% 6%) → replace current warm wood tones
- Surface/Card: `#171717` (0 0% 9%)
- Primary: `#C6A15B` (40 47% 57%)
- Accent: `#E5C07B` (40 62% 69%)
- Text Primary: `#F5F5F5` (0 0% 96%)
- Text Secondary: `#A3A3A3` (0 0% 64%)
- Border: `#2A2A2A` (0 0% 16%)
- Remove wood grain `body::before` texture overlay
- Add Inter and JetBrains Mono Google Fonts imports

**`tailwind.config.ts` changes:**
- Add `font-mono: ['JetBrains Mono', 'monospace']`
- Change `font-sans` from Source Sans 3 to Inter
- Keep Playfair Display for serif/headings

**Component-wide impact:**
- All `tabular-nums` price displays get `font-mono` class
- Cards get consistent `bg-[#171717]` surface color
- Buttons standardized with amber primary
- Hover states use `primary/10` glow pattern

---

## Phase 2: Dashboard Enhancements

**Add Popular Dishes widget** — query `menu_items` grouped by `dish_id`, count occurrences over last 30 days, show top 5 with usage count.

**Add Olivia Insights panel** — card with 2-3 AI-generated insights (low margin dishes, pricing suggestions). Uses existing `olivia-chat` edge function with a "dashboard-insights" prompt type.

**Improve KPI cards** — add trend indicators (vs last week), use JetBrains Mono for numbers.

No database changes needed.

---

## Phase 3: Command Palette (CMD+K)

Create `src/components/CommandPalette.tsx` using the existing `cmdk` compatible command component (`src/components/ui/command.tsx`).

- Register keyboard shortcut `CMD+K` / `Ctrl+K` in AppLayout
- Search across: pages (navigation), dishes, ingredients, recipes
- Quick actions: create dish, generate menu, export
- Render in a Dialog overlay

---

## Phase 4: Nastenka Improvements

**@mentions:** Add a simple text pattern `@name` in the `note` field. Parse and highlight in display. No DB change needed — notes already support free text.

**Comments:** Add `proposal_comments` table:
```sql
CREATE TABLE proposal_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES menu_proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;
-- RLS via is_restaurant_member through proposal → restaurant_id
```

**Task statuses:** Already implemented (pending/planned/used). Add visual kanban-style columns.

---

## Phase 5: Settings Expansion

**Integrations section** — show connected services (ElevenLabs, Firecrawl, Perplexity, Cloudinary) with status badges.

**Billing section** — placeholder with link to external billing management.

No database changes needed — reads from existing connectors/secrets.

---

## Phase 6: UX Polish

- **Skeleton loading:** Already on Dashboard; extend to Dishes, Ingredients, Recipes pages (replace text "Načítavam...")
- **Empty states:** Already good; add illustrations
- **Breadcrumbs:** Add to AppLayout below TopActionBar showing current page path
- **Legacy branding:** Fix "MenuGen" reference in `weeklyPrintExport.ts`

---

## Implementation Order

Each phase is independent and can be implemented in a single message:

1. **Phase 1** — Design system (CSS + Tailwind config) — highest visual impact
2. **Phase 2** — Dashboard widgets
3. **Phase 3** — Command palette
4. **Phase 4** — Nastenka comments (DB migration + UI)
5. **Phase 5** — Settings sections
6. **Phase 6** — UX polish

---

## What Already Works Well (No Changes Needed)

- Daily Menu weekly planner with drag-and-drop ✓
- Dish pricing engine (cost → margin → selling price) ✓
- Permanent Menu with category drag sorting + live preview ✓
- Recipe editor with ingredients ✓
- Shopping list with supplier grouping + Excel export ✓
- Export centrum (PDF, TV, Excel, Web embed) with preview ✓
- Template customization (fonts, colors, layout) ✓
- Multi-tenant architecture with RLS ✓
- Notifications system ✓
- Landing page ✓
- Olivia AI assistant ✓

Shall I proceed with Phase 1 (Design System Migration)?

