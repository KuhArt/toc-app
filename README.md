# Tocito

Shopify app for adding a configurable table of contents to blog article pages.

## Development

```shell
npm install
npm run db:up
npm run dev
```

Local development uses PostgreSQL through Prisma. Copy `.env.example` to `.env`
if the local file is missing or if you need to reset the data base connection
settings. The default local database port is `55432` to avoid conflicts with
other PostgreSQL instances on `5432`.

### Docs preview

Use the normal Shopify dev server when working on the full embedded app:

```shell
npm run dev
```

For a local docs-only preview, start Vite with the required Shopify server
environment placeholders:

```shell
set -a; source .env; set +a; \
SHOPIFY_APP_URL=http://127.0.0.1:3001 \
SHOPIFY_API_KEY=dev \
SHOPIFY_API_SECRET=dev \
SCOPES=read_content \
npm run vite -- --host 127.0.0.1 --port 3001
```

Then open:

```text
http://127.0.0.1:3001/docs
```

Use port `3001` when `3000` is already reserved by another local process. Stop
the preview with `Ctrl+C` in the terminal where it is running.

## Checks

```shell
npm run typecheck
npm run lint
npm run build
```

## Shopify pricing details

Configure two public plans in the Shopify Partner Dashboard:

- Basic: $1/month or $10/year after a 7-day free trial.
- Lifetime: $12 one-time payment for permanent access.

The in-app pricing page is available at `/app/pricing`. Basic merchants can buy
Lifetime later; after Lifetime is approved, the app cancels any active Basic
subscription.

## Production

The app expects PostgreSQL through Prisma.

Required environment variables:

```shell
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_APP_URL=https://tocito.pompych.com
SCOPES=
DATABASE_URL=
RESEND_API_KEY=
EMAIL_FROM="Tocito <tocito@pompych.com>"
SUPPORT_EMAIL=tocito@pompych.com
NODE_ENV=production
```

For the included Docker Compose setup, set these values in the server
environment:

```shell
DOMAIN=tocito.pompych.com
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=
RESEND_API_KEY=
EMAIL_FROM="Tocito <tocito@pompych.com>"
SUPPORT_EMAIL=tocito@pompych.com
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
```

Deploy the web app:

```shell
docker compose up -d --build
```

Deploy Shopify app configuration and extensions:

```shell
npm run deploy
```
