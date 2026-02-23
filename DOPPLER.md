# 🔑 DOPPLER – Správa tajomstiev

> Tento projekt používa [Doppler](https://doppler.com) na centrálnu správu
> environment premenných. Kľúče sa NIKDY neukladajú priamo do repozitára.

## Prvotné nastavenie (raz na každom PC)

```bash
# 1. Inštalácia Doppler CLI
npm install -g @doppler/cli      # alebo: winget install Doppler.doppler

# 2. Prihlásenie
doppler login

# 3. Prepojenie s týmto projektom (spustiť v root priečinku)
doppler setup
# → vyberte projekt: smartair | menumat | menugenerator
# → vyberte config: dev
```

## Každodenné použitie

```bash
# Miesto:  npm run dev
doppler run -- npm run dev

# Miesto:  node server.js
doppler run -- node server.js

# Zobraziť aktuálne kľúče
doppler secrets

# Stiahnuť ako .env (pre nástroje ktoré potrebujú .env súbor)
doppler secrets download --no-file --format env > .env
```

## Projekty v Doppler

| Doppler projekt | GitHub repo |
|---|---|
| `smartair` | SmartAir |
| `menumat` | menumat-ecb44ba0 |
| `menugenerator` | MENUGENERATOR |

## Pre AI asistentov

Keď spúšťaš príkazy v tomto projekte, VŽDY prefix-uj s `doppler run --`.
Nikdy nevytváraj ani nenavrhuj .env súbor s reálnymi hodnotami.
Kľúče sú dostupné automaticky cez Doppler CLI.

## GitHub Actions / Codex

Kľúče sú synchronizované z Doppler → GitHub Secrets automaticky
(cez Doppler GitHub Sync integration v dashboard).
V Actions sú dostupné ako `${{ secrets.VITE_SUPABASE_URL }}` atď.
