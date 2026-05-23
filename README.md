# WatchTower

WatchTower is a production-ready uptime monitoring system built with Node.js, Express, SQLite, and vanilla JavaScript. It features robust monitoring capabilities with smart alerting via Email and a Telegram Bot.

## Features

- **Multi-Protocol Monitoring:** Supports HTTP(S), TCP Ports, and ICMP Ping checks.
- **Smart Alerting:** Prevents alert fatigue by requiring consecutive failures before triggering downtime incidents.
- **Notification Channels:** Extensive integration with Email (SMTP) and Telegram Bot, complete with interactive UI buttons.
- **Dynamic Control Panel:** Pure HTML/JS admin dashboard to manage monitors and control notification configurations dynamically without editing `.env` files.
- **Lightweight Frontend:** The UI uses vanilla JS and Tailwind CSS via CDN—no complex build steps (like Webpack or Vite) are required.
- **Dark Mode:** Built-in toggle to switch between an aesthetically pleasing Light and Dark mode interface.

## Prerequisites

- Node.js (v18 or higher recommended)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the application:**
   ```bash
   npm start
   # Or for development with live reload:
   npx nodemon src/index.js
   ```

3. **Access the dashboard:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Default Credentials

Upon the first startup, a default administrator account is generated:

- **Email:** `admin@example.com`
- **Password:** `admin123`

*(It is highly recommended to change these credentials or create a new user for production use).*

## Notification Setup

After logging in, navigate to the **Settings** page:
1. **Email Alerts:** Configure your SMTP server details, authentication, and define recipient addresses.
2. **Telegram Alerts:** Enter your Telegram Bot Token (obtained from [@BotFather](https://t.me/BotFather)) and your target Chat IDs.

Use the built-in "Send Test" buttons to verify your configurations instantly.

## Project Structure

- `src/` - Backend API and application logic.
  - `config/` - Database initialization and schemas.
  - `controllers/` - Request handlers for API routes.
  - `models/` - SQLite database interactions.
  - `services/` - Core business logic for monitoring, alerts, and scheduling.
  - `public/` - Vanilla HTML/CSS/JS frontend files.
- `data/` - Holds the SQLite database (`uptime.db`). *This directory is git-ignored.*
- `logs/` - Log files. *This directory is git-ignored.*
