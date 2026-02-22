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
Rozhodnutie: Pouzivame menumat-ecb44ba0 (Lovable auto-vytvorene)
Dovod: Lovable si vytvara vlastne repo pri Connect — netreba duplikovat
Poucenie: Nabuduce nechat Lovable vytvorit repo ako prvy krok