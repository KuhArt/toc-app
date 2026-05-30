import type { MetaFunction } from "react-router";
import { useEffect, useState } from "react";

import styles from "../docs/styles.module.css";

const supportEmail = "tocito@pompych.com";
const CRISP_WEBSITE_ID = "00d4dcb8-9b3d-4cdc-bf58-2e3dcaf9989f";
const CRISP_SCRIPT_ID = "crisp-chat-script";
const DOCS_TOC_SCRIPT_ID = "privacy-shopify-toc-js";
const DOCS_TOC_STYLESHEET_ID = "privacy-shopify-toc-css";
const docsTocAssetVersion = "20260520-jump-left";
const docsTocConfig = {
  title: "Privacy policy",
  headingLevels: [2],
  indentation: false,
  textAlignment: "left",
  markerFormat: "none",
  minHeadings: 1,
  mobileBreakpoint: 704,
  enableJsonLd: false,
  desktop: {
    position: "css-selector",
    positionSelector: "#docs-toc-slot",
    background: "#ffffff",
    maxWidth: 0,
    showTitle: true,
    showButton: false,
    smoothScroll: true,
    scrollOffset: 88,
    animationType: "jumping-marker",
    jumpingMarkerOffset: 18,
  },
  mobile: {
    position: "before-first-heading",
    background: "#ffffff",
    maxWidth: 0,
    showTitle: true,
    showButton: false,
    smoothScroll: true,
    scrollOffset: 76,
  },
};

export const meta: MetaFunction = () => {
  return [
    { title: "Tocito Privacy Policy" },
    {
      name: "description",
      content: "Privacy policy for Tocito, a Shopify table of contents app.",
    },
  ];
};

