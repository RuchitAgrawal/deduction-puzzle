# Deduction Puzzle Bot

Telegram and Discord bots for the Deduction Puzzle daily investigative game.
Both bots share a single game engine and SQLite storage layer.

## Setup

```bash
cd bot/
npm install
cp .env.example .env
# fill in TELEGRAM_TOKEN and/or DISCORD_TOKEN in .env
```

## Running

```bash
# Telegram only
npm run start:telegram

# Discord only
npm run start:discord

# Both in dev mode (with auto-restart)
npm run dev:all
```

## Discord: Register Slash Commands

Run once before starting the Discord bot:

```bash
npm run deploy:discord
```

Set `DISCORD_GUILD_ID` in `.env` for instant registration during development.
Leave it empty to register globally (up to 1 hour propagation delay).

## Production (pm2)

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable                   | Required | Description                                  |
|----------------------------|----------|----------------------------------------------|
| `TELEGRAM_TOKEN`           | Yes*     | Bot token from @BotFather                    |
| `TELEGRAM_CHANNEL_ID`      | No       | Channel ID for daily puzzle posts            |
| `DISCORD_TOKEN`            | Yes*     | Bot token from Discord Developer Portal      |
| `DISCORD_CLIENT_ID`        | Yes*     | Application client ID                        |
| `DISCORD_GUILD_ID`         | No       | Guild ID for dev command registration        |
| `DISCORD_DAILY_CHANNEL_ID` | No       | Channel ID for daily puzzle posts            |
| `DB_PATH`                  | No       | SQLite database path (default: ./data/players.db) |
| `CASES_JSON_PATH`          | No       | Path to cases.json (default: ../data/cases.json)  |

*At least one platform token is required.

## Architecture

```
bot/
  engine/        - Pure game logic, no platform dependencies
    cases.js     - Load and query cases.json
    ranks.js     - Rank progression system
    session.js   - In-memory session management
  storage/
    schema.sql   - SQLite schema
    db.js        - Database operations
  telegram/
    index.js     - Bot entry point (grammy)
    formatters.js - Message text formatters
    handlers/    - Command and callback handlers
  discord/
    index.js     - Bot entry point (discord.js v14)
    formatters.js - Embed builders
    commands/    - Slash command definitions
    handlers/    - Button interaction handlers
```
