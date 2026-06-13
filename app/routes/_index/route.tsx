import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return null;
};

export default function App() {
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
        <p className={styles.note}>
          Installed merchants can manage Tocito from Shopify admin. New
          installs must start from Shopify.
        </p>
      </div>
    </div>
  );
}
