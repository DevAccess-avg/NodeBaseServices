# NodeBaseServices

Custom Discord & FiveM / ERLC bot ordering website with Discord OAuth login and admin panel.

## Features

- Discord OAuth2 sign-in (Client ID: 1536519039508291604)
- Service selection: **Basic Bot**, **Advanced Bot**, **FiveM / ERLC Bot**
- Dynamic dropdowns for bot types
  - Basic / Advanced: Moderation, Utility, Fun, Economy, Welcome, Ticket (+ Music, Leveling, **Custom** for Advanced only)
  - FiveM/ERLC: Server Status, Whitelist, Player Lookup, Discord Sync, Queue, ERLC Status, ERLC Logging, Custom Integration
- Custom option (Advanced only) with 2000 character textbox
- Unique **16-digit order code** generated for every order (always different)
- User must copy & save the code
- Orders + users stored persistently (JSON files)
- **Secret Admin Panel** only accessible when logged in as Discord ID `1242592219366690921`
  - View every registered user
  - Suspend / unsuspend users (suspended users cannot order and see a ticket message)
  - View all orders with codes, details, status; update status
- Terms of Service includes:
  - **NO REFUNDS**
  - We will fix errors/problems for **3 days** after you receive the files; after that no support
  - **WE WILL NOT HOST YOUR BOT** — you only receive the files
- Clean dark UI matching the logo, loading screen (short), subtle animations
- Uses the provided cube logo

## Deploy on Render (nodebase-services.onrender.com)

1. Create a **Web Service**, upload this folder or connect a repo.
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Environment Variables:

| Variable | Value |
|----------|-------|
| `DISCORD_CLIENT_ID` | `1536519039508291604` |
| `DISCORD_CLIENT_SECRET` | *your real client secret from Discord Developer Portal* |
| `SESSION_SECRET` | *long random string* |
| `ADMIN_DISCORD_ID` | `1242592219366690921` |
| `DISCORD_INVITE` | `https://discord.gg/YOUR_REAL_INVITE` |
| `BASE_URL` | `https://nodebase-services.onrender.com` |
| `NODE_ENV` | `production` |

5. In Discord Developer Portal → your app → **OAuth2 → Redirects**, add:
   - `https://nodebase-services.onrender.com/auth/discord/callback`

6. Deploy.

**Persistence note:** Render free instances have ephemeral disk. The `db/users.json` and `db/orders.json` files will reset on redeploy/restart. For real production attach a persistent disk or migrate the two JSON files to a free Postgres / MongoDB Atlas.

## Local test

```bash
cp .env.example .env
# fill DISCORD_CLIENT_SECRET, SESSION_SECRET, set BASE_URL=http://localhost:3000
npm install
npm start
```

Also add `http://localhost:3000/auth/discord/callback` in the Discord portal redirects while testing.

## Security

- Client secret never committed.
- Admin panel gated by exact Discord ID check after OAuth.
- Suspended users are redirected and cannot place orders.
