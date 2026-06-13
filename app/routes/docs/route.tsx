import type { MetaFunction } from "react-router";
import type { ComponentType, MouseEvent, SVGProps } from "react";
import {
  BookOpenIcon,
  CornerRoundIcon,
  DesktopIcon,
  DragDropIcon,
  EyeglassesIcon,
  IncentiveIcon,
  InventoryIcon,
  LayoutBuyButtonHorizontalIcon,
  MeasurementSizeIcon,
  MobileIcon,
  RemoveBackgroundIcon,
  SettingsIcon,
  SortIcon,
  TextIndentIcon,
  TextTitleIcon,
  WrenchIcon,
} from "@shopify/polaris-icons";
import { useEffect, useState } from "react";

import styles from "./styles.module.css";

type DocsIcon = ComponentType<SVGProps<SVGSVGElement>>;

const supportEmail = "tocito@pompych.com";
const CRISP_WEBSITE_ID = "00d4dcb8-9b3d-4cdc-bf58-2e3dcaf9989f";
const CRISP_SCRIPT_ID = "crisp-chat-script";
const DOCS_TOC_SCRIPT_ID = "docs-shopify-toc-js";
const DOCS_TOC_STYLESHEET_ID = "docs-shopify-toc-css";
const docsTocAssetVersion = "20260520-jump-left";
const docsTocConfig = {
  title: "Table of Contents",
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
    { title: "Tocito Docs" },
    {
      name: "description",
      content: "Documentation for Tocito, a Shopify table of contents app.",
    },
  ];
};

function OptionName({ icon: Icon, label }: { icon: DocsIcon; label: string }) {
  return (
    <span className={styles.optionName}>
      <Icon className={styles.optionIcon} aria-hidden="true" focusable="false" />
      {label}:
    </span>
  );
}

function TabName({ icon: Icon, label }: { icon: DocsIcon; label: string }) {
  return (
    <strong className={styles.tabName}>
      <Icon className={styles.tabIcon} aria-hidden="true" focusable="false" />
      {label}
    </strong>
  );
}

function openSupportChat() {
  if (typeof window === "undefined") {
    return;
  }

  const crispWindow = window as typeof window & {
    $crisp?: unknown[];
  };

  crispWindow.$crisp = crispWindow.$crisp || [];
  crispWindow.$crisp.push(["do", "chat:open"]);
}

function getDocsSectionTarget(targetId: string) {
  return (
    document.getElementById(targetId) ||
    document.getElementById(`toc-${targetId}`)
  );
}

function removeDuplicateDocsTocWidgets() {
  const widgets = Array.from(
    document.querySelectorAll(".toc-widget, .toc-widget-float"),
  );

  widgets.slice(1).forEach((node) => node.remove());
}

