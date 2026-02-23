# 👤 OWNER CONTEXT – Mgr. Norbert Považanec

> Tento súbor poskytuje kontext o vlastníkovi a jeho projektovom ekosystéme.
> Určený pre AI asistentov a nových spolupracovníkov.
> Umiestnenie: SmartAir repozitár (hlavný referenčný bod)

---

## 🏢 Firmy a projekty

### SmartAir s.r.o.
- **IČO:** 57368279
- **Adresa:** Kopčianska 8, 85101 Bratislava
- **Činnosť:** Predaj, montáž a servis klimatizácií (DAIKIN, Samsung, TCL, Midea)
- **Web repozitár:** `SmartAir` (tento repo)
- **Tech stack:** Webflow CMS + Cloudflare Workers

### DreamAir s.r.o.
- **Činnosť:** Klimatizácie – montáž, servis, predaj
- **Poznámka:** Sesterská firma, rovnaký majiteľ
- **Spoločné:** Zdieľaný kalendár, niektoré marketing aktivity

---

## 📦 GitHub Repozitáre – Mapa projektov

| Repozitár | Projekt | Status | Stack |
|---|---|---|---|
| `SmartAir` | SmartAir web | 🟢 Aktívny | Webflow + CF Workers |
| `menumat-ecb44ba0` | MENUMAT | 🟢 Aktívny | React + Supabase + Lovable |
| `MENUGENERATOR` | Menu generátor | 🟡 Experimentálny | React + Gemini AI |
| `claude-webflow-api` | Webflow API integrácia | 🟡 Vedľajší | JavaScript |
| `AI-pm---visual` | AI PM vizualizácia | 🟡 Interný | PowerShell |
| `programming-ai` | AI experimenty | 🔵 Sandbox | — |
| `KOLIESKO` | Starý projekt | 📦 Archív | — |
| `menugen` | Starší menu generátor | 📦 Archív | TypeScript |
| `MenuGen-` | Lovable pokus | 📦 Archív | — |

---

## 🤖 AI Asistenti v používaní

| AI Nástroj | Kde sa používa |
|---|---|
| **Claude (claude.ai)** | Všetky projekty – hlavný AI asistent |
| **Claude Code** | Terminál – agentic coding |
| **GitHub Copilot** | Cursor IDE – inline completion |
| **Lovable** | menumat – full-stack generátor |
| **ElevenLabs** | menumat – AI hlasová asistencia |
| **Google Gemini** | MENUGENERATOR – menu generovanie |
| **Cursor IDE** | Lokálny vývoj |

---

## 🗂️ AI Context súbory (čo kde hľadať)

Každý repozitár obsahuje tieto AI context súbory:

```
CLAUDE.md                           ← Hlavný kontext (Claude Code, Claude AI)
.cursorrules                        ← Cursor IDE pravidlá
.github/copilot-instructions.md    ← GitHub Copilot pravidlá
.env.example                        ← Šablóna premenných prostredia
```

---

## 📋 Vývojové pravidlá (platné pre všetky projekty)

1. **Nikdy** necommitovať `.env`, API kľúče, heslá
2. Zmeny do `main` len cez Pull Request
3. Commit správy: Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)
4. Vetvy: `feature/nazov`, `fix/nazov`, `docs/nazov`
5. Jazyk UI a dokumentácie: **slovenčina**
6. Jazyk kódu a komentárov: **angličtina**

---

## 🔄 GitHub Audit Log

| Dátum | Akcia |
|---|---|
| 2026-02-23 | Audit a čistenie repozitárov (-353 MB, -9 repos) |
| 2026-02-23 | Pridaný .env do .gitignore vo všetkých aktívnych repos |
| 2026-02-23 | Vytvorené CLAUDE.md, .cursorrules, copilot-instructions |
| 2026-02-23 | claude-webflow-api nastavený na Private |
| 2026-02-23 | Prečistené staré vetvy (MENUGENERATOR, SmartAir) |