function loadCrispChat() {
  if (typeof window === "undefined") {
    return;
  }

  const crispWindow = window as typeof window & {
    $crisp?: unknown[];
    CRISP_WEBSITE_ID?: string;
  };

  crispWindow.$crisp = crispWindow.$crisp || [];
  crispWindow.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

  if (document.getElementById(CRISP_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = CRISP_SCRIPT_ID;
  script.src = "https://client.crisp.chat/l.js";
  script.async = true;

  document.head.appendChild(script);
}

function openSupportChat() {
  if (typeof window === "undefined") {
    return;
  }

  const crispWindow = window as typeof window & {
    $crisp?: unknown[];
  };

  loadCrispChat();
  crispWindow.$crisp = crispWindow.$crisp || [];
  crispWindow.$crisp.push(["do", "chat:open"]);
}

function removeDuplicateDocsTocWidgets() {
  const widgets = Array.from(
    document.querySelectorAll(".toc-widget, .toc-widget-float"),
  );

  widgets.slice(1).forEach((node) => node.remove());
}

export default function PrivacyPolicyRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => setDrawerMounted(false), 220);

    return () => window.clearTimeout(timeout);
  }, [drawerOpen]);

  useEffect(() => {
    const docsWindow = window as typeof window & {
      __tocitoPrivacyTocScriptLoading?: boolean;
    };

    if (!document.getElementById(DOCS_TOC_STYLESHEET_ID)) {
      const stylesheet = document.createElement("link");
      stylesheet.id = DOCS_TOC_STYLESHEET_ID;
      stylesheet.rel = "stylesheet";
      stylesheet.href = `/docs/toc-css?v=${docsTocAssetVersion}`;
      document.head.appendChild(stylesheet);
    }

    removeDuplicateDocsTocWidgets();

    const existingScript = document.getElementById(DOCS_TOC_SCRIPT_ID);
    const hasTocWidget = Boolean(
      document.querySelector(".toc-widget, .toc-widget-float"),
    );

    if (docsWindow.__tocitoPrivacyTocScriptLoading) {
      return;
    }

    if (existingScript && hasTocWidget) {
      return;
    }

    existingScript?.remove();

    const script = document.createElement("script");
    script.id = DOCS_TOC_SCRIPT_ID;
    script.src = `/docs/toc-js?v=${docsTocAssetVersion}`;
    script.async = true;
    script.onload = () => {
      docsWindow.__tocitoPrivacyTocScriptLoading = false;
      removeDuplicateDocsTocWidgets();
    };
    script.onerror = () => {
      docsWindow.__tocitoPrivacyTocScriptLoading = false;
    };

    docsWindow.__tocitoPrivacyTocScriptLoading = true;
    document.body.appendChild(script);
  }, []);

  return (
    <main className={styles.docs}>
      <script
        id="toc-config"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(docsTocConfig) }}
      />
      <script
        id="toc-animation-assets"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            shared: `/docs/toc-animation-shared-js?v=${docsTocAssetVersion}`,
            "following-marker": `/docs/toc-animation-following-marker-js?v=${docsTocAssetVersion}`,
            "crawling-snake": `/docs/toc-animation-crawling-snake-js?v=${docsTocAssetVersion}`,
            "jumping-marker": `/docs/toc-animation-jumping-marker-js?v=${docsTocAssetVersion}`,
          }),
        }}
      />
      <header className={styles.header}>
        <a className={styles.brand} href="/">
          <span className={styles.brandMark}>
            <img className={styles.brandIcon} src="/tocito.svg" alt="" />
          </span>
          <span>Tocito</span>
        </a>
        <div className={styles.headerActions}>
          <nav className={styles.topNav} aria-label="Top navigation">
            <a href="/docs">Docs</a>
            <a href="/privacy-policy" aria-current="page">
              Privacy
            </a>
            <button type="button" onClick={openSupportChat}>
              Support
            </button>
          </nav>
          <button
            className={`${styles.iconButton} ${drawerOpen ? styles.iconButtonOpen : ""}`}
            type="button"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-controls="privacy-mobile-drawer"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((current) => !current)}
          >
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
            <span className={styles.menuLine} />
          </button>
        </div>
      </header>

      {drawerMounted ? (
        <div
          className={`${styles.drawerLayer} ${
            drawerOpen ? styles.drawerLayerOpen : ""
          }`}
        >
          <button
            className={styles.drawerBackdrop}
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className={styles.drawer}
            id="privacy-mobile-drawer"
            aria-label="Privacy navigation"
          >
            <nav className={styles.drawerNav}>
              <a href="/docs">Docs</a>
              <a
                href="#information-we-collect"
                onClick={() => setDrawerOpen(false)}
              >
                Information we collect
              </a>
              <a
                href="#how-we-use-information"
                onClick={() => setDrawerOpen(false)}
              >
                How we use information
              </a>
              <a href="#data-retention" onClick={() => setDrawerOpen(false)}>
                Data retention
              </a>
              <a href="#contact-us" onClick={() => setDrawerOpen(false)}>
                Contact us
              </a>
            </nav>
          </aside>
        </div>
      ) : null}

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Privacy navigation">
          <div id="docs-toc-slot" className={styles.tocSlot} />
        </aside>

        <article className={styles.article}>
          <h1>Privacy Policy</h1>
          <p className={styles.lead}>
            This Privacy Policy explains how Tocito handles information when a
            Shopify merchant installs or uses the Tocito app.
          </p>

          <section className={styles.section}>
            <h2 id="who-we-are">Who we are</h2>
            <p>
              Tocito is operated by Artsiom Kukharenka, Pulawska 24b, Warsaw,
              Poland. In this policy, "Tocito", "we", "us", and "our" refer to
              the operator of the Tocito Shopify app.
            </p>
            <p>Effective date: May 30, 2026.</p>
          </section>

          <section className={styles.section}>
            <h2 id="information-we-collect">Information we collect</h2>
            <p>
              When you install or use Tocito, we collect the minimum information
              needed to provide and operate the app:
            </p>
            <ul>
              <li>Your Shopify shop domain.</li>
              <li>Your shop name.</li>
              <li>Your merchant email address and contact email address.</li>
              <li>Installation and uninstall timestamps.</li>
              <li>
                Shopify session and authentication information required to keep
                the app connected to your Shopify store.
              </li>
              <li>
                Tocito configuration settings, such as table of contents
                display, layout, styling, excluded blog posts, and custom CSS.
              </li>
              <li>
                Information you choose to provide when you contact us for
                support by email or chat.
              </li>
            </ul>
            <p>
              Tocito stores app configuration in Shopify app installation
              metafields and stores app session and merchant contact records in
              a self-hosted database on a Hetzner server in the European Union.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="information-we-do-not-collect">
              Information we do not collect
            </h2>
            <p>
              Tocito does not request access to Shopify customer, order,
              product, or payment data. Tocito does not collect personal
              information from storefront visitors. The storefront script reads
              page headings in the visitor's browser to build a table of
              contents and does not use cookies, local storage, analytics,
              advertising tracking, or visitor event tracking.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="how-we-use-information">How we use information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Install, authenticate, operate, and secure Tocito.</li>
              <li>Load, save, and apply your Tocito settings.</li>
              <li>Show Tocito on your Shopify storefront when enabled.</li>
              <li>Provide support and respond to your requests.</li>
              <li>
                Send service-related messages about Tocito when necessary.
              </li>
              <li>Comply with legal obligations and protect our rights.</li>
            </ul>
            <p>
              We do not sell personal information. We do not use merchant or
              visitor data for advertising, profiling, or automated
              decision-making.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="sharing-and-processors">Sharing and processors</h2>
            <p>
              We share information only with service providers that help us run
              Tocito:
            </p>
            <ul>
              <li>
                Shopify, for app installation, authentication, and app data.
              </li>
              <li>Hetzner, for hosting and database infrastructure.</li>
              <li>
                Resend, for service email delivery if service emails are sent.
              </li>
              <li>Crisp, for merchant support chat if you use chat support.</li>
            </ul>
            <p>
              We may also disclose information if required by law, to protect
              Tocito and our users, or as part of a business transfer.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="data-retention">Data retention</h2>
            <p>
              We keep personal information only for as long as needed for the
              purposes described in this policy. Shopify session records are
              deleted when Tocito receives an app uninstall webhook from
              Shopify. Minimal shop and contact records may be retained as
              needed for support, security, legal compliance, dispute
              resolution, and business records, unless deletion is required or
              requested under applicable law.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="international-processing">International processing</h2>
            <p>
              Tocito is operated from Poland and hosted in the European Union.
              Some service providers, including Shopify, Resend, and Crisp, may
              process information in other countries. Where required, we rely on
              appropriate safeguards for international transfers.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="security">Security</h2>
            <p>
              We use reasonable technical and organizational measures to protect
              the information processed by Tocito, including encrypted HTTPS
              connections. No method of transmission or storage is completely
              secure, so we cannot guarantee absolute security.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="your-rights">Your rights</h2>
            <p>
              Depending on where you are located, you may have rights to access,
              correct, delete, restrict, or object to the processing of your
              personal information. You can make a request by contacting us at{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="changes-to-this-policy">Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. If we make
              material changes, we will update the effective date above and,
              when appropriate, provide additional notice.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="contact-us">Contact us</h2>
            <p>
              If you have questions about this Privacy Policy or want to make a
              privacy request, contact us at{" "}
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
            </p>
            <p>
              You can also use the{" "}
              <button
                className={styles.textLinkButton}
                type="button"
                onClick={openSupportChat}
              >
                chat
              </button>{" "}
              inside Tocito.
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
