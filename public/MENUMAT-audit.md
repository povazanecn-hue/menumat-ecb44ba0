# MENUMAT — Full Application Audit Document

> Generated: 2026-03-13
> Purpose: External AI audit / onboarding document

---

## 1. Project Identity

- **Name:** MENUMAT (MenuMaestro)
- **Type:** Restaurant daily menu management SaaS
- **Language:** Slovak UI, English codebase
- **Target:** Small restaurants, cafés, food trucks (initially Klub Koliesko)
- **Live:** https://menumaestro.lovable.app
- **Repo:** https://github.com/povazanecn-hue/MENUMAT

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS 3 + shadcn/ui + Radix UI |
| State | TanStack Query v5, React Hook Form + Zod |
| Backend | Supabase (Postgres + Auth + Edge Functions + Storage) |
| AI | Lovable AI (Gemini, GPT models) via Edge Functions |
| Animations | Framer Motion |
| Charts | Recharts |
| DnD | dnd-kit |
| Excel | xlsx (SheetJS) |
| Markdown | react-markdown |
| Package Manager | Bun |
| Hosting | Lovable (auto-deploy from main) |

---

## 3. Application Routes

| Route | Page Component | Auth | Description |
|-------|---------------|------|-------------|
| `/` | Landing | No | Public landing page |
| `/auth` | Auth | No | Login/Register |
| `/reset-password` | ResetPassword | No | Password reset |
| `/onboarding` | Onboarding | Yes | Restaurant setup wizard |
| `/dashboard` | Dashboard | Yes | Operations overview |
| `/daily-menu` | DailyMenu | Yes | Weekly menu creation (Mon-Fri) |
| `/dishes` | Dishes | Yes | Dish database CRUD |
| `/ingredients` | Ingredients | Yes | Ingredients + supplier prices |
| `/recipes` | Recipes | Yes | Recipe management |
| `/permanent-menu` | PermanentMenu | Yes | Permanent offer menu |
| `/nastenka` | Nastenka | Yes | Team board / proposals |
| `/shopping-list` | ShoppingList | Yes | Auto-generated shopping list |
| `/exports` | Exports | Yes | Export center + history |
| `/templates` | Templates | Yes | Template management |
| `/settings` | Settings | Yes | Restaurant settings + members |

---

## 4. Database Schema (16 tables)

### Core Tables

#### `restaurants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | text | |
| address | text? | |
| logo_url | text? | |
| settings | jsonb | Default {} |
| created_at, updated_at | timestamptz | |

#### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | References auth.users |
| full_name | text? | |
| avatar_url | text? | |
| created_at, updated_at | timestamptz | |

#### `restaurant_members`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK → restaurants | |
| user_id | uuid | |
| role | app_role enum | owner, manager, staff, head_chef |
| created_at | timestamptz | |

### Dish & Ingredient System

#### `dishes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK → restaurants | Tenant isolation |
| name | text | |
| category | dish_category enum | polievka, hlavne_jedlo, dezert, predjedlo, salat, pizza, burger, pasta, napoj, ine |
| subtype | text? | |
| allergens | int[] | EU 1-14 |
| grammage | text? | e.g. "200g/50g" |
| cost | numeric | Computed from ingredients |
| recommended_price | numeric | cost × margin |
| final_price | numeric? | Owner-set authoritative price |
| vat_rate | numeric | Default 20 |
| is_daily_menu | boolean | |
| is_permanent_offer | boolean | |
| created_at, updated_at | timestamptz | |

#### `ingredients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK | |
| name | text | |
| unit | text | g, kg, ml, l, pcs |
| base_price | numeric | Owner-controlled |
| created_at, updated_at | timestamptz | |

#### `dish_ingredients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| dish_id | uuid FK → dishes | |
| ingredient_id | uuid FK → ingredients | |
| quantity | numeric | |
| unit | text | |

#### `supplier_prices`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| ingredient_id | uuid FK → ingredients | |
| supplier_name | text | Lidl, Kaufland, Metro, etc. |
| price | numeric | |
| is_promo | boolean | |
| valid_from, valid_to | date? | |
| confidence | text? | |
| created_at, updated_at | timestamptz | |

