## Stav: 2026-03-10
**Posledna session:** Copilot (copilot/secure-repositories branch)

### Hotovo
- [x] Lovable pushol kompletny kod do repo
- [x] CLAUDE.md vytvoreny (Claude Code cita automaticky)
- [x] .github/copilot-instructions.md vytvoreny (Codex cita automaticky)
- [x] .ai-context/ struktura nastavena s realnym obsahom
- [x] Architektura zdokumentovana (vsetky pages + komponenty)
- [x] SECURITY FIX: .env odstraneny z git trackingu (`git rm --cached .env`)
- [x] .gitignore rozšírený: `.env.*` blokovaný, `.env.example` povolený

### AI Sync stav
- Claude Code: cita CLAUDE.md automaticky pri otvoreni repo ✓
- Codex:       cita .github/copilot-instructions.md automaticky ✓
- Lovable:     sync cez main branch ✓
- Zdielana pamat: .ai-context/ (vsetky AI) ✓

### Dalsi krok (pre dalšiu AI — Claude alebo Codex)
→ ⚠️ KRITICKE: Rotuj Supabase anon key na https://supabase.com/dashboard
  (starý kľúč bol exponovaný v git histórii commitu df4958b)
→ Repo zostáva PUBLIC (úmyselne) — third-party konektory a servery to potrebujú
→ Pokračovať na feature vývoji

### Dolezite kontexty
- Package manager: Bun (nie npm ani yarn)
- AI asistent v app sa volá Olivia
- Supabase projekt: pozri supabase/config.toml
- Repo je PUBLIC úmyselne (third-party konektory), bezpečnosť cez Supabase RLS

## Zmeny 2026-03-10
- ✅ .env odstraneny z git trackingu (security fix)
- ✅ .gitignore rozšírený (`.env.*` pattern)
- ✅ KNOWN_ISSUES.md aktualizovaný
