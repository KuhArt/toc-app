# Hetzner Docker Compose Deployment

This app is intended to run behind Caddy with Postgres for Shopify session storage.

## Server Setup

Install Docker and the Docker Compose plugin on the Hetzner server, then point your app domain DNS `A` record to the server IP.

## Environment

Create a `.env` file next to `docker-compose.yml` on the server:

```bash
cp deploy/production.env.example .env
```

Then edit `.env` and set:

- `DOMAIN` to the real app domain, for example `tocito.pompych.com`
- `SHOPIFY_API_KEY` from Shopify Partner Dashboard
- `SHOPIFY_API_SECRET` from Shopify Partner Dashboard
- `SCOPES` to the scopes configured in `shopify.app.toml`
- `RESEND_API_KEY` from Resend, if install/uninstall emails should be sent
- `EMAIL_FROM` to a verified sender, for example `Tocito <tocito@pompych.com>`
- `SUPPORT_EMAIL` to your support inbox
- `POSTGRES_PASSWORD` to a long random password

## Shopify Config

Update `shopify.app.toml` before deploying the app config:

```toml
application_url = "https://tocito.pompych.com"

[auth]
redirect_urls = [
  "https://tocito.pompych.com/auth/callback"
]
```

Then deploy the Shopify app config and theme extension from your local machine:

```bash
npm run deploy
```

## Start

Build and start the production stack:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f app
docker compose logs -f caddy
```

## Backups

The Postgres volume stores Shopify sessions. Back it up regularly.

Run a manual backup:

```bash
sh deploy/backup-postgres.sh
```

Backups are written to `backups/` as timestamped `.sql.gz` files.

Example daily cron job at 03:15 UTC:

```cron
15 3 * * * cd /path/to/tocito && /bin/sh deploy/backup-postgres.sh >> /var/log/tocito-backup.log 2>&1
```
