# KNOWN ISSUES / TODO

## Pravidlo zápisu
Pri každom issue uveď:
- **Symptóm**
- **Dopad**
- **Workaround** (ak existuje)
- **Stav** (open / in progress / resolved)

---

## ✅ RESOLVED — Branch protection

- **Symptóm:** Branch protection nešla zapnúť bez GitHub Pro pre private repo.
- **Dopad:** Teoreticky možný direct push bez technického blokovania.
- **Workaround:** Procesné pravidlo owner approval-only + PR workflow.
- **Stav:** ✅ resolved — GitHub Pro aktivovaný 2026-02-22, branch protection plne aktívna.
  - PR povinný pred každým merge do `main`
  - CODEOWNERS review required (@povazanecn-hue)
  - Force push zablokovaný
  - Delete vetvy zablokovaný

---

## 🔴 OPEN — .env commited s live kľúčmi

- **Symptóm:** Súbor `.env` bol commitnutý do repozitára s reálnymi Supabase kľúčmi.
- **Dopad:** Live API kľúče viditeľné v git histórii — bezpečnostné riziko.
- **Workaround:** Kľúče zatiaľ nerotované, repo je private.
- **Stav:** open — treba: 1) pridať .env do .gitignore, 2) vytvoriť .env.example, 3) rotovať Supabase kľúče
