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

## Checks

```shell
npm run typecheck
npm run lint
npm run build
```

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
EMAIL_FROM="Tocito <help@pompych.com>"
SUPPORT_EMAIL=help@pompych.com
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
EMAIL_FROM="Tocito <help@pompych.com>"
SUPPORT_EMAIL=help@pompych.com
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
