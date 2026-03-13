import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import tocStyles from "../../extensions/toc-theme/assets/toc.css?raw";
import { authenticate } from "../shopify.server";

const DEFAULT_CONFIG = {
  title: "Contents",
  headingLevels: [2, 3, 4],
  minHeadings: 3,
  desktopMode: "fixedRight",
  wrapperSelector: "",
  topOffset: 80,
  smoothScroll: true,
};

const PREVIEW_STYLES = `
  .toc-settings-preview {
    display: grid;
    gap: 16px;
  }

  .toc-preview-pane {
    min-width: 0;
  }

  .toc-preview-pane + .toc-preview-pane {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 16px;
  }

  .toc-preview-label {
    margin: 0 0 8px;
    color: rgb(87, 87, 87);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.75px;
  }

  .toc-preview-stage {
    overflow: hidden;
  }

  .toc-preview-desktop .shopify-toc-float {
    position: static;
    top: auto;
    right: auto;
    max-width: 100%;
    max-height: none;
    z-index: auto;
  }

  .toc-preview-desktop .shopify-toc {
    max-width: 100%;
  }

  .toc-preview-mobile {
    max-width: 320px;
  }

  .toc-preview-mobile .shopify-toc {
    border: 0;
    background: transparent;
    max-height: none;
  }

  .toc-preview-mobile .shopify-toc__list,
  .toc-preview-mobile .shopify-toc--expanded .shopify-toc__list {
    max-height: none;
    overflow: visible;
  }

  .toc-preview-mobile .shopify-toc__toggle,
  .toc-preview-mobile .toc-fade,
  .toc-preview-mobile .shopify-toc-float {
    display: none !important;
  }
`;

type TocConfig = typeof DEFAULT_CONFIG;

type LoaderData = {
  config: TocConfig;
  deepLink: string | null;
};

type ActionData = {
  ok?: boolean;
  userErrors?: Array<{ field?: string[]; message: string }>;
};

type TocConfigInput = {
  title: string;
  headingLevels: string;
  minHeadings: string;
  desktopMode: string;
  wrapperSelector: string;
  topOffset: string;
  smoothScroll: boolean;
};

type PreviewHeading = {
  id: string;
  title: string;
  level: number;
};