#### `recipes`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| dish_id | uuid FK → dishes | One-to-one |
| instructions | text? | |
| prep_time_minutes | int? | |
| cook_time_minutes | int? | |
| servings | int? | |
| ai_confidence | numeric? | |
| is_locked | boolean | Blocks AI overwrite |
| source_metadata | text? | |
| created_at, updated_at | timestamptz | |

### Menu System

#### `menus`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK | |
| menu_date | date | One menu per day |
| status | text | draft, published |
| created_at, updated_at | timestamptz | |

#### `menu_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| menu_id | uuid FK → menus | |
| dish_id | uuid FK → dishes | |
| sort_order | int | |
| override_price | numeric? | Per-menu price override |
| side_dish | text? | |
| extras | text? | |
| created_at | timestamptz | |

#### `menu_exports`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| menu_id | uuid FK → menus | |
| format | export_format enum | tv, pdf, excel, webflow |
| template_name | text? | |
| file_url | text? | |
| exported_by | uuid? | |
| created_at | timestamptz | |

### Permanent Menu

#### `permanent_menu_categories`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK | |
| name | text | |
| sort_order | int | |

#### `permanent_menu_items`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| category_id | uuid FK | |
| dish_id | uuid FK → dishes | |
| sort_order | int | |

### Team Features

#### `menu_proposals`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK | |
| dish_name | text | |
| dish_id | uuid? FK → dishes | |
| category | dish_category enum | |
| proposed_by | uuid | |
| target_week_start | date | |
| status | text | pending, approved, rejected |
| note | text? | |

#### `menu_proposal_assignments`
Links proposals to specific menu dates.

#### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| restaurant_id | uuid FK | |
| user_id | uuid | |
| title | text | |
| message | text? | |
| type | text | |
| link | text? | |
| is_read | boolean | |

### Database Enums
- `app_role`: owner, manager, staff, head_chef
- `dish_category`: polievka, hlavne_jedlo, dezert, predjedlo, salat, pizza, burger, pasta, napoj, ine
- `export_format`: tv, pdf, excel, webflow

### Database Functions
- `create_restaurant_with_owner(_name, _address, _role)` → uuid
- `get_user_restaurant_ids(_user_id)` → uuid[]
- `is_restaurant_member(_restaurant_id, _user_id)` → boolean
- `recompute_dish_cost` — trigger that recalculates dish cost from ingredients

---

## 5. Edge Functions (14 serverless functions)

| Function | Purpose |
|----------|---------|
| `generate-menu` | AI-powered daily menu generation using Gemini/GPT |
| `regenerate-menu-item` | Replace single menu item via AI |
| `auto-recipe-pipeline` | AI extracts recipe + ingredients for a dish |
| `import-dishes-from-doc` | Import dishes from Word/document |
| `ocr-menu-import` | OCR-based menu import from PDF/image |
| `olivia-chat` | AI assistant (Olivia) chat endpoint |
| `olivia-tts` | Text-to-speech via ElevenLabs |
| `publish-tv` | Generate FullHD TV display HTML |
| `publish-embed` | Generate web embed snippet |
| `extract-price` | AI-powered price extraction from supplier data |
| `firecrawl-scrape` | Web scraping via Firecrawl |
| `firecrawl-search` | Web search via Firecrawl |
| `cloudinary-transform` | Image transformation via Cloudinary |
| `check-missing-menu` | Scheduled check for missing menu days |

---

## 6. Frontend Architecture

### Providers (wrapping order)
```
QueryClientProvider → TooltipProvider → BrowserRouter → AuthProvider → RestaurantProvider → Routes
```

### Key Components

