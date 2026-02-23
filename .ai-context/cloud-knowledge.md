# Cloud Knowledge — Guardrails pre AI spoluprácu

## Účel
Tento dokument je povinné čítanie pre každý AI nástroj (Lovable, Claude Code, Codex)
pred väčším zásahom do štruktúry, configu alebo závislostí projektu.

---

## Ako pracuje Lovable (a čo potrebuje)

- Lovable je **primárny UI builder** — vlastní `main` vetvu
- Pushuje priamo zo svojho editora do `main` cez GitHub sync
- **Potrebuje:** stabilné názvy komponentov, žiadne breaking changes v props/typoch bez upozornenia
- **Nikdy nemeňte** bez súhlasu: `src/components/`, `src/pages/`, `tailwind.config`, `vite.config`
- Ak Lovable a Claude/Codex zmenia ten istý súbor → **vyhrá ten, kto merguje neskôr** (conflict risk!)

## Ako pracuje Claude Code a Codex (a čo potrebujú)

- Claude Code / Codex pracujú na **`feature/*` vetvách**, nikdy priamo na `main`
- Každá zmena ide cez **Pull Request → schválenie vlastníka (@povazanecn-hue) → merge**
- **Potrebujú:** aktuálny `.ai-context/` pred začatím práce
- Sú vhodní na: backend logiku, Supabase integrácie, Edge Functions, refaktoring, testy

---

## Guardrails — čo platí pre VŠETKY AI nástroje

| Pravidlo | Dôvod |
|---|---|
| Nikdy hardcoded API kľúče | Bezpečnosť |
| Nikdy priamy push do `main` (okrem Lovable) | Branch protection |
| Vždy aktualizovať `.ai-context/current-sprint.md` po session | AI sync |
| Breaking changes len po konzultácii s vlastníkom | Stabilita |
| `.env` nikdy do commitu | Bezpečnosť |

---

## Conflict Playbook

**Scenár 1: Lovable a Claude zmenili ten istý súbor**
1. Otvor PR od Claude/Codex a skontroluj diff
2. Ak je konflikt → resolve manuálne vo VS Code alebo GitHub web editor
3. Vždy preferuj Lovable verziu pre UI/štýly, Claude verziu pre logiku/typy

**Scenár 2: Lovable prepisuje zmeny z PR**
1. Zmeny z PR musia byť mergnuté PRED ďalším Lovable pushom
2. Poradie: Claude PR → schválenie → merge → potom Lovable sync

**Scenár 3: AI nástroj chce zmeniť chránený súbor**
1. Vytvorí PR (nesmie pushnúť priamo)
2. Vlastník dostane notifikáciu
3. Review → schváliť alebo zamietnuť

---

## Chránený kód bez spomalenia tímu

- Bežné zmeny (texty, štýly, nové komponenty): Lovable robí priamo
- Logika, Supabase, typy: Claude/Codex cez PR — review do 24h
- Config zmeny (vite, tailwind, tsconfig): vždy PR + vlastník schváli
- `.ai-context/` aktualizácia: povolená priamo (nízke riziko)