type PreviewTocItem = {
  id: string;
  title: string;
  children: PreviewTocItem[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query LoadConfig {
        currentAppInstallation {
          id
          metafield(namespace: "toc", key: "config") {
            value
          }
        }
        shop {
          myshopifyDomain
        }
      }`,
  );

  const responseJson = await response.json();
  const metafieldValue =
    responseJson?.data?.currentAppInstallation?.metafield?.value;
  const myshopifyDomain = responseJson?.data?.shop?.myshopifyDomain as
    | string
    | undefined;
  const apiKey = process.env.SHOPIFY_API_KEY || "";

  return {
    config: parseConfig(metafieldValue),
    deepLink: buildActivateDeepLink(myshopifyDomain, apiKey, "toc-embed"),
  } satisfies LoaderData;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const config = coerceConfigFromForm(formData);

  const idResponse = await admin.graphql(
    `#graphql
      query LoadInstallationId {
        currentAppInstallation {
          id
        }
      }`,
  );
  const idJson = await idResponse.json();
  const installationId = idJson?.data?.currentAppInstallation?.id as
    | string
    | undefined;

  if (!installationId) {
    return {
      ok: false,
      userErrors: [{ message: "Could not load app installation id." }],
    } satisfies ActionData;
  }

  const response = await admin.graphql(
    `#graphql
      mutation SaveConfig($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          userErrors { field message }
        }
      }`,
    {
      variables: {
        metafields: [
          {
            ownerId: installationId,
            namespace: "toc",
            key: "config",
            type: "json",
            value: JSON.stringify(config),
          },
        ],
      },
    },
  );

  const responseJson = await response.json();
  const userErrors = responseJson?.data?.metafieldsSet?.userErrors || [];

  return {
    ok: userErrors.length === 0,
    userErrors,
  } satisfies ActionData;
};

export default function Index() {
  const { config, deepLink } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const shopify = useAppBridge();

  const [title, setTitle] = useState(config.title);
  const [headingLevels, setHeadingLevels] = useState(
    config.headingLevels.join(", "),
  );
  const [minHeadings, setMinHeadings] = useState(String(config.minHeadings));
  const [desktopMode, setDesktopMode] = useState(config.desktopMode);
  const [wrapperSelector, setWrapperSelector] = useState(
    config.wrapperSelector,
  );
  const [topOffset, setTopOffset] = useState(String(config.topOffset));
  const [smoothScroll, setSmoothScroll] = useState(config.smoothScroll);
  const previewConfig = coerceConfig({
    title,
    headingLevels,
    minHeadings,
    desktopMode,
    wrapperSelector,
    topOffset,
    smoothScroll,
  });
  const desktopPreview = buildPreviewState(previewConfig);
  const mobilePreview = buildPreviewState(previewConfig);

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData?.ok, shopify]);

  return (
    <s-page heading="Table of contents settings">
      <style>{tocStyles}</style>
      <style>{PREVIEW_STYLES}</style>
      <s-section heading="Display">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="title"
              label="Title"
              value={title}
              onInput={(event) => setTitle(event.currentTarget.value)}
              onChange={(event) => setTitle(event.currentTarget.value)}
            ></s-text-field>
            <s-text-field
              name="headingLevels"
              label="Heading levels"
              details="Comma-separated, e.g. 2,3,4"
              value={headingLevels}
              onInput={(event) => setHeadingLevels(event.currentTarget.value)}
              onChange={(event) => setHeadingLevels(event.currentTarget.value)}
            ></s-text-field>
            <s-text-field
              name="minHeadings"
              label="Minimum headings"
              value={minHeadings}
              onInput={(event) => setMinHeadings(event.currentTarget.value)}
              onChange={(event) => setMinHeadings(event.currentTarget.value)}
            ></s-text-field>
            <s-text-field
              name="desktopMode"
              label="Desktop mode"
              details="Use fixedRight for floating panel"
              value={desktopMode}
              onInput={(event) => setDesktopMode(event.currentTarget.value)}
              onChange={(event) => setDesktopMode(event.currentTarget.value)}
            ></s-text-field>
            <s-text-field
              name="wrapperSelector"
              label="Wrapper selector"
              details="CSS selector for your article container"
              value={wrapperSelector}
              onInput={(event) => setWrapperSelector(event.currentTarget.value)}
              onChange={(event) =>
                setWrapperSelector(event.currentTarget.value)
              }
            ></s-text-field>
            <s-text-field
              name="topOffset"
              label="Top offset"
              value={topOffset}
              onInput={(event) => setTopOffset(event.currentTarget.value)}
              onChange={(event) => setTopOffset(event.currentTarget.value)}
            ></s-text-field>
            <label>
              <input
                type="checkbox"
                name="smoothScroll"
                checked={smoothScroll}
                onChange={(e) => setSmoothScroll(e.currentTarget.checked)}
              />{" "}
              Smooth scroll
            </label>
            <s-button type="submit">Save</s-button>
            {actionData?.userErrors?.length ? (
              <s-paragraph>
                {actionData.userErrors
                  .map((error: { message: string }) => error.message)
                  .join(" ")}
              </s-paragraph>
            ) : null}
          </s-stack>
        </Form>
      </s-section>
      <s-section heading="Activate app embed">
        <s-paragraph>
          App embeds are disabled by default. Activate the embed for blog
          articles in the theme editor.
        </s-paragraph>
        {deepLink ? (
          <s-button href={deepLink} target="_blank">
            Activate now
          </s-button>
        ) : (
          <s-paragraph>
            Could not build the activate link. Please try again later.
          </s-paragraph>
        )}
      </s-section>
      <s-section slot="aside" heading="Preview">
        <div className="toc-settings-preview">
          <div className="toc-preview-pane">
            <p className="toc-preview-label">Desktop</p>
            <div className="toc-preview-stage toc-preview-desktop">
              <TocPreview
                preview={desktopPreview}
                mode={previewConfig.desktopMode}
              />
            </div>
          </div>
          <div className="toc-preview-pane">
            <p className="toc-preview-label">Mobile</p>
            <div className="toc-preview-stage toc-preview-mobile">
              <TocPreview preview={mobilePreview} mode="inline" />
            </div>
          </div>
        </div>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

function parseConfig(value: unknown): TocConfig {
  if (typeof value !== "string" || !value.trim()) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return { ...DEFAULT_CONFIG };
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      headingLevels: Array.isArray(parsed.headingLevels)
        ? parsed.headingLevels
        : DEFAULT_CONFIG.headingLevels,
    } as TocConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function coerceConfig(input: TocConfigInput): TocConfig {
  const title = input.title.trim();
  const headingLevels = parseHeadingLevelsInput(input.headingLevels);
  const minHeadings = parseIntegerInput(input.minHeadings);
  const desktopMode = input.desktopMode.trim();
  const wrapperSelector = input.wrapperSelector.trim();
  const topOffset = parseIntegerInput(input.topOffset);

  return {
    title: title || DEFAULT_CONFIG.title,
    headingLevels: headingLevels.length
      ? headingLevels
      : DEFAULT_CONFIG.headingLevels,
    minHeadings: Number.isFinite(minHeadings)
      ? minHeadings
      : DEFAULT_CONFIG.minHeadings,
    desktopMode: desktopMode || DEFAULT_CONFIG.desktopMode,
    wrapperSelector,
    topOffset: Number.isFinite(topOffset)
      ? topOffset
      : DEFAULT_CONFIG.topOffset,
    smoothScroll: input.smoothScroll,
  };
}

function coerceConfigFromForm(formData: FormData): TocConfig {
  return coerceConfig({
    title: String(formData.get("title") || DEFAULT_CONFIG.title),
    headingLevels: String(formData.get("headingLevels") || ""),
    minHeadings: String(formData.get("minHeadings") || ""),
    desktopMode: String(
      formData.get("desktopMode") || DEFAULT_CONFIG.desktopMode,
    ),
    wrapperSelector: String(
      formData.get("wrapperSelector") || DEFAULT_CONFIG.wrapperSelector,
    ),
    topOffset: String(formData.get("topOffset") || ""),
    smoothScroll: formData.get("smoothScroll") === "on",
  });
}

function buildActivateDeepLink(
  myshopifyDomain: string | undefined,
  apiKey: string,
  handle: string,
): string | null {
  if (!myshopifyDomain || !apiKey || !handle) return null;

  const params = new URLSearchParams({
    context: "apps",
    template: "article",
    activateAppId: `${apiKey}/${handle}`,
  });

  return `https://${myshopifyDomain}/admin/themes/current/editor?${params.toString()}`;
}

function parseHeadingLevelsInput(value: string): number[] {
  return value
    .split(",")
    .map((item) => parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item >= 1 && item <= 6);
}

function parseIntegerInput(value: string): number {
  return parseInt(value, 10);
}

function TocPreview({
  preview,
  mode,
}: {
  preview: ReturnType<typeof buildPreviewState>;
  mode: string;
}) {
  if (!preview.showToc) return null;

  const nav = (
    <nav
      className={`shopify-toc${preview.needsToggle ? "" : " shopify-toc--expanded"}`}
      aria-label="Table of contents preview"
      onClick={(event) => event.preventDefault()}
    >
      <div className="shopify-toc__title">{preview.title}</div>
      {preview.needsToggle ? (
        <div className="toc-fade toc-fade--top" hidden>
          <span className="toc-fade__shim"></span>
        </div>
      ) : null}
      <PreviewTocList items={preview.items} activeId={preview.activeId} />
      {preview.needsToggle ? (
        <div className="toc-fade toc-fade--bottom" aria-hidden="true">
          <span className="toc-fade__shim"></span>
        </div>
      ) : null}
      {preview.needsToggle ? (
        <button type="button" className="shopify-toc__toggle">
          Show more
        </button>
      ) : null}
    </nav>
  );

  if (mode === "fixedRight") {
    return <div className="shopify-toc-float">{nav}</div>;
  }

  return nav;
}