| Component | File | Purpose |
|-----------|------|---------|
| AppLayout | `src/components/AppLayout.tsx` | Main shell with sidebar + content |
| AppSidebar | `src/components/AppSidebar.tsx` | Navigation sidebar |
| MobileBottomNav | `src/components/MobileBottomNav.tsx` | Mobile navigation |
| TopActionBar | `src/components/TopActionBar.tsx` | Quick action icons |
| ProtectedRoute | `src/components/ProtectedRoute.tsx` | Auth guard |
| OliviaAssistant | `src/components/OliviaAssistant.tsx` | AI chat assistant |
| OliviaGreeting | `src/components/OliviaGreeting.tsx` | Page-specific voice greeting |
| OliviaContextTip | `src/components/OliviaContextTip.tsx` | Contextual help tips |
| MenuCreationWizard | `src/components/daily-menu/MenuCreationWizard.tsx` | Menu generation wizard |
| DayMenuCard | `src/components/daily-menu/DayMenuCard.tsx` | Single day menu card |
| DishFormDialog | `src/components/dishes/DishFormDialog.tsx` | Dish CRUD dialog |
| DishPickerDialog | `src/components/daily-menu/DishPickerDialog.tsx` | Pick dish for menu |
| IngredientFormDialog | `src/components/ingredients/IngredientFormDialog.tsx` | Ingredient CRUD |
| SupplierPriceTable | `src/components/ingredients/SupplierPriceTable.tsx` | Supplier price comparison |
| RecipeDetailDialog | `src/components/recipes/RecipeDetailDialog.tsx` | Recipe view/edit |
| MenuPreview | `src/components/exports/MenuPreview.tsx` | Export preview |
| ExportActions | `src/components/exports/ExportActions.tsx` | Export buttons |
| TemplatePreviewCard | `src/components/templates/TemplatePreviewCard.tsx` | Template preview |
| OnboardingStepper | `src/components/onboarding/OnboardingStepper.tsx` | Onboarding flow |

### Custom Hooks (17)

| Hook | Purpose |
|------|---------|
| `useAuth` | Auth context (session, user, signOut) |
| `useRestaurant` | Current restaurant context |
| `useUserRole` | User role in current restaurant |
| `useMenus` | Weekly menus CRUD + query |
| `useDishes` | Dishes CRUD |
| `useIngredients` | Ingredients CRUD |
| `useRecipes` | Recipes CRUD |
| `usePermanentMenu` | Permanent menu management |
| `useTemplates` | Template preferences |
| `useExports` | Export history |
| `useShoppingList` | Auto-generated shopping list |
| `useNotifications` | Notification system |
| `useProposals` | Menu proposals (Nastenka) |
| `useAutoRecipePipeline` | AI recipe extraction |
| `useMenuRegenerate` | AI menu item regeneration |
| `useCloudinary` | Image uploads/transforms |
| `use-mobile` | Responsive breakpoint detection |

---

## 7. Design System

