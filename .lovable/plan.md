

# Phase 2: Dashboard Enhancements

Phase 1 (Amber Premium design system) is complete. Now implementing Phase 2 — dashboard improvements.

## Changes

### 1. Apply `font-mono` to all numeric values
All KPI values, margins, prices across Dashboard use `font-mono` class for JetBrains Mono rendering.

### 2. Popular Dishes widget (`src/components/dashboard/PopularDishes.tsx`)
- Query `menu_items` joined with `dishes`, group by `dish_id`, count usage over last 30 days
- Show top 5 most-used dishes with usage count badge
- Add to `useDashboardData.ts` query

### 3. Olivia Insights panel (`src/components/dashboard/OliviaInsights.tsx`)
- Card with AI-generated insights using existing `olivia-chat` edge function
- Send dashboard context (low margin dishes, missing prices, active promos) as `pageContext`
- Lazy-load on button click ("Analyzovať") to avoid unnecessary API calls
- Stream response with markdown rendering
- Placed in the grid alongside Quick Actions

### 4. Dashboard layout update
Replace the current 2-column grid (Cost Trend + Quick Actions) with a 2-column layout:
- Left: Cost Trend chart + Popular Dishes
- Right: Olivia Insights + Quick Actions

### Files to create
- `src/components/dashboard/PopularDishes.tsx`
- `src/components/dashboard/OliviaInsights.tsx`

### Files to modify
- `src/pages/Dashboard.tsx` — add new widgets, apply `font-mono` to numbers
- `src/components/dashboard/useDashboardData.ts` — add popular dishes query

No database changes needed.

