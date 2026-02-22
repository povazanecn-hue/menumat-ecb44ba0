# Architektonicke rozhodnutia — MENUMAT

## 2026-02-22 — AI Sync cez .ai-context/
Rozhodnutie: Zavedenie .ai-context/ pre koordinaciu Claude + Codex + Lovable
Dovod: Vsetky AI nastroje citaju rovnaky kontext bez opakovaneho vysvetlovania
Pravidlo: Po kazdej session aktualizovat current-sprint.md

## 2026-02-22 — Lovable ako UI builder
Rozhodnutie: UI sa buduje v Lovable, sync cez GitHub
Dovod: Rychly development, Supabase integracia out-of-the-box
Dosledok: main branch = Lovable sync, feature branches pre Claude/Codex

## 2026-02-22 — Repo naming
Rozhodnutie: Pouzivame menumat-menumaestro-aktual (Lovable auto-vytvorene)
Dovod: Lovable si vytvara vlastne repo pri Connect — netreba duplikovat
Poucenie: Nabuduce nechat Lovable vytvorit repo ako prvy krok
## [2026-02-22] Repo premenovaný na menumat-menumaestro-aktual
- **Dôvod:** Lovable vytvorilo repo s hash názvom (menumat-ecb44ba0). Premenované na zmysluplný názov.
- **Nový názov:** menumat-menumaestro-aktual
- **Projekt:** MenuMaestro (interný kódový názov MENUMAT)
- **Všetky AI context súbory:** aktualizované

## [2026-02-22] Branch protection — obmedzenie
- GitHub branch protection (PR required) je dostupná len pre:
  - Verejné repozitáre (free účet)
  - Súkromné repozitáre (GitHub Pro/Team/Enterprise)
- **Alternatíva:** Lovable, Claude, Codex pracujú na feature/* vetvách → PR do main
  - Toto je dohoda, nie technické vynútenie

## [2026-02-22] Cloud Knowledge — officiálny collaboration režim
- Zavedený súbor `.ai-context/cloud-knowledge.md` ako zdieľaná dohoda medzi AI nástrojmi
- Popisuje workflow pre Lovable, Claude Code a Codex
- Conflict playbook pre prípad kolízie zmien
- Guardrails sú povinné pre všetky AI nástroje pred väčšími zásahmi
