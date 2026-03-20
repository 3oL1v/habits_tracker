# Habit Tracker Mini App

Telegram bot + Telegram Mini App MVP for tracking daily habits and monthly sleep logs.

The project is intentionally narrow:

- `Habits tracker`
- `Sleep tracker`
- Telegram bot as entry point to the Mini App

No mood/water/finance tracking, no payments, no AI coach, no social features.

## What Is Included

- Mobile-first React Mini App with `Home`, `Habits`, and `Sleep` screens
- Fastify backend with validated DTOs and protected API
- Telegram Mini App auth flow with backend validation of `initData`
- PostgreSQL + Prisma schema, seed, and SQL migration
- grammY bot with `/start`, `/app`, inline web app button, and menu button setup
- Tailwind UI styled for a light Pinterest / bullet journal aesthetic

## Monorepo Structure

```text
.
├─ app/
│  ├─ backend/
│  │  ├─ prisma/
│  │  │  ├─ migrations/
│  │  │  ├─ schema.prisma
│  │  │  └─ seed.ts
│  │  ├─ src/
│  │  │  ├─ lib/
│  │  │  ├─ routes/
│  │  │  ├─ types/
│  │  │  ├─ app.ts
│  │  │  ├─ config.ts
│  │  │  └─ server.ts
│  │  └─ package.json
│  └─ frontend/
│     ├─ src/
│     │  ├─ components/
│     │  ├─ hooks/
│     │  ├─ lib/
│     │  ├─ screens/
│     │  ├─ App.tsx
│     │  └─ main.tsx
│     └─ package.json
├─ bot/
│  ├─ src/
│  │  ├─ env.ts
│  │  └─ index.ts
│  └─ package.json
├─ docs/
│  └─ production-notes.md
├─ scripts/
│  └─ setup.mjs
├─ docker-compose.yml
├─ .env.example
├─ package.json
└─ pnpm-workspace.yaml
```

## Stack

- `Node.js`
- `TypeScript`
- `pnpm workspaces`
- `Fastify`
- `Prisma`
- `PostgreSQL`
- `grammY`
- `React + Vite`
- `Tailwind CSS`
- `react-hook-form + zod`
- `dayjs`
- `lucide-react`

## Architecture

### Backend

- Issues JWT session tokens after Telegram auth
- Validates Telegram `initData` on the server
- Maps app users to `telegramId`
- Exposes REST API for auth, home summary, habits, and sleep
- Stores data in PostgreSQL through Prisma

### Frontend

- Opens inside Telegram as a Web App / Mini App
- Falls back to guarded dev auth in local browser mode when `VITE_DEV_AUTH=true`
- Uses React Query for API state
- Uses modal sheets for create/edit flows
- Renders a monthly bullet-journal style sleep chart on a 18:00 -> 14:00 timeline

### Bot

- Sends a welcome message on `/start`
- Sends Mini App button on `/start` and `/app`
- Sets menu button to the Mini App URL on startup

## Environment Variables

Copy `.env.example` to `.env` and fill the values.

### Shared / database

- `NODE_ENV`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `DATABASE_URL`

### Backend

- `PORT`
- `API_PREFIX`
- `FRONTEND_ORIGIN` (optional when it matches `WEBAPP_URL`)
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_AUTH_MAX_AGE_SECONDS`
- `ALLOW_DEV_AUTH`
- `DEV_AUTH_TELEGRAM_ID`
- `DEV_AUTH_FIRST_NAME`
- `DEV_AUTH_USERNAME`

### Frontend

- `VITE_API_BASE_URL` (optional for same-origin `/api`)
- `VITE_APP_NAME`
- `VITE_DEV_AUTH`

### Bot

- `WEBAPP_URL`

## Local Setup

### 1. Bootstrap env

```bash
node scripts/setup.mjs
```

or manually:

```bash
cp .env.example .env
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Start PostgreSQL

```bash
pnpm db:up
```

This uses `docker-compose.yml`. Docker is required locally.

### 4. Generate Prisma client

```bash
pnpm prisma:generate
```

### 5. Apply migrations

```bash
pnpm prisma:migrate
```

### 6. Seed demo data

```bash
pnpm seed
```

The seed creates a demo user tied to `DEV_AUTH_TELEGRAM_ID` and adds sample habits + sleep logs.

### 7. Start the full workspace

```bash
pnpm dev
```

This runs:

