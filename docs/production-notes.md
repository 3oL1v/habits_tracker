# Production Notes

## Recommended Railway Topology

- `Single service`: Fastify backend + Telegram bot + built frontend Mini App
- `Single PostgreSQL service`

The backend now serves `app/frontend/dist`, so Railway does not need a separate frontend service unless you intentionally want a split deployment.

## Environment

Set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `WEBAPP_URL`
- `FRONTEND_ORIGIN` (optional when it matches `WEBAPP_URL`)
- `VITE_API_BASE_URL` (optional for same-origin `/api`)

Recommended single-service values:

- `WEBAPP_URL=https://your-backend-domain.up.railway.app`
- `FRONTEND_ORIGIN` may be omitted and will fall back to `WEBAPP_URL` origin
- `VITE_API_BASE_URL` may be omitted and already defaults to `/api`

## Build And Start

Use:

1. `pnpm build`
2. `pnpm start`

This starts:

- Fastify API on the Railway service port
- grammY bot in the same service
- static Mini App delivery from the backend process

## Backend

- Run Prisma migrations before starting the API
- Keep `JWT_SECRET` long and random
- Keep `ALLOW_DEV_AUTH=false` in production unless you explicitly need local-only browser auth
- If you keep a split frontend deployment, set `FRONTEND_ORIGIN` explicitly to that frontend origin

## Telegram Bot

- The bot process should boot after `WEBAPP_URL` is correct
- On startup it sets `/start`, `/app`, and the chat menu button
- If you change `WEBAPP_URL`, restart the service so menu button settings are refreshed
- Only one running bot instance may use the same `TELEGRAM_BOT_TOKEN`

## Database

- Use managed PostgreSQL in production when possible
- Back up the database regularly
- Run Prisma deploy migrations during release

## Release Flow

1. Build and deploy the single Railway service
2. Run Prisma migrations against production DB
3. Verify `/health`
4. Open the Telegram Mini App through `/start`

## Operational Notes

- The frontend uses JWT after Telegram auth and does not trust a frontend user id
- Telegram `initData` validation happens on the backend before issuing the session token
- Sleep duration is calculated server-side
- Habit completion is unique per habit per day
- Sleep log is unique per user per night date
