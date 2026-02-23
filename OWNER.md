# 👤 OWNER CONTEXT – Mgr. Norbert Považanec

> Hlavný referenčný súbor pre AI asistentov a nových spolupracovníkov.
> Umiestnenie: dreamair-web + menumat-ecb44ba0

---

## 🏢 Firmy a projekty

### DreamAir s.r.o.
- **Činnosť:** Predaj, montáž a servis klimatizácií (DAIKIN, Samsung, TCL, Midea)
- **Sídlo:** Bratislava, SK
- **Majiteľ:** Mgr. Norbert Považanec
- **Web repozitár:** `dreamair-web` (GitHub)
- **Tech stack:** Webflow CMS + Cloudflare Workers

### SmartAir s.r.o.
- **Poznámka:** Sesterská firma, rovnaký majiteľ
- **Status:** Materiály a projekty prešli pod DreamAir (feb 2026)

---

## 📦 GitHub Repozitáre – Mapa projektov

| Repozitár | Projekt | Status | Stack |
|---|---|---|---|
| `dreamair-web` | DreamAir web | 🟢 Aktívny | Webflow + CF Workers |
| `menumat-ecb44ba0` | MENUMAT | 🟢 Aktívny | React + Supabase + Lovable |
| `MENUGENERATOR` | Menu generátor | 🟡 Experimentálny | React + Gemini AI |
| `claude-webflow-api` | Webflow API integrácia | 🟡 Vedľajší | JavaScript |
| `AI-pm---visual` | AI PM vizualizácia | 🟡 Interný | PowerShell |
| `KOLIESKO` | Starý projekt | 📦 Archív | — |
| `menugen` | Starší menu generátor | 📦 Archív | TypeScript |
| `MenuGen-` | Lovable pokus | 📦 Archív | — |

---

## 🤖 AI Asistenti v používaní

| AI Nástroj | Kde sa používa |
|---|---|
| **Claude (claude.ai)** | Všetky projekty – hlavný AI asistent |
| **Claude Code** | Terminál – agentic coding |
| **GitHub Copilot / Codex** | Cursor IDE + GitHub |
| **Lovable** | menumat – full-stack generátor |
| **ElevenLabs** | menumat – AI hlasová asistencia (SK) |
| **Google Gemini** | MENUGENERATOR – menu generovanie |
| **Cursor IDE** | Lokálny vývoj |
| **Doppler** | Centrálna správa API kľúčov |

---

## 🔑 Doppler – Projekty

| Doppler projekt | GitHub repo |
|---|---|
| `dreamair` | dreamair-web |
| `menumat` | menumat-ecb44ba0 |
| `menugenerator` | MENUGENERATOR |

---

## 🗂️ AI Context súbory (čo kde hľadať)

```
CLAUDE.md                           ← Claude AI + Claude Code
.cursorrules                        ← Cursor IDE
.github/copilot-instructions.md    ← GitHub Copilot / Codex
DOPPLER.md                          ← Správa tajomstiev
OWNER.md                            ← Tento súbor – master prehľad
.env.example                        ← Šablóna premenných
```

---

## 📋 Vývojové pravidlá (všetky projekty)

1. **Nikdy** necommitovať `.env`, API kľúče, heslá
2. Zmeny do `main` len cez Pull Request
3. Commit správy: `feat:`, `fix:`, `docs:`, `refactor:`
4. Vetvy: `feature/nazov`, `fix/nazov`, `docs/nazov`
5. Jazyk UI: **slovenčina** | Jazyk kódu: **angličtina**
6. Kľúče spravuj cez **Doppler** (`doppler run -- príkaz`)

---

## 🔄 GitHub Audit Log

| Dátum | Akcia |
|---|---|
| 2026-02-23 | SmartAir repo premenovaný → dreamair-web |
| 2026-02-23 | Všetky AI súbory aktualizované na DreamAir |
| 2026-02-23 | Doppler integrácia nastavená (dreamair, menumat, menugenerator) |
| 2026-02-23 | Audit a čistenie repozitárov (-353 MB, -11 repos) |
| 2026-02-23 | Pridaný .env do .gitignore, Vulnerability Alerts zapnuté |