- backend on `http://localhost:3001`
- frontend on `http://localhost:5173`
- bot in polling mode

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm db:up
pnpm db:down
pnpm prisma:generate
pnpm prisma:migrate
pnpm seed
```

## Backend API

Main routes under `API_PREFIX`:

- `POST /auth/telegram`
- `POST /auth/dev-login`
- `GET /auth/me`
- `GET /home/summary`
- `GET /habits`
- `POST /habits`
- `PATCH /habits/:habitId`
- `POST /habits/:habitId/toggle`
- `DELETE /habits/:habitId`
- `GET /sleep`
- `POST /sleep`
- `PATCH /sleep/:entryId`
- `DELETE /sleep/:entryId`

## Telegram Setup

### 1. Create the bot

1. Open `@BotFather` in Telegram.
2. Run `/newbot`.
3. Pick a bot name and username.
4. Copy the token BotFather returns.

### 2. Put the bot token into env

In the root `.env` file set:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

If you already have a token, paste it here. Do not commit the real token.

### 3. Set the Mini App URL

In the same root `.env` file set:

```env
WEBAPP_URL=https://your-single-service-domain.example
```

Important:

- Telegram Mini Apps require `HTTPS`
- `localhost` is fine for browser development, but not for opening inside Telegram
- for real Telegram testing you need a public HTTPS URL

### 4. Configure the frontend/backend origins

For local browser development:

```env
FRONTEND_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=/api
```

For Telegram testing via tunnel or production, update these to your real domains.

### 5. Start the bot

```bash
pnpm --filter @habit-tracker/bot dev
```

On startup the bot will:

- register `/start`
- register `/app`
- set the chat menu button to `WEBAPP_URL`

### 6. Open the Mini App

- Send `/start` to the bot
- Tap `Open Habit Tracker`
- or use the bot menu button

## Local Development Modes

### Browser-only local UI development

If you want to work on the frontend outside Telegram:

- keep `VITE_DEV_AUTH=true`
- keep `ALLOW_DEV_AUTH=true`
- run the app in the browser at `http://localhost:5173`

The backend will create/use the demo user from seed data.

### Real Telegram Mini App testing

Use a public HTTPS URL that serves the Mini App:

1. expose the app over HTTPS
2. set `WEBAPP_URL` to that HTTPS URL
3. set `FRONTEND_ORIGIN` only if the frontend origin differs from `WEBAPP_URL`
4. restart the service or local processes

## Deployment

Recommended deployment:

- single service for `backend + bot + built frontend`
- one PostgreSQL service

### Railway / Railpack Notes

This repository can now run as a single Railway service. The backend serves the built Mini App from `app/frontend/dist`, while the same process also exposes the API.

Default production commands:

```bash
Build: pnpm build
Start: pnpm start
```

What `pnpm start` runs:

- backend: `pnpm start:backend`
- bot: `pnpm start:bot`

Recommended single-service Railway variables:

- `WEBAPP_URL=https://your-backend-domain.up.railway.app`
- `FRONTEND_ORIGIN` may be omitted and will fall back to `WEBAPP_URL` origin
- `VITE_API_BASE_URL` may be omitted and already defaults to `/api`

Optional split deployment is still possible if you explicitly keep a separate frontend service.

Production checklist:

1. Provision PostgreSQL and set `DATABASE_URL`
2. Set strong `JWT_SECRET`
3. Deploy one Railway service from this repo with `pnpm build` and `pnpm start`
4. Set `WEBAPP_URL` to that same service domain
5. Set `FRONTEND_ORIGIN` only if it differs from `WEBAPP_URL`
6. Optionally set `VITE_API_BASE_URL=/api` (already the default)
7. Run `pnpm prisma:migrate`
8. Ensure only one bot instance is running for the token

Extra notes are in [docs/production-notes.md](./docs/production-notes.md).

## UX Notes

- `Home` shows greeting, today summary, and last sleep snapshot
- `Habits` optimizes for 1-tap completion
- `Sleep` prioritizes a monthly sleep chart over analytics-heavy dashboards
- safe-area padding is included for Telegram on phones

## MVP Limitations

- One sleep entry per night date
- No reminders or notifications yet
- No offline mode
- No historical analytics beyond the monthly sleep view and habit streaks
- No habit reordering
- No multi-timezone profile settings yet
- Dev auth exists for local browser development and must stay disabled in production if not needed

## Verification

The project includes scripts for:

```bash
pnpm prisma:generate
pnpm typecheck
pnpm build
pnpm lint
```

If Docker is available locally, also run:

```bash
pnpm db:up
pnpm prisma:migrate
pnpm seed
pnpm dev
```

