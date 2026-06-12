import type { LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData } from "react-router";

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
        <img className={styles.brandMark} src="/tocito.svg" alt="" />
        <div className={styles.header}>
          <h1 className={styles.heading}>Tocito</h1>
          <p className={styles.text}>
            Table of contents for Shopify blog posts.
          </p>
        </div>
        {showForm && (
          <form
            className={styles.form}
            method="post"
            action="/auth/login"
            target="_top"
          >
            <label className={styles.label}>
              <span>Shop domain</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="example.myshopify.com"
                autoComplete="organization"
              />
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </form>
        )}
        <p className={styles.note}>
          Installed merchants can manage Tocito from Shopify admin.
        </p>
      </div>
    </div>
  );
}
