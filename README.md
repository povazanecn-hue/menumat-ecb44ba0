# MENUMAT – Menu Maestro

**Inteligentný nástroj na správu denného menu pre reštaurácie**

## 🍽️ O projekte

MENUMAT je moderná webová aplikácia pre gastro prevádzky, ktorá automatizuje tvorbu, kalkuláciu a publikovanie denného menu. Nahradí manuálne procesy v Exceli, Worde a Canve jedným integrovaným riešením.

## ✨ Hlavné funkcie

- **Databáza jedál** – správa receptúr, alergénov, gramáže a cien
- **Databáza ingrediencií** – sledovanie cien od dodávateľov (Lidl, Kaufland, Metro…)
- **AI generovanie menu** – automatické zostavenie denného menu s pravidlom neopakovania (14 dní)
- **Import menu** – z Excelu, CSV, PDF/Word (OCR)
- **Kalkulácia cien** – náklady, DPH, marža, odporúčaná a finálna cena
- **Export** – TV (1920×1080), PDF, Excel pre kuchyňu, Webflow embed
- **Šablóny** – country/rustikálne, minimalistické, moderné
- **Nákupný zoznam** – automaticky generovaný z menu
- **Tímová spolupráca** – roly (owner, manager, staff, head_chef)

## 🛠️ Technológie

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Lovable Cloud – Auth, Postgres, RLS, Storage, Edge Functions
- **AI:** Lovable AI (Gemini, GPT)
- **Knižnice:** shadcn/ui, Framer Motion, Recharts, TanStack Query, xlsx

## 🚀 Spustenie

Projekt beží na [Lovable](https://lovable.dev) platforme s automatickým deployom.

```sh
# Lokálny vývoj
git clone https://github.com/povazanecn-hue/MENUMAT.git
cd MENUMAT
npm i
npm run dev
```

## 📄 Licencia

Proprietárny softvér – všetky práva vyhradené.

---

*Vytvorené pre Klub Koliesko s víziou B2B rollout-u.*
