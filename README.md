# Sports App 🏆

A school sports app built with **Cloudflare Workers**, **Cloudflare D1** (SQLite), and **Cloudflare Pages**.  
Track your sports, teams, and match scores — all deployed on Cloudflare's global network for free.

---

## Features

- 🏅 View all sports (Football, Basketball, Volleyball, Tennis, Swimming)
- 🏟️ Browse teams per sport
- 📋 View all match results with scores
- ➕ Add new match results via a web form
- 🗑️ Delete matches
- 🔍 Filter matches and teams by sport

---

## Tech stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | HTML + CSS + Vanilla JS           |
| Backend  | Cloudflare Workers (JS)           |
| Database | Cloudflare D1 (SQLite)            |
| Hosting  | Cloudflare Pages                  |
| CLI tool | Wrangler v3                       |

---

## Project structure

```
Sports-App/
├── public/           # Frontend (served by Cloudflare Pages)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── src/
│   └── index.js      # Cloudflare Worker (API)
├── schema.sql        # D1 database schema + seed data
├── wrangler.toml     # Cloudflare configuration
└── package.json
```

---

## Getting started

### 1. Prerequisites

- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Node.js](https://nodejs.org/) (v18+)

### 2. Install Wrangler

```bash
npm install
```

### 3. Log in to Cloudflare

```bash
npx wrangler login
```

### 4. Create the D1 database

```bash
npx wrangler d1 create sports-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "sports-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"   # ← replace this
```

### 5. Initialise the database (create tables + seed data)

Local (for development):
```bash
npm run db:init
```

Remote (production):
```bash
npm run db:init:remote
```

### 6. Run locally

```bash
npm run dev
```

Then open <http://localhost:8787> in your browser.

### 7. Deploy to Cloudflare

```bash
npm run deploy
```

Your Worker is now live at `https://sports-app.<your-subdomain>.workers.dev`.

---

## API reference

All endpoints return JSON. The Worker handles `/api/*` routes.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sports` | List all sports |
| GET | `/api/sports/:id/teams` | List teams for a sport |
| GET | `/api/teams` | List all teams (optional `?sport_id=`) |
| POST | `/api/teams` | Create a team `{ name, sport_id }` |
| GET | `/api/matches` | List all matches (optional `?sport_id=`) |
| POST | `/api/matches` | Create a match |
| GET | `/api/matches/:id` | Get a single match |
| PUT | `/api/matches/:id` | Update score / details |
| DELETE | `/api/matches/:id` | Delete a match |

---

## License

MIT