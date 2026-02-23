

# Oprava Auth page -- zobrazenie aj pre prihlasenych

## Problem
Aktualne `Auth.tsx` obsahuje redirect na `/dashboard` ked uz existuje session (riadky 39-41). To znamena, ze prihlaseny pouzivatel nikdy neuvidí Auth stranku.

## Riesenie
Odstranit podmienku `if (session) { return <Navigate to="/dashboard" replace />; }` z `Auth.tsx`. Tymto sa Auth stranka zobrazi vzdy, bez ohladu na stav prihlasenia.

## Technicke detaily

### Subor: `src/pages/Auth.tsx`
- Zmazat riadky 39-41 (redirect pri existujucej session)
- Ponechat loading stav (riadky 32-37) pre plynule nacitanie
- Po uspesnom prihlaseni/registracii sa pouzivatel stale presmeruje cez `onAuthStateChange` a `ProtectedRoute` logiku v `App.tsx`

### Dopad
- Auth stranka bude pristupna vzdy
- Prihlasovaci formular sa zobrazi aj ked je pouzivatel uz prihlaseny
- Navigacia po prihlaseni stale funguje cez React Router a `ProtectedRoute`

