# Known Issues & Tech Debt — MENUMAT

## Bezpecnost
- [x] OPRAVENE: .env bol commitnuty v repo s ostrymi Supabase kľúčmi.
      Riesenie: `git rm --cached .env` — súbor je teraz untracked.
      ⚠️ AKCIA POTREBNA: Rotuj Supabase anon key na https://supabase.com/dashboard
        (starý kľúč bol exponovaný v git histórii)
- [x] .gitignore rozšírený: `.env.*` je blokovaný, `.env.example` je povolený
- [i] Repo zostáva PUBLIC (úmyselne) — potrebné pre third-party konektory a servery.
      Bezpečnosť je riešená cez Supabase RLS politiky a rotáciu kľúčov.

## Tech Debt
- [ ] Doplnit architecture.md po preskumani src/
- [ ] Zdokumentovat Supabase schemu
- [ ] Nastavit error handling pre Gemini API

## Sledovane veci
(pridavaj sem pocas development)