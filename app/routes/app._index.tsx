import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import tocStyles from "../styles/toc-preview.css?raw";
import { authenticate } from "../shopify.server";

const DEFAULT_CONFIG = {
  title: "Contents",
  headingLevels: [2, 3, 4],
  indentation: true,
  textAlignment: "left",
  markerFormat: "none",
  minHeadings: 3,
  smoothScroll: true,
};

const HEADING_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
const TEXT_ALIGNMENT_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
] as const;
const MARKER_FORMAT_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Bullet", value: "bullet" },
  { label: "Numeric", value: "numeric" },
] as const;

const FORM_STYLES = `
  .toc-field {
    display: grid;
    gap: 0;
  }

  .toc-field-details {
    display: flex;
    gap: .25rem;
    font-size: .75rem;
    line-height: 1rem;
    color: #616161;
  }

  .toc-inline-choices {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    overflow-x: auto;
  }
`;

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
  .toc-preview-mobile .toc-fade {
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

type TocTextAlignment = (typeof TEXT_ALIGNMENT_OPTIONS)[number]["value"];
type TocMarkerFormat = (typeof MARKER_FORMAT_OPTIONS)[number]["value"];

type TocConfigInput = {
  title: string;
  headingLevels: number[];
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  minHeadings: string;
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
    normalizeHeadingLevels(config.headingLevels),
  );
  const [indentation, setIndentation] = useState(config.indentation);
  const [textAlignment, setTextAlignment] = useState(config.textAlignment);
  const [markerFormat, setMarkerFormat] = useState(config.markerFormat);
  const [minHeadings, setMinHeadings] = useState(String(config.minHeadings));
  const [smoothScroll, setSmoothScroll] = useState(config.smoothScroll);
  const previewConfig = coerceConfig({
    title,
    headingLevels,
    indentation,
    textAlignment,
    markerFormat,
    minHeadings,
    smoothScroll,
  });
  const desktopPreview = buildPreviewState(previewConfig);
  const mobilePreview = buildPreviewState(previewConfig);

  useEffect(() => {
    if (actionData?.ok) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData?.ok, shopify]);

  useEffect(() => {
    if (textAlignment === "center" && indentation) {
      setIndentation(false);
    }
  }, [indentation, textAlignment]);

  return (
    <s-page heading="Table of contents settings">
      <style>{tocStyles}</style>
      <style>{FORM_STYLES}</style>
      <style>{PREVIEW_STYLES}</style>
      <s-section heading="Display">
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-text-field
              name="title"
              label="Title"
              details="Shown at the top of the table of contents"
              value={title}
              onInput={(event) => setTitle(event.currentTarget.value)}
              onChange={(event) => setTitle(event.currentTarget.value)}
            ></s-text-field>
            <div className="toc-field">
              <s-text>Heading levels</s-text>
              <div className="toc-inline-choices" role="group" aria-label="Heading levels">
                {HEADING_LEVEL_OPTIONS.map((level) => (
                  <s-checkbox
                    key={level}
                    name="headingLevels"
                    value={String(level)}
                    label={`H${level}`}
                    checked={headingLevels.includes(level)}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked;

                      setHeadingLevels((current) => {
                        const next = checked
                          ? normalizeHeadingLevels([...current, level])
                          : current.filter((currentLevel) => currentLevel !== level);

                        return next.length ? next : current;
                      });
                    }}
                  ></s-checkbox>
                ))}
              </div>
              <div className="toc-field-details">
                Choose which article headings should appear in the table of
                contents.
              </div>
            </div>
            <s-text-field
              name="minHeadings"
              label="Minimum headings to show"
              details="Hide the table of contents until this many selected headings are found"
              value={minHeadings}
              onInput={(event) => setMinHeadings(event.currentTarget.value)}
              onChange={(event) => setMinHeadings(event.currentTarget.value)}
            ></s-text-field>
            <s-select
              name="textAlignment"
              label="Text alignment"
              details="Align the title and links inside the table of contents"
              value={textAlignment}
              onChange={(event) =>
                setTextAlignment(
                  normalizeTextAlignment(event.currentTarget.value),
                )
              }
            >
              {TEXT_ALIGNMENT_OPTIONS.map((option) => (
                <s-option key={option.value} value={option.value}>
                  {option.label}
                </s-option>
              ))}
            </s-select>
            <s-select
              name="markerFormat"
              label="Numbering / Bullet Format"
              details="Choose whether items use no marker, bullets, or numbers"
              value={markerFormat}
              onChange={(event) =>
                setMarkerFormat(
                  normalizeMarkerFormat(event.currentTarget.value),
                )
              }
            >
              {MARKER_FORMAT_OPTIONS.map((option) => (
                <s-option key={option.value} value={option.value}>
                  {option.label}
                </s-option>
              ))}
            </s-select>
            <s-checkbox
              name="indentation"
              label="Indent nested headings"
              details="Show lower-level headings as nested items"
              checked={textAlignment === "center" ? false : indentation}
              disabled={textAlignment === "center"}
              onChange={(event) =>
                setIndentation(event.currentTarget.checked)
              }
            ></s-checkbox>
            <s-checkbox
              name="smoothScroll"
              label="Smooth scroll"
              details="Scroll smoothly to a heading when a TOC link is clicked"
              checked={smoothScroll}
              onChange={(event) => setSmoothScroll(event.currentTarget.checked)}
            ></s-checkbox>
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
                indentation={previewConfig.indentation}
                textAlignment={previewConfig.textAlignment}
                markerFormat={previewConfig.markerFormat}
              />
            </div>
          </div>
          <div className="toc-preview-pane">
            <p className="toc-preview-label">Mobile</p>
            <div className="toc-preview-stage toc-preview-mobile">
              <TocPreview
                preview={mobilePreview}
                indentation={previewConfig.indentation}
                textAlignment={previewConfig.textAlignment}
                markerFormat={previewConfig.markerFormat}
              />
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
    const {
      desktopMode: _desktopMode,
      wrapperSelector: _wrapperSelector,
      topOffset: _topOffset,
      ...rest
    } = parsed as Record<string, unknown>;
    return {
      ...DEFAULT_CONFIG,
      ...rest,
      headingLevels: Array.isArray(rest.headingLevels)
        ? normalizeHeadingLevels(rest.headingLevels as number[])
        : DEFAULT_CONFIG.headingLevels,
      indentation:
        typeof rest.indentation === "boolean"
          ? rest.indentation
          : DEFAULT_CONFIG.indentation,
      textAlignment: normalizeTextAlignment(rest.textAlignment),
      markerFormat: normalizeMarkerFormat(rest.markerFormat),
    } as TocConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function coerceConfig(input: TocConfigInput): TocConfig {
  const title = input.title.trim();
  const headingLevels = normalizeHeadingLevels(input.headingLevels);
  const textAlignment = normalizeTextAlignment(input.textAlignment);
  const markerFormat = normalizeMarkerFormat(input.markerFormat);
  const minHeadings = parseIntegerInput(input.minHeadings);

  return {
    title: title || DEFAULT_CONFIG.title,
    headingLevels: headingLevels.length
      ? headingLevels
      : DEFAULT_CONFIG.headingLevels,
    indentation: textAlignment === "center" ? false : input.indentation,
    textAlignment,
    markerFormat,
    minHeadings: Number.isFinite(minHeadings)
      ? minHeadings
      : DEFAULT_CONFIG.minHeadings,
    smoothScroll: input.smoothScroll,
  };
}

