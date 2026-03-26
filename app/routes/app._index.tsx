import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import CodeMirror from "@uiw/react-codemirror";
import { css as cssLanguage } from "@codemirror/lang-css";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import { SaveBar, useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import tocStyles from "../styles/toc-preview.css?raw";
import { authenticate } from "../shopify.server";

type TocTextAlignment = "left" | "center" | "right";
type TocMarkerFormat = "none" | "bullet" | "numeric";
type TocDesktopPosition =
  | "float-right"
  | "float-left"
  | "before-first-heading"
  | "after-first-heading"
  | "css-selector";
type TocMobilePosition =
  | "before-first-heading"
  | "after-first-heading"
  | "css-selector";
type TocBorderConfig = {
  color: string;
  width: number;
  radius: number;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
};

type TocDeviceConfig = TocBorderConfig & {
  position: TocDesktopPosition | TocMobilePosition;
  positionSelector: string;
  background: string;
  maxWidth: number;
  smoothScroll: boolean;
  scrollOffset: number;
  showTitle: boolean;
  headingsFontSize: number;
  headingsFontColor: string;
  headingsFontWeight: number;
  titleFontSize: number;
  titleFontColor: string;
  titleFontWeight: number;
  showButton: boolean;
  showButtonHeight: number;
  showMoreButtonText: string;
  showLessButtonText: string;
  showButtonFontSize: number;
  showButtonFontColor: string;
  showButtonFontWeight: number;
  showButtonBorderColor: string;
  showButtonBorderWidth: number;
  showButtonBorderRadius: number;
};
type TocConfig = {
  title: string;
  headingLevels: number[];
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  minHeadings: number;
  mobileBreakpoint: number;
  excludedBlogs: string;
  customCss: string;
  desktop: TocDeviceConfig;
  mobile: TocDeviceConfig;
};

const DEFAULT_MOBILE_BREAKPOINT = 768;
const CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN = "{{mobileBreakpoint}}";
const CUSTOM_CSS_EDITOR_EXTENSIONS = [cssLanguage()];
const CUSTOM_CSS_REFERENCE_SELECTORS = [
  ".toc-widget",
  ".toc-widget__title",
  ".toc-widget__list",
  ".toc-widget__sublist",
  ".toc-widget__item",
  ".toc-widget__link",
  ".toc-widget__link-label",
  ".toc-widget__toggle",
  ".toc-widget__fade",
  ".toc-widget__fade--top",
  ".toc-widget__fade--bottom",
  ".toc-widget__fade-shim",
  ".toc-widget-float",
  ".toc-widget-float--left",
] as const;

const DEFAULT_DESKTOP_CONFIG: TocDeviceConfig = {
  position: "float-right",
  positionSelector: "",
  color: "#0000001f",
  width: 1,
  radius: 12,
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  paddingRight: 16,
  background: "#ffffff",
  maxWidth: 0,
  smoothScroll: true,
  scrollOffset: 80,
  showTitle: true,
  headingsFontSize: 14,
  headingsFontColor: "#575757",
  headingsFontWeight: 400,
  titleFontSize: 14,
  titleFontColor: "#575757",
  titleFontWeight: 600,
  showButton: true,
  showButtonHeight: 300,
  showMoreButtonText: "Show more",
  showLessButtonText: "Show less",
  showButtonFontSize: 13,
  showButtonFontColor: "#575757",
  showButtonFontWeight: 600,
  showButtonBorderColor: "#575757",
  showButtonBorderWidth: 0,
  showButtonBorderRadius: 0,
};
const DEFAULT_MOBILE_CONFIG: TocDeviceConfig = {
  position: "before-first-heading",
  positionSelector: "",
  color: "#0000001f",
  width: 0,
  radius: 12,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  background: "#00000000",
  maxWidth: 0,
  smoothScroll: true,
  scrollOffset: 80,
  showTitle: true,
  headingsFontSize: 14,
  headingsFontColor: "#575757",
  headingsFontWeight: 400,
  titleFontSize: 14,
  titleFontColor: "#575757",
  titleFontWeight: 600,
  showButton: false,
  showButtonHeight: 300,
  showMoreButtonText: "Show more",
  showLessButtonText: "Show less",
  showButtonFontSize: 13,
  showButtonFontColor: "#575757",
  showButtonFontWeight: 600,
  showButtonBorderColor: "#575757",
  showButtonBorderWidth: 0,
  showButtonBorderRadius: 0,
};

const DEFAULT_CONFIG: TocConfig = {
  title: "Contents",
  headingLevels: [2, 3, 4],
  indentation: true,
  textAlignment: "left",
  markerFormat: "none",
  minHeadings: 3,
  mobileBreakpoint: DEFAULT_MOBILE_BREAKPOINT,
  excludedBlogs: "",
  customCss: buildDefaultCustomCss(),
  desktop: DEFAULT_DESKTOP_CONFIG,
  mobile: DEFAULT_MOBILE_CONFIG,
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
const FONT_WEIGHT_OPTIONS = [
  { label: "Thin", value: "100" },
  { label: "Extra light", value: "200" },
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra bold", value: "800" },
  { label: "Black", value: "900" },
] as const;
const DESKTOP_POSITION_OPTIONS = [
  { label: "Float right", value: "float-right" },
  { label: "Float left", value: "float-left" },
  { label: "Before first heading", value: "before-first-heading" },
  { label: "After first heading", value: "after-first-heading" },
  { label: "CSS selector", value: "css-selector" },
] as const;
const MOBILE_POSITION_OPTIONS = [
  { label: "Before first heading", value: "before-first-heading" },
  { label: "After first heading", value: "after-first-heading" },
  { label: "CSS selector", value: "css-selector" },
] as const;
const APP_EMBED_HANDLE = "toc-embed";
const FORM_ID = "toc-settings-form";
const SAVE_BAR_ID = "toc-settings-save-bar";
const EDITOR_TABS = [
  { id: "general", label: "General", icon: "settings" },
  { id: "desktop", label: "Desktop", icon: "desktop" },
  { id: "mobile", label: "Mobile", icon: "mobile" },
] as const;
const FORM_STYLES = `
  .toc-tab-group {
    display: grid;
    gap: 12px;
    margin-bottom: 16px;
  }

  .toc-main-layout {
    display: grid;
    gap: 16px;
    align-items: start;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 360px);
    margin-bottom: 16px;
  }

  .toc-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .toc-embed-actions {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .toc-segmented-control {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    margin: 0;
    padding: 4px;
    list-style: none;
    border-radius: 12px;
    background: var(--p-color-bg-surface, #ffffff);
    border: 1px solid var(--p-color-border-secondary, rgba(0, 0, 0, 0.08));
    width: fit-content;
    max-width: 100%;
    overflow-x: auto;
  }

  .toc-segmented-item {
    display: flex;
  }

  .toc-segmented-button {
    appearance: none;
    border: 0;
    background: transparent;
    color: var(--p-color-text, #303030);
    border-radius: 8px;
    min-height: 32px;
    padding: 0 12px 0 9px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    cursor: pointer;
    white-space: nowrap;
    font: inherit;
    transition: background-color 120ms ease, box-shadow 120ms ease;
  }

  .toc-segmented-button:hover {
    background: var(--p-color-bg-surface-hover, rgba(0, 0, 0, 0.04));
  }

  .toc-segmented-button:focus-visible {
    outline: 2px solid var(--p-color-border-focus, #005bd3);
    outline-offset: 2px;
  }

  .toc-segmented-button[aria-current="true"] {
    background: var(--p-color-bg-surface, #ffffff);
    box-shadow: inset 0 0 0 1px var(--p-color-border, rgba(0, 0, 0, 0.1));
  }

  .toc-segmented-button s-icon {
    flex: 0 0 auto;
  }

  .toc-field {
    display: grid;
    gap: 0;
    margin-block-end: 0;
  }

  .toc-field-details {
    display: flex;
    gap: .25rem;
    font-size: .75rem;
    line-height: 1rem;
    color: #616161;
  }

  .toc-code-field {
    display: grid;
    gap: 8px;
  }

  .toc-code-field__label {
    color: var(--p-color-text, #303030);
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25rem;
  }

  .toc-code-editor {
    width: 100%;
    min-height: 320px;
    border: 1px solid var(--p-color-border-secondary, rgba(0, 0, 0, 0.08));
    border-radius: 12px;
    background: var(--p-color-bg-surface, #ffffff);
    overflow: hidden;
    box-sizing: border-box;
  }

  .toc-code-editor:focus-within {
    outline: 2px solid var(--p-color-border-focus, #005bd3);
    outline-offset: 2px;
  }

  .toc-code-editor .cm-editor {
    height: 320px;
    background: transparent;
  }

  .toc-code-editor .cm-scroller {
    height: 100%;
    overflow: auto;
    font: 400 12px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
  }

  .toc-code-editor .cm-content,
  .toc-code-editor .cm-gutter {
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .toc-code-editor .cm-content {
    padding-left: 2px;
  }

  .toc-code-editor .cm-gutters {
    border-right: 1px solid var(--p-color-border-secondary, rgba(0, 0, 0, 0.08));
    background: rgba(0, 0, 0, 0.02);
  }

  .toc-code-editor .cm-activeLine,
  .toc-code-editor .cm-activeLineGutter {
    background: rgba(0, 91, 211, 0.06);
  }

  .toc-code-editor .cm-focused {
    outline: none;
  }

  .toc-inline-choices {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    overflow-x: auto;
  }

  .toc-compact-fields {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }

  .toc-compact-fields-two {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .toc-compact-fields-four {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: start;
  }

  .toc-subsection {
    display: grid;
    gap: 7px;
    align-items: start;
  }

  .toc-subsection:first-of-type {
    margin-top: 14px;
  }

  .toc-subsection + .toc-subsection {
    margin-top: 4px;
    padding-top: 16px;
    border-top: 1px solid var(--p-color-border-secondary, rgba(0, 0, 0, 0.08));
  }

  .toc-subsection-title {
    margin: 0;
    color: #616161;
    font-size: 13px;
    font-weight: 600;
    line-height: 16px;
  }

  .toc-device-section {
    position: relative;
  }

  .toc-device-section__chip {
    position: absolute;
    top: 12px;
    right: 16px;
    z-index: 1;
    max-width: calc(100% - 32px);
  }

  @media (max-width: 900px) {
    .toc-main-layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (max-width: 640px) {
    .toc-compact-fields-two {
      grid-template-columns: minmax(0, 1fr);
    }

    .toc-compact-fields {
      grid-template-columns: minmax(0, 1fr);
    }

    .toc-compact-fields-four {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

const PREVIEW_STYLES = `
  .toc-preview-column {
    min-width: 0;
  }

  .toc-preview-column--sticky {
    position: sticky;
    top: 16px;
    align-self: start;
  }

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

  .toc-preview-desktop {
    overflow: visible;
  }

  .toc-preview-float {
    width: min(320px, 100%);
    max-width: 100%;
    margin-left: auto;
  }

  .toc-preview-float--left {
    margin-left: 0;
    margin-right: auto;
  }

  .toc-preview-float .toc-widget {
    box-sizing: border-box;
    width: 100%;
  }

  .toc-preview-flow {
    width: min(320px, 100%);
    max-width: 100%;
  }

  .toc-preview-mobile {
    max-width: 320px;
  }

  @media (max-width: 900px) {
    .toc-preview-column--sticky {
      position: static;
    }
  }
`;

type LoaderData = {
  config: TocConfig;
  deepLink: string | null;
};

type ActionData = {
  ok?: boolean;
  userErrors?: Array<{ field?: string[]; message: string }>;
};

type EditorTab = (typeof EDITOR_TABS)[number]["id"];
type DeviceTab = Extract<EditorTab, "desktop" | "mobile">;
type DeviceSectionKey =
  | "general"
  | "title"
  | "headings"
  | "border"
  | "padding"
  | "scroll"
  | "showButton";
type DeviceSectionApplyState = Record<
  DeviceTab,
  Partial<Record<DeviceSectionKey, boolean>>
>;

type TocConfigInput = {
  title: string;
  headingLevels: number[];
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  minHeadings: string;
  mobileBreakpoint: string;
  excludedBlogs: string;
  customCss: string;
  desktop: TocDeviceConfigInput;
  mobile: TocDeviceConfigInput;
};

type TocDeviceConfigInput = {
  position: string;
  positionSelector: string;
  color: string;
  width: string;
  radius: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  background: string;
  maxWidth: string;
  smoothScroll: boolean;
  scrollOffset: string;
  showTitle: boolean;
  headingsFontSize: string;
  headingsFontColor: string;
  headingsFontWeight: string;
  titleFontSize: string;
  titleFontColor: string;
  titleFontWeight: string;
  showButton: boolean;
  showButtonHeight: string;
  showMoreButtonText: string;
  showLessButtonText: string;
  showButtonFontSize: string;
  showButtonFontColor: string;
  showButtonFontWeight: string;
  showButtonBorderColor: string;
  showButtonBorderWidth: string;
  showButtonBorderRadius: string;
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

type AppEmbedStatus = "checking" | "active" | "inactive" | "unavailable";
type ThemeExtensionActivationRecord = {
  handle?: string;
  status?: string;
  activations?: Array<{ target?: string; themeId?: string | number }>;
};
type AppBridgeExtensionRecord = {
  handle?: string;
  type?: string;
  activations?: Array<{ target?: string } | ThemeExtensionActivationRecord>;
};

const DEVICE_SECTION_FIELDS = {
  general: ["position", "positionSelector", "background", "maxWidth"],
  title: ["showTitle", "titleFontSize", "titleFontColor", "titleFontWeight"],
  headings: [
    "headingsFontSize",
    "headingsFontColor",
    "headingsFontWeight",
  ],
  border: ["color", "width", "radius"],
  padding: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"],
  scroll: ["smoothScroll", "scrollOffset"],
  showButton: [
    "showButton",
    "showButtonHeight",
    "showMoreButtonText",
    "showLessButtonText",
    "showButtonFontSize",
    "showButtonFontColor",
    "showButtonFontWeight",
    "showButtonBorderColor",
    "showButtonBorderWidth",
    "showButtonBorderRadius",
  ],
} as const satisfies Record<DeviceSectionKey, readonly (keyof TocDeviceConfig)[]>;

type GeneralSectionApplyPayload = Pick<
  TocDeviceConfig,
  "background" | "maxWidth"
> &
  Partial<Pick<TocDeviceConfig, "position" | "positionSelector">>;

type DeviceSettingsSectionProps = {
  heading: string;
  activeDevice: DeviceTab;
  showApplyAction: boolean;
  isApplied: boolean;
  onApply: () => void;
  onEdit: () => void;
  children: ReactNode;
};

function createEmptyDeviceSectionApplyState(): DeviceSectionApplyState {
  return { desktop: {}, mobile: {} };
}

function getOtherDevice(device: DeviceTab): DeviceTab {
  return device === "desktop" ? "mobile" : "desktop";
}

function getDeviceLabel(device: DeviceTab): "Desktop" | "Mobile" {
  return device === "desktop" ? "Desktop" : "Mobile";
}

function deviceSectionFieldsEqual(
  left: TocDeviceConfig,
  right: TocDeviceConfig,
  section: DeviceSectionKey,
) {
  return DEVICE_SECTION_FIELDS[section].every((field) => left[field] === right[field]);
}

function getGeneralSectionApplyPayload(
  sourceDevice: DeviceTab,
  source: TocDeviceConfig,
): GeneralSectionApplyPayload {
  if (sourceDevice === "desktop") {
    if (
      source.position === "before-first-heading" ||
      source.position === "after-first-heading"
    ) {
      return {
        background: source.background,
        maxWidth: source.maxWidth,
        position: source.position,
        positionSelector: "",
      };
    }

    if (source.position === "css-selector") {
      return {
        background: source.background,
        maxWidth: source.maxWidth,
        position: source.position,
        positionSelector: source.positionSelector,
      };
    }

    return {
      background: source.background,
      maxWidth: source.maxWidth,
    };
  }

  return {
    background: source.background,
    maxWidth: source.maxWidth,
    position: source.position,
    positionSelector:
      source.position === "css-selector" ? source.positionSelector : "",
  };
}

function deviceSectionDiffersForApply(
  section: DeviceSectionKey,
  sourceDevice: DeviceTab,
  source: TocDeviceConfig,
  target: TocDeviceConfig,
) {
  if (section !== "general") {
    return !deviceSectionFieldsEqual(source, target, section);
  }

  const payload = getGeneralSectionApplyPayload(sourceDevice, source);

  return (
    payload.background !== target.background ||
    payload.maxWidth !== target.maxWidth ||
    ("position" in payload && payload.position !== target.position) ||
    ("positionSelector" in payload &&
      payload.positionSelector !== target.positionSelector)
  );
}

function DeviceSettingsSection({
  heading,
  activeDevice,
  showApplyAction,
  isApplied,
  onApply,
  onEdit,
  children,
}: DeviceSettingsSectionProps) {
  const targetLabel = getDeviceLabel(getOtherDevice(activeDevice));

  return (
    <div
      className="toc-device-section"
      onInputCapture={onEdit}
      onChangeCapture={onEdit}
    >
      {isApplied ? (
        <div className="toc-device-section__chip">
          <s-badge tone="success" icon="check-circle">
            Applied
          </s-badge>
        </div>
      ) : null}
      {!isApplied && showApplyAction ? (
        <div className="toc-device-section__chip">
          <s-clickable-chip
            color="strong"
            accessibilityLabel={`Apply this section to ${targetLabel}`}
            onClick={onApply}
          >
            Apply to {targetLabel}
          </s-clickable-chip>
        </div>
      ) : null}
      <s-section heading={heading}>{children}</s-section>
    </div>
  );
}

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
    deepLink: buildActivateDeepLink(myshopifyDomain, apiKey, APP_EMBED_HANDLE),
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
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const [savedConfig, setSavedConfig] = useState(config);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [title, setTitle] = useState(config.title);
  const [headingLevels, setHeadingLevels] = useState(
    normalizeHeadingLevels(config.headingLevels),
  );
  const [indentation, setIndentation] = useState(config.indentation);
  const [textAlignment, setTextAlignment] = useState(config.textAlignment);
  const [markerFormat, setMarkerFormat] = useState(config.markerFormat);
  const [minHeadings, setMinHeadings] = useState(String(config.minHeadings));
  const [mobileBreakpoint, setMobileBreakpoint] = useState(
    String(config.mobileBreakpoint),
  );
  const [excludedBlogs, setExcludedBlogs] = useState(config.excludedBlogs);
  const [customCss, setCustomCss] = useState(config.customCss);
  const [desktopPosition, setDesktopPosition] = useState(
    config.desktop.position,
  );
  const [desktopPositionSelector, setDesktopPositionSelector] = useState(
    config.desktop.positionSelector,
  );
  const [desktopBorderColor, setDesktopBorderColor] = useState(
    config.desktop.color,
  );
  const [desktopBorderWidth, setDesktopBorderWidth] = useState(
    String(config.desktop.width),
  );
  const [desktopBorderRadius, setDesktopBorderRadius] = useState(
    String(config.desktop.radius),
  );
  const [desktopPaddingTop, setDesktopPaddingTop] = useState(
    String(config.desktop.paddingTop),
  );
  const [desktopPaddingBottom, setDesktopPaddingBottom] = useState(
    String(config.desktop.paddingBottom),
  );
  const [desktopPaddingLeft, setDesktopPaddingLeft] = useState(
    String(config.desktop.paddingLeft),
  );
  const [desktopPaddingRight, setDesktopPaddingRight] = useState(
    String(config.desktop.paddingRight),
  );
  const [desktopBackground, setDesktopBackground] = useState(
    config.desktop.background,
  );
  const [desktopMaxWidth, setDesktopMaxWidth] = useState(
    String(config.desktop.maxWidth),
  );
  const [desktopSmoothScroll, setDesktopSmoothScroll] = useState(
    config.desktop.smoothScroll,
  );
  const [desktopScrollOffset, setDesktopScrollOffset] = useState(
    String(config.desktop.scrollOffset),
  );
  const [desktopShowTitle, setDesktopShowTitle] = useState(
    config.desktop.showTitle,
  );
  const [desktopHeadingsFontSize, setDesktopHeadingsFontSize] = useState(
    String(config.desktop.headingsFontSize),
  );
  const [desktopHeadingsFontColor, setDesktopHeadingsFontColor] = useState(
    config.desktop.headingsFontColor,
  );
  const [desktopHeadingsFontWeight, setDesktopHeadingsFontWeight] = useState(
    String(config.desktop.headingsFontWeight),
  );
  const [desktopTitleFontSize, setDesktopTitleFontSize] = useState(
    String(config.desktop.titleFontSize),
  );
  const [desktopTitleFontColor, setDesktopTitleFontColor] = useState(
    config.desktop.titleFontColor,
  );
  const [desktopTitleFontWeight, setDesktopTitleFontWeight] = useState(
    String(config.desktop.titleFontWeight),
  );
  const [desktopShowButton, setDesktopShowButton] = useState(
    config.desktop.showButton,
  );
  const [desktopShowButtonHeight, setDesktopShowButtonHeight] = useState(
    String(config.desktop.showButtonHeight),
  );
  const [desktopShowMoreButtonText, setDesktopShowMoreButtonText] = useState(
    config.desktop.showMoreButtonText,
  );
  const [desktopShowLessButtonText, setDesktopShowLessButtonText] = useState(
    config.desktop.showLessButtonText,
  );
  const [desktopShowButtonFontSize, setDesktopShowButtonFontSize] = useState(
    String(config.desktop.showButtonFontSize),
  );
  const [desktopShowButtonFontColor, setDesktopShowButtonFontColor] = useState(
    config.desktop.showButtonFontColor,
  );
  const [desktopShowButtonFontWeight, setDesktopShowButtonFontWeight] =
    useState(String(config.desktop.showButtonFontWeight));
  const [desktopShowButtonBorderColor, setDesktopShowButtonBorderColor] =
    useState(config.desktop.showButtonBorderColor);
  const [desktopShowButtonBorderWidth, setDesktopShowButtonBorderWidth] =
    useState(String(config.desktop.showButtonBorderWidth));
  const [desktopShowButtonBorderRadius, setDesktopShowButtonBorderRadius] =
    useState(String(config.desktop.showButtonBorderRadius));
  const [mobilePosition, setMobilePosition] = useState(config.mobile.position);
  const [mobilePositionSelector, setMobilePositionSelector] = useState(
    config.mobile.positionSelector,
  );
  const [mobileBorderColor, setMobileBorderColor] = useState(
    config.mobile.color,
  );
  const [mobileBorderWidth, setMobileBorderWidth] = useState(
    String(config.mobile.width),
  );
  const [mobileBorderRadius, setMobileBorderRadius] = useState(
    String(config.mobile.radius),
  );
  const [mobilePaddingTop, setMobilePaddingTop] = useState(
    String(config.mobile.paddingTop),
  );
  const [mobilePaddingBottom, setMobilePaddingBottom] = useState(
    String(config.mobile.paddingBottom),
  );
  const [mobilePaddingLeft, setMobilePaddingLeft] = useState(
    String(config.mobile.paddingLeft),
  );
  const [mobilePaddingRight, setMobilePaddingRight] = useState(
    String(config.mobile.paddingRight),
  );
  const [mobileBackground, setMobileBackground] = useState(
    config.mobile.background,
  );
  const [mobileMaxWidth, setMobileMaxWidth] = useState(
    String(config.mobile.maxWidth),
  );
  const [mobileSmoothScroll, setMobileSmoothScroll] = useState(
    config.mobile.smoothScroll,
  );
  const [mobileScrollOffset, setMobileScrollOffset] = useState(
    String(config.mobile.scrollOffset),
  );
  const [mobileShowTitle, setMobileShowTitle] = useState(
    config.mobile.showTitle,
  );
  const [mobileHeadingsFontSize, setMobileHeadingsFontSize] = useState(
    String(config.mobile.headingsFontSize),
  );
  const [mobileHeadingsFontColor, setMobileHeadingsFontColor] = useState(
    config.mobile.headingsFontColor,
  );
  const [mobileHeadingsFontWeight, setMobileHeadingsFontWeight] = useState(
    String(config.mobile.headingsFontWeight),
  );
  const [mobileTitleFontSize, setMobileTitleFontSize] = useState(
    String(config.mobile.titleFontSize),
  );
  const [mobileTitleFontColor, setMobileTitleFontColor] = useState(
    config.mobile.titleFontColor,
  );
  const [mobileTitleFontWeight, setMobileTitleFontWeight] = useState(
    String(config.mobile.titleFontWeight),
  );
  const [mobileShowButton, setMobileShowButton] = useState(
    config.mobile.showButton,
  );
  const [mobileShowButtonHeight, setMobileShowButtonHeight] = useState(
    String(config.mobile.showButtonHeight),
  );
  const [mobileShowMoreButtonText, setMobileShowMoreButtonText] = useState(
    config.mobile.showMoreButtonText,
  );
  const [mobileShowLessButtonText, setMobileShowLessButtonText] = useState(
    config.mobile.showLessButtonText,
  );
  const [mobileShowButtonFontSize, setMobileShowButtonFontSize] = useState(
    String(config.mobile.showButtonFontSize),
  );
  const [mobileShowButtonFontColor, setMobileShowButtonFontColor] = useState(
    config.mobile.showButtonFontColor,
  );
  const [mobileShowButtonFontWeight, setMobileShowButtonFontWeight] = useState(
    String(config.mobile.showButtonFontWeight),
  );
  const [mobileShowButtonBorderColor, setMobileShowButtonBorderColor] =
    useState(config.mobile.showButtonBorderColor);
  const [mobileShowButtonBorderWidth, setMobileShowButtonBorderWidth] =
    useState(String(config.mobile.showButtonBorderWidth));
  const [mobileShowButtonBorderRadius, setMobileShowButtonBorderRadius] =
    useState(String(config.mobile.showButtonBorderRadius));
  const [appliedSections, setAppliedSections] = useState(
    createEmptyDeviceSectionApplyState(),
  );
  const [appEmbedStatus, setAppEmbedStatus] =
    useState<AppEmbedStatus>("checking");
  const activeDevice =
    activeTab === "desktop" || activeTab === "mobile" ? activeTab : null;
  const isShowMoreEnabled =
    activeTab === "desktop" ? desktopShowButton : mobileShowButton;
  const isTitleEnabled =
    activeTab === "desktop" ? desktopShowTitle : mobileShowTitle;
  const currentConfig = coerceConfig({
    title,
    headingLevels,
    indentation,
    textAlignment,
    markerFormat,
    minHeadings,
    mobileBreakpoint,
    excludedBlogs,
    customCss,
    desktop: {
      position: desktopPosition,
      positionSelector: desktopPositionSelector,
      color: desktopBorderColor,
      width: desktopBorderWidth,
      radius: desktopBorderRadius,
      paddingTop: desktopPaddingTop,
      paddingBottom: desktopPaddingBottom,
      paddingLeft: desktopPaddingLeft,
      paddingRight: desktopPaddingRight,
      background: desktopBackground,
      maxWidth: desktopMaxWidth,
      smoothScroll: desktopSmoothScroll,
      scrollOffset: desktopScrollOffset,
      showTitle: desktopShowTitle,
      headingsFontSize: desktopHeadingsFontSize,
      headingsFontColor: desktopHeadingsFontColor,
      headingsFontWeight: desktopHeadingsFontWeight,
      titleFontSize: desktopTitleFontSize,
      titleFontColor: desktopTitleFontColor,
      titleFontWeight: desktopTitleFontWeight,
      showButton: desktopShowButton,
      showButtonHeight: desktopShowButtonHeight,
      showMoreButtonText: desktopShowMoreButtonText,
      showLessButtonText: desktopShowLessButtonText,
      showButtonFontSize: desktopShowButtonFontSize,
      showButtonFontColor: desktopShowButtonFontColor,
      showButtonFontWeight: desktopShowButtonFontWeight,
      showButtonBorderColor: desktopShowButtonBorderColor,
      showButtonBorderWidth: desktopShowButtonBorderWidth,
      showButtonBorderRadius: desktopShowButtonBorderRadius,
    },
    mobile: {
      position: mobilePosition,
      positionSelector: mobilePositionSelector,
      color: mobileBorderColor,
      width: mobileBorderWidth,
      radius: mobileBorderRadius,
      paddingTop: mobilePaddingTop,
      paddingBottom: mobilePaddingBottom,
      paddingLeft: mobilePaddingLeft,
      paddingRight: mobilePaddingRight,
      background: mobileBackground,
      maxWidth: mobileMaxWidth,
      smoothScroll: mobileSmoothScroll,
      scrollOffset: mobileScrollOffset,
      showTitle: mobileShowTitle,
      headingsFontSize: mobileHeadingsFontSize,
      headingsFontColor: mobileHeadingsFontColor,
      headingsFontWeight: mobileHeadingsFontWeight,
      titleFontSize: mobileTitleFontSize,
      titleFontColor: mobileTitleFontColor,
      titleFontWeight: mobileTitleFontWeight,
      showButton: mobileShowButton,
      showButtonHeight: mobileShowButtonHeight,
      showMoreButtonText: mobileShowMoreButtonText,
      showLessButtonText: mobileShowLessButtonText,
      showButtonFontSize: mobileShowButtonFontSize,
      showButtonFontColor: mobileShowButtonFontColor,
      showButtonFontWeight: mobileShowButtonFontWeight,
      showButtonBorderColor: mobileShowButtonBorderColor,
      showButtonBorderWidth: mobileShowButtonBorderWidth,
      showButtonBorderRadius: mobileShowButtonBorderRadius,
    },
  });
  const desktopPreview = buildPreviewState(currentConfig);
  const mobilePreview = buildPreviewState(currentConfig);
  const isDirty = !configsEqual(savedConfig, currentConfig);
  const isSaving = navigation.state === "submitting";

  const clearAppliedSection = (section: DeviceSectionKey) => {
    if (!activeDevice) {
      return;
    }

    setAppliedSections((current) => {
      if (!current[activeDevice][section]) {
        return current;
      }

      return {
        ...current,
        [activeDevice]: {
          ...current[activeDevice],
          [section]: false,
        },
      };
    });
  };

  const getSectionState = (section: DeviceSectionKey) => {
    if (!activeDevice) {
      return { isApplied: false, showApplyAction: false };
    }

    const targetDevice = getOtherDevice(activeDevice);
    const currentDeviceConfig = currentConfig[activeDevice];
    const targetDeviceConfig = currentConfig[targetDevice];
    const savedDeviceConfig = savedConfig[activeDevice];
    const isApplied = appliedSections[activeDevice][section] === true;
    const changedSinceSave = !deviceSectionFieldsEqual(
      currentDeviceConfig,
      savedDeviceConfig,
      section,
    );
    const differsFromOtherDevice = deviceSectionDiffersForApply(
      section,
      activeDevice,
      currentDeviceConfig,
      targetDeviceConfig,
    );

    return {
      isApplied,
      showApplyAction: !isApplied && changedSinceSave && differsFromOtherDevice,
    };
  };

  const applySectionToOtherDevice = (section: DeviceSectionKey) => {
    if (!activeDevice) {
      return;
    }

    const sourceConfig = currentConfig[activeDevice];
    const targetDevice = getOtherDevice(activeDevice);

    switch (section) {
      case "general": {
        const payload = getGeneralSectionApplyPayload(activeDevice, sourceConfig);

        if (targetDevice === "desktop") {
          setDesktopBackground(payload.background);
          setDesktopMaxWidth(String(payload.maxWidth));

          if (payload.position) {
            setDesktopPosition(normalizeDesktopPosition(payload.position));
            setDesktopPositionSelector(payload.positionSelector ?? "");
          }
        } else {
          setMobileBackground(payload.background);
          setMobileMaxWidth(String(payload.maxWidth));

          if (payload.position) {
            setMobilePosition(normalizeMobilePosition(payload.position));
            setMobilePositionSelector(payload.positionSelector ?? "");
          }
        }

        break;
      }
      case "title":
        if (targetDevice === "desktop") {
          setDesktopShowTitle(sourceConfig.showTitle);
          setDesktopTitleFontSize(String(sourceConfig.titleFontSize));
          setDesktopTitleFontColor(sourceConfig.titleFontColor);
          setDesktopTitleFontWeight(String(sourceConfig.titleFontWeight));
        } else {
          setMobileShowTitle(sourceConfig.showTitle);
          setMobileTitleFontSize(String(sourceConfig.titleFontSize));
          setMobileTitleFontColor(sourceConfig.titleFontColor);
          setMobileTitleFontWeight(String(sourceConfig.titleFontWeight));
        }
        break;
      case "headings":
        if (targetDevice === "desktop") {
          setDesktopHeadingsFontSize(String(sourceConfig.headingsFontSize));
          setDesktopHeadingsFontColor(sourceConfig.headingsFontColor);
          setDesktopHeadingsFontWeight(String(sourceConfig.headingsFontWeight));
        } else {
          setMobileHeadingsFontSize(String(sourceConfig.headingsFontSize));
          setMobileHeadingsFontColor(sourceConfig.headingsFontColor);
          setMobileHeadingsFontWeight(String(sourceConfig.headingsFontWeight));
        }
        break;
      case "border":
        if (targetDevice === "desktop") {
          setDesktopBorderColor(sourceConfig.color);
          setDesktopBorderWidth(String(sourceConfig.width));
          setDesktopBorderRadius(String(sourceConfig.radius));
        } else {
          setMobileBorderColor(sourceConfig.color);
          setMobileBorderWidth(String(sourceConfig.width));
          setMobileBorderRadius(String(sourceConfig.radius));
        }
        break;
      case "padding":
        if (targetDevice === "desktop") {
          setDesktopPaddingTop(String(sourceConfig.paddingTop));
          setDesktopPaddingBottom(String(sourceConfig.paddingBottom));
          setDesktopPaddingLeft(String(sourceConfig.paddingLeft));
          setDesktopPaddingRight(String(sourceConfig.paddingRight));
        } else {
          setMobilePaddingTop(String(sourceConfig.paddingTop));
          setMobilePaddingBottom(String(sourceConfig.paddingBottom));
          setMobilePaddingLeft(String(sourceConfig.paddingLeft));
          setMobilePaddingRight(String(sourceConfig.paddingRight));
        }
        break;
      case "scroll":
        if (targetDevice === "desktop") {
          setDesktopSmoothScroll(sourceConfig.smoothScroll);
          setDesktopScrollOffset(String(sourceConfig.scrollOffset));
        } else {
          setMobileSmoothScroll(sourceConfig.smoothScroll);
          setMobileScrollOffset(String(sourceConfig.scrollOffset));
        }
        break;
      case "showButton":
        if (targetDevice === "desktop") {
          setDesktopShowButton(sourceConfig.showButton);
          setDesktopShowButtonHeight(String(sourceConfig.showButtonHeight));
          setDesktopShowMoreButtonText(sourceConfig.showMoreButtonText);
          setDesktopShowLessButtonText(sourceConfig.showLessButtonText);
          setDesktopShowButtonFontSize(String(sourceConfig.showButtonFontSize));
          setDesktopShowButtonFontColor(sourceConfig.showButtonFontColor);
          setDesktopShowButtonFontWeight(
            String(sourceConfig.showButtonFontWeight),
          );
          setDesktopShowButtonBorderColor(sourceConfig.showButtonBorderColor);
          setDesktopShowButtonBorderWidth(
            String(sourceConfig.showButtonBorderWidth),
          );
          setDesktopShowButtonBorderRadius(
            String(sourceConfig.showButtonBorderRadius),
          );
        } else {
          setMobileShowButton(sourceConfig.showButton);
          setMobileShowButtonHeight(String(sourceConfig.showButtonHeight));
          setMobileShowMoreButtonText(sourceConfig.showMoreButtonText);
          setMobileShowLessButtonText(sourceConfig.showLessButtonText);
          setMobileShowButtonFontSize(String(sourceConfig.showButtonFontSize));
          setMobileShowButtonFontColor(sourceConfig.showButtonFontColor);
          setMobileShowButtonFontWeight(
            String(sourceConfig.showButtonFontWeight),
          );
          setMobileShowButtonBorderColor(sourceConfig.showButtonBorderColor);
          setMobileShowButtonBorderWidth(
            String(sourceConfig.showButtonBorderWidth),
          );
          setMobileShowButtonBorderRadius(
            String(sourceConfig.showButtonBorderRadius),
          );
        }
        break;
    }

    setAppliedSections((current) => ({
      ...current,
      [activeDevice]: {
        ...current[activeDevice],
        [section]: true,
      },
    }));
  };

  const renderDeviceSection = (
    section: DeviceSectionKey,
    heading: string,
    children: ReactNode,
  ) => {
    if (!activeDevice) {
      return null;
    }

    const sectionState = getSectionState(section);

    return (
      <DeviceSettingsSection
        heading={heading}
        activeDevice={activeDevice}
        showApplyAction={sectionState.showApplyAction}
        isApplied={sectionState.isApplied}
        onApply={() => applySectionToOtherDevice(section)}
        onEdit={() => clearAppliedSection(section)}
      >
        {children}
      </DeviceSettingsSection>
    );
  };

  useEffect(() => {
    setSavedConfig(config);
    setAppliedSections(createEmptyDeviceSectionApplyState());
    applyConfigToForm(config, {
      setTitle,
      setHeadingLevels,
      setIndentation,
      setTextAlignment,
      setMarkerFormat,
      setMinHeadings,
      setMobileBreakpoint,
      setExcludedBlogs,
      setCustomCss,
      setDesktopPosition,
      setDesktopPositionSelector,
      setDesktopBorderColor,
      setDesktopBorderWidth,
      setDesktopBorderRadius,
      setDesktopPaddingTop,
      setDesktopPaddingBottom,
      setDesktopPaddingLeft,
      setDesktopPaddingRight,
      setDesktopBackground,
      setDesktopMaxWidth,
      setDesktopSmoothScroll,
      setDesktopScrollOffset,
      setDesktopShowTitle,
      setDesktopHeadingsFontSize,
      setDesktopHeadingsFontColor,
      setDesktopHeadingsFontWeight,
      setDesktopTitleFontSize,
      setDesktopTitleFontColor,
      setDesktopTitleFontWeight,
      setDesktopShowButton,
      setDesktopShowButtonHeight,
      setDesktopShowMoreButtonText,
      setDesktopShowLessButtonText,
      setDesktopShowButtonFontSize,
      setDesktopShowButtonFontColor,
      setDesktopShowButtonFontWeight,
      setDesktopShowButtonBorderColor,
      setDesktopShowButtonBorderWidth,
      setDesktopShowButtonBorderRadius,
      setMobilePosition,
      setMobilePositionSelector,
      setMobileBorderColor,
      setMobileBorderWidth,
      setMobileBorderRadius,
      setMobilePaddingTop,
      setMobilePaddingBottom,
      setMobilePaddingLeft,
      setMobilePaddingRight,
      setMobileBackground,
      setMobileMaxWidth,
      setMobileSmoothScroll,
      setMobileScrollOffset,
      setMobileShowTitle,
      setMobileHeadingsFontSize,
      setMobileHeadingsFontColor,
      setMobileHeadingsFontWeight,
      setMobileTitleFontSize,
      setMobileTitleFontColor,
      setMobileTitleFontWeight,
      setMobileShowButton,
      setMobileShowButtonHeight,
      setMobileShowMoreButtonText,
      setMobileShowLessButtonText,
      setMobileShowButtonFontSize,
      setMobileShowButtonFontColor,
      setMobileShowButtonFontWeight,
      setMobileShowButtonBorderColor,
      setMobileShowButtonBorderWidth,
      setMobileShowButtonBorderRadius,
    });
  }, [config]);

  useEffect(() => {
    setAppliedSections(createEmptyDeviceSectionApplyState());
  }, [activeTab]);

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

  useEffect(() => {
    let cancelled = false;

    const refreshAppEmbedStatus = async (showLoadingState = false) => {
      if (showLoadingState) {
        setAppEmbedStatus("checking");
      }

      try {
        const extensions = await shopify.app.extensions();

        if (cancelled) return;

        const appEmbed = getAppEmbedRecord(
          extensions as unknown as AppBridgeExtensionRecord[],
          APP_EMBED_HANDLE,
        );

        setAppEmbedStatus(appEmbed ?? "unavailable");
      } catch {
        if (!cancelled) {
          setAppEmbedStatus("unavailable");
        }
      }
    };

    const handleWindowFocus = () => {
      void refreshAppEmbedStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAppEmbedStatus();
      }
    };

    void refreshAppEmbedStatus(true);

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [shopify]);

  return (
    <s-page heading="Table of contents settings">
      <style>{tocStyles}</style>
      <style>{FORM_STYLES}</style>
      <style>{PREVIEW_STYLES}</style>
      <style>
        {compilePreviewCustomCss(
          currentConfig.customCss,
          currentConfig.mobileBreakpoint,
        )}
      </style>
      <SaveBar id={SAVE_BAR_ID} open={isDirty}>
        <button form={FORM_ID} type="reset" disabled={isSaving}>
          Discard
        </button>
        <button
          form={FORM_ID}
          type="submit"
          disabled={!isDirty || isSaving}
          {...{ variant: "primary" }}
        >
          Save
        </button>
      </SaveBar>
      <div className="toc-tab-group">
        <div className="toc-top-row">
          <ul className="toc-segmented-control" aria-label="Settings view">
            {EDITOR_TABS.map((tab) => (
              <li key={tab.id} className="toc-segmented-item">
                <button
                  type="button"
                  className="toc-segmented-button"
                  aria-current={activeTab === tab.id ? "true" : "false"}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <s-icon type={tab.icon}></s-icon>
                  <span>{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="toc-embed-actions">
            <s-badge
              tone={getAppEmbedBadgeTone(appEmbedStatus)}
              icon={getAppEmbedBadgeIcon(appEmbedStatus)}
            >
              {formatAppEmbedStatus(appEmbedStatus)}
            </s-badge>
            {deepLink ? (
              <s-button
                href={deepLink}
                target="_blank"
                variant={getAppEmbedButtonVariant(appEmbedStatus)}
                tone={getAppEmbedButtonTone()}
              >
                {getAppEmbedButtonLabel(appEmbedStatus)}
              </s-button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="toc-main-layout">
        <Form
          id={FORM_ID}
          method="post"
          onReset={(event) => {
            event.preventDefault();
            applyConfigToForm(savedConfig, {
              setTitle,
              setHeadingLevels,
              setIndentation,
              setTextAlignment,
              setMarkerFormat,
              setMinHeadings,
              setMobileBreakpoint,
              setExcludedBlogs,
              setCustomCss,
              setDesktopPosition,
              setDesktopPositionSelector,
              setDesktopBorderColor,
              setDesktopBorderWidth,
              setDesktopBorderRadius,
              setDesktopPaddingTop,
              setDesktopPaddingBottom,
              setDesktopPaddingLeft,
              setDesktopPaddingRight,
              setDesktopBackground,
              setDesktopMaxWidth,
              setDesktopSmoothScroll,
              setDesktopScrollOffset,
              setDesktopShowTitle,
              setDesktopHeadingsFontSize,
              setDesktopHeadingsFontColor,
              setDesktopHeadingsFontWeight,
              setDesktopTitleFontSize,
              setDesktopTitleFontColor,
              setDesktopTitleFontWeight,
              setDesktopShowButton,
              setDesktopShowButtonHeight,
              setDesktopShowMoreButtonText,
              setDesktopShowLessButtonText,
              setDesktopShowButtonFontSize,
              setDesktopShowButtonFontColor,
              setDesktopShowButtonFontWeight,
              setDesktopShowButtonBorderColor,
              setDesktopShowButtonBorderWidth,
              setDesktopShowButtonBorderRadius,
              setMobilePosition,
              setMobilePositionSelector,
              setMobileBorderColor,
              setMobileBorderWidth,
              setMobileBorderRadius,
              setMobilePaddingTop,
              setMobilePaddingBottom,
              setMobilePaddingLeft,
              setMobilePaddingRight,
              setMobileBackground,
              setMobileMaxWidth,
              setMobileSmoothScroll,
              setMobileScrollOffset,
              setMobileShowTitle,
              setMobileHeadingsFontSize,
              setMobileHeadingsFontColor,
              setMobileHeadingsFontWeight,
              setMobileTitleFontSize,
              setMobileTitleFontColor,
              setMobileTitleFontWeight,
              setMobileShowButton,
              setMobileShowButtonHeight,
              setMobileShowMoreButtonText,
              setMobileShowLessButtonText,
              setMobileShowButtonFontSize,
              setMobileShowButtonFontColor,
              setMobileShowButtonFontWeight,
              setMobileShowButtonBorderColor,
              setMobileShowButtonBorderWidth,
              setMobileShowButtonBorderRadius,
            });
            setAppliedSections(createEmptyDeviceSectionApplyState());
          }}
        >
          <s-stack direction="block" gap="base">
            {activeTab !== "general" ? (
              <HiddenGeneralFields config={currentConfig} />
            ) : null}
            {activeTab !== "desktop" ? (
              <HiddenDeviceFields
                prefix="desktop"
                config={currentConfig.desktop}
              />
            ) : null}
            {activeTab !== "mobile" ? (
              <HiddenDeviceFields
                prefix="mobile"
                config={currentConfig.mobile}
              />
            ) : null}
            {activeTab === "general" ? (
              <>
                <s-section heading="General">
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
                      <div
                        className="toc-inline-choices"
                        role="group"
                        aria-label="Heading levels"
                      >
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
                                  : current.filter(
                                      (currentLevel) => currentLevel !== level,
                                    );

                                return next.length ? next : current;
                              });
                            }}
                          ></s-checkbox>
                        ))}
                      </div>
                      <div className="toc-field-details">
                        Choose which article headings should appear in the table
                        of contents.
                      </div>
                    </div>
                    <s-text-field
                      name="minHeadings"
                      label="Minimum headings to show"
                      details="Hide the table of contents until this many selected headings are found"
                      value={minHeadings}
                      onInput={(event) =>
                        setMinHeadings(event.currentTarget.value)
                      }
                      onChange={(event) =>
                        setMinHeadings(event.currentTarget.value)
                      }
                    ></s-text-field>
                    <s-number-field
                      name="mobileBreakpoint"
                      label="Mobile breakpoint"
                      details="Use mobile styles at this width and below"
                      min={0}
                      step={1}
                      suffix="px"
                      value={mobileBreakpoint}
                      onInput={(event) =>
                        setMobileBreakpoint(event.currentTarget.value)
                      }
                      onChange={(event) =>
                        setMobileBreakpoint(event.currentTarget.value)
                      }
                    ></s-number-field>
                    <s-text-field
                      name="excludedBlogs"
                      label="Blog posts to exclude"
                      details="Comma-separated article handles or IDs where the table of contents should stay hidden"
                      placeholder="news/today-is-the-best-day, 671373295959"
                      value={excludedBlogs}
                      onInput={(event) =>
                        setExcludedBlogs(event.currentTarget.value)
                      }
                      onChange={(event) =>
                        setExcludedBlogs(event.currentTarget.value)
                      }
                    ></s-text-field>
                  </s-stack>
                </s-section>
                <s-section heading="Text Formatting">
                  <s-stack direction="block" gap="base">
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
                  </s-stack>
                </s-section>
                <s-section heading="Advanced settings">
                  <div className="toc-field">
                    <div className="toc-code-field">
                      <span className="toc-code-field__label">Custom CSS</span>
                      <span className="toc-field-details">
                        Same classes work for desktop and mobile. Use
                        {" "}
                        {CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN}
                        {" "}
                        for mobile-only rules.
                      </span>
                      <input
                        name="customCss"
                        type="hidden"
                        value={customCss}
                      />
                      <div className="toc-code-editor">
                        <CodeMirror
                          value={customCss}
                          height="320px"
                          aria-label="Custom CSS"
                          extensions={CUSTOM_CSS_EDITOR_EXTENSIONS}
                          basicSetup={{
                            foldGutter: false,
                            highlightActiveLine: true,
                            lineNumbers: true,
                          }}
                          onChange={(value) => setCustomCss(value)}
                        />
                      </div>
                    </div>
                  </div>
                </s-section>
              </>
            ) : (
              <>
                {renderDeviceSection("general", "General", (
                  <s-stack direction="block" gap="base">
                    <s-select
                      name={
                        activeTab === "desktop"
                          ? "desktopPosition"
                          : "mobilePosition"
                      }
                      label="Position"
                      value={
                        activeTab === "desktop"
                          ? desktopPosition
                          : mobilePosition
                      }
                      onChange={(event) => {
                        const value = event.currentTarget.value;

                        if (activeTab === "desktop") {
                          setDesktopPosition(normalizeDesktopPosition(value));
                        } else {
                          setMobilePosition(normalizeMobilePosition(value));
                        }
                      }}
                    >
                      {(activeTab === "desktop"
                        ? DESKTOP_POSITION_OPTIONS
                        : MOBILE_POSITION_OPTIONS
                      ).map((option) => (
                        <s-option key={option.value} value={option.value}>
                          {option.label}
                        </s-option>
                      ))}
                    </s-select>
                    {(
                      activeTab === "desktop"
                        ? desktopPosition === "css-selector"
                        : mobilePosition === "css-selector"
                    ) ? (
                      <s-text-field
                        name={
                          activeTab === "desktop"
                            ? "desktopPositionSelector"
                            : "mobilePositionSelector"
                        }
                        label="CSS selector"
                        details={
                          activeTab === "desktop"
                            ? "Appends the TOC inside the first matching element. Falls back to float right when no match is found."
                            : "Appends the TOC inside the first matching element. Falls back to before first heading when no match is found."
                        }
                        value={
                          activeTab === "desktop"
                            ? desktopPositionSelector
                            : mobilePositionSelector
                        }
                        onInput={(event) => {
                          const value = event.currentTarget.value;

                          if (activeTab === "desktop") {
                            setDesktopPositionSelector(value);
                          } else {
                            setMobilePositionSelector(value);
                          }
                        }}
                        onChange={(event) => {
                          const value = event.currentTarget.value;

                          if (activeTab === "desktop") {
                            setDesktopPositionSelector(value);
                          } else {
                            setMobilePositionSelector(value);
                          }
                        }}
                      ></s-text-field>
                    ) : null}
                    <s-color-field
                      name={
                        activeTab === "desktop"
                          ? "desktopBackground"
                          : "mobileBackground"
                      }
                      label="Background"
                      alpha
                      value={
                        activeTab === "desktop"
                          ? desktopBackground
                          : mobileBackground
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBackground(value);
                        } else {
                          setMobileBackground(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBackground(value);
                        } else {
                          setMobileBackground(value);
                        }
                      }}
                    ></s-color-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopMaxWidth"
                          : "mobileMaxWidth"
                      }
                      label="Max width"
                      details="Set to 0 for no max width"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopMaxWidth
                          : mobileMaxWidth
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopMaxWidth(value);
                        } else {
                          setMobileMaxWidth(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopMaxWidth(value);
                        } else {
                          setMobileMaxWidth(value);
                        }
                      }}
                    ></s-number-field>
                  </s-stack>
                ))}
                {renderDeviceSection("title", "Title", (
                  <s-stack direction="block" gap="base">
                    <s-checkbox
                      name={
                        activeTab === "desktop"
                          ? "desktopShowTitle"
                          : "mobileShowTitle"
                      }
                      label="Show title"
                      checked={
                        activeTab === "desktop"
                          ? desktopShowTitle
                          : mobileShowTitle
                      }
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        if (activeTab === "desktop") {
                          setDesktopShowTitle(checked);
                        } else {
                          setMobileShowTitle(checked);
                        }
                      }}
                    ></s-checkbox>
                    <div className="toc-compact-fields">
                      <s-color-field
                        name={
                          activeTab === "desktop"
                            ? "desktopTitleFontColor"
                            : "mobileTitleFontColor"
                        }
                        label="Color"
                        alpha
                        disabled={!isTitleEnabled}
                        value={
                          activeTab === "desktop"
                            ? desktopTitleFontColor
                            : mobileTitleFontColor
                        }
                        onInput={(event) => {
                          const value = event.currentTarget.value;
                          if (activeTab === "desktop") {
                            setDesktopTitleFontColor(value);
                          } else {
                            setMobileTitleFontColor(value);
                          }
                        }}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          if (activeTab === "desktop") {
                            setDesktopTitleFontColor(value);
                          } else {
                            setMobileTitleFontColor(value);
                          }
                        }}
                      ></s-color-field>
                      <s-number-field
                        name={
                          activeTab === "desktop"
                            ? "desktopTitleFontSize"
                            : "mobileTitleFontSize"
                        }
                        label="Font size"
                        min={0}
                        step={1}
                        suffix="px"
                        disabled={!isTitleEnabled}
                        value={
                          activeTab === "desktop"
                            ? desktopTitleFontSize
                            : mobileTitleFontSize
                        }
                        onInput={(event) => {
                          const value = event.currentTarget.value;
                          if (activeTab === "desktop") {
                            setDesktopTitleFontSize(value);
                          } else {
                            setMobileTitleFontSize(value);
                          }
                        }}
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          if (activeTab === "desktop") {
                            setDesktopTitleFontSize(value);
                          } else {
                            setMobileTitleFontSize(value);
                          }
                        }}
                      ></s-number-field>
                      <s-select
                        name={
                          activeTab === "desktop"
                            ? "desktopTitleFontWeight"
                            : "mobileTitleFontWeight"
                        }
                        label="Font weight"
                        disabled={!isTitleEnabled}
                        value={
                          activeTab === "desktop"
                            ? desktopTitleFontWeight
                            : mobileTitleFontWeight
                        }
                        onChange={(event) => {
                          const value = event.currentTarget.value;
                          if (activeTab === "desktop") {
                            setDesktopTitleFontWeight(value);
                          } else {
                            setMobileTitleFontWeight(value);
                          }
                        }}
                      >
                        {FONT_WEIGHT_OPTIONS.map((option) => (
                          <s-option key={option.value} value={option.value}>
                            {option.label}
                          </s-option>
                        ))}
                      </s-select>
                    </div>
                  </s-stack>
                ))}
                {renderDeviceSection("headings", "Headings", (
                  <div className="toc-compact-fields">
                    <s-color-field
                      name={
                        activeTab === "desktop"
                          ? "desktopHeadingsFontColor"
                          : "mobileHeadingsFontColor"
                      }
                      label="Color"
                      alpha
                      value={
                        activeTab === "desktop"
                          ? desktopHeadingsFontColor
                          : mobileHeadingsFontColor
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopHeadingsFontColor(value);
                        } else {
                          setMobileHeadingsFontColor(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopHeadingsFontColor(value);
                        } else {
                          setMobileHeadingsFontColor(value);
                        }
                      }}
                    ></s-color-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopHeadingsFontSize"
                          : "mobileHeadingsFontSize"
                      }
                      label="Font size"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopHeadingsFontSize
                          : mobileHeadingsFontSize
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopHeadingsFontSize(value);
                        } else {
                          setMobileHeadingsFontSize(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopHeadingsFontSize(value);
                        } else {
                          setMobileHeadingsFontSize(value);
                        }
                      }}
                    ></s-number-field>
                    <s-select
                      name={
                        activeTab === "desktop"
                          ? "desktopHeadingsFontWeight"
                          : "mobileHeadingsFontWeight"
                      }
                      label="Font weight"
                      value={
                        activeTab === "desktop"
                          ? desktopHeadingsFontWeight
                          : mobileHeadingsFontWeight
                      }
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopHeadingsFontWeight(value);
                        } else {
                          setMobileHeadingsFontWeight(value);
                        }
                      }}
                    >
                      {FONT_WEIGHT_OPTIONS.map((option) => (
                        <s-option key={option.value} value={option.value}>
                          {option.label}
                        </s-option>
                      ))}
                    </s-select>
                  </div>
                ))}
                {renderDeviceSection("border", "Border", (
                  <div className="toc-compact-fields">
                    <s-color-field
                      name={
                        activeTab === "desktop"
                          ? "desktopBorderColor"
                          : "mobileBorderColor"
                      }
                      label="Color"
                      alpha
                      value={
                        activeTab === "desktop"
                          ? desktopBorderColor
                          : mobileBorderColor
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderColor(value);
                        } else {
                          setMobileBorderColor(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderColor(value);
                        } else {
                          setMobileBorderColor(value);
                        }
                      }}
                    ></s-color-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopBorderWidth"
                          : "mobileBorderWidth"
                      }
                      label="Width"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopBorderWidth
                          : mobileBorderWidth
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderWidth(value);
                        } else {
                          setMobileBorderWidth(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderWidth(value);
                        } else {
                          setMobileBorderWidth(value);
                        }
                      }}
                    ></s-number-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopBorderRadius"
                          : "mobileBorderRadius"
                      }
                      label="Radius"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopBorderRadius
                          : mobileBorderRadius
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderRadius(value);
                        } else {
                          setMobileBorderRadius(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopBorderRadius(value);
                        } else {
                          setMobileBorderRadius(value);
                        }
                      }}
                    ></s-number-field>
                  </div>
                ))}
                {renderDeviceSection("padding", "Padding", (
                  <div className="toc-compact-fields-four">
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopPaddingTop"
                          : "mobilePaddingTop"
                      }
                      label="Top"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopPaddingTop
                          : mobilePaddingTop
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingTop(value);
                        } else {
                          setMobilePaddingTop(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingTop(value);
                        } else {
                          setMobilePaddingTop(value);
                        }
                      }}
                    ></s-number-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopPaddingBottom"
                          : "mobilePaddingBottom"
                      }
                      label="Bottom"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopPaddingBottom
                          : mobilePaddingBottom
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingBottom(value);
                        } else {
                          setMobilePaddingBottom(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingBottom(value);
                        } else {
                          setMobilePaddingBottom(value);
                        }
                      }}
                    ></s-number-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopPaddingLeft"
                          : "mobilePaddingLeft"
                      }
                      label="Left"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopPaddingLeft
                          : mobilePaddingLeft
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingLeft(value);
                        } else {
                          setMobilePaddingLeft(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingLeft(value);
                        } else {
                          setMobilePaddingLeft(value);
                        }
                      }}
                    ></s-number-field>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopPaddingRight"
                          : "mobilePaddingRight"
                      }
                      label="Right"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopPaddingRight
                          : mobilePaddingRight
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingRight(value);
                        } else {
                          setMobilePaddingRight(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopPaddingRight(value);
                        } else {
                          setMobilePaddingRight(value);
                        }
                      }}
                    ></s-number-field>
                  </div>
                ))}
                {renderDeviceSection("scroll", "Scroll", (
                  <s-stack direction="block" gap="base">
                    <s-checkbox
                      name={
                        activeTab === "desktop"
                          ? "desktopSmoothScroll"
                          : "mobileSmoothScroll"
                      }
                      label="Smooth scroll"
                      details="Scroll smoothly to a heading when a TOC link is clicked"
                      checked={
                        activeTab === "desktop"
                          ? desktopSmoothScroll
                          : mobileSmoothScroll
                      }
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        if (activeTab === "desktop") {
                          setDesktopSmoothScroll(checked);
                        } else {
                          setMobileSmoothScroll(checked);
                        }
                      }}
                    ></s-checkbox>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopScrollOffset"
                          : "mobileScrollOffset"
                      }
                      label="Offset"
                      details="Top offset in pixels"
                      min={0}
                      step={1}
                      suffix="px"
                      value={
                        activeTab === "desktop"
                          ? desktopScrollOffset
                          : mobileScrollOffset
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopScrollOffset(value);
                        } else {
                          setMobileScrollOffset(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopScrollOffset(value);
                        } else {
                          setMobileScrollOffset(value);
                        }
                      }}
                    ></s-number-field>
                  </s-stack>
                ))}
                {renderDeviceSection("showButton", "Show more button", (
                  <s-stack direction="block" gap="base">
                    <s-checkbox
                      name={
                        activeTab === "desktop"
                          ? "desktopShowButton"
                          : "mobileShowButton"
                      }
                      label="Enable show more"
                      checked={
                        activeTab === "desktop"
                          ? desktopShowButton
                          : mobileShowButton
                      }
                      onChange={(event) => {
                        const checked = event.currentTarget.checked;
                        if (activeTab === "desktop") {
                          setDesktopShowButton(checked);
                        } else {
                          setMobileShowButton(checked);
                        }
                      }}
                    ></s-checkbox>
                    <s-number-field
                      name={
                        activeTab === "desktop"
                          ? "desktopShowButtonHeight"
                          : "mobileShowButtonHeight"
                      }
                      label="Collapsed height"
                      details="Collapsed content height before the button is shown"
                      min={0}
                      step={1}
                      suffix="px"
                      disabled={!isShowMoreEnabled}
                      value={
                        activeTab === "desktop"
                          ? desktopShowButtonHeight
                          : mobileShowButtonHeight
                      }
                      onInput={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopShowButtonHeight(value);
                        } else {
                          setMobileShowButtonHeight(value);
                        }
                      }}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        if (activeTab === "desktop") {
                          setDesktopShowButtonHeight(value);
                        } else {
                          setMobileShowButtonHeight(value);
                        }
                      }}
                    ></s-number-field>
                    <div className="toc-subsection">
                      <p className="toc-subsection-title">Text</p>
                      <div className="toc-compact-fields-two">
                        <s-text-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowMoreButtonText"
                              : "mobileShowMoreButtonText"
                          }
                          label="Show more"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowMoreButtonText
                              : mobileShowMoreButtonText
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowMoreButtonText(value);
                            } else {
                              setMobileShowMoreButtonText(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowMoreButtonText(value);
                            } else {
                              setMobileShowMoreButtonText(value);
                            }
                          }}
                        ></s-text-field>
                        <s-text-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowLessButtonText"
                              : "mobileShowLessButtonText"
                          }
                          label="Show less"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowLessButtonText
                              : mobileShowLessButtonText
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowLessButtonText(value);
                            } else {
                              setMobileShowLessButtonText(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowLessButtonText(value);
                            } else {
                              setMobileShowLessButtonText(value);
                            }
                          }}
                        ></s-text-field>
                      </div>
                    </div>
                    <div className="toc-subsection">
                      <p className="toc-subsection-title">Font</p>
                      <div className="toc-compact-fields">
                        <s-color-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonFontColor"
                              : "mobileShowButtonFontColor"
                          }
                          label="Color"
                          alpha
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonFontColor
                              : mobileShowButtonFontColor
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonFontColor(value);
                            } else {
                              setMobileShowButtonFontColor(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonFontColor(value);
                            } else {
                              setMobileShowButtonFontColor(value);
                            }
                          }}
                        ></s-color-field>
                        <s-number-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonFontSize"
                              : "mobileShowButtonFontSize"
                          }
                          label="Size"
                          min={0}
                          step={1}
                          suffix="px"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonFontSize
                              : mobileShowButtonFontSize
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonFontSize(value);
                            } else {
                              setMobileShowButtonFontSize(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonFontSize(value);
                            } else {
                              setMobileShowButtonFontSize(value);
                            }
                          }}
                        ></s-number-field>
                        <s-select
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonFontWeight"
                              : "mobileShowButtonFontWeight"
                          }
                          label="Weight"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonFontWeight
                              : mobileShowButtonFontWeight
                          }
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonFontWeight(value);
                            } else {
                              setMobileShowButtonFontWeight(value);
                            }
                          }}
                        >
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <s-option key={option.value} value={option.value}>
                              {option.label}
                            </s-option>
                          ))}
                        </s-select>
                      </div>
                    </div>
                    <div className="toc-subsection">
                      <p className="toc-subsection-title">Border</p>
                      <div className="toc-compact-fields">
                        <s-color-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonBorderColor"
                              : "mobileShowButtonBorderColor"
                          }
                          label="Color"
                          alpha
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonBorderColor
                              : mobileShowButtonBorderColor
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderColor(value);
                            } else {
                              setMobileShowButtonBorderColor(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderColor(value);
                            } else {
                              setMobileShowButtonBorderColor(value);
                            }
                          }}
                        ></s-color-field>
                        <s-number-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonBorderWidth"
                              : "mobileShowButtonBorderWidth"
                          }
                          label="Width"
                          min={0}
                          step={1}
                          suffix="px"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonBorderWidth
                              : mobileShowButtonBorderWidth
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderWidth(value);
                            } else {
                              setMobileShowButtonBorderWidth(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderWidth(value);
                            } else {
                              setMobileShowButtonBorderWidth(value);
                            }
                          }}
                        ></s-number-field>
                        <s-number-field
                          name={
                            activeTab === "desktop"
                              ? "desktopShowButtonBorderRadius"
                              : "mobileShowButtonBorderRadius"
                          }
                          label="Radius"
                          min={0}
                          step={1}
                          suffix="px"
                          disabled={!isShowMoreEnabled}
                          value={
                            activeTab === "desktop"
                              ? desktopShowButtonBorderRadius
                              : mobileShowButtonBorderRadius
                          }
                          onInput={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderRadius(value);
                            } else {
                              setMobileShowButtonBorderRadius(value);
                            }
                          }}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            if (activeTab === "desktop") {
                              setDesktopShowButtonBorderRadius(value);
                            } else {
                              setMobileShowButtonBorderRadius(value);
                            }
                          }}
                        ></s-number-field>
                      </div>
                    </div>
                  </s-stack>
                ))}
              </>
            )}
            {actionData?.userErrors?.length ? (
              <s-paragraph>
                {actionData.userErrors
                  .map((error: { message: string }) => error.message)
                  .join(" ")}
              </s-paragraph>
            ) : null}
          </s-stack>
        </Form>
        <div
          className={`toc-preview-column${activeTab === "general" ? "" : " toc-preview-column--sticky"}`}
        >
          <s-section heading="Preview">
            <div className="toc-settings-preview">
              {(activeTab === "general" || activeTab === "desktop") && (
                <div className="toc-preview-pane">
                  {activeTab === "general" ? (
                    <p className="toc-preview-label">Desktop</p>
                  ) : null}
                  <div className="toc-preview-stage toc-preview-desktop">
                    <TocPreview
                      preview={desktopPreview}
                      indentation={currentConfig.indentation}
                      textAlignment={currentConfig.textAlignment}
                      markerFormat={currentConfig.markerFormat}
                      device={currentConfig.desktop}
                      previewDevice="desktop"
                    />
                  </div>
                </div>
              )}
              {(activeTab === "general" || activeTab === "mobile") && (
                <div className="toc-preview-pane">
                  {activeTab === "general" ? (
                    <p className="toc-preview-label">Mobile</p>
                  ) : null}
                  <div className="toc-preview-stage toc-preview-mobile">
                    <TocPreview
                      preview={mobilePreview}
                      indentation={currentConfig.indentation}
                      textAlignment={currentConfig.textAlignment}
                      markerFormat={currentConfig.markerFormat}
                      device={currentConfig.mobile}
                      previewDevice="mobile"
                    />
                  </div>
                </div>
              )}
            </div>
          </s-section>
        </div>
      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

function parseConfig(value: unknown): TocConfig {
  if (typeof value !== "string" || !value.trim()) {
    return { ...DEFAULT_CONFIG } as TocConfig;
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") {
      return { ...DEFAULT_CONFIG } as TocConfig;
    }
    const {
      desktopMode,
      smoothScroll: legacySmoothScroll,
      wrapperSelector,
      topOffset: legacyTopOffset,
      ...rest
    } = parsed as Record<string, unknown>;
    void desktopMode;
    void wrapperSelector;

    const defaultDesktop = {
      ...DEFAULT_CONFIG.desktop,
      smoothScroll:
        typeof legacySmoothScroll === "boolean"
          ? legacySmoothScroll
          : DEFAULT_CONFIG.desktop.smoothScroll,
      scrollOffset:
        typeof legacyTopOffset === "number" && Number.isFinite(legacyTopOffset)
          ? Math.max(0, legacyTopOffset)
          : DEFAULT_CONFIG.desktop.scrollOffset,
    };
    const defaultMobile = {
      ...DEFAULT_CONFIG.mobile,
      smoothScroll:
        typeof legacySmoothScroll === "boolean"
          ? legacySmoothScroll
          : DEFAULT_CONFIG.mobile.smoothScroll,
      scrollOffset:
        typeof legacyTopOffset === "number" && Number.isFinite(legacyTopOffset)
          ? Math.max(0, legacyTopOffset)
          : DEFAULT_CONFIG.mobile.scrollOffset,
    };

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
      mobileBreakpoint:
        typeof rest.mobileBreakpoint === "number" &&
        Number.isFinite(rest.mobileBreakpoint)
          ? Math.max(0, rest.mobileBreakpoint)
          : DEFAULT_CONFIG.mobileBreakpoint,
      excludedBlogs:
        typeof rest.excludedBlogs === "string"
          ? normalizeExcludedBlogsInput(rest.excludedBlogs)
          : DEFAULT_CONFIG.excludedBlogs,
      customCss:
        typeof rest.customCss === "string"
          ? normalizeCustomCssInput(rest.customCss)
          : DEFAULT_CONFIG.customCss,
      desktop: normalizeDeviceConfig(rest.desktop, defaultDesktop, "desktop"),
      mobile: normalizeDeviceConfig(rest.mobile, defaultMobile, "mobile"),
    } as TocConfig;
  } catch {
    return { ...DEFAULT_CONFIG } as TocConfig;
  }
}

function applyConfigToForm(
  config: TocConfig,
  controls: {
    setTitle: (value: string) => void;
    setHeadingLevels: (value: number[]) => void;
    setIndentation: (value: boolean) => void;
    setTextAlignment: (value: TocTextAlignment) => void;
    setMarkerFormat: (value: TocMarkerFormat) => void;
    setMinHeadings: (value: string) => void;
    setMobileBreakpoint: (value: string) => void;
    setExcludedBlogs: (value: string) => void;
    setCustomCss: (value: string) => void;
    setDesktopPosition: (value: TocDesktopPosition) => void;
    setDesktopPositionSelector: (value: string) => void;
    setDesktopBorderColor: (value: string) => void;
    setDesktopBorderWidth: (value: string) => void;
    setDesktopBorderRadius: (value: string) => void;
    setDesktopPaddingTop: (value: string) => void;
    setDesktopPaddingBottom: (value: string) => void;
    setDesktopPaddingLeft: (value: string) => void;
    setDesktopPaddingRight: (value: string) => void;
    setDesktopBackground: (value: string) => void;
    setDesktopMaxWidth: (value: string) => void;
    setDesktopSmoothScroll: (value: boolean) => void;
    setDesktopScrollOffset: (value: string) => void;
    setDesktopShowTitle: (value: boolean) => void;
    setDesktopHeadingsFontSize: (value: string) => void;
    setDesktopHeadingsFontColor: (value: string) => void;
    setDesktopHeadingsFontWeight: (value: string) => void;
    setDesktopTitleFontSize: (value: string) => void;
    setDesktopTitleFontColor: (value: string) => void;
    setDesktopTitleFontWeight: (value: string) => void;
    setDesktopShowButton: (value: boolean) => void;
    setDesktopShowButtonHeight: (value: string) => void;
    setDesktopShowMoreButtonText: (value: string) => void;
    setDesktopShowLessButtonText: (value: string) => void;
    setDesktopShowButtonFontSize: (value: string) => void;
    setDesktopShowButtonFontColor: (value: string) => void;
    setDesktopShowButtonFontWeight: (value: string) => void;
    setDesktopShowButtonBorderColor: (value: string) => void;
    setDesktopShowButtonBorderWidth: (value: string) => void;
    setDesktopShowButtonBorderRadius: (value: string) => void;
    setMobilePosition: (value: TocMobilePosition) => void;
    setMobilePositionSelector: (value: string) => void;
    setMobileBorderColor: (value: string) => void;
    setMobileBorderWidth: (value: string) => void;
    setMobileBorderRadius: (value: string) => void;
    setMobilePaddingTop: (value: string) => void;
    setMobilePaddingBottom: (value: string) => void;
    setMobilePaddingLeft: (value: string) => void;
    setMobilePaddingRight: (value: string) => void;
    setMobileBackground: (value: string) => void;
    setMobileMaxWidth: (value: string) => void;
    setMobileSmoothScroll: (value: boolean) => void;
    setMobileScrollOffset: (value: string) => void;
    setMobileShowTitle: (value: boolean) => void;
    setMobileHeadingsFontSize: (value: string) => void;
    setMobileHeadingsFontColor: (value: string) => void;
    setMobileHeadingsFontWeight: (value: string) => void;
    setMobileTitleFontSize: (value: string) => void;
    setMobileTitleFontColor: (value: string) => void;
    setMobileTitleFontWeight: (value: string) => void;
    setMobileShowButton: (value: boolean) => void;
    setMobileShowButtonHeight: (value: string) => void;
    setMobileShowMoreButtonText: (value: string) => void;
    setMobileShowLessButtonText: (value: string) => void;
    setMobileShowButtonFontSize: (value: string) => void;
    setMobileShowButtonFontColor: (value: string) => void;
    setMobileShowButtonFontWeight: (value: string) => void;
    setMobileShowButtonBorderColor: (value: string) => void;
    setMobileShowButtonBorderWidth: (value: string) => void;
    setMobileShowButtonBorderRadius: (value: string) => void;
  },
) {
  controls.setTitle(config.title);
  controls.setHeadingLevels(normalizeHeadingLevels(config.headingLevels));
  controls.setIndentation(config.indentation);
  controls.setTextAlignment(config.textAlignment);
  controls.setMarkerFormat(config.markerFormat);
  controls.setMinHeadings(String(config.minHeadings));
  controls.setMobileBreakpoint(String(config.mobileBreakpoint));
  controls.setExcludedBlogs(config.excludedBlogs);
  controls.setCustomCss(config.customCss);
  controls.setDesktopPosition(
    normalizeDesktopPosition(config.desktop.position),
  );
  controls.setDesktopPositionSelector(config.desktop.positionSelector);
  controls.setDesktopBorderColor(config.desktop.color);
  controls.setDesktopBorderWidth(String(config.desktop.width));
  controls.setDesktopBorderRadius(String(config.desktop.radius));
  controls.setDesktopPaddingTop(String(config.desktop.paddingTop));
  controls.setDesktopPaddingBottom(String(config.desktop.paddingBottom));
  controls.setDesktopPaddingLeft(String(config.desktop.paddingLeft));
  controls.setDesktopPaddingRight(String(config.desktop.paddingRight));
  controls.setDesktopBackground(config.desktop.background);
  controls.setDesktopMaxWidth(String(config.desktop.maxWidth));
  controls.setDesktopSmoothScroll(config.desktop.smoothScroll);
  controls.setDesktopScrollOffset(String(config.desktop.scrollOffset));
  controls.setDesktopShowTitle(config.desktop.showTitle);
  controls.setDesktopHeadingsFontSize(String(config.desktop.headingsFontSize));
  controls.setDesktopHeadingsFontColor(config.desktop.headingsFontColor);
  controls.setDesktopHeadingsFontWeight(
    String(config.desktop.headingsFontWeight),
  );
  controls.setDesktopTitleFontSize(String(config.desktop.titleFontSize));
  controls.setDesktopTitleFontColor(config.desktop.titleFontColor);
  controls.setDesktopTitleFontWeight(String(config.desktop.titleFontWeight));
  controls.setDesktopShowButton(config.desktop.showButton);
  controls.setDesktopShowButtonHeight(String(config.desktop.showButtonHeight));
  controls.setDesktopShowMoreButtonText(config.desktop.showMoreButtonText);
  controls.setDesktopShowLessButtonText(config.desktop.showLessButtonText);
  controls.setDesktopShowButtonFontSize(
    String(config.desktop.showButtonFontSize),
  );
  controls.setDesktopShowButtonFontColor(config.desktop.showButtonFontColor);
  controls.setDesktopShowButtonFontWeight(
    String(config.desktop.showButtonFontWeight),
  );
  controls.setDesktopShowButtonBorderColor(
    config.desktop.showButtonBorderColor,
  );
  controls.setDesktopShowButtonBorderWidth(
    String(config.desktop.showButtonBorderWidth),
  );
  controls.setDesktopShowButtonBorderRadius(
    String(config.desktop.showButtonBorderRadius),
  );
  controls.setMobilePosition(normalizeMobilePosition(config.mobile.position));
  controls.setMobilePositionSelector(config.mobile.positionSelector);
  controls.setMobileBorderColor(config.mobile.color);
  controls.setMobileBorderWidth(String(config.mobile.width));
  controls.setMobileBorderRadius(String(config.mobile.radius));
  controls.setMobilePaddingTop(String(config.mobile.paddingTop));
  controls.setMobilePaddingBottom(String(config.mobile.paddingBottom));
  controls.setMobilePaddingLeft(String(config.mobile.paddingLeft));
  controls.setMobilePaddingRight(String(config.mobile.paddingRight));
  controls.setMobileBackground(config.mobile.background);
  controls.setMobileMaxWidth(String(config.mobile.maxWidth));
  controls.setMobileSmoothScroll(config.mobile.smoothScroll);
  controls.setMobileScrollOffset(String(config.mobile.scrollOffset));
  controls.setMobileShowTitle(config.mobile.showTitle);
  controls.setMobileHeadingsFontSize(String(config.mobile.headingsFontSize));
  controls.setMobileHeadingsFontColor(config.mobile.headingsFontColor);
  controls.setMobileHeadingsFontWeight(
    String(config.mobile.headingsFontWeight),
  );
  controls.setMobileTitleFontSize(String(config.mobile.titleFontSize));
  controls.setMobileTitleFontColor(config.mobile.titleFontColor);
  controls.setMobileTitleFontWeight(String(config.mobile.titleFontWeight));
  controls.setMobileShowButton(config.mobile.showButton);
  controls.setMobileShowButtonHeight(String(config.mobile.showButtonHeight));
  controls.setMobileShowMoreButtonText(config.mobile.showMoreButtonText);
  controls.setMobileShowLessButtonText(config.mobile.showLessButtonText);
  controls.setMobileShowButtonFontSize(
    String(config.mobile.showButtonFontSize),
  );
  controls.setMobileShowButtonFontColor(config.mobile.showButtonFontColor);
  controls.setMobileShowButtonFontWeight(
    String(config.mobile.showButtonFontWeight),
  );
  controls.setMobileShowButtonBorderColor(config.mobile.showButtonBorderColor);
  controls.setMobileShowButtonBorderWidth(
    String(config.mobile.showButtonBorderWidth),
  );
  controls.setMobileShowButtonBorderRadius(
    String(config.mobile.showButtonBorderRadius),
  );
}

function configsEqual(left: TocConfig, right: TocConfig) {
  return (
    left.title === right.title &&
    left.indentation === right.indentation &&
    left.textAlignment === right.textAlignment &&
    left.markerFormat === right.markerFormat &&
    left.minHeadings === right.minHeadings &&
    left.mobileBreakpoint === right.mobileBreakpoint &&
    left.excludedBlogs === right.excludedBlogs &&
    left.customCss === right.customCss &&
    left.desktop.position === right.desktop.position &&
    left.desktop.positionSelector === right.desktop.positionSelector &&
    left.desktop.color === right.desktop.color &&
    left.desktop.width === right.desktop.width &&
    left.desktop.radius === right.desktop.radius &&
    left.desktop.paddingTop === right.desktop.paddingTop &&
    left.desktop.paddingBottom === right.desktop.paddingBottom &&
    left.desktop.paddingLeft === right.desktop.paddingLeft &&
    left.desktop.paddingRight === right.desktop.paddingRight &&
    left.desktop.background === right.desktop.background &&
    left.desktop.maxWidth === right.desktop.maxWidth &&
    left.desktop.smoothScroll === right.desktop.smoothScroll &&
    left.desktop.scrollOffset === right.desktop.scrollOffset &&
    left.desktop.showTitle === right.desktop.showTitle &&
    left.desktop.headingsFontSize === right.desktop.headingsFontSize &&
    left.desktop.headingsFontColor === right.desktop.headingsFontColor &&
    left.desktop.headingsFontWeight === right.desktop.headingsFontWeight &&
    left.desktop.titleFontSize === right.desktop.titleFontSize &&
    left.desktop.titleFontColor === right.desktop.titleFontColor &&
    left.desktop.titleFontWeight === right.desktop.titleFontWeight &&
    left.desktop.showButton === right.desktop.showButton &&
    left.desktop.showButtonHeight === right.desktop.showButtonHeight &&
    left.desktop.showMoreButtonText === right.desktop.showMoreButtonText &&
    left.desktop.showLessButtonText === right.desktop.showLessButtonText &&
    left.desktop.showButtonFontSize === right.desktop.showButtonFontSize &&
    left.desktop.showButtonFontColor === right.desktop.showButtonFontColor &&
    left.desktop.showButtonFontWeight === right.desktop.showButtonFontWeight &&
    left.desktop.showButtonBorderColor ===
      right.desktop.showButtonBorderColor &&
    left.desktop.showButtonBorderWidth ===
      right.desktop.showButtonBorderWidth &&
    left.desktop.showButtonBorderRadius ===
      right.desktop.showButtonBorderRadius &&
    left.mobile.position === right.mobile.position &&
    left.mobile.positionSelector === right.mobile.positionSelector &&
    left.mobile.color === right.mobile.color &&
    left.mobile.width === right.mobile.width &&
    left.mobile.radius === right.mobile.radius &&
    left.mobile.paddingTop === right.mobile.paddingTop &&
    left.mobile.paddingBottom === right.mobile.paddingBottom &&
    left.mobile.paddingLeft === right.mobile.paddingLeft &&
    left.mobile.paddingRight === right.mobile.paddingRight &&
    left.mobile.background === right.mobile.background &&
    left.mobile.maxWidth === right.mobile.maxWidth &&
    left.mobile.smoothScroll === right.mobile.smoothScroll &&
    left.mobile.scrollOffset === right.mobile.scrollOffset &&
    left.mobile.showTitle === right.mobile.showTitle &&
    left.mobile.headingsFontSize === right.mobile.headingsFontSize &&
    left.mobile.headingsFontColor === right.mobile.headingsFontColor &&
    left.mobile.headingsFontWeight === right.mobile.headingsFontWeight &&
    left.mobile.titleFontSize === right.mobile.titleFontSize &&
    left.mobile.titleFontColor === right.mobile.titleFontColor &&
    left.mobile.titleFontWeight === right.mobile.titleFontWeight &&
    left.mobile.showButton === right.mobile.showButton &&
    left.mobile.showButtonHeight === right.mobile.showButtonHeight &&
    left.mobile.showMoreButtonText === right.mobile.showMoreButtonText &&
    left.mobile.showLessButtonText === right.mobile.showLessButtonText &&
    left.mobile.showButtonFontSize === right.mobile.showButtonFontSize &&
    left.mobile.showButtonFontColor === right.mobile.showButtonFontColor &&
    left.mobile.showButtonFontWeight === right.mobile.showButtonFontWeight &&
    left.mobile.showButtonBorderColor === right.mobile.showButtonBorderColor &&
    left.mobile.showButtonBorderWidth === right.mobile.showButtonBorderWidth &&
    left.mobile.showButtonBorderRadius ===
      right.mobile.showButtonBorderRadius &&
    left.headingLevels.length === right.headingLevels.length &&
    left.headingLevels.every(
      (level, index) => level === right.headingLevels[index],
    )
  );
}

function formatAppEmbedStatus(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "Activated";
    case "inactive":
      return "Not activated";
    case "checking":
      return "Checking...";
    default:
      return "Unavailable";
  }
}

function getAppEmbedBadgeTone(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "caution";
    case "checking":
      return "info";
    default:
      return "warning";
  }
}

function getAppEmbedBadgeIcon(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "check-circle";
    case "checking":
      return "clock";
    case "inactive":
      return "alert-triangle";
    default:
      return "alert-triangle";
  }
}

function getAppEmbedButtonLabel(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "Manage status";
    case "inactive":
      return "Activate";
    case "checking":
      return "Open theme editor";
    default:
      return "Open theme editor";
  }
}

function getAppEmbedButtonVariant(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "secondary";
    case "inactive":
      return "primary";
    default:
      return "secondary";
  }
}

function getAppEmbedButtonTone(): "auto" {
  return "auto";
}

function getAppEmbedRecord(
  extensions: AppBridgeExtensionRecord[],
  appEmbedHandle: string,
): AppEmbedStatus | null {
  for (const extension of extensions) {
    const nestedActivation = extension.activations?.find((activation) => {
      const record = activation as ThemeExtensionActivationRecord;
      return record.handle === appEmbedHandle;
    }) as ThemeExtensionActivationRecord | undefined;

    if (!nestedActivation) {
      if (extension.handle === appEmbedHandle) {
        return extension.activations?.length ? "active" : "inactive";
      }

      continue;
    }

    if (
      nestedActivation.status === "active" ||
      (nestedActivation.activations?.length ?? 0) > 0
    ) {
      return "active";
    }

    if (
      nestedActivation.status === "available" ||
      nestedActivation.status === "unavailable"
    ) {
      return "inactive";
    }

    return "inactive";
  }

  return null;
}

function HiddenGeneralFields({ config }: { config: TocConfig }) {
  return (
    <>
      <input type="hidden" name="title" value={config.title} />
      {config.headingLevels.map((level) => (
        <input
          key={level}
          type="hidden"
          name="headingLevels"
          value={String(level)}
        />
      ))}
      <input
        type="hidden"
        name="minHeadings"
        value={String(config.minHeadings)}
      />
      <input
        type="hidden"
        name="mobileBreakpoint"
        value={String(config.mobileBreakpoint)}
      />
      <input type="hidden" name="excludedBlogs" value={config.excludedBlogs} />
      <input type="hidden" name="customCss" value={config.customCss} />
      <input type="hidden" name="textAlignment" value={config.textAlignment} />
      <input type="hidden" name="markerFormat" value={config.markerFormat} />
      {config.indentation ? (
        <input type="hidden" name="indentation" value="on" />
      ) : null}
    </>
  );
}

function HiddenDeviceFields({
  prefix,
  config,
}: {
  prefix: "desktop" | "mobile";
  config: TocDeviceConfig;
}) {
  return (
    <>
      <input type="hidden" name={`${prefix}Position`} value={config.position} />
      <input
        type="hidden"
        name={`${prefix}PositionSelector`}
        value={config.positionSelector}
      />
      <input type="hidden" name={`${prefix}BorderColor`} value={config.color} />
      <input
        type="hidden"
        name={`${prefix}BorderWidth`}
        value={String(config.width)}
      />
      <input
        type="hidden"
        name={`${prefix}BorderRadius`}
        value={String(config.radius)}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingTop`}
        value={String(config.paddingTop)}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingBottom`}
        value={String(config.paddingBottom)}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingLeft`}
        value={String(config.paddingLeft)}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingRight`}
        value={String(config.paddingRight)}
      />
      <input
        type="hidden"
        name={`${prefix}Background`}
        value={config.background}
      />
      <input
        type="hidden"
        name={`${prefix}MaxWidth`}
        value={String(config.maxWidth)}
      />
      {config.smoothScroll ? (
        <input type="hidden" name={`${prefix}SmoothScroll`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}ScrollOffset`}
        value={String(config.scrollOffset)}
      />
      {config.showTitle ? (
        <input type="hidden" name={`${prefix}ShowTitle`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}HeadingsFontSize`}
        value={String(config.headingsFontSize)}
      />
      <input
        type="hidden"
        name={`${prefix}HeadingsFontColor`}
        value={config.headingsFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}HeadingsFontWeight`}
        value={String(config.headingsFontWeight)}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontSize`}
        value={String(config.titleFontSize)}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontColor`}
        value={config.titleFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontWeight`}
        value={String(config.titleFontWeight)}
      />
      {config.showButton ? (
        <input type="hidden" name={`${prefix}ShowButton`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}ShowButtonHeight`}
        value={String(config.showButtonHeight)}
      />
      <input
        type="hidden"
        name={`${prefix}ShowMoreButtonText`}
        value={config.showMoreButtonText}
      />
      <input
        type="hidden"
        name={`${prefix}ShowLessButtonText`}
        value={config.showLessButtonText}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontSize`}
        value={String(config.showButtonFontSize)}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontColor`}
        value={config.showButtonFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontWeight`}
        value={String(config.showButtonFontWeight)}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderColor`}
        value={config.showButtonBorderColor}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderWidth`}
        value={String(config.showButtonBorderWidth)}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderRadius`}
        value={String(config.showButtonBorderRadius)}
      />
    </>
  );
}

