# Production Notes

## Suggested Deployment Topology

- `Frontend`: static hosting over HTTPS
- `Backend`: Node service running Fastify
- `Bot`: separate long-running polling worker
- `Database`: PostgreSQL

## Environment

Set at minimum:

- `DATABASE_URL`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `WEBAPP_URL`
- `FRONTEND_ORIGIN`
- `VITE_API_BASE_URL`

## Backend

- Run Prisma migrations before starting the API
- Restrict `FRONTEND_ORIGIN` to the deployed frontend origin
- Keep `JWT_SECRET` long and random
- Keep `ALLOW_DEV_AUTH=false` in production unless you explicitly need local-only browser auth

## Frontend

- Must be served over `HTTPS`
- `VITE_API_BASE_URL` should point to the deployed backend API prefix, for example `https://api.example.com/api`
- Telegram opens the Mini App URL directly, so the final frontend URL should be stable

## Telegram Bot

- The bot process should boot after `WEBAPP_URL` is correct
- On startup it sets `/start`, `/app`, and the chat menu button
- If you change `WEBAPP_URL`, restart the bot so menu button settings are refreshed

## Database

- Use managed PostgreSQL in production when possible
- Back up the database regularly
- Run Prisma deploy migrations during release

## Release Flow

1. Build backend, frontend, and bot
2. Deploy backend
3. Run Prisma migrations against production DB
4. Deploy frontend
5. Update `WEBAPP_URL` if needed
6. Start or restart the bot worker

## Operational Notes

- The frontend uses JWT after Telegram auth and does not trust a frontend user id
- Telegram `initData` validation happens on the backend before issuing the session token
- Sleep duration is calculated server-side
- Habit completion is unique per habit per day
- Sleep log is unique per user per night date
