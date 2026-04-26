# Plutonium SMP — Vercel Deployment Guide

> One Vercel project. One domain. Frontend + API together.

---

## How This Deploy Works

Vercel is pointed at the `artifacts/api-server` folder as the Root Directory. The build inside that folder:

1. Builds the **API server** into `api/index.js` (runs as a Vercel serverless function)
2. Builds the **React frontend** (Vite) and copies it into `public/`

```
artifacts/api-server/
├── api/index.js        ← Serverless API (auto-detected by Vercel)
├── public/             ← React frontend static files (created at build time)
└── vercel.json         ← Build config + routing rules
```

- All requests to `/api/*` → handled by the serverless function
- Everything else → served from the React frontend
- Both on the same domain — no CORS issues

**Total setup time:** ~15 minutes

---

## Prerequisites

| Service | Link | What it's for |
|---|---|---|
| **GitHub** | [github.com](https://github.com) | Hosts your code |
| **Vercel** | [vercel.com](https://vercel.com) | Deploys and hosts the app |
| **MongoDB Atlas** | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) | Database |

---

## PART 1 — Push Your Code to GitHub

If you haven't already:

1. Log in to [github.com](https://github.com) → **+** → **New repository**
2. Name it `plutonium-smp` → **Private** → **Create repository**
3. In Replit, open the **Shell** tab and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/plutonium-smp.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

To push updates in the future, just run:
```bash
git push origin main
```

---

## PART 2 — Set Up MongoDB Atlas

### Step 1 — Create a free cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Try Free**
2. On **Deploy your cluster**:
   - Select **M0** (free forever)
   - Pick any provider and region
   - Cluster name: `plutonium`
   - Click **Create Deployment**

### Step 2 — Create a database user

A dialog appears automatically:

1. Username: `plutonium`
2. Click **Autogenerate Secure Password** — **copy the password now**
3. Click **Create Database User**

### Step 3 — Allow all IP addresses

Vercel uses dynamic IPs, so you must allow all:

1. Left sidebar → **Network Access**
2. Click **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Click **Confirm**

### Step 4 — Copy the connection string

1. Left sidebar → **Database** → **Connect** → **Drivers**
2. Select **Node.js** and copy the string:
   ```
   mongodb+srv://plutonium:<password>@plutonium.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
3. Replace `<password>` with your real password
4. Add `/plutonium` before the `?`:
   ```
   mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority
   ```

**Save this — it is your `MONGODB_URI`.**

---

## PART 3 — Deploy on Vercel

### Step 1 — Import the project

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**
2. Connect GitHub if not already → find your repo → click **Import**

### Step 2 — Configure the project

Set these fields exactly on the configuration page:

---

**Root Directory**
```
artifacts/api-server
```
> This is the most important setting. Click **Edit** next to Root Directory and type `artifacts/api-server`.

---

**Framework Preset**

Select: **Other**

---

**Build Command**

Leave **blank** — `vercel.json` inside `artifacts/api-server` sets this automatically.

---

**Output Directory**

Leave **blank** — set automatically by `vercel.json`.

---

**Install Command**

Leave **blank** — set automatically by `vercel.json`.

---

### Step 3 — Add environment variables

Scroll down to **Environment Variables** and add:

#### Required

| Name | Value |
|---|---|
| `MONGODB_URI` | Your full Atlas connection string from Part 2 Step 4 |
| `SESSION_SECRET` | A random 64-character string — generate one at [generate-random.org](https://generate-random.org/string-password-generator?count=1&length=64&type=mixed) |
| `NODE_ENV` | `production` |

#### Email — pick one option

**Option A — Resend (recommended, free)**

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key** → copy it

| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxx` (your Resend API key) |
| `SMTP_FROM` | `Plutonium SMP <noreply@yourdomain.com>` |

**Option B — Gmail**

1. Google Account → **Security** → **2-Step Verification** must be on
2. Search for **App passwords** → App: **Mail**, Device: **Other** → name it `Vercel` → **Generate**
3. Copy the 16-character password

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | The 16-character app password |
| `SMTP_FROM` | `Plutonium SMP <your@gmail.com>` |

#### Discord OAuth (optional — can add later)

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Your Discord app Client ID |
| `DISCORD_CLIENT_SECRET` | Your Discord app Client Secret |
| `APP_URL` | Your full API domain, e.g. `https://plutoniumsmp.fun` |

> **`APP_URL` is critical for Discord OAuth.** Without it, the API may generate an incorrect redirect URI from Vercel's internal hostname instead of your custom domain, causing a "redirect_uri_mismatch" error from Discord. Always set this to whatever domain your Vercel project is publicly served on.

---

### Step 4 — Deploy

Click **Deploy** and wait 2–3 minutes. You will see a success screen with your URL, e.g. `https://plutonium-smp.vercel.app`.

**Verify the API is working:** open `https://plutonium-smp.vercel.app/api/healthz` — you should see `{"status":"ok"}`.

---

## PART 4 — Seed the Database

The database is empty on first deploy. You need to run the seed script once to add the admin account, store items, leaderboard, and announcements.

### Option A — From Replit Shell (simplest)

Open the **Shell** tab in Replit and run (replace the URI with your real Atlas connection string):

```bash
MONGODB_URI="mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority" pnpm --filter @workspace/scripts run seed
```

### Option B — From your own computer terminal

Make sure you have Node.js and pnpm installed, then clone the repo and run:

```bash
git clone https://github.com/YOUR_USERNAME/plutonium-smp.git
cd plutonium-smp
pnpm install
MONGODB_URI="mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority" pnpm --filter @workspace/scripts run seed
```

### Option C — Using the Vercel CLI (run seed against production DB)

If you have the [Vercel CLI](https://vercel.com/docs/cli) installed and your project linked:

```bash
# Pull the production env vars locally
vercel env pull .env.production

# Run the seed using those vars
source .env.production && pnpm --filter @workspace/scripts run seed
```

---

### Expected output (all options)

```
Connecting to MongoDB...
[MongoDB] Connected
Seeding database...
Created admin user: admin@plutoniumsmp.net / admin123
Created store items
Created leaderboard entries
Created announcements
Seed complete!
```

If it says `Seed complete!` without "Created..." lines, the data was already there from a previous run — that is fine.

---

### Login with the admin account

Visit your live site → **Login** and sign in with:
- Email: `admin@plutoniumsmp.net`
- Password: `admin123`

**Change this password immediately after logging in.**

---

## PART 5 — Discord OAuth (Optional)

### Step 1 — Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `Plutonium SMP` → **Create**

### Step 2 — Copy your credentials

1. Left sidebar → **OAuth2** → **General**
2. Copy the **Client ID** — you'll need this shortly
3. Click **Reset Secret** → copy the **Client Secret** — save it securely

### Step 3 — Add the redirect URI

This is the most common source of Discord OAuth errors. The redirect URI you add here must **exactly** match the URL the API generates at runtime.

1. On the same **OAuth2 → General** page, scroll to **Redirects**
2. Click **Add Redirect** and enter your callback URL:

   **If using a custom domain (e.g. `plutoniumsmp.fun`):**
   ```
   https://plutoniumsmp.fun/api/auth/discord/callback
   ```

   **If using the default Vercel URL:**
   ```
   https://your-project-name.vercel.app/api/auth/discord/callback
   ```

3. Click **Save Changes**

> If you add a custom domain later, come back here and add a second redirect URI for it — Discord allows multiple.

### Step 4 — Add environment variables to Vercel

Go to your Vercel project → **Settings** → **Environment Variables** → add all three:

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Your Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Your Discord Client Secret |
| `APP_URL` | `https://plutoniumsmp.fun` ← your public domain (no trailing slash) |

> **Why `APP_URL`?** The API constructs the redirect URI dynamically. Without `APP_URL`, it may fall back to Vercel's internal `.vercel.app` hostname instead of your custom domain — causing a mismatch even if your custom domain is in Discord's allowed list.

### Step 5 — Redeploy

**Deployments** → three-dot menu on the latest deployment → **Redeploy** (so the new env vars take effect).

---

## PART 6 — Custom Domain (Optional)

1. Vercel project → **Settings** → **Domains**
2. Click **Add** → enter your domain (e.g. `plutoniumsmp.fun`)
3. Add the DNS records shown at your registrar (Namecheap, GoDaddy, Cloudflare, etc.)
4. Wait a few minutes — Vercel shows a green checkmark when ready

After the domain is live, update two more things:

**Update `APP_URL` in Vercel:**
Go to **Settings** → **Environment Variables** → set/update `APP_URL` to your custom domain:
```
https://plutoniumsmp.fun
```

**Update Discord redirect URI** (if using Discord OAuth):
Go to the Discord Developer Portal → your app → **OAuth2** → **Redirects** → add:
```
https://plutoniumsmp.fun/api/auth/discord/callback
```
You can keep the old `.vercel.app` redirect as well — Discord allows multiple.

Then redeploy for the `APP_URL` change to take effect.

---

## Environment Variables — Complete Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **YES** | MongoDB Atlas connection string |
| `SESSION_SECRET` | **YES** | 64-char random string for JWT tokens. Never change after going live. |
| `NODE_ENV` | **YES** | Set to `production` |
| `APP_URL` | **YES (if using Discord OAuth or custom domain)** | Your public domain with no trailing slash, e.g. `https://plutoniumsmp.fun`. Ensures Discord OAuth generates the correct redirect URI. |
| `DISCORD_CLIENT_ID` | Optional | Discord app Client ID |
| `DISCORD_CLIENT_SECRET` | Optional | Discord app Client Secret |
| `RESEND_API_KEY` | Email | Resend.com API key. If set, overrides SMTP. |
| `SMTP_HOST` | Email | SMTP server hostname |
| `SMTP_PORT` | Email | SMTP port (usually `587`) |
| `SMTP_USER` | Email | SMTP login username |
| `SMTP_PASS` | Email | SMTP password or app password |
| `SMTP_FROM` | Email | Display name + email for outgoing mail |
| `LOG_LEVEL` | No | `trace` `debug` `info` `warn` `error` (default: `info`) |

---

## Vercel Project Settings — Exact Values

| Field | Value |
|---|---|
| Root Directory | `artifacts/api-server` |
| Framework Preset | **Other** |
| Build Command | *(leave blank — from vercel.json)* |
| Output Directory | *(leave blank — from vercel.json)* |
| Install Command | *(leave blank — from vercel.json)* |

---

## Troubleshooting

### Build fails — "No Output Directory named public found"
Make sure **Root Directory** in Vercel project settings is set to `artifacts/api-server` (not blank, not the repo root).

### Build fails — "Cannot find module @workspace/..."
The install command in `vercel.json` uses `cd ../..` to install from the workspace root. If you overrode the Install Command in the Vercel dashboard, clear it so `vercel.json` takes over.

### API health check returns 500 or connection error
`MONGODB_URI` is wrong or Atlas network access is not open. Common mistakes:
- Password still contains `<password>` literally
- Missing `/plutonium` before the `?` in the URI
- Network Access in Atlas is not set to `0.0.0.0/0`

### Login works but OTP email never arrives
Email is not configured. Add `RESEND_API_KEY` + `SMTP_FROM` (or the full SMTP variables) and redeploy.

### "redirect_uri_mismatch" or "invalid redirect_uri" when logging in with Discord
Two things must match exactly:
1. The URI registered in the Discord Developer Portal (OAuth2 → Redirects)
2. The URI the API sends to Discord at runtime — which is `APP_URL + /api/auth/discord/callback`

**Checklist:**
- Is `APP_URL` set in Vercel env vars to your exact public domain (e.g. `https://plutoniumsmp.fun`, no trailing slash)?
- Is `https://plutoniumsmp.fun/api/auth/discord/callback` (or your `.vercel.app` equivalent) in Discord's Redirects list?
- Did you redeploy after adding `APP_URL`?

If you have a custom domain and are still using the old `.vercel.app` URL in Discord, add the custom-domain redirect URI — Discord allows multiple entries.

### Store / leaderboard / announcements are empty
Run the seed script from Part 4.

### Users get logged out after every redeploy
`SESSION_SECRET` is not set as a permanent value. Go to **Settings → Environment Variables**, set it to a fixed random string, and redeploy.

### Forgot the admin password
Delete the admin user from MongoDB Atlas (Browse Collections → users collection → delete the document with `_id: "admin-plutonium-001"`) and re-run the seed script from Part 4.

### Clicking a route directly (e.g. `/store`) shows 404
The SPA fallback in `vercel.json` handles this. Make sure Root Directory is `artifacts/api-server` and you haven't overridden any build settings in the Vercel dashboard.
