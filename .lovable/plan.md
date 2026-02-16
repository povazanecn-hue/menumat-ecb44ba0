

# MenuGen — Restaurant Operations App (Rebuild Plan)

## Overview
MenuGen is a Slovak-language restaurant operations app replacing manual Excel/Word/Canva workflows for daily menu creation and publishing. Built with React + Vite + Tailwind CSS + Supabase, designed with a rustic/country aesthetic and modern admin clarity.

---

## Phase 1: Foundation — Auth, Database & Navigation Shell

### Authentication & Onboarding
- Supabase Auth with email login/signup (Slovak UI)
- Onboarding flow: create restaurant profile (name, address, logo, settings)
- Restaurant membership system (owner, staff roles via `user_roles` table)
- Tenant isolation: all data scoped by `restaurant_id` with RLS policies

### Database Schema
- Core tables: `profiles`, `restaurants`, `restaurant_members`, `dishes`, `ingredients`, `dish_ingredients`, `recipes`, `menus`, `menu_items`, `menu_exports`, `permanent_menu_categories`, `permanent_menu_items`, `supplier_prices`
- RLS on all tables ensuring restaurant-level data isolation

### Navigation & Layout
- Left sidebar with collapsible navigation (Dashboard, Jedálny lístok, Jedlá, Ingrediencie, Recepty, Nákupný zoznam, Export centrum, Šablóny, Nastavenia)
- Top horizontal quick-action icon rail with counters (today's menu status, pending exports, alerts)
- Responsive layout for desktop (1440px), tablet (768px), mobile (390px)
- Rustic/country design tokens: warm wood/parchment background accents, earthy color palette, high-legibility typography

---

## Phase 2: Core Operational Modules

### Dashboard
- Overview cards: today's menu status, dish count, recent exports, cost summary
- Quick links to common actions (create today's menu, export, add dish)

### Dish Database (Jedlá)
- Full CRUD with fields: name, category/subtype, allergens (EU 1-14 checkboxes), grammage, VAT/DPH, cost (calculated from ingredients), recommended price (cost + margin), final manual price
- Tags: `daily_menu`, `permanent_offer` with filter toggles
- Category/type filters, search
- Recipe indicator badge ("R") on dishes that have linked recipes

### Ingredients Database (Ingrediencie)
- CRUD with name, unit, base price (owner-controlled)
- Link ingredients to dishes with quantities

### Daily Menu Creation (Denné menu)
- Monday–Friday (Po–Pia) default view with day tabs
- Three modes:
  - **Manual**: drag/pick dishes from database into menu slots
  - **AI-assisted**: specify # soups, mains, desserts, optional categories → AI generates suggestions
  - **Import**: upload Excel/CSV to populate menu
- Generator inputs: soup count, main count, dessert count, optional category slots
- Non-repeat rule: same dish cannot appear within 14 days (configurable in settings)
- Per-day save and save-all actions
- Menu row layout: icon/badge | highlighted title | side + extra below | right-aligned price

---

## Phase 3: Pricing, Recipes & Supplier Intelligence

### Pricing Engine
- Margin slider: 50–300%
- Three-column price display per dish: cost with VAT | recommended price (cost × margin) | final manual price (editable, authoritative)
- AI never overwrites final saved price without explicit approval
- Optional "Sync price to master" action for temporary menu price → dish database

### Recipes (Recepty)
- Standalone `/recipes` page listing all recipes
- Dish-level recipe detail: instructions, ingredient lines (qty + unit), prep/cook time, servings, source metadata
- AI confidence indicator and lock flag (`is_locked`) to prevent AI overwrite
- Link recipes to dishes bidirectionally

### Supplier Intelligence
- Multi-source pricing per ingredient (Lidl, Kaufland, Billa, Metro, Hoppe, Wiesbauer, uploaded lists)
- Supplier price rows: supplier name, current price, promo flag, validity range, updated timestamp, confidence marker
- UI: highlight cheapest valid price, filter by supplier/promo-only/cheapest-only/validity
- "Use this price" action to update ingredient's internal base price

---

## Phase 4: Exports, Templates & AI Assistant

### Export Center
- TV export: FullHD 1920×1080 template render
- Print: PDF generation + direct print action
- Kitchen: Excel export for kitchen staff
- Webflow: embed/card stack output with idempotent publish (update existing, no duplicates)
- Export history table: format, template, author, timestamp

### Template Management (Šablóny)
- Three template style sets: Country/Rustic, Minimalist, Modern
- Template preview and selection for exports
- Template customization (logo, colors, fonts)

### AI Assistant (Olivia)
- Onboarding guidance and help
- Navigation assistance
- Builder AI for workflow execution (generate menu, import, export)
- AI respects locked prices and requires explicit approval for price changes

### Shopping List (Nákupný zoznam)
- Auto-generated from selected menu's ingredients
- Aggregated quantities across menu days
- Export to print/PDF

---

## Phase 5: Settings & Polish

### Settings (Nastavenia)
- Restaurant profile management
- Team member management
- Non-repeat rule configuration (default 14 days)
- VAT/DPH category settings
- Default margin preferences
- Export preferences

### Quality & Accessibility
- All UI labels and messages in Slovak
- Keyboard navigation and focus management
- Proper form labels and ARIA attributes
- Consistent error handling with toast notifications

