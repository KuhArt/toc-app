# TOC App

Shopify app for adding a configurable table of contents to blog article pages.

## Development

```shell
npm install
npm run dev
```

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
SHOPIFY_APP_URL=
SCOPES=
DATABASE_URL=
NODE_ENV=production
```

For the included Docker Compose setup, set these values in the server
environment:

```shell
DOMAIN=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SCOPES=
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
