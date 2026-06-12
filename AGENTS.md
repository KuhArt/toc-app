# Agent Instructions

## Shopify Embedded Redirects

This is a Shopify embedded app. Redirects inside authenticated app routes must
preserve Shopify Admin context, otherwise the merchant can end up seeing the
standalone `/auth/login` shop-domain form inside the app frame.

Use these rules:

- For unpaid merchants, prefer rendering an in-app paywall or plan selector from
  the authenticated `/app` loader. Do not redirect from `/app` to `/app/pricing`
  just to enforce billing.

- If a redirect is still necessary in a route that calls
  `authenticate.admin(request)`, prefer the `redirect` helper returned by
  Shopify auth:

  ```ts
  const { redirect } = await authenticate.admin(request);

  return redirect("/app/pricing");
  ```

- Do not use plain React Router `redirect()` for app-internal redirects after
  `authenticate.admin(request)`. Plain redirects can drop `shop`, `host`, and
  `embedded` context.

- For billing approval flows, pass an explicit Admin app `returnUrl` to
  `billing.request()`:

  ```ts
  await billing.request({
    plan,
    isTest: isTestBilling(),
    returnUrl: getEmbeddedAdminAppUrl(session.shop, "/app/pricing"),
  });
  ```

- Use `getEmbeddedAdminAppUrl(shop, pathname)` from `app/billing.server.ts`
  when Shopify needs to return the merchant to the embedded Admin app.

- When passing an Admin app URL to client code, preserve the full absolute URL.
  Do not convert it back to `pathname + search`, or the browser will navigate
  to the app domain without Shopify Admin context.

- Keep billing side-effect routes, such as `/app/pricing/approve`, as sibling
  routes under `/app`. Do not nest them under the pricing page route, because
  the parent pricing loader will run first.

- Plain React Router `redirect()` is acceptable only before admin
  authentication, for public/non-embedded routes, or when forwarding the exact
  existing Shopify query string intentionally.

- Do not add cookie, referer, or guessed-shop recovery logic unless production
  request logs prove that Shopify is sending bare app-domain document requests.

Before finishing redirect-related changes, run:

```shell
rg -n "\\bredirect\\(|throw redirect|return redirect" app
npm run typecheck
```
