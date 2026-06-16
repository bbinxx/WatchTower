# WatchTower

Production-ready uptime monitoring system with cron-based architecture designed for Render free tier. Built with Node.js, Express, Firebase Firestore, and vanilla JavaScript.

## Features

- **Multi-Protocol Monitoring** - HTTP(S), TCP Ports, and ICMP Ping checks
- **Smart Alerting** - Requires consecutive failures before triggering incidents to prevent alert fatigue
- **Auto Wake-Up** - Automatically pings downed Render services to trigger spin-up
- **Email & Telegram Alerts** - SMTP and Telegram Bot integration with interactive buttons
- **Cron-Based Architecture** - Monitor checks run via scheduled cron jobs, compatible with Render free tier (no always-on worker needed)
- **Dynamic Control Panel** - Manage monitors and notification recipients via the web dashboard
- **Dark Mode** - Built-in light/dark theme toggle

## Architecture

```
┌─────────────┐     ┌─────────────────┐
│  Web Server │     │  Cron Service   │
│  (Dashboard │     │  (Monitor Checks│
│   + API)    │     │   + Alerts)     │
└──────┬──────┘     └───────┬─────────┘
       │                    │
       └────────┬───────────┘
                │
        ┌───────▼────────┐
        │ Firebase Admin │
        │   (Firestore)  │
        └────────────────┘
```

- **Web** - Serves the dashboard and API. Stays alive via self-ping on Render.
- **Cron** - Fires every minute via Render Cron Jobs. Checks monitors, saves results, sends alerts. Exits after each run.

## Quick Start

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.template .env
# Edit .env with your Firebase credentials

# 3. Start the web server
npm start

# 4. Start the cron service (separate terminal)
npm run cron
```

Dashboard: [http://localhost:3000](http://localhost:3000)

### Docker

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Render Deployment

1. Push to GitHub
2. Connect repo in Render Dashboard
3. Render auto-detects `render.yaml` and creates:
   - `watchtower-web` (Web Service)
   - `watchtower-cron` (Cron Job, every 1 minute)

## Environment Variables

Copy `.env.template` to `.env` and fill in your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | Yes | Secret for session cookies |
| `FIREBASE_API_KEY` | Yes | Firebase client config |
| `FIREBASE_AUTH_DOMAIN` | Yes | Firebase client config |
| `FIREBASE_DATABASE_URL` | Yes | Firebase client config |
| `FIREBASE_PROJECT_ID` | Yes | Firebase client config |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase client config |
| `FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase client config |
| `FIREBASE_APP_ID` | Yes | Firebase client config |
| `FIREBASE_MEASUREMENT_ID` | Yes | Firebase client config |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase Admin service account JSON (single line) |
| `EMAIL_ENABLED` | No | `true` or `false` |
| `EMAIL_SMTP_HOST` | If email | SMTP server hostname |
| `EMAIL_SMTP_PORT` | If email | SMTP server port |
| `EMAIL_SMTP_USER` | If email | SMTP username |
| `EMAIL_SMTP_PASS` | If email | SMTP password |
| `EMAIL_FROM_NAME` | No | Sender name (default: WatchTower) |
| `EMAIL_FROM_ADDRESS` | If email | Sender email address |
| `EMAIL_RECIPIENTS` | No | JSON array of email addresses |
| `TELEGRAM_ENABLED` | No | `true` or `false` |
| `TELEGRAM_BOT_TOKEN` | If telegram | Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_IDS` | No | JSON array of chat IDs |
| `TELEGRAM_NOTIFY_DOWN` | No | Notify on down (default: true) |
| `TELEGRAM_NOTIFY_UP` | No | Notify on recovery (default: true) |

## Dashboard Configuration

After deployment, set **recipients** and **chat IDs** via the Settings page in the dashboard. SMTP and bot token are configured via environment variables only.

## Project Structure

```
src/
  config/         Firebase initialization
  controllers/    API request handlers
  middleware/      Auth and admin middleware
  models/         Firestore data models
  public/         Frontend HTML/CSS/JS
  routes/         Express route definitions
  services/       Core business logic
  index.js        Web server entry point
  cron.js         Cron service entry point
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start web server |
| `npm run cron` | Run monitor checks once |
| `npm run dev` | Start web server with nodemon |
| `npm run dev:cron` | Run cron manually for testing |