### Theme: Dark-Gold Luxury
- **Background:** Dark wood (#1a1410 ~ HSL 20 30% 7%)
- **Primary:** Rich gold (HSL 40 55% 55%)
- **Cards:** Slightly lighter dark (HSL 20 25% 10%)
- **Text:** Warm parchment (HSL 38 40% 85%)
- **Accent:** Warm gold (HSL 40 60% 50%)
- **Destructive:** Deep red (HSL 0 72% 45%)

### Typography
- **Display:** Playfair Display (serif)
- **Body:** Source Sans 3 (sans-serif)

### Custom Tokens
- `--wood`, `--wood-light`, `--parchment`, `--gold-*` variants
- Sidebar: deepest wood background
- All colors in HSL format for Tailwind compatibility

---

## 8. Business Logic

### Pricing Engine
- **Cost calculation:** Automatic from `dish_ingredients` quantities × `ingredients.base_price`
- **Recommended price:** cost × margin (50-300% configurable)
- **Final price:** Owner-set, authoritative, AI cannot overwrite
- **Override price:** Per-menu-item temporary price
- **Price priority in exports:** override_price → final_price → recommended_price → "—"
- **VAT:** Category-based (default 20%)

### Menu Generation
- AI mode: Uses Gemini/GPT to compose menu from dish database
- Manual mode: Empty template for manual dish picking
- Import mode: Excel/CSV direct, OCR for PDF/Word
- **14-day non-repeat rule:** Same dish cannot appear within 14 days
- Wizard inputs: soup count (1-3), main count (1-8), dessert count (0-2), optional category slots

### Export Formats
- **TV:** FullHD 1920×1080 HTML via Edge Function (`publish-tv`)
- **PDF/Print:** Client-side HTML generation + `window.print()`
- **Excel:** SheetJS (xlsx) kitchen export
- **Web Embed:** Idempotent publish via Edge Function (`publish-embed`)
- **Weekly Print:** A4 landscape, all 5 days in grid

### AI Assistant (Olivia)
- Chat interface via `olivia-chat` Edge Function
- Voice greeting via `olivia-tts` (ElevenLabs TTS)
- Page-specific context tips
- Onboarding guidance

### Allergens
EU standard 1-14: Lepok, Kôrovce, Vajcia, Ryby, Arašidy, Sója, Mlieko, Orechy, Zeler, Horčica, Sezam, Siričitany, Lupina, Mäkkýše

### Dish Categories
polievka (Soup), hlavne_jedlo (Main), dezert (Dessert), predjedlo (Starter), salat (Salad), pizza, burger, pasta, napoj (Drink), ine (Other)

---

## 9. External Integrations

| Service | Purpose | Key Type |
|---------|---------|----------|
| ElevenLabs | TTS for Olivia voice | Secret (Edge Function) |
| Cloudinary | Image hosting/transforms | Secret (Edge Function) |
| Firecrawl | Web scraping for prices | Secret (Edge Function) |
| Perplexity | AI search | Secret (Edge Function) |

---

## 10. File Structure Summary

```
src/
├── App.tsx                    # Root with routes
├── main.tsx                   # Entry point
├── index.css                  # Design system tokens
├── pages/                     # 14 page components
├── components/
│   ├── ui/                    # 45+ shadcn/ui components
│   ├── daily-menu/            # Menu creation components
│   ├── dashboard/             # Dashboard widgets
│   ├── dishes/                # Dish management
│   ├── ingredients/           # Ingredient + supplier
│   ├── recipes/               # Recipe components
│   ├── exports/               # Export center
│   ├── templates/             # Template management
│   ├── permanent-menu/        # Permanent menu
│   ├── nastenka/              # Team board
│   ├── onboarding/            # Onboarding wizard
│   ├── settings/              # Settings components
│   ├── AppLayout.tsx
│   ├── AppSidebar.tsx
│   ├── OliviaAssistant.tsx
│   └── ...
├── hooks/                     # 17 custom hooks
├── lib/
│   ├── constants.ts           # Allergens, categories
│   ├── exportUtils.ts         # Export logic (TV, PDF, Excel, Embed)
│   ├── weeklyPrintExport.ts   # Weekly A4 print
│   ├── kolieskoImport.ts      # Koliesko-specific import
│   └── utils.ts               # cn() utility
├── integrations/
│   └── supabase/
│       ├── client.ts          # Auto-generated client
│       └── types.ts           # Auto-generated types
supabase/
├── config.toml                # Supabase config
├── functions/                 # 14 Edge Functions
│   ├── generate-menu/
│   ├── olivia-chat/
│   ├── olivia-tts/
│   ├── publish-tv/
│   ├── publish-embed/
│   └── ...
```

---

## 11. Security Model

- **Tenant isolation:** All queries scoped by `restaurant_id`
- **RLS:** Row Level Security on all tables
- **Auth:** Supabase Auth (email/password)
- **Roles:** Stored in `restaurant_members` table (not profiles)
- **Edge Functions:** Bearer token auth
- **Secrets:** Managed via Lovable Cloud secrets (not in code)

---

## 12. Known Issues

1. Legacy branding "MenuGen" in `weeklyPrintExport.ts` footer (should be "MENUMAT")
2. `DailyMenu.tsx` is ~579 lines, needs refactoring
3. ElevenLabs TTS returns 401 (quota_exceeded) — falls back to text-only
4. No dark/light mode toggle (dark-gold is the only theme)

---

## 13. Dependencies (production)

```
react ^18.3.1, react-dom ^18.3.1, react-router-dom ^6.30.1
@tanstack/react-query ^5.83.0
@supabase/supabase-js ^2.95.3
tailwindcss ^3.4.17, tailwind-merge ^2.6.0, tailwindcss-animate ^1.0.7
framer-motion ^12.34.0
recharts ^2.15.4
xlsx ^0.18.5
react-hook-form ^7.61.1, @hookform/resolvers ^3.10.0, zod ^3.25.76
@dnd-kit/core ^6.3.1, @dnd-kit/sortable ^10.0.0
date-fns ^3.6.0
lucide-react ^0.462.0
sonner ^1.7.4
react-markdown ^10.1.0
class-variance-authority ^0.7.1, clsx ^2.1.1
cmdk ^1.1.1
45+ @radix-ui/* components (shadcn/ui base)
```