export default function DocsRoute() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);

  const scrollToDocsSection = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const href = event.currentTarget.getAttribute("href") || "";
    const targetId = href.startsWith("#") ? href.slice(1) : "";

    setDrawerOpen(false);

    window.setTimeout(() => {
      const target = getDocsSectionTarget(targetId);

      if (!target) {
        return;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });

      if (window.history?.pushState) {
        window.history.pushState(null, "", `#${encodeURIComponent(target.id)}`);
      }
    }, 0);
  };

  useEffect(() => {
    const scrollToHash = () => {
      const targetId = decodeURIComponent(window.location.hash.slice(1));

      if (!targetId) {
        return;
      }

      window.setTimeout(() => {
        getDocsSectionTarget(targetId)?.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }, 80);
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);

    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      setDrawerMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => setDrawerMounted(false), 220);

    return () => window.clearTimeout(timeout);
  }, [drawerOpen]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const docsWindow = window as typeof window & {
      __tocitoDocsTocScriptLoading?: boolean;
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

    if (docsWindow.__tocitoDocsTocScriptLoading) {
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
      docsWindow.__tocitoDocsTocScriptLoading = false;
      removeDuplicateDocsTocWidgets();
    };
    script.onerror = () => {
      docsWindow.__tocitoDocsTocScriptLoading = false;
    };

    docsWindow.__tocitoDocsTocScriptLoading = true;
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
            <a href="/privacy-policy">Privacy</a>
            <button type="button" onClick={openSupportChat}>
              Support
            </button>
          </nav>
          <button
            className={`${styles.iconButton} ${drawerOpen ? styles.iconButtonOpen : ""}`}
            type="button"
            aria-label={
              drawerOpen ? "Close documentation menu" : "Open documentation menu"
            }
            aria-controls="docs-mobile-drawer"
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
            aria-label="Close documentation menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside
            className={styles.drawer}
            id="docs-mobile-drawer"
            aria-label="Docs navigation"
          >
            <nav className={styles.drawerNav}>
              <a href="/privacy-policy">Privacy policy</a>
              <a href="#getting-started" onClick={scrollToDocsSection}>
                Getting started
              </a>
              <a href="#configure-tocito" onClick={scrollToDocsSection}>
                Configure Tocito
              </a>
              <a href="#custom-css" onClick={scrollToDocsSection}>
                Custom CSS
              </a>
              <a href="#troubleshooting" onClick={scrollToDocsSection}>
                Troubleshooting
              </a>
              <a href="#uninstall-tocito" onClick={scrollToDocsSection}>
                Uninstall Tocito
              </a>
              <a href="#support" onClick={scrollToDocsSection}>
                Support
              </a>
            </nav>
          </aside>
        </div>
      ) : null}

      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Docs navigation">
          <div id="docs-toc-slot" className={styles.tocSlot} />
        </aside>

        <article className={styles.article}>
          <h1>Tocito</h1>
          <p className={styles.lead}>
            A clean, easy table of contents for Shopify blog posts.
          </p>

          <section className={styles.section}>
            <h2 id="getting-started">Getting started</h2>
            <p>
              Tocito builds a table of contents from your blog post headings.
              Before it can appear on your storefront, the Tocito app embed must
              be enabled in your theme.
            </p>
            <p>
              If Tocito shows{" "}
              <span className={`${styles.appBadge} ${styles.appBadgeCaution}`}>
                Not activated
              </span>
              , the app embed is off.
            </p>
            <p>To set it up:</p>
            <ol>
              <li>Open Tocito in Shopify admin.</li>
              <li>
                Choose a plan and approve it in Shopify. You can start with a
                free trial before deciding to purchase.
              </li>
              <li>
                Click <span className={styles.appButton}>Activate</span>.
              </li>
              <li>Enable the Tocito app embed in the Shopify theme editor.</li>
              <li>Click <strong>Save</strong> in the theme editor.</li>
              <li>
                Return to Tocito. The status should change to{" "}
                <span className={`${styles.appBadge} ${styles.appBadgeSuccess}`}>
                  Activated
                </span>
                .
              </li>
              <li>Configure Tocito and save your changes.</li>
              <li>Check a blog post on your storefront.</li>
            </ol>
            <p>
              If the status does not change after saving the theme,{" "}
              <button
                className={styles.textLinkButton}
                type="button"
                onClick={openSupportChat}
              >
                contact support
              </button>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="configure-tocito">Configure Tocito</h2>
            <p>
              Tocito has three settings tabs:{" "}
              <TabName icon={SettingsIcon} label="General" />,{" "}
              <TabName icon={DesktopIcon} label="Desktop" />, and{" "}
              <TabName icon={MobileIcon} label="Mobile" />.
            </p>

            <h3>
              <TabName icon={SettingsIcon} label="General" />
            </h3>
            <p>
              Use this tab for settings that affect the table of contents
              overall.
            </p>
            <ul>
              <li>
                <OptionName icon={InventoryIcon} label="Basics" /> title,
                heading levels, minimum headings required, mobile breakpoint,
                hidden blog posts, and SEO JSON-LD schema.
              </li>
              <li>
                <OptionName icon={TextIndentIcon} label="Text Formatting" />{" "}
                text alignment, list style, and nested item indentation.
              </li>
              <li>
                <OptionName icon={WrenchIcon} label="Advanced settings" /> custom
                CSS for cases where the built-in controls are not enough.
              </li>
            </ul>

            <h3>
              <TabName icon={DesktopIcon} label="Desktop" />
            </h3>
            <p>
              Use this tab to tune the desktop table of contents. Most sections
              can be copied to mobile with{" "}
              <span className={styles.appButton}>Apply to Mobile</span>.
            </p>
            <ul>
              <li>
                <OptionName
                  icon={LayoutBuyButtonHorizontalIcon}
                  label="Layout"
                />{" "}
                placement, selected element, mobile fallback for floating layouts,
                background color, and maximum width.
              </li>
              <li>
                <OptionName icon={TextTitleIcon} label="Title" /> show or hide
                the title, then set title color, weight, and size.
              </li>
              <li>
                <OptionName icon={BookOpenIcon} label="Links" /> set link color,
                weight, and size.
              </li>
              <li>
                <OptionName icon={CornerRoundIcon} label="Border" /> border
                color, width, and corner radius.
              </li>
              <li>
                <OptionName icon={RemoveBackgroundIcon} label="Shadow" /> shadow
                style and shadow color.
              </li>
              <li>
                <OptionName icon={MeasurementSizeIcon} label="Padding" /> top,
                bottom, left, and right spacing inside Tocito.
              </li>
              <li>
                <OptionName icon={DragDropIcon} label="Offset" /> top, bottom,
                left, and right position offsets.
              </li>
              <li>
                <OptionName icon={SortIcon} label="Scroll behavior" /> smooth
                scroll and scroll offset.
              </li>
              <li>
                <OptionName icon={EyeglassesIcon} label="Show more button" />{" "}
                enable show more, collapsed height, button text, padding, font,
                and border.
              </li>
              <li>
                <OptionName icon={IncentiveIcon} label="Animation" /> choose
                none, following marker, crawling snake, or jumping marker, then
                tune color, size, offset, and roundness where available.
              </li>
            </ul>

            <h3>
              <TabName icon={MobileIcon} label="Mobile" />
            </h3>
            <p>
              Use this tab to tune the mobile table of contents. Most sections
              can be copied to desktop with{" "}
              <span className={styles.appButton}>Apply to Desktop</span>.
            </p>
            <ul>
              <li>
                <OptionName
                  icon={LayoutBuyButtonHorizontalIcon}
                  label="Layout"
                />{" "}
                placement, selected element, background color, and maximum width.
              </li>
              <li>
                <OptionName icon={TextTitleIcon} label="Title" /> show or hide
                the title, then set title color, weight, and size.
              </li>
              <li>
                <OptionName icon={BookOpenIcon} label="Links" /> set link color,
                weight, and size.
              </li>
              <li>
                <OptionName icon={CornerRoundIcon} label="Border" /> border
                color, width, and corner radius.
              </li>
              <li>
                <OptionName icon={RemoveBackgroundIcon} label="Shadow" /> shadow
                style and shadow color.
              </li>
              <li>
                <OptionName icon={MeasurementSizeIcon} label="Padding" /> top,
                bottom, left, and right spacing inside Tocito.
              </li>
              <li>
                <OptionName icon={DragDropIcon} label="Offset" /> top, bottom,
                left, and right position offsets.
              </li>
              <li>
                <OptionName icon={SortIcon} label="Scroll behavior" /> smooth
                scroll and scroll offset.
              </li>
              <li>
                <OptionName icon={EyeglassesIcon} label="Show more button" />{" "}
                enable show more, collapsed height, button text, padding, font,
                and border.
              </li>
            </ul>

            <p>
              Desktop and mobile settings are separate, so you can use a floating
              layout on desktop and an inline layout on mobile.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="custom-css">Custom CSS</h2>
            <p>
              Use Custom CSS only when the built-in controls are not enough.
            </p>
            <p>
              Custom CSS is in the{" "}
              <TabName icon={SettingsIcon} label="General" /> tab under
              advanced settings. It can target Tocito widget elements such as the
              wrapper, title, list, links, toggle button, fade areas, and
              floating layout.
            </p>
            <p>
              Use <code>{"{{mobileBreakpoint}}"}</code> for mobile-only rules
              that should follow your Tocito mobile breakpoint.
            </p>
            <p>
              Test custom CSS on both desktop and mobile before publishing. Need
              help with styling?{" "}
              <button
                className={styles.textLinkButton}
                type="button"
                onClick={openSupportChat}
              >
                Contact support
              </button>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="troubleshooting">Troubleshooting</h2>
            <p>
              Start with these checks if Tocito does not appear or the table of
              contents does not match your settings.
            </p>

            <h3>Tocito does not appear</h3>
            <p>
              Check that the Tocito app embed is enabled in the theme editor.
              Also check that the article has enough matching headings.
            </p>

            <h3>Headings are missing</h3>
            <p>
              Make sure the blog post uses real heading tags, such as{" "}
              <code>H2</code> or <code>H3</code>, and that those levels are
              selected in <strong>Headings to include</strong>.
            </p>

            <h3>Tocito appears on the wrong posts</h3>
            <p>
              Check <strong>Hide on blog posts</strong>. You can exclude posts
              with comma-separated article IDs, exact tags, or wildcard patterns.
            </p>

            <h3>The desktop layout does not fit</h3>
            <p>
              If you use a left or right floating placement, enable{" "}
              <strong>Use mobile layout when desktop layout no longer fits</strong>.
            </p>

            <h3>Custom selector placement does not work</h3>
            <p>
              Make sure the CSS selector exists on the article page. If Tocito
              cannot find the selected element, it uses the fallback placement.
            </p>

            <p>
              Still stuck?{" "}
              <button
                className={styles.textLinkButton}
                type="button"
                onClick={openSupportChat}
              >
                Contact support
              </button>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="uninstall-tocito">Uninstall Tocito</h2>
            <p>There are two ways to remove Tocito from your storefront.</p>

            <h3>Disable Tocito in the theme</h3>
            <p>
              Use this if you want to stop showing the table of contents but
              keep the app installed.
            </p>
            <p>
              Open the Shopify theme editor, go to app embeds, disable Tocito,
              and save the theme.
            </p>

            <h3>Delete the app</h3>
            <p>Use this if you want to remove Tocito completely.</p>
            <p>
              Uninstall Tocito from Shopify admin. After uninstalling, Tocito
              stops running on your storefront and you will no longer be able to
              manage its settings from the app.
            </p>
          </section>

          <section className={styles.section}>
            <h2 id="support">Support</h2>
            <p>
              Need help? Email us at{" "}
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
              inside the Tocito app.
            </p>
            <p>Contact us any time. We are ready to help.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
