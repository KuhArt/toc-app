import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Tocito</h1>
        <p className={styles.text}>
          Configure a responsive table of contents for Shopify blog articles, then
          enable it from the Shopify theme editor.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>example.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Article-only embed</strong>. The theme app extension loads
            on blog article templates.
          </li>
          <li>
            <strong>Custom layout</strong>. Merchants control placement,
            spacing, colors, headings, and mobile behavior.
          </li>
          <li>
            <strong>Live preview</strong>. Settings can be reviewed in the app
            before publishing to the storefront.
          </li>
        </ul>
      </div>
    </div>
  );
}