function coerceConfig(input: TocConfigInput): TocConfig {
  const title = input.title.trim();
  const headingLevels = normalizeHeadingLevels(input.headingLevels);
  const textAlignment = normalizeTextAlignment(input.textAlignment);
  const markerFormat = normalizeMarkerFormat(input.markerFormat);
  const minHeadings = parseIntegerInput(input.minHeadings);
  const mobileBreakpoint = parseNonNegativeIntegerInput(input.mobileBreakpoint);
  const excludedBlogs = normalizeExcludedBlogsInput(input.excludedBlogs);
  const customCss = normalizeCustomCssInput(input.customCss);

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
    mobileBreakpoint: Number.isFinite(mobileBreakpoint)
      ? mobileBreakpoint
      : DEFAULT_CONFIG.mobileBreakpoint,
    excludedBlogs,
    customCss,
    desktop: coerceDeviceConfig(
      input.desktop,
      DEFAULT_CONFIG.desktop,
      "desktop",
    ),
    mobile: coerceDeviceConfig(input.mobile, DEFAULT_CONFIG.mobile, "mobile"),
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
    mobileBreakpoint: String(formData.get("mobileBreakpoint") || ""),
    excludedBlogs: String(formData.get("excludedBlogs") || ""),
    customCss: String(formData.get("customCss") || ""),
    desktop: {
      position: String(
        formData.get("desktopPosition") || DEFAULT_CONFIG.desktop.position,
      ),
      positionSelector: String(formData.get("desktopPositionSelector") || ""),
      color: String(
        formData.get("desktopBorderColor") || DEFAULT_CONFIG.desktop.color,
      ),
      width: String(formData.get("desktopBorderWidth") || ""),
      radius: String(formData.get("desktopBorderRadius") || ""),
      paddingTop: String(formData.get("desktopPaddingTop") || ""),
      paddingBottom: String(formData.get("desktopPaddingBottom") || ""),
      paddingLeft: String(formData.get("desktopPaddingLeft") || ""),
      paddingRight: String(formData.get("desktopPaddingRight") || ""),
      background: String(
        formData.get("desktopBackground") || DEFAULT_CONFIG.desktop.background,
      ),
      maxWidth: String(formData.get("desktopMaxWidth") || ""),
      smoothScroll: formData.get("desktopSmoothScroll") === "on",
      scrollOffset: String(formData.get("desktopScrollOffset") || ""),
      showTitle: formData.get("desktopShowTitle") === "on",
      headingsFontSize: String(formData.get("desktopHeadingsFontSize") || ""),
      headingsFontColor: String(
        formData.get("desktopHeadingsFontColor") ||
          DEFAULT_CONFIG.desktop.headingsFontColor,
      ),
      headingsFontWeight: String(
        formData.get("desktopHeadingsFontWeight") || "",
      ),
      titleFontSize: String(formData.get("desktopTitleFontSize") || ""),
      titleFontColor: String(
        formData.get("desktopTitleFontColor") ||
          DEFAULT_CONFIG.desktop.titleFontColor,
      ),
      titleFontWeight: String(formData.get("desktopTitleFontWeight") || ""),
      showButton: formData.get("desktopShowButton") === "on",
      showButtonHeight: String(formData.get("desktopShowButtonHeight") || ""),
      showMoreButtonText: String(
        formData.get("desktopShowMoreButtonText") || "",
      ),
      showLessButtonText: String(
        formData.get("desktopShowLessButtonText") || "",
      ),
      showButtonFontSize: String(
        formData.get("desktopShowButtonFontSize") || "",
      ),
      showButtonFontColor: String(
        formData.get("desktopShowButtonFontColor") ||
          DEFAULT_CONFIG.desktop.showButtonFontColor,
      ),
      showButtonFontWeight: String(
        formData.get("desktopShowButtonFontWeight") || "",
      ),
      showButtonBorderColor: String(
        formData.get("desktopShowButtonBorderColor") ||
          DEFAULT_CONFIG.desktop.showButtonBorderColor,
      ),
      showButtonBorderWidth: String(
        formData.get("desktopShowButtonBorderWidth") || "",
      ),
      showButtonBorderRadius: String(
        formData.get("desktopShowButtonBorderRadius") || "",
      ),
    },
    mobile: {
      position: String(
        formData.get("mobilePosition") || DEFAULT_CONFIG.mobile.position,
      ),
      positionSelector: String(formData.get("mobilePositionSelector") || ""),
      color: String(
        formData.get("mobileBorderColor") || DEFAULT_CONFIG.mobile.color,
      ),
      width: String(formData.get("mobileBorderWidth") || ""),
      radius: String(formData.get("mobileBorderRadius") || ""),
      paddingTop: String(formData.get("mobilePaddingTop") || ""),
      paddingBottom: String(formData.get("mobilePaddingBottom") || ""),
      paddingLeft: String(formData.get("mobilePaddingLeft") || ""),
      paddingRight: String(formData.get("mobilePaddingRight") || ""),
      background: String(
        formData.get("mobileBackground") || DEFAULT_CONFIG.mobile.background,
      ),
      maxWidth: String(formData.get("mobileMaxWidth") || ""),
      smoothScroll: formData.get("mobileSmoothScroll") === "on",
      scrollOffset: String(formData.get("mobileScrollOffset") || ""),
      showTitle: formData.get("mobileShowTitle") === "on",
      headingsFontSize: String(formData.get("mobileHeadingsFontSize") || ""),
      headingsFontColor: String(
        formData.get("mobileHeadingsFontColor") ||
          DEFAULT_CONFIG.mobile.headingsFontColor,
      ),
      headingsFontWeight: String(
        formData.get("mobileHeadingsFontWeight") || "",
      ),
      titleFontSize: String(formData.get("mobileTitleFontSize") || ""),
      titleFontColor: String(
        formData.get("mobileTitleFontColor") ||
          DEFAULT_CONFIG.mobile.titleFontColor,
      ),
      titleFontWeight: String(formData.get("mobileTitleFontWeight") || ""),
      showButton: formData.get("mobileShowButton") === "on",
      showButtonHeight: String(formData.get("mobileShowButtonHeight") || ""),
      showMoreButtonText: String(
        formData.get("mobileShowMoreButtonText") || "",
      ),
      showLessButtonText: String(
        formData.get("mobileShowLessButtonText") || "",
      ),
      showButtonFontSize: String(
        formData.get("mobileShowButtonFontSize") || "",
      ),
      showButtonFontColor: String(
        formData.get("mobileShowButtonFontColor") ||
          DEFAULT_CONFIG.mobile.showButtonFontColor,
      ),
      showButtonFontWeight: String(
        formData.get("mobileShowButtonFontWeight") || "",
      ),
      showButtonBorderColor: String(
        formData.get("mobileShowButtonBorderColor") ||
          DEFAULT_CONFIG.mobile.showButtonBorderColor,
      ),
      showButtonBorderWidth: String(
        formData.get("mobileShowButtonBorderWidth") || "",
      ),
      showButtonBorderRadius: String(
        formData.get("mobileShowButtonBorderRadius") || "",
      ),
    },
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

function normalizeExcludedBlogsInput(value: string): string {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeCustomCssInput(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function compileCustomCss(customCss: string, mobileBreakpoint: number): string {
  return normalizeCustomCssInput(customCss).replaceAll(
    CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN,
    `${mobileBreakpoint}px`,
  );
}

function compilePreviewCustomCss(
  customCss: string,
  mobileBreakpoint: number,
): string {
  const normalizedCss = normalizeCustomCssInput(customCss);
  const compiledCss = compileCustomCss(normalizedCss, mobileBreakpoint);
  const previewMobileCss = extractPreviewMobileCss(normalizedCss);

  if (!previewMobileCss.trim()) {
    return compiledCss;
  }

  return `${compiledCss}\n${compileCustomCss(previewMobileCss, mobileBreakpoint)}`;
}

function extractPreviewMobileCss(customCss: string): string {
  const mediaPattern =
    /@media\s*\(\s*max-width\s*:\s*\{\{mobileBreakpoint\}\}\s*\)\s*\{/g;
  const scopedBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mediaPattern.exec(customCss))) {
    const blockStart = match.index + match[0].length - 1;
    const blockEnd = findMatchingBrace(customCss, blockStart);

    if (blockEnd === -1) {
      continue;
    }

    const blockContent = customCss.slice(blockStart + 1, blockEnd);
    const scopedBlock = scopeCssToPreviewMobile(blockContent);

    if (scopedBlock.trim()) {
      scopedBlocks.push(scopedBlock);
    }

    mediaPattern.lastIndex = blockEnd + 1;
  }

  return scopedBlocks.join("\n");
}

function scopeCssToPreviewMobile(css: string): string {
  let index = 0;
  let output = "";

  while (index < css.length) {
    const nextOpenBrace = css.indexOf("{", index);

    if (nextOpenBrace === -1) {
      output += css.slice(index);
      break;
    }

    const selectorText = css.slice(index, nextOpenBrace);
    const selectorTrimmed = selectorText.trim();
    const blockEnd = findMatchingBrace(css, nextOpenBrace);

    if (blockEnd === -1) {
      output += css.slice(index);
      break;
    }

    const declarations = css.slice(nextOpenBrace + 1, blockEnd);

    if (!selectorTrimmed) {
      index = blockEnd + 1;
      continue;
    }

    if (selectorTrimmed.startsWith("@")) {
      output += `${selectorText}{${scopeCssToPreviewMobile(declarations)}}`;
      index = blockEnd + 1;
      continue;
    }

    output += `${prefixCssSelectors(selectorText, ".toc-preview-mobile")}{${declarations}}`;
    index = blockEnd + 1;
  }

  return output;
}

function prefixCssSelectors(selectorText: string, prefix: string): string {
  return selectorText
    .split(",")
    .map((selector) => {
      const trimmedSelector = selector.trim();

      if (!trimmedSelector) {
        return selector;
      }

      return `${prefix} ${trimmedSelector}`;
    })
    .join(", ");
}

function findMatchingBrace(value: string, openBraceIndex: number): number {
  let depth = 0;

  for (let index = openBraceIndex; index < value.length; index += 1) {
    const character = value[index];

    if (character === "{") {
      depth += 1;
      continue;
    }

    if (character !== "}") {
      continue;
    }

    depth -= 1;

    if (depth === 0) {
      return index;
    }
  }

  return -1;
}

function parseIntegerInput(value: string): number {
  return parseInt(value, 10);
}

function parseNonNegativeIntegerInput(value: string): number {
  const parsed = parseIntegerInput(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : parsed;
}

function normalizeDesktopPosition(value: unknown): TocDesktopPosition {
  return DESKTOP_POSITION_OPTIONS.some((option) => option.value === value)
    ? (value as TocDesktopPosition)
    : "float-right";
}

function normalizeMobilePosition(value: unknown): TocMobilePosition {
  return MOBILE_POSITION_OPTIONS.some((option) => option.value === value)
    ? (value as TocMobilePosition)
    : "before-first-heading";
}

function normalizeTextAlignment(value: unknown): TocTextAlignment {
  return TEXT_ALIGNMENT_OPTIONS.some((option) => option.value === value)
    ? (value as TocTextAlignment)
    : (DEFAULT_CONFIG.textAlignment as TocTextAlignment);
}

function normalizeMarkerFormat(value: unknown): TocMarkerFormat {
  return MARKER_FORMAT_OPTIONS.some((option) => option.value === value)
    ? (value as TocMarkerFormat)
    : (DEFAULT_CONFIG.markerFormat as TocMarkerFormat);
}

function normalizeHeadingLevels(levels: number[]): number[] {
  return [...new Set(levels)]
    .filter((level) =>
      HEADING_LEVEL_OPTIONS.includes(level as 1 | 2 | 3 | 4 | 5 | 6),
    )
    .sort((left, right) => left - right);
}

function normalizeDeviceConfig(
  value: unknown,
  fallback: TocDeviceConfig,
  device: "desktop" | "mobile",
): TocDeviceConfig {
  if (!value || typeof value !== "object") return { ...fallback };

  const config = value as Partial<TocDeviceConfig>;

  return {
    position:
      device === "desktop"
        ? normalizeDesktopPosition(config.position)
        : normalizeMobilePosition(config.position),
    positionSelector:
      typeof config.positionSelector === "string"
        ? config.positionSelector.trim()
        : fallback.positionSelector,
    color:
      typeof config.color === "string" && config.color.trim()
        ? config.color.trim()
        : fallback.color,
    width:
      typeof config.width === "number" && Number.isFinite(config.width)
        ? Math.max(0, config.width)
        : fallback.width,
    radius:
      typeof config.radius === "number" && Number.isFinite(config.radius)
        ? Math.max(0, config.radius)
        : fallback.radius,
    paddingTop:
      typeof config.paddingTop === "number" &&
      Number.isFinite(config.paddingTop)
        ? Math.max(0, config.paddingTop)
        : fallback.paddingTop,
    paddingBottom:
      typeof config.paddingBottom === "number" &&
      Number.isFinite(config.paddingBottom)
        ? Math.max(0, config.paddingBottom)
        : fallback.paddingBottom,
    paddingLeft:
      typeof config.paddingLeft === "number" &&
      Number.isFinite(config.paddingLeft)
        ? Math.max(0, config.paddingLeft)
        : fallback.paddingLeft,
    paddingRight:
      typeof config.paddingRight === "number" &&
      Number.isFinite(config.paddingRight)
        ? Math.max(0, config.paddingRight)
        : fallback.paddingRight,
    background:
      typeof config.background === "string" && config.background.trim()
        ? config.background.trim()
        : fallback.background,
    maxWidth:
      typeof config.maxWidth === "number" && Number.isFinite(config.maxWidth)
        ? Math.max(0, config.maxWidth)
        : fallback.maxWidth,
    smoothScroll:
      typeof config.smoothScroll === "boolean"
        ? config.smoothScroll
        : fallback.smoothScroll,
    scrollOffset:
      typeof config.scrollOffset === "number" &&
      Number.isFinite(config.scrollOffset)
        ? Math.max(0, config.scrollOffset)
        : fallback.scrollOffset,
    showTitle:
      typeof config.showTitle === "boolean"
        ? config.showTitle
        : fallback.showTitle,
    headingsFontSize:
      typeof config.headingsFontSize === "number" &&
      Number.isFinite(config.headingsFontSize)
        ? Math.max(0, config.headingsFontSize)
        : fallback.headingsFontSize,
    headingsFontColor:
      typeof config.headingsFontColor === "string" &&
      config.headingsFontColor.trim()
        ? config.headingsFontColor.trim()
        : fallback.headingsFontColor,
    headingsFontWeight:
      typeof config.headingsFontWeight === "number" &&
      Number.isFinite(config.headingsFontWeight)
        ? Math.max(0, config.headingsFontWeight)
        : fallback.headingsFontWeight,
    titleFontSize:
      typeof config.titleFontSize === "number" &&
      Number.isFinite(config.titleFontSize)
        ? Math.max(0, config.titleFontSize)
        : fallback.titleFontSize,
    titleFontColor:
      typeof config.titleFontColor === "string" && config.titleFontColor.trim()
        ? config.titleFontColor.trim()
        : fallback.titleFontColor,
    titleFontWeight:
      typeof config.titleFontWeight === "number" &&
      Number.isFinite(config.titleFontWeight)
        ? Math.max(0, config.titleFontWeight)
        : fallback.titleFontWeight,
    showButton:
      typeof config.showButton === "boolean"
        ? config.showButton
        : fallback.showButton,
    showButtonHeight:
      typeof config.showButtonHeight === "number" &&
      Number.isFinite(config.showButtonHeight)
        ? Math.max(0, config.showButtonHeight)
        : fallback.showButtonHeight,
    showMoreButtonText:
      typeof config.showMoreButtonText === "string" &&
      config.showMoreButtonText.trim()
        ? config.showMoreButtonText.trim()
        : fallback.showMoreButtonText,
    showLessButtonText:
      typeof config.showLessButtonText === "string" &&
      config.showLessButtonText.trim()
        ? config.showLessButtonText.trim()
        : fallback.showLessButtonText,
    showButtonFontSize:
      typeof config.showButtonFontSize === "number" &&
      Number.isFinite(config.showButtonFontSize)
        ? Math.max(0, config.showButtonFontSize)
        : fallback.showButtonFontSize,
    showButtonFontColor:
      typeof config.showButtonFontColor === "string" &&
      config.showButtonFontColor.trim()
        ? config.showButtonFontColor.trim()
        : fallback.showButtonFontColor,
    showButtonFontWeight:
      typeof config.showButtonFontWeight === "number" &&
      Number.isFinite(config.showButtonFontWeight)
        ? Math.max(0, config.showButtonFontWeight)
        : fallback.showButtonFontWeight,
    showButtonBorderColor:
      typeof config.showButtonBorderColor === "string" &&
      config.showButtonBorderColor.trim()
        ? config.showButtonBorderColor.trim()
        : fallback.showButtonBorderColor,
    showButtonBorderWidth:
      typeof config.showButtonBorderWidth === "number" &&
      Number.isFinite(config.showButtonBorderWidth)
        ? Math.max(0, config.showButtonBorderWidth)
        : fallback.showButtonBorderWidth,
    showButtonBorderRadius:
      typeof config.showButtonBorderRadius === "number" &&
      Number.isFinite(config.showButtonBorderRadius)
        ? Math.max(0, config.showButtonBorderRadius)
        : fallback.showButtonBorderRadius,
  };
}

function coerceDeviceConfig(
  input: TocDeviceConfigInput,
  fallback: TocDeviceConfig,
  device: "desktop" | "mobile",
): TocDeviceConfig {
  const width = parseNonNegativeIntegerInput(input.width);
  const radius = parseNonNegativeIntegerInput(input.radius);
  const paddingTop = parseNonNegativeIntegerInput(input.paddingTop);
  const paddingBottom = parseNonNegativeIntegerInput(input.paddingBottom);
  const paddingLeft = parseNonNegativeIntegerInput(input.paddingLeft);
  const paddingRight = parseNonNegativeIntegerInput(input.paddingRight);
  const maxWidth = parseNonNegativeIntegerInput(input.maxWidth);
  const scrollOffset = parseNonNegativeIntegerInput(input.scrollOffset);
  const headingsFontSize = parseNonNegativeIntegerInput(input.headingsFontSize);
  const headingsFontWeight = parseNonNegativeIntegerInput(
    input.headingsFontWeight,
  );
  const titleFontSize = parseNonNegativeIntegerInput(input.titleFontSize);
  const titleFontWeight = parseNonNegativeIntegerInput(input.titleFontWeight);
  const showButtonHeight = parseNonNegativeIntegerInput(input.showButtonHeight);
  const showButtonFontSize = parseNonNegativeIntegerInput(
    input.showButtonFontSize,
  );
  const showButtonFontWeight = parseNonNegativeIntegerInput(
    input.showButtonFontWeight,
  );
  const showButtonBorderWidth = parseNonNegativeIntegerInput(
    input.showButtonBorderWidth,
  );
  const showButtonBorderRadius = parseNonNegativeIntegerInput(
    input.showButtonBorderRadius,
  );

  return {
    position:
      device === "desktop"
        ? normalizeDesktopPosition(input.position)
        : normalizeMobilePosition(input.position),
    positionSelector: input.positionSelector.trim(),
    color: input.color.trim() || fallback.color,
    width: Number.isFinite(width) ? width : fallback.width,
    radius: Number.isFinite(radius) ? radius : fallback.radius,
    paddingTop: Number.isFinite(paddingTop) ? paddingTop : fallback.paddingTop,
    paddingBottom: Number.isFinite(paddingBottom)
      ? paddingBottom
      : fallback.paddingBottom,
    paddingLeft: Number.isFinite(paddingLeft)
      ? paddingLeft
      : fallback.paddingLeft,
    paddingRight: Number.isFinite(paddingRight)
      ? paddingRight
      : fallback.paddingRight,
    background: input.background.trim() || fallback.background,
    maxWidth: Number.isFinite(maxWidth) ? maxWidth : fallback.maxWidth,
    smoothScroll: input.smoothScroll,
    scrollOffset: Number.isFinite(scrollOffset)
      ? scrollOffset
      : fallback.scrollOffset,
    showTitle: input.showTitle,
    headingsFontSize: Number.isFinite(headingsFontSize)
      ? headingsFontSize
      : fallback.headingsFontSize,
    headingsFontColor:
      input.headingsFontColor.trim() || fallback.headingsFontColor,
    headingsFontWeight: Number.isFinite(headingsFontWeight)
      ? headingsFontWeight
      : fallback.headingsFontWeight,
    titleFontSize: Number.isFinite(titleFontSize)
      ? titleFontSize
      : fallback.titleFontSize,
    titleFontColor: input.titleFontColor.trim() || fallback.titleFontColor,
    titleFontWeight: Number.isFinite(titleFontWeight)
      ? titleFontWeight
      : fallback.titleFontWeight,
    showButton: input.showButton,
    showButtonHeight: Number.isFinite(showButtonHeight)
      ? showButtonHeight
      : fallback.showButtonHeight,
    showMoreButtonText:
      input.showMoreButtonText.trim() || fallback.showMoreButtonText,
    showLessButtonText:
      input.showLessButtonText.trim() || fallback.showLessButtonText,
    showButtonFontSize: Number.isFinite(showButtonFontSize)
      ? showButtonFontSize
      : fallback.showButtonFontSize,
    showButtonFontColor:
      input.showButtonFontColor.trim() || fallback.showButtonFontColor,
    showButtonFontWeight: Number.isFinite(showButtonFontWeight)
      ? showButtonFontWeight
      : fallback.showButtonFontWeight,
    showButtonBorderColor:
      input.showButtonBorderColor.trim() || fallback.showButtonBorderColor,
    showButtonBorderWidth: Number.isFinite(showButtonBorderWidth)
      ? showButtonBorderWidth
      : fallback.showButtonBorderWidth,
    showButtonBorderRadius: Number.isFinite(showButtonBorderRadius)
      ? showButtonBorderRadius
      : fallback.showButtonBorderRadius,
  };
}

function getPreviewContainerStyle(device: TocDeviceConfig): CSSProperties {
  return {
    "--toc-background": device.background,
    "--toc-max-width": device.maxWidth > 0 ? `${device.maxWidth}px` : "none",
    "--toc-border-color": device.color,
    "--toc-border-width": `${device.width}px`,
    "--toc-border-radius": `${device.radius}px`,
    "--toc-padding-top": `${device.paddingTop}px`,
    "--toc-padding-bottom": `${device.paddingBottom}px`,
    "--toc-padding-left": `${device.paddingLeft}px`,
    "--toc-padding-right": `${device.paddingRight}px`,
    "--toc-title-font-size": `${device.titleFontSize}px`,
    "--toc-title-font-color": device.titleFontColor,
    "--toc-title-font-weight": String(device.titleFontWeight),
    "--toc-show-button-height": `${device.showButtonHeight}px`,
    "--toc-show-button-font-size": `${device.showButtonFontSize}px`,
    "--toc-show-button-font-color": device.showButtonFontColor,
    "--toc-show-button-font-weight": String(device.showButtonFontWeight),
    "--toc-show-button-border-color": device.showButtonBorderColor,
    "--toc-show-button-border-width": `${device.showButtonBorderWidth}px`,
    "--toc-show-button-border-radius": `${device.showButtonBorderRadius}px`,
    "--toc-mobile-border-color": device.color,
    "--toc-mobile-border-width": `${device.width}px`,
    "--toc-mobile-border-radius": `${device.radius}px`,
    "--toc-mobile-padding-top": `${device.paddingTop}px`,
    "--toc-mobile-padding-bottom": `${device.paddingBottom}px`,
    "--toc-mobile-padding-left": `${device.paddingLeft}px`,
    "--toc-mobile-padding-right": `${device.paddingRight}px`,
    "--toc-mobile-background": device.background,
    "--toc-mobile-max-width":
      device.maxWidth > 0 ? `${device.maxWidth}px` : "none",
    "--toc-headings-font-size": `${device.headingsFontSize}px`,
    "--toc-headings-font-color": device.headingsFontColor,
    "--toc-headings-font-weight": String(device.headingsFontWeight),
    "--toc-mobile-title-font-size": `${device.titleFontSize}px`,
    "--toc-mobile-title-font-color": device.titleFontColor,
    "--toc-mobile-title-font-weight": String(device.titleFontWeight),
    "--toc-mobile-headings-font-size": `${device.headingsFontSize}px`,
    "--toc-mobile-headings-font-color": device.headingsFontColor,
    "--toc-mobile-headings-font-weight": String(device.headingsFontWeight),
    "--toc-mobile-show-button-height": `${device.showButtonHeight}px`,
    "--toc-mobile-show-button-font-size": `${device.showButtonFontSize}px`,
    "--toc-mobile-show-button-font-color": device.showButtonFontColor,
    "--toc-mobile-show-button-font-weight": String(device.showButtonFontWeight),
    "--toc-mobile-show-button-border-color": device.showButtonBorderColor,
    "--toc-mobile-show-button-border-width": `${device.showButtonBorderWidth}px`,
    "--toc-mobile-show-button-border-radius": `${device.showButtonBorderRadius}px`,
  } as CSSProperties;
}

function getPreviewPlacementClass(
  previewDevice: "desktop" | "mobile",
  position: TocDeviceConfig["position"],
) {
  if (previewDevice !== "desktop") {
    return "toc-preview-flow";
  }

  if (position === "float-left") {
    return "toc-preview-float toc-preview-float--left";
  }

  if (position === "float-right") {
    return "toc-preview-float";
  }

  return "toc-preview-flow";
}

function TocPreview({
  preview,
  indentation,
  textAlignment,
  markerFormat,
  device,
  previewDevice,
}: {
  preview: ReturnType<typeof buildPreviewState>;
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  device: TocDeviceConfig;
  previewDevice: "desktop" | "mobile";
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  const refreshFades = useCallback(() => {
    const list = listRef.current;

    if (!list || !device.showButton || !needsToggle) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    if (maxScrollTop <= 1) {
      setShowTopFade(false);
      setShowBottomFade(false);
      return;
    }

    setShowTopFade(list.scrollTop > 1);
    setShowBottomFade(maxScrollTop - list.scrollTop > 1);
  }, [device.showButton, needsToggle]);

  useEffect(() => {
    if (!needsToggle) {
      setExpanded(false);
    }
  }, [needsToggle]);

  useEffect(() => {
    if (!device.showButton) {
      setNeedsToggle(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      const list = listRef.current;

      if (!list) {
        setNeedsToggle(false);
        return;
      }
      const toggleHeight = Math.max(0, device.showButtonHeight);

      setNeedsToggle(list.scrollHeight > toggleHeight + 1);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    device.showButton,
    device.showButtonHeight,
    indentation,
    markerFormat,
    preview.items,
    textAlignment,
  ]);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    refreshFades();
    list.addEventListener("scroll", refreshFades, { passive: true });

    return () => list.removeEventListener("scroll", refreshFades);
  }, [refreshFades]);

  if (!preview.showToc) return null;

  const showToggle = device.showButton && needsToggle;

  const nav = (
    <nav
      className={`toc-widget toc-widget--align-${textAlignment} toc-widget--markers-${markerFormat}${!indentation ? " toc-widget--flat" : ""}${showToggle ? " toc-widget--show-more-active" : ""}${showToggle && expanded ? " toc-widget--expanded" : ""}`}
      aria-label="Table of contents preview"
      data-device={previewDevice}
      style={getPreviewContainerStyle(device)}
    >
      {device.showTitle ? (
        <div className="toc-widget__title">{preview.title}</div>
      ) : null}
      {showToggle ? (
        <div
          className="toc-widget__fade toc-widget__fade--top"
          hidden={!showTopFade}
        >
          <span className="toc-widget__fade-shim"></span>
        </div>
      ) : null}
      <PreviewTocList
        ref={listRef}
        items={preview.items}
        activeId={preview.activeId}
      />
      {showToggle ? (
        <div
          className="toc-widget__fade toc-widget__fade--bottom"
          aria-hidden="true"
          hidden={!showBottomFade}
        >
          <span className="toc-widget__fade-shim"></span>
        </div>
      ) : null}
      {showToggle ? (
        <button
          type="button"
          className="toc-widget__toggle"
          onClick={() => {
            setExpanded((current) => !current);
          }}
        >
          {expanded ? device.showLessButtonText : device.showMoreButtonText}
        </button>
      ) : null}
    </nav>
  );
  return (
    <div className={getPreviewPlacementClass(previewDevice, device.position)}>
      {nav}
    </div>
  );
}

const PreviewTocList = forwardRef<
  HTMLUListElement,
  {
    items: PreviewTocItem[];
    activeId: string;
  }
>(function PreviewTocList({ items, activeId }, ref) {
  return (
    <ul ref={ref} className="toc-widget__list">
      {items.map((item) => (
        <PreviewTocListItem key={item.id} item={item} activeId={activeId} />
      ))}
    </ul>
  );
});

function PreviewTocListItem({
  item,
  activeId,
}: {
  item: PreviewTocItem;
  activeId: string;
}) {
  return (
    <li className="toc-widget__item">
      <a
        href={`#${item.id}`}
        className={`toc-widget__link${item.id === activeId ? " toc-widget__link--current" : ""}`}
        onClick={(event) => event.preventDefault()}
      >
        <span className="toc-widget__link-label">{item.title}</span>
      </a>
      {item.children.length ? (
        <ul className="toc-widget__sublist">
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

function buildDefaultCustomCss() {
  return CUSTOM_CSS_REFERENCE_SELECTORS.map(
    (selector) =>
      `${selector} {\n\n}\n\n@media (max-width: ${CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN}) {\n  ${selector} {\n\n  }\n}`,
  ).join("\n\n");
}