function PreviewTocList({
  items,
  activeId,
}: {
  items: PreviewTocItem[];
  activeId: string;
}) {
  return (
    <ul className="shopify-toc__list">
      {items.map((item) => (
        <PreviewTocListItem key={item.id} item={item} activeId={activeId} />
      ))}
    </ul>
  );
}

function PreviewTocListItem({
  item,
  activeId,
}: {
  item: PreviewTocItem;
  activeId: string;
}) {
  return (
    <li>
      <a
        href={`#${item.id}`}
        className={item.id === activeId ? "is-current" : undefined}
      >
        {item.title}
      </a>
      {item.children.length ? (
        <ul className="shopify-toc__sublist">
          {item.children.map((child) => (
            <PreviewTocListItem
              key={child.id}
              item={child}
              activeId={activeId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function buildPreviewState(config: TocConfig) {
  const headings = buildPreviewHeadings(config.headingLevels);

  return {
    activeId: headings[Math.min(4, headings.length - 1)]?.id || "",
    items: buildPreviewTocItems(headings),
    needsToggle: headings.length > 10,
    showToc: headings.length >= config.minHeadings,
    title: config.title,
  };
}

function buildPreviewHeadings(levels: number[]): PreviewHeading[] {
  const normalizedLevels = normalizeLevels(levels);
  const titles = [
    "Overview",
    "Key features",
    "Installation",
    "Theme setup",
    "Desktop placement",
    "Heading hierarchy",
    "Reader experience",
    "Mobile behavior",
    "Styling notes",
    "Anchor offsets",
    "Troubleshooting",
    "Theme compatibility",
    "Support",
  ];
  const depthPattern = [0, 1, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 0];

  return titles.map((title, index) => {
    const depth = Math.min(
      depthPattern[index] ?? 0,
      Math.max(normalizedLevels.length - 1, 0),
    );

    return {
      id: `preview-${index}`,
      title,
      level: normalizedLevels[depth],
    };
  });
}

function normalizeLevels(levels: number[]) {
  const uniqueLevels = [...new Set(levels)].sort((left, right) => left - right);
  return uniqueLevels.length ? uniqueLevels : DEFAULT_CONFIG.headingLevels;
}

function buildPreviewTocItems(headings: PreviewHeading[]): PreviewTocItem[] {
  const root: PreviewTocItem[] = [];
  const levels = headings.map((heading) => heading.level);
  const minLevel = Math.min(...levels);
  const stack: PreviewTocItem[][] = [root];
  let currentDepth = 0;
  let previousItem: PreviewTocItem | null = null;

  headings.forEach((heading) => {
    const rawDepth = Math.max(0, heading.level - minLevel);
    const targetDepth = Math.min(rawDepth, currentDepth + 1);

    while (currentDepth > targetDepth) {
      stack.pop();
      currentDepth -= 1;
    }

    while (currentDepth < targetDepth && previousItem) {
      stack.push(previousItem.children);
      currentDepth += 1;
    }

    const item: PreviewTocItem = {
      id: heading.id,
      title: heading.title,
      children: [],
    };

    stack[stack.length - 1].push(item);
    previousItem = item;
  });

  return root;
}
