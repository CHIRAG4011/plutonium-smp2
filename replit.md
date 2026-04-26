# Plutonium SMP

A Minecraft Lifesteal SMP store and community web app, migrated from a Vercel/v0 project to Replit's pnpm monorepo.

## Architecture

This is a pnpm monorepo with three artifacts and shared libraries.

### Artifacts
- **artifacts/plutonium-smp** (web, port 19366, path `/`) — Vite + React frontend. Wouter routing, shadcn/ui, Tailwind v4, Framer Motion. Dark "neon green" gaming aesthetic.
- **artifacts/api-server** (api, port 8080, path `/api`) — Express + Mongoose backend. JWT auth, Discord OAuth, Resend/SMTP emails, Pino logging. Routes: auth, store, users, purchases, tickets, server, admin, leaderboard, announcements.
- **artifacts/mockup-sandbox** (design, port 8081, path `/__mockup`) — Canvas component preview server (scaffold).

### Shared libs
- **lib/db** — Mongoose models (User, Product, Category, Order, Ticket, Server, Announcement, etc.) and the `connectDB()` helper.
- **lib/api-spec** — OpenAPI 3 specification used to generate clients.
- **lib/api-zod** — Zod schemas generated from the OpenAPI spec.
- **lib/api-client-react** — Generated React Query hooks + custom fetch wrapper.

## Database
MongoDB via Mongoose. Connection string lives in the `MONGODB_URI` secret. The app reads `MONGODB_URI` first, then falls back to `DATABASE_URL` if it starts with `mongodb`. No Replit Postgres usage.

## Required secrets
- `MONGODB_URI` — MongoDB connection string (Atlas free cluster works).
- `SESSION_SECRET` — JWT/session signing key.

## Optional configuration (env vars / secrets)
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI` — Discord OAuth login.
- `RESEND_API_KEY` or `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` — outbound email. When neither is set, emails are logged to console.
- `SMTP_FROM` — From address for outbound mail.
- `ALLOWED_ORIGINS` — CORS allowlist (defaults to `*` for dev).
- `LOG_LEVEL` — Pino log level (defaults to `info`).
- `APP_URL` — Public app URL used in email templates.

## Routing
The Replit proxy maps each artifact to a path prefix. The frontend calls `/api/*` directly (relative URLs), which the proxy routes to `artifacts/api-server`. No `VITE_API_URL` is needed in this environment; the Vite + Express setup talks through the shared proxy.

## Development
Each workflow is started by Replit's workflow runner:
- `pnpm --filter @workspace/plutonium-smp run dev`
- `pnpm --filter @workspace/api-server run dev` (builds with esbuild then runs the bundle)
- `pnpm --filter @workspace/mockup-sandbox run dev`

## Migration notes
The original Vercel project was already a pnpm monorepo. The migration:
1. Re-created the web artifact with Replit's `react-vite` scaffold (which provides the shared libs wiring) and copied the imported `src/`, `public/`, `index.html`, and `components.json` over the scaffold defaults.
2. Replaced the scaffold versions of `lib/db`, `lib/api-spec`, `lib/api-zod`, and `lib/api-client-react` with the Mongoose-based originals.
3. Replaced the API server `src/`, `package.json`, `tsconfig.json`, and `build.mjs` with the originals.
4. Removed the `.migration-backup/` directory after copying everything needed.

## Vercel deployment (still supported alongside Replit)
The repo can also deploy to Vercel from `artifacts/api-server/` as the project root:
- `artifacts/api-server/vercel.json` defines install/build commands and `/api/*` rewrites.
- `build.mjs` outputs `api/index.js` (CJS serverless bundle) and copies the built frontend (`artifacts/plutonium-smp/dist/public/`) into `artifacts/api-server/public/` so Vercel serves it as static.
- `artifacts/api-server/src/serverless.cts` is the function entrypoint (CJS, hence `.cts`).
- `vite.config.ts` falls back to safe defaults for `PORT`/`BASE_PATH` during `vite build` so production builds don't require Replit-specific env vars.

## GitHub push
The GitHub integration was dismissed once. To push from this Repl, either re-connect via the integrations system or store a personal access token (`repo` scope) and use it for HTTPS pushes. The remote `origin` points at `github.com/CHIRAG4011/plutonium-smp2`.
