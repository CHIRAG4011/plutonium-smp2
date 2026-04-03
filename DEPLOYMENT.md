# Plutonium SMP — Vercel Deployment Guide

> From code to live website in one Vercel project.
> Every field, every button, every variable is listed here.

---

## How This Deploy Works

This project deploys as a **single Vercel project** from the root of the repository:

```
YOUR GITHUB REPO (root)
├── api/index.ts                 ← Serverless API function (auto-detected by Vercel)
├── vercel.json                  ← Build config + routing rules
└── artifacts/plutonium-smp/     ← React frontend (built to static files)
```

- All requests to `/api/*` are handled by the serverless function
- Everything else is served as static files from the React build
- Both live on the same domain — no cross-origin configuration needed

**Total time:** ~15 minutes

---

## Prerequisites

You need accounts on these 3 services (all free):

| Service | Sign-up link | What it's for |
|---|---|---|
| **GitHub** | [github.com](https://github.com) | Hosts your code (Vercel reads from it) |
| **Vercel** | [vercel.com](https://vercel.com) | Deploys and hosts the app |
| **MongoDB Atlas** | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) | Your database |

---

## PART 1 — Push Your Code to GitHub

1. Log in to [github.com](https://github.com)
2. Click **+** (top right) → **New repository**
3. Name it `plutonium-smp` → **Private** → click **Create repository**
4. In Replit, open the **Shell** tab and run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/plutonium-smp.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## PART 2 — Set Up MongoDB Atlas

### Step 1 — Create a free cluster

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) → **Try Free**
2. Skip the onboarding or answer the questions
3. On **Deploy your cluster**:
   - Select **M0** (free forever)
   - Pick any provider and region
   - Cluster name: `plutonium`
   - Click **Create Deployment**

### Step 2 — Create a database user

A dialog appears:

1. Username: `plutonium`
2. Click **Autogenerate Secure Password**
3. **Copy the password now** — you cannot see it again
4. Click **Create Database User**

### Step 3 — Allow all IP addresses

Vercel uses dynamic IPs, so you must allow all:

1. Click **Network Access** in the left sidebar
2. Click **Add IP Address** → **Allow Access from Anywhere**
3. Click **Confirm**

### Step 4 — Copy the connection string

1. Click **Database** → **Connect** → **Drivers**
2. Select **Node.js**
3. Copy the string (looks like):
   ```
   mongodb+srv://plutonium:<password>@plutonium.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your real password
5. Add `/plutonium` before the `?`:
   ```
   mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority
   ```

**Save this — it is your `MONGODB_URI`.**

---

## PART 3 — Deploy on Vercel

### Step 1 — Import the project

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**
2. Connect GitHub if not already connected
3. Find `plutonium-smp` → click **Import**

### Step 2 — Configure the project

On the configuration page, set these fields exactly:

---

**Project Name**
```
plutonium-smp
```

---

**Root Directory**

Leave this **blank** (do not change it).

> The `vercel.json` is at the repo root — that is where Vercel should work from.

---

**Framework Preset**

Select: **Other**

---

**Build Command**

Leave **blank** — `vercel.json` sets this automatically.

---

**Output Directory**

Leave **blank** — `vercel.json` sets this automatically.

---

**Install Command**

Leave **blank** — `vercel.json` sets this automatically.

---

### Step 3 — Add environment variables

Scroll down to **Environment Variables** and add each one below.

---

#### DATABASE

| Name | Value |
|---|---|
| `MONGODB_URI` | Your full Atlas connection string from Part 2 Step 4 |

---

#### AUTHENTICATION

| Name | Value | How to get it |
|---|---|---|
| `SESSION_SECRET` | A random 64-character string | Generate one at [generate-random.org](https://generate-random.org/string-password-generator?count=1&length=64&type=mixed) and copy it |
| `NODE_ENV` | `production` | Type this literally |

---

#### EMAIL — choose one option

OTP codes (login, register, checkout) require an email sender. Pick one:

**Option A — Resend (recommended)**

1. Sign up free at [resend.com](https://resend.com)
2. Go to **API Keys** → **Create API Key** → copy it

| Name | Value |
|---|---|
| `RESEND_API_KEY` | `re_xxxxxx` (your Resend API key) |
| `SMTP_FROM` | `Plutonium SMP <noreply@yourdomain.com>` |

**Option B — Gmail**

First create a Gmail App Password:
1. Google Account → **Security** → **2-Step Verification** (must be on)
2. Scroll to **App passwords** → app: **Mail**, device: **Other** → type `Vercel` → **Generate**
3. Copy the 16-character password

| Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `your@gmail.com` |
| `SMTP_PASS` | The 16-character app password |
| `SMTP_FROM` | `Plutonium SMP <your@gmail.com>` |

---

#### DISCORD OAUTH (optional — skip for now)

You can add this later. See Part 5.

---

### Step 4 — Deploy

Click **Deploy** and wait 1–3 minutes.

When the build completes you will see a success screen with your URL, for example `https://plutonium-smp.vercel.app`.

**Verify it works:** open `https://plutonium-smp.vercel.app/api/health` — you should see `{"status":"ok"}`.

---

## PART 4 — Seed the Database

The database is empty after first deploy. Run the seed script from Replit's Shell to populate it.

Replace the URI with your actual Atlas connection string:

```bash
MONGODB_URI="mongodb+srv://plutonium:YOURPASSWORD@plutonium.xxxxx.mongodb.net/plutonium?retryWrites=true&w=majority" pnpm --filter @workspace/scripts run seed
```

Expected output:
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

Now visit your live site → **Login** and sign in with:
- Email: `admin@plutoniumsmp.net`
- Password: `admin123`

**Change this password immediately after logging in.**

---

## PART 5 — Discord OAuth (Optional)

### Step 1 — Create a Discord application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it `Plutonium SMP` → **Create**

### Step 2 — Add the redirect URI

1. Left sidebar → **OAuth2**
2. Under **Redirects** → **Add Redirect**:
   ```
   https://plutonium-smp.vercel.app/api/auth/discord/callback
   ```
   (Replace with your actual Vercel URL)
3. Click **Save Changes**

### Step 3 — Copy credentials

On the **OAuth2** page:
- **Client ID** — click the copy icon
- **Client Secret** — click **Reset Secret** → copy

### Step 4 — Add to Vercel

Go to your Vercel project → **Settings** → **Environment Variables** → add:

| Name | Value |
|---|---|
| `DISCORD_CLIENT_ID` | Your Discord Client ID |
| `DISCORD_CLIENT_SECRET` | Your Discord Client Secret |

Then redeploy: **Deployments** → three-dot menu → **Redeploy**.

---

## PART 6 — Custom Domain (Optional)

### Add domain to Vercel

1. Vercel project → **Settings** → **Domains**
2. Click **Add** → enter your domain (e.g. `plutoniumsmp.net`)
3. Vercel shows DNS records — add them at your registrar (Namecheap, GoDaddy, etc.)
4. Wait a few minutes — Vercel shows a green checkmark when ready

### Update Discord (if using Discord OAuth)

In the Discord developer portal → **OAuth2** → **Redirects** — update to:
```
https://plutoniumsmp.net/api/auth/discord/callback
```

---

## Environment Variables — Complete Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **YES** | MongoDB Atlas connection string |
| `SESSION_SECRET` | **YES** | 64-char random string for JWT tokens. Never change after going live. |
| `NODE_ENV` | **YES** | Set to `production` |
| `DISCORD_CLIENT_ID` | Optional | Discord app Client ID (for Discord login) |
| `DISCORD_CLIENT_SECRET` | Optional | Discord app Client Secret (for Discord login) |
| `RESEND_API_KEY` | Email | Resend.com API key. If set, overrides SMTP. |
| `SMTP_HOST` | Email | SMTP server hostname |
| `SMTP_PORT` | Email | SMTP port (usually `587`) |
| `SMTP_USER` | Email | SMTP login username |
| `SMTP_PASS` | Email | SMTP password or app password |
| `SMTP_FROM` | Email | Display name + email for outgoing mail |
| `LOG_LEVEL` | No | Verbosity: `trace` `debug` `info` `warn` `error` (default: `info`) |

> **Note:** `VITE_API_URL` is NOT needed. The frontend and API are on the same domain, so API calls are made automatically to `/api/*` with no configuration.

---

## Vercel Project Settings — Exact Values

| Field | Value |
|---|---|
| Project Name | `plutonium-smp` |
| Root Directory | *(leave blank)* |
| Framework Preset | **Other** |
| Build Command | *(leave blank — from vercel.json)* |
| Output Directory | *(leave blank — from vercel.json)* |
| Install Command | *(leave blank — from vercel.json)* |

---

## Troubleshooting

### Build fails with "Cannot find module @workspace/..."
Make sure Root Directory is blank (not set to any subdirectory). The install must run from the repo root where `pnpm-workspace.yaml` is.

### API health check returns 500 or connection error
`MONGODB_URI` is wrong or Atlas network access is not open. Common mistakes:
- Password still contains `<password>` literally
- Missing `/plutonium` before the `?` in the URI
- Network Access in Atlas is not set to `0.0.0.0/0`

### Login works but OTP email never arrives
Email is not configured. Add `RESEND_API_KEY` + `SMTP_FROM` (or the full SMTP variables) and redeploy.

### "redirect_uri_mismatch" when logging in with Discord
The redirect URI in the Discord developer portal doesn't match. Make sure:
- The URI is exactly: `https://YOUR_VERCEL_URL/api/auth/discord/callback`
- No trailing slash on the URL

### Clicking a route directly (e.g. `/store`) shows a 404
The SPA fallback route in `vercel.json` should handle this. Check that you deployed from the root of the repo and `vercel.json` is present.

### Store / leaderboard is empty after deploy
Run the seed script (Part 4 above).

### Users get logged out after every redeploy
`SESSION_SECRET` is not set as a fixed value. Go to **Settings → Environment Variables**, set it to a permanent random string, and redeploy.

### I forgot the admin password
Delete the admin user from MongoDB Atlas (Browse Collections → users) and re-run the seed script. It only creates the admin if it doesn't already exist.
