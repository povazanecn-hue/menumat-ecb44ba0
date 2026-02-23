# 👤 OWNER CONTEXT – Mgr. Norbert Považanec

> Hlavný referenčný súbor pre AI asistentov a nových spolupracovníkov.
> Posledná aktualizácia: 2026-02-23

---

## 🏢 Firmy

### DreamAir s.r.o.
- **Činnosť:** Predaj, montáž a servis klimatizácií (DAIKIN, Samsung, TCL, Midea)
- **Sídlo:** Bratislava, SK
- **Majiteľ:** Mgr. Norbert Považanec
- **Web:** `dreamair-web` (GitHub) → Webflow CMS + Cloudflare Workers

### SmartAir s.r.o.
- Sesterská firma, rovnaký majiteľ
- Materiály a projekty prešli pod DreamAir (feb 2026)

---

## 📦 GitHub Repozitáre

### 🟢 AKTÍVNE (2 hlavné projekty)

| Repozitár | Projekt | Stack | Doppler |
|---|---|---|---|
| `dreamair-web` | DreamAir web + backend | Webflow + CF Workers | `dreamair` |
| `menumat-ecb44ba0` | MENUMAT – menu systém | React + Supabase + Lovable | `menumat` |

### 🟡 VEDĽAJŠIE

| Repozitár | Popis |
|---|---|
| `claude-webflow-api` | Webflow API integrácia (JS) |
| `AI-pm---visual` | Interný AI PM nástroj |
| `mcp-figma` | Figma MCP fork |

### 📦 ARCHÍV (len na čítanie)

| Repozitár | Čo sa tu naučilo |
|---|---|
| `MENUGENERATOR` | React + Gemini AI menu generátor → poznatky v CLAUDE.md |
| `menugen` | Starší TypeScript pokus |
| `MenuGen-` | Lovable prvotný pokus |
| `KOLIESKO` | Starý projekt |

---

## 🔑 Doppler – Správa kľúčov

**Len 2 aktívne projekty:**

| Doppler projekt | GitHub repo | Kľúče |
|---|---|---|
| `dreamair` | `dreamair-web` | CF_API_TOKEN, WEBFLOW_API_TOKEN |
| `menumat` | `menumat-ecb44ba0` | SUPABASE_*, ELEVENLABS_*, GEMINI_* |

```bash
# Spustenie projektov
doppler run -- npm run dev          # v dreamair-web
doppler run -- npm run dev          # v menumat-ecb44ba0
```

---

## 🤖 AI Nástroje

| Nástroj | Použitie |
|---|---|
| Claude (claude.ai + Claude Code) | Hlavný AI asistent, všetky projekty |
| GitHub Copilot / Codex | Cursor IDE + GitHub Actions |
| Lovable | menumat – generovanie kódu |
| ElevenLabs | menumat – SK hlasová asistencia |
| Doppler | Centrálna správa API kľúčov |

---

## 📋 Vývojové pravidlá

1. Nikdy necommitovať `.env`, API kľúče
2. Zmeny do `main` len cez Pull Request
3. Commit správy: `feat:`, `fix:`, `docs:`, `refactor:`
4. Jazyk UI: **slovenčina** | Kód: **angličtina**
5. Kľúče: vždy cez **Doppler** (`doppler run -- príkaz`)

---

## 🔄 Audit Log

| Dátum | Akcia |
|---|---|
| 2026-02-23 | MENUGENERATOR archivovaný, poznatky zachované v CLAUDE.md |
| 2026-02-23 | SmartAir → dreamair-web premenovaný |
| 2026-02-23 | Doppler nastavený: 2 projekty (dreamair, menumat) |
| 2026-02-23 | GitHub audit: -353 MB, Vulnerability Alerts zapnuté |
