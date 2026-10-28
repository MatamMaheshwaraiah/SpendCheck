# SpendCheck — Frontend (React + Tailwind CSS v4)

AI-powered personal finance tracker, final-year project based on
*"SpendCheck: An LLM-Based Mobile Personal Finance Tracker"* (IEEE GSEACT 2026), with these upgrades:
hybrid 4-stage categorisation with confidence scores, receipt OCR with GST/arithmetic validation,
UPI/bank SMS parsing, statement import, grounded AI insights, forecasts, subscriptions and goals.

## Run
```bash
npm install
npm run dev        # http://localhost:5173  (demo login is pre-filled)
npm run build
```
Requires Node 18+.

## Stack
React 19 · React Router 7 · Tailwind CSS v4 (CSS-first `@theme` tokens in `src/index.css`) · lucide-react icons.
Charts are hand-built SVG components (`src/components/charts`) — no chart library needed.

## Design system — "The Ledger"
Rooted in how India keeps money: the hisaab notebook, thermal receipts and fountain-pen indigo ink.

| Token | Dark | Light | Used for |
|---|---|---|---|
| Ground | `#0E1122` indigo night | `#F0F1EB` ledger paper | page background |
| Ink | `#F2F3F7` | `#151A30` | text, primary buttons |
| Peacock (`mint-*`) | `#2FBFAC` | `#0C7A6D` | brand, positive, savings |
| Indigo (`need`) | `#8496F5` | `#4A5FD6` | needs |
| Rani (`want`) | `#EC6FA5` | `#C93D7C` | wants |
| Marigold (`iris-*`) | `#E9A10F` | `#E9A10F` | **only** for AI-written content |

**Type:** Fraunces (soft variable serif) for headlines and AI notes, which are set in italic like
handwritten margin notes. Geist for the interface, with tabular figures for money. Geist Mono only on the receipt.

**Motion** (no animation library; spring curves via CSS `linear()`; reduced motion is respected):
- Landing hero: a receipt prints line by line, items get stamped need or want, and the totals are filed into a ledger.
- Money counts up, chart lines draw in, donut arcs sweep, bars grow with a stagger.
- Theme switch spreads from the toggle as a circle (View Transitions API).
- Sliding indicators on the sidebar and tabs, spring bottom sheets on phones, ⌘K / Ctrl K command palette.

## Starting fresh
- **Overview → Start fresh** (or **Settings → Start a fresh ledger**) clears all transactions, goals, alerts,
  insights and learned category rules. Budget limits, account and settings are kept. A confirmation lists exactly what goes.
- The empty Overview then shows a quick-add bar: amount → description → Enter, and focus returns to the amount
  for the next entry. Categories are detected as you type; each new entry has an undo button.
- In mock mode the ledger is saved in the browser (`localStorage`, key `spendcheck.ledger.v1`), so entries survive a refresh.
  Insights, subscriptions and budget alerts (80% / 100%) are then calculated from your own entries.
- "Load the sample data" brings the demo back. Backend endpoints: `DELETE /api/v1/me/data?mode=fresh|demo`, `DELETE /api/v1/transactions/:id`.

## Light & dark mode
- Toggle (sun/moon) in the app header, landing nav and login screens; Light / Dark / System picker in **Settings → Appearance**.
- *System* follows the device setting live. The choice is saved per device and applied before first paint (no flash).
- How it works: `:root[data-theme="light"]` in `src/index.css` inverts the `ink` scale and darkens brand hues for
  contrast on white, so components need no `dark:` classes. Use `snow` / `onyx` for colours that must never flip.

## Devices
Phone (bottom tab bar + floating add button, safe-area aware), tablet (bottom bar, wider grids) and
laptop/desktop (sidebar from 1024 px). Tested at 390, 768, 1024 and 1440 px wide.

## Structure
```
src/
  index.css               design tokens + base styles
  main.jsx, App.jsx       providers + routes
  services/api.js         ALL backend calls (1:1 with planned REST endpoints)
  data/mock.js            demo dataset + SMS parser
  data/categories.js      categories + merchant-dictionary categoriser
  context/                Auth + Toast providers
  hooks/useApi.js         data-loading hook
  components/ui           Button, Card, Badge, Modal, Progress, ...
  components/charts       SpendAreaChart, Donut, Ring, StackedBars, HBars, Sparkline
  components/layout       AppShell (sidebar, top bar, mobile bottom nav)
  pages/                  Landing, Auth (Login/Register)
  pages/app/              Dashboard, Transactions, AddImport, Budgets, Insights,
                          Goals, Subscriptions, Alerts, Settings
```

## Connecting the backend later
1. Copy `.env.example` to `.env` and set `VITE_USE_MOCK=false`.
2. Run the Express + MySQL API on port 5000 — Vite proxies `/api` to it.
3. Implement the endpoints listed in `src/services/api.js` (e.g. `POST /api/v1/auth/login`,
   `GET /api/v1/summary`, `POST /api/v1/receipts`, `POST /api/v1/imports/sms`, `POST /api/v1/assistant/chat`).
No page code needs to change.
