

# Implementacia rolí pri registrácii + Nástenka (Board)

## 1. Databázové zmeny

### 1a. Nová hodnota v enum `app_role`
- Pridanie `head_chef` do existujúceho enum `app_role`
- Mapovanie: Šéf = `owner`, Prevádzkar = `manager`, Hl. Kuchár = `head_chef`, Kuchár = `staff`

### 1b. Nová tabuľka `menu_proposals`
Ukladá návrhy jedál na Nástenku:

| Stlpec | Typ | Popis |
|---|---|---|
| id | uuid PK | |
| restaurant_id | uuid FK | Tenant izolácia |
| proposed_by | uuid | Kto navrhol |
| dish_id | uuid FK nullable | Odkaz na existujúce jedlo (voliteľné) |
| dish_name | text | Názov jedla (aj pre nové) |
| category | dish_category | Typ: polievka/hlavné/dezert |
| target_week_start | date | Pondelok cieľového týždňa |
| note | text nullable | Poznámka |
| status | text | `pending` / `planned` / `used` |
| created_at | timestamptz | |

### 1c. Nová tabuľka `menu_proposal_assignments`
Prepojenie návrhu na konkrétne dni:

| Stlpec | Typ | Popis |
|---|---|---|
| id | uuid PK | |
| proposal_id | uuid FK | |
| menu_date | date | Ktorý deň |
| assigned_by | uuid | Kto priradil |
| created_at | timestamptz | |

### 1d. RLS politiky
- `menu_proposals`: CRUD pre členov reštaurácie (cez `is_restaurant_member`)
- `menu_proposal_assignments`: CRUD pre členov reštaurácie

## 2. Registračný formulár - Voľba role

### Auth.tsx zmeny:
- Pri registrácii sa zobrazí pole **"Vaša pozícia"** so 4 možnosťami:
  - Šéf (owner)
  - Prevádzkar (manager)
  - Hl. Kuchár (head_chef)
  - Kuchár (staff)
- Vybraná rola sa uloží do `user_metadata` pri `signUp`
- V Onboarding sa pri `create_restaurant_with_owner` použije zvolená rola namiesto defaultného `owner`

### Zmena RPC funkcie `create_restaurant_with_owner`:
- Pridanie parametra `_role app_role DEFAULT 'owner'` aby sa pri vytváraní použila rola z registrácie

## 3. Správa používateľov (pre Šéfa)

### Nová sekcia v Settings alebo samostatná stránka:
- Šéf (owner) vidí zoznam členov reštaurácie
- Môže meniť roly existujúcich členov
- Môže pozvať nových členov (email)
- Potrebná UPDATE RLS politika na `restaurant_members` pre ownerov

### Databázová zmena:
- Pridanie UPDATE politiky na `restaurant_members`:
  ```
  Len owner môže meniť roly iných členov
  ```

## 4. Nástenka (Board) - `/nastenka`

### Funkcionalita:
1. **Pridávanie návrhov**: Každý člen pridá návrh jedla na konkrétny týždeň
   - Výber z existujúcich jedál alebo zadanie voľného názvu
   - Výber kategórie (polievka/hlavné/dezert)
   - Výber cieľového týždňa (dátum pondelka)
   - Voliteľná poznámka

2. **Zobrazenie**: Karty návrhov zoskupené podľa týždňa
   - Kto navrhol, kedy, kategória
   - Stav: Čakajúce / Naplánované / Použité

3. **Plánovanie (len s exportnými privilégiami - owner/manager)**:
   - Označiť návrh a vybrať dni (checkbox pre Po-Pia)
   - Môže označiť viac dní aj viac menu naraz
   - Po priradení sa stav zmení na `planned`

4. **Označenie ako použité**:
   - Keď sa menu exportuje/publikuje, návrh sa označí `used`
   - Presunie sa do histórie

5. **História**:
   - Tab/sekcia so starými návrhmi (status `used`)
   - Filtrovanie podľa týždňa

### Nová stránka `/nastenka`:
- Pridanie do navigácie v sidebar
- Pridanie routy v App.tsx

## 5. Oprávnenia podľa roly

| Akcia | Šéf | Prevádzkar | Hl.Kuchár | Kuchár |
|---|---|---|---|---|
| Pridať návrh | Ano | Ano | Ano | Ano |
| Priradiť dni | Ano | Ano | Nie | Nie |
| Správa členov | Ano | Nie | Nie | Nie |
| Export | Ano | Ano | Nie | Nie |
| Finančné údaje | Ano | Ano | Nie | Nie |

## Technické detaily

### Poradie implementácie:
1. DB migrácia: enum rozšírenie + nové tabuľky + RLS + RPC update
2. Auth.tsx: role picker pri registrácii
3. Onboarding.tsx: predanie role do RPC
4. useUserRole.ts: update pre `head_chef` rolu
5. Settings.tsx: sekcia správy členov (len owner)
6. Nová stránka Nastenka.tsx + hook useProposals.ts
7. AppSidebar.tsx + App.tsx: routing

### Nové súbory:
- `src/pages/Nastenka.tsx`
- `src/hooks/useProposals.ts`
- `src/components/nastenka/ProposalCard.tsx`
- `src/components/nastenka/AddProposalDialog.tsx`
- `src/components/nastenka/AssignDaysDialog.tsx`
- `src/components/settings/MemberManagement.tsx`