function coerceConfigFromForm(formData: FormData): TocConfig {
  return coerceConfig({
    title: String(formData.get("title") || DEFAULT_CONFIG.title),
    headingLevels: formData
      .getAll("headingLevels")
      .map((value) => parseInt(String(value), 10)),
    indentation: formData.get("indentation") === "on",
    textAlignment: normalizeTextAlignment(
      String(formData.get("textAlignment") || DEFAULT_CONFIG.textAlignment),
    ),
    markerFormat: normalizeMarkerFormat(
      String(formData.get("markerFormat") || DEFAULT_CONFIG.markerFormat),
    ),
    minHeadings: String(formData.get("minHeadings") || ""),
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

function parseIntegerInput(value: string): number {
  return parseInt(value, 10);
}

function normalizeTextAlignment(value: unknown): TocTextAlignment {
  return TEXT_ALIGNMENT_OPTIONS.some((option) => option.value === value)
    ? (value as TocTextAlignment)
    : DEFAULT_CONFIG.textAlignment;
}

function normalizeMarkerFormat(value: unknown): TocMarkerFormat {
  return MARKER_FORMAT_OPTIONS.some((option) => option.value === value)
    ? (value as TocMarkerFormat)
    : DEFAULT_CONFIG.markerFormat;
}

function normalizeHeadingLevels(levels: number[]): number[] {
  return [...new Set(levels)]
    .filter((level) =>
      HEADING_LEVEL_OPTIONS.includes(level as 1 | 2 | 3 | 4 | 5 | 6),
    )
    .sort((left, right) => left - right);
}

function TocPreview({
  preview,
  indentation,
  textAlignment,
  markerFormat,
}: {
  preview: ReturnType<typeof buildPreviewState>;
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!preview.needsToggle) {
      setExpanded(false);
    }
  }, [preview.needsToggle]);

  if (!preview.showToc) return null;

  const nav = (
    <nav
      className={`shopify-toc shopify-toc--align-${textAlignment} shopify-toc--markers-${markerFormat}${!indentation ? " shopify-toc--flat" : ""}${!preview.needsToggle || expanded ? " shopify-toc--expanded" : ""}`}
      aria-label="Table of contents preview"
      onClick={(event) => event.preventDefault()}
    >
      <div className="shopify-toc__title">{preview.title}</div>
      {preview.needsToggle ? (
        <div className="toc-fade toc-fade--top" hidden={!expanded}>
          <span className="toc-fade__shim"></span>
        </div>
      ) : null}
      <PreviewTocList items={preview.items} activeId={preview.activeId} />
      {preview.needsToggle ? (
        <div className="toc-fade toc-fade--bottom" aria-hidden="true" hidden={expanded}>
          <span className="toc-fade__shim"></span>
        </div>
      ) : null}
      {preview.needsToggle ? (
        <button
          type="button"
          className="shopify-toc__toggle"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </nav>
  );
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
        <span className="shopify-toc__link-label">{item.title}</span>
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

  return titles.map((title, index) => {
    const depth = index % normalizedLevels.length;
    const level = normalizedLevels[depth];

    return {
      id: `preview-${index}`,
      title: `H${level} ${title}`,
      level,
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
