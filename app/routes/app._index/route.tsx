import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import CodeMirror, { type EditorView } from "@uiw/react-codemirror";
import enTranslations from "@shopify/polaris/locales/en.json";
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
import tocStyles from "../../styles/toc-preview.css?raw";
import { authenticate } from "../../shopify.server";
import {
  DeviceSettingsSection,
  TocSectionHeading,
} from "./components/DeviceSettingsSection";
import { EditorToolbar } from "./components/EditorToolbar";
import { HiddenDeviceFields } from "./components/HiddenDeviceFields";
import { PreviewPanel } from "./components/PreviewPanel";
import { TocPreview } from "./components/TocPreview";
import { TocSliderField } from "./components/TocSliderField";
import { useAppEmbedStatus } from "./hooks/useAppEmbedStatus";
import {
  applyConfigToForm,
  buildActivateDeepLink,
  coerceConfig,
  coerceConfigFromForm,
  compilePreviewCustomCss,
  configsEqual,
  createEmptyDeviceSectionApplyState,
  deviceSectionDiffersForApply,
  deviceSectionFieldsEqual,
  getDeviceLabel,
  getGeneralSectionApplyPayload,
  getOtherDevice,
  isDesktopFloatPosition,
  normalizeAnimationType,
  normalizeDesktopPosition,
  normalizeHeadingLevels,
  normalizeMarkerFormat,
  normalizeMobilePosition,
  normalizeShadowPreset,
  normalizeTextAlignment,
  parseConfig,
} from "./lib/config";
import {
  ANIMATION_TYPE_OPTIONS,
  APP_EMBED_HANDLE,
  CUSTOM_CSS_EDITOR_EXTENSIONS,
  CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN,
  DESKTOP_DEVICE_SECTION_NAV_ITEMS,
  DESKTOP_POSITION_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  FORM_ID,
  FORM_STYLES,
  GENERAL_SECTION_NAV_ITEMS,
  HEADING_LEVEL_OPTIONS,
  MARKER_FORMAT_OPTIONS,
  MOBILE_POSITION_OPTIONS,
  MOBILE_DEVICE_SECTION_NAV_ITEMS,
  PREVIEW_STYLES,
  SAVE_BAR_ID,
  SECTION_NAV_METADATA,
  SHADOW_PRESET_OPTIONS,
  SLIDER_RANGES,
  TEXT_ALIGNMENT_OPTIONS,
} from "./lib/constants";
import {
  buildPreviewState,
  createPreviewShuffleSeed,
} from "./lib/preview-data";
import type {
  DeviceTab,
  DeviceSectionKey,
  EditorTab,
  SectionNavKey,
  TocConfig,
} from "./lib/types";

type LoaderData = {
  config: TocConfig;
  deepLink: string | null;
};

type ActionData = {
  ok?: boolean;
  userErrors?: Array<{ field?: string[]; message: string }>;
};

const CRISP_WEBSITE_ID = "00d4dcb8-9b3d-4cdc-bf58-2e3dcaf9989f";
const CRISP_SCRIPT_ID = "crisp-chat-script";

function CrispChat() {
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

  return null;
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
  const initialHeadingLevels = normalizeHeadingLevels(config.headingLevels);
  const initialHeadingLevelsKey = initialHeadingLevels.join(",");

  const [savedConfig, setSavedConfig] = useState(config);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [generalPreviewDevice, setGeneralPreviewDevice] =
    useState<DeviceTab>("desktop");
  const [title, setTitle] = useState(config.title);
  const [headingLevels, setHeadingLevels] = useState(initialHeadingLevels);
  const [previewHeadingShuffleSeed, setPreviewHeadingShuffleSeed] = useState(
    () => createPreviewShuffleSeed(initialHeadingLevelsKey),
  );
  const previousHeadingLevelsKeyRef = useRef(initialHeadingLevelsKey);
  const headingLevelsKey = headingLevels.join(",");
  const [indentation, setIndentation] = useState(config.indentation);
  const [textAlignment, setTextAlignment] = useState(config.textAlignment);
  const [markerFormat, setMarkerFormat] = useState(config.markerFormat);
  const [minHeadings, setMinHeadings] = useState(String(config.minHeadings));
  const [mobileBreakpoint, setMobileBreakpoint] = useState(
    String(config.mobileBreakpoint),
  );
  const [excludedBlogs, setExcludedBlogs] = useState(config.excludedBlogs);
  const [enableJsonLd, setEnableJsonLd] = useState(config.enableJsonLd);
  const [customCss, setCustomCss] = useState(config.customCss);
  const [desktopPosition, setDesktopPosition] = useState(
    config.desktop.position,
  );
  const [desktopPositionSelector, setDesktopPositionSelector] = useState(
    config.desktop.positionSelector,
  );
  const [
    desktopSwitchToMobileOnFloatOverflow,
    setDesktopSwitchToMobileOnFloatOverflow,
  ] = useState(config.desktop.switchToMobileOnFloatOverflow);
  const [desktopBorderColor, setDesktopBorderColor] = useState(
    config.desktop.color,
  );
  const [desktopBorderWidth, setDesktopBorderWidth] = useState(
    String(config.desktop.width),
  );
  const [desktopBorderRadius, setDesktopBorderRadius] = useState(
    String(config.desktop.radius),
  );
  const [desktopShadowPreset, setDesktopShadowPreset] = useState(
    config.desktop.shadowPreset,
  );
  const [desktopShadowColor, setDesktopShadowColor] = useState(
    config.desktop.shadowColor,
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
  const [desktopOffsetTop, setDesktopOffsetTop] = useState(
    String(config.desktop.offsetTop),
  );
  const [desktopOffsetBottom, setDesktopOffsetBottom] = useState(
    String(config.desktop.offsetBottom),
  );
  const [desktopOffsetLeft, setDesktopOffsetLeft] = useState(
    String(config.desktop.offsetLeft),
  );
  const [desktopOffsetRight, setDesktopOffsetRight] = useState(
    String(config.desktop.offsetRight),
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
  const [desktopShowButtonPaddingTop, setDesktopShowButtonPaddingTop] =
    useState(String(config.desktop.showButtonPaddingTop));
  const [desktopShowButtonPaddingBottom, setDesktopShowButtonPaddingBottom] =
    useState(String(config.desktop.showButtonPaddingBottom));
  const [desktopShowButtonPaddingLeft, setDesktopShowButtonPaddingLeft] =
    useState(String(config.desktop.showButtonPaddingLeft));
  const [desktopShowButtonPaddingRight, setDesktopShowButtonPaddingRight] =
    useState(String(config.desktop.showButtonPaddingRight));
  const [desktopAnimationType, setDesktopAnimationType] = useState(
    config.desktop.animationType,
  );
  const [desktopFollowingMarkerWidth, setDesktopFollowingMarkerWidth] =
    useState(String(config.desktop.followingMarkerWidth));
  const [desktopFollowingMarkerHeight, setDesktopFollowingMarkerHeight] =
    useState(String(config.desktop.followingMarkerHeight));
  const [desktopFollowingMarkerColor, setDesktopFollowingMarkerColor] =
    useState(config.desktop.followingMarkerColor);
  const [desktopFollowingMarkerOffset, setDesktopFollowingMarkerOffset] =
    useState(String(config.desktop.followingMarkerOffset));
  const [
    desktopFollowingMarkerBorderRadius,
    setDesktopFollowingMarkerBorderRadius,
  ] = useState(String(config.desktop.followingMarkerBorderRadius));
  const [desktopCrawlingSnakeWidth, setDesktopCrawlingSnakeWidth] = useState(
    String(config.desktop.crawlingSnakeWidth),
  );
  const [desktopCrawlingSnakeHeight, setDesktopCrawlingSnakeHeight] = useState(
    String(config.desktop.crawlingSnakeHeight),
  );
  const [desktopCrawlingSnakeColor, setDesktopCrawlingSnakeColor] = useState(
    config.desktop.crawlingSnakeColor,
  );
  const [desktopCrawlingSnakeOffset, setDesktopCrawlingSnakeOffset] = useState(
    String(config.desktop.crawlingSnakeOffset),
  );
  const [desktopJumpingMarkerWidth, setDesktopJumpingMarkerWidth] = useState(
    String(config.desktop.jumpingMarkerWidth),
  );
  const [desktopJumpingMarkerHeight, setDesktopJumpingMarkerHeight] = useState(
    String(config.desktop.jumpingMarkerHeight),
  );
  const [desktopJumpingMarkerColor, setDesktopJumpingMarkerColor] = useState(
    config.desktop.jumpingMarkerColor,
  );
  const [desktopJumpingMarkerOffset, setDesktopJumpingMarkerOffset] = useState(
    String(config.desktop.jumpingMarkerOffset),
  );
  const [
    desktopJumpingMarkerBorderRadius,
    setDesktopJumpingMarkerBorderRadius,
  ] = useState(String(config.desktop.jumpingMarkerBorderRadius));
  const [desktopPreviewReplayToken, setDesktopPreviewReplayToken] = useState(0);
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
  const [mobileShadowPreset, setMobileShadowPreset] = useState(
    config.mobile.shadowPreset,
  );
  const [mobileShadowColor, setMobileShadowColor] = useState(
    config.mobile.shadowColor,
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
  const [mobileOffsetTop, setMobileOffsetTop] = useState(
    String(config.mobile.offsetTop),
  );
  const [mobileOffsetBottom, setMobileOffsetBottom] = useState(
    String(config.mobile.offsetBottom),
  );
  const [mobileOffsetLeft, setMobileOffsetLeft] = useState(
    String(config.mobile.offsetLeft),
  );
  const [mobileOffsetRight, setMobileOffsetRight] = useState(
    String(config.mobile.offsetRight),
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
  const [mobileShowButtonPaddingTop, setMobileShowButtonPaddingTop] = useState(
    String(config.mobile.showButtonPaddingTop),
  );
  const [mobileShowButtonPaddingBottom, setMobileShowButtonPaddingBottom] =
    useState(String(config.mobile.showButtonPaddingBottom));
  const [mobileShowButtonPaddingLeft, setMobileShowButtonPaddingLeft] =
    useState(String(config.mobile.showButtonPaddingLeft));
  const [mobileShowButtonPaddingRight, setMobileShowButtonPaddingRight] =
    useState(String(config.mobile.showButtonPaddingRight));
  const [mobileAnimationType, setMobileAnimationType] = useState(
    config.mobile.animationType,
  );
  const [mobileFollowingMarkerWidth, setMobileFollowingMarkerWidth] = useState(
    String(config.mobile.followingMarkerWidth),
  );
  const [mobileFollowingMarkerHeight, setMobileFollowingMarkerHeight] =
    useState(String(config.mobile.followingMarkerHeight));
  const [mobileFollowingMarkerColor, setMobileFollowingMarkerColor] = useState(
    config.mobile.followingMarkerColor,
  );
  const [mobileFollowingMarkerOffset, setMobileFollowingMarkerOffset] =
    useState(String(config.mobile.followingMarkerOffset));
  const [
    mobileFollowingMarkerBorderRadius,
    setMobileFollowingMarkerBorderRadius,
  ] = useState(String(config.mobile.followingMarkerBorderRadius));
  const [mobileCrawlingSnakeWidth, setMobileCrawlingSnakeWidth] = useState(
    String(config.mobile.crawlingSnakeWidth),
  );
  const [mobileCrawlingSnakeHeight, setMobileCrawlingSnakeHeight] = useState(
    String(config.mobile.crawlingSnakeHeight),
  );
  const [mobileCrawlingSnakeColor, setMobileCrawlingSnakeColor] = useState(
    config.mobile.crawlingSnakeColor,
  );
  const [mobileCrawlingSnakeOffset, setMobileCrawlingSnakeOffset] = useState(
    String(config.mobile.crawlingSnakeOffset),
  );
  const [mobileJumpingMarkerWidth, setMobileJumpingMarkerWidth] = useState(
    String(config.mobile.jumpingMarkerWidth),
  );
  const [mobileJumpingMarkerHeight, setMobileJumpingMarkerHeight] = useState(
    String(config.mobile.jumpingMarkerHeight),
  );
  const [mobileJumpingMarkerColor, setMobileJumpingMarkerColor] = useState(
    config.mobile.jumpingMarkerColor,
  );
  const [mobileJumpingMarkerOffset, setMobileJumpingMarkerOffset] = useState(
    String(config.mobile.jumpingMarkerOffset),
  );
  const [mobileJumpingMarkerBorderRadius, setMobileJumpingMarkerBorderRadius] =
    useState(String(config.mobile.jumpingMarkerBorderRadius));
  const [appliedSections, setAppliedSections] = useState(
    createEmptyDeviceSectionApplyState(),
  );
  const appEmbedStatus = useAppEmbedStatus(shopify, APP_EMBED_HANDLE);
  const activeDevice =
    activeTab === "desktop" || activeTab === "mobile" ? activeTab : null;
  const desktopFollowingMarkerSelected =
    desktopAnimationType === "following-marker";
  const desktopCrawlingSnakeSelected =
    desktopAnimationType === "crawling-snake";
  const desktopJumpingMarkerSelected =
    desktopAnimationType === "jumping-marker";
  const desktopDeviceForm = {
    kind: "desktop" as const,
    namePrefix: "desktop",
    positionOptions: DESKTOP_POSITION_OPTIONS,
    positionSelectorDetails:
      "Places the table of contents inside the first element that matches this selector. If no match is found, it will be placed on the right side instead.",
    general: {
      position: desktopPosition,
      setPosition: (value: string) => {
        const nextPosition = normalizeDesktopPosition(value);

        if (
          isDesktopFloatPosition(nextPosition) &&
          !isDesktopFloatPosition(desktopPosition)
        ) {
          setDesktopSwitchToMobileOnFloatOverflow(true);
        }

        setDesktopPosition(nextPosition);
      },
      positionSelector: desktopPositionSelector,
      setPositionSelector: setDesktopPositionSelector,
      background: desktopBackground,
      setBackground: setDesktopBackground,
      maxWidth: desktopMaxWidth,
      setMaxWidth: setDesktopMaxWidth,
      switchToMobileOnFloatOverflow: desktopSwitchToMobileOnFloatOverflow,
      setSwitchToMobileOnFloatOverflow: setDesktopSwitchToMobileOnFloatOverflow,
      showFloatOverflowToggle: isDesktopFloatPosition(desktopPosition),
    },
    title: {
      showTitle: desktopShowTitle,
      setShowTitle: setDesktopShowTitle,
      fontColor: desktopTitleFontColor,
      setFontColor: setDesktopTitleFontColor,
      fontWeight: desktopTitleFontWeight,
      setFontWeight: setDesktopTitleFontWeight,
      fontSize: desktopTitleFontSize,
      setFontSize: setDesktopTitleFontSize,
      enabled: desktopShowTitle,
    },
    headings: {
      fontColor: desktopHeadingsFontColor,
      setFontColor: setDesktopHeadingsFontColor,
      fontWeight: desktopHeadingsFontWeight,
      setFontWeight: setDesktopHeadingsFontWeight,
      fontSize: desktopHeadingsFontSize,
      setFontSize: setDesktopHeadingsFontSize,
    },
    border: {
      color: desktopBorderColor,
      setColor: setDesktopBorderColor,
      width: desktopBorderWidth,
      setWidth: setDesktopBorderWidth,
      radius: desktopBorderRadius,
      setRadius: setDesktopBorderRadius,
    },
    shadow: {
      preset: desktopShadowPreset,
      setPreset: setDesktopShadowPreset,
      color: desktopShadowColor,
      setColor: setDesktopShadowColor,
    },
    padding: {
      top: desktopPaddingTop,
      setTop: setDesktopPaddingTop,
      bottom: desktopPaddingBottom,
      setBottom: setDesktopPaddingBottom,
      left: desktopPaddingLeft,
      setLeft: setDesktopPaddingLeft,
      right: desktopPaddingRight,
      setRight: setDesktopPaddingRight,
    },
    offset: {
      top: desktopOffsetTop,
      setTop: setDesktopOffsetTop,
      bottom: desktopOffsetBottom,
      setBottom: setDesktopOffsetBottom,
      left: desktopOffsetLeft,
      setLeft: setDesktopOffsetLeft,
      right: desktopOffsetRight,
      setRight: setDesktopOffsetRight,
    },
    scroll: {
      smoothScroll: desktopSmoothScroll,
      setSmoothScroll: setDesktopSmoothScroll,
      offset: desktopScrollOffset,
      setOffset: setDesktopScrollOffset,
    },
    showButton: {
      enabled: desktopShowButton,
      setEnabled: setDesktopShowButton,
      height: desktopShowButtonHeight,
      setHeight: setDesktopShowButtonHeight,
      showMoreText: desktopShowMoreButtonText,
      setShowMoreText: setDesktopShowMoreButtonText,
      showLessText: desktopShowLessButtonText,
      setShowLessText: setDesktopShowLessButtonText,
      fontColor: desktopShowButtonFontColor,
      setFontColor: setDesktopShowButtonFontColor,
      fontWeight: desktopShowButtonFontWeight,
      setFontWeight: setDesktopShowButtonFontWeight,
      fontSize: desktopShowButtonFontSize,
      setFontSize: setDesktopShowButtonFontSize,
      borderColor: desktopShowButtonBorderColor,
      setBorderColor: setDesktopShowButtonBorderColor,
      borderWidth: desktopShowButtonBorderWidth,
      setBorderWidth: setDesktopShowButtonBorderWidth,
      borderRadius: desktopShowButtonBorderRadius,
      setBorderRadius: setDesktopShowButtonBorderRadius,
      paddingTop: desktopShowButtonPaddingTop,
      setPaddingTop: setDesktopShowButtonPaddingTop,
      paddingBottom: desktopShowButtonPaddingBottom,
      setPaddingBottom: setDesktopShowButtonPaddingBottom,
      paddingLeft: desktopShowButtonPaddingLeft,
      setPaddingLeft: setDesktopShowButtonPaddingLeft,
      paddingRight: desktopShowButtonPaddingRight,
      setPaddingRight: setDesktopShowButtonPaddingRight,
    },
  };
  const mobileDeviceForm = {
    kind: "mobile" as const,
    namePrefix: "mobile",
    positionOptions: MOBILE_POSITION_OPTIONS,
    positionSelectorDetails:
      "Places the table of contents inside the first element that matches this selector. If no match is found, it will be placed before the first heading instead.",
    general: {
      position: mobilePosition,
      setPosition: (value: string) => {
        setMobilePosition(normalizeMobilePosition(value));
      },
      positionSelector: mobilePositionSelector,
      setPositionSelector: setMobilePositionSelector,
      background: mobileBackground,
      setBackground: setMobileBackground,
      maxWidth: mobileMaxWidth,
      setMaxWidth: setMobileMaxWidth,
      switchToMobileOnFloatOverflow: false,
      setSwitchToMobileOnFloatOverflow: () => {},
      showFloatOverflowToggle: false,
    },
    title: {
      showTitle: mobileShowTitle,
      setShowTitle: setMobileShowTitle,
      fontColor: mobileTitleFontColor,
      setFontColor: setMobileTitleFontColor,
      fontWeight: mobileTitleFontWeight,
      setFontWeight: setMobileTitleFontWeight,
      fontSize: mobileTitleFontSize,
      setFontSize: setMobileTitleFontSize,
      enabled: mobileShowTitle,
    },
    headings: {
      fontColor: mobileHeadingsFontColor,
      setFontColor: setMobileHeadingsFontColor,
      fontWeight: mobileHeadingsFontWeight,
      setFontWeight: setMobileHeadingsFontWeight,
      fontSize: mobileHeadingsFontSize,
      setFontSize: setMobileHeadingsFontSize,
    },
    border: {
      color: mobileBorderColor,
      setColor: setMobileBorderColor,
      width: mobileBorderWidth,
      setWidth: setMobileBorderWidth,
      radius: mobileBorderRadius,
      setRadius: setMobileBorderRadius,
    },
    shadow: {
      preset: mobileShadowPreset,
      setPreset: setMobileShadowPreset,
      color: mobileShadowColor,
      setColor: setMobileShadowColor,
    },
    padding: {
      top: mobilePaddingTop,
      setTop: setMobilePaddingTop,
      bottom: mobilePaddingBottom,
      setBottom: setMobilePaddingBottom,
      left: mobilePaddingLeft,
      setLeft: setMobilePaddingLeft,
      right: mobilePaddingRight,
      setRight: setMobilePaddingRight,
    },
    offset: {
      top: mobileOffsetTop,
      setTop: setMobileOffsetTop,
      bottom: mobileOffsetBottom,
      setBottom: setMobileOffsetBottom,
      left: mobileOffsetLeft,
      setLeft: setMobileOffsetLeft,
      right: mobileOffsetRight,
      setRight: setMobileOffsetRight,
    },
    scroll: {
      smoothScroll: mobileSmoothScroll,
      setSmoothScroll: setMobileSmoothScroll,
      offset: mobileScrollOffset,
      setOffset: setMobileScrollOffset,
    },
    showButton: {
      enabled: mobileShowButton,
      setEnabled: setMobileShowButton,
      height: mobileShowButtonHeight,
      setHeight: setMobileShowButtonHeight,
      showMoreText: mobileShowMoreButtonText,
      setShowMoreText: setMobileShowMoreButtonText,
      showLessText: mobileShowLessButtonText,
      setShowLessText: setMobileShowLessButtonText,
      fontColor: mobileShowButtonFontColor,
      setFontColor: setMobileShowButtonFontColor,
      fontWeight: mobileShowButtonFontWeight,
      setFontWeight: setMobileShowButtonFontWeight,
      fontSize: mobileShowButtonFontSize,
      setFontSize: setMobileShowButtonFontSize,
      borderColor: mobileShowButtonBorderColor,
      setBorderColor: setMobileShowButtonBorderColor,
      borderWidth: mobileShowButtonBorderWidth,
      setBorderWidth: setMobileShowButtonBorderWidth,
      borderRadius: mobileShowButtonBorderRadius,
      setBorderRadius: setMobileShowButtonBorderRadius,
      paddingTop: mobileShowButtonPaddingTop,
      setPaddingTop: setMobileShowButtonPaddingTop,
      paddingBottom: mobileShowButtonPaddingBottom,
      setPaddingBottom: setMobileShowButtonPaddingBottom,
      paddingLeft: mobileShowButtonPaddingLeft,
      setPaddingLeft: setMobileShowButtonPaddingLeft,
      paddingRight: mobileShowButtonPaddingRight,
      setPaddingRight: setMobileShowButtonPaddingRight,
    },
  };
  const activeDeviceForm =
    activeDevice === "desktop"
      ? desktopDeviceForm
      : activeDevice === "mobile"
        ? mobileDeviceForm
        : null;
  const isShowMoreEnabled = activeDeviceForm?.showButton.enabled ?? false;
  const isTitleEnabled = activeDeviceForm?.title.enabled ?? false;
  const currentConfig = coerceConfig({
    title,
    headingLevels,
    indentation,
    textAlignment,
    markerFormat,
    minHeadings,
    mobileBreakpoint,
    excludedBlogs,
    enableJsonLd,
    customCss,
    desktop: {
      position: desktopPosition,
      positionSelector: desktopPositionSelector,
      switchToMobileOnFloatOverflow: desktopSwitchToMobileOnFloatOverflow,
      color: desktopBorderColor,
      width: desktopBorderWidth,
      radius: desktopBorderRadius,
      shadowPreset: desktopShadowPreset,
      shadowColor: desktopShadowColor,
      paddingTop: desktopPaddingTop,
      paddingBottom: desktopPaddingBottom,
      paddingLeft: desktopPaddingLeft,
      paddingRight: desktopPaddingRight,
      offsetTop: desktopOffsetTop,
      offsetBottom: desktopOffsetBottom,
      offsetLeft: desktopOffsetLeft,
      offsetRight: desktopOffsetRight,
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
      showButtonPaddingTop: desktopShowButtonPaddingTop,
      showButtonPaddingBottom: desktopShowButtonPaddingBottom,
      showButtonPaddingLeft: desktopShowButtonPaddingLeft,
      showButtonPaddingRight: desktopShowButtonPaddingRight,
      animationType: desktopAnimationType,
      followingMarkerWidth: desktopFollowingMarkerWidth,
      followingMarkerHeight: desktopFollowingMarkerHeight,
      followingMarkerColor: desktopFollowingMarkerColor,
      followingMarkerOffset: desktopFollowingMarkerOffset,
      followingMarkerBorderRadius: desktopFollowingMarkerBorderRadius,
      crawlingSnakeWidth: desktopCrawlingSnakeWidth,
      crawlingSnakeHeight: desktopCrawlingSnakeHeight,
      crawlingSnakeColor: desktopCrawlingSnakeColor,
      crawlingSnakeOffset: desktopCrawlingSnakeOffset,
      jumpingMarkerWidth: desktopJumpingMarkerWidth,
      jumpingMarkerHeight: desktopJumpingMarkerHeight,
      jumpingMarkerColor: desktopJumpingMarkerColor,
      jumpingMarkerOffset: desktopJumpingMarkerOffset,
      jumpingMarkerBorderRadius: desktopJumpingMarkerBorderRadius,
    },
    mobile: {
      position: mobilePosition,
      positionSelector: mobilePositionSelector,
      switchToMobileOnFloatOverflow: false,
      color: mobileBorderColor,
      width: mobileBorderWidth,
      radius: mobileBorderRadius,
      shadowPreset: mobileShadowPreset,
      shadowColor: mobileShadowColor,
      paddingTop: mobilePaddingTop,
      paddingBottom: mobilePaddingBottom,
      paddingLeft: mobilePaddingLeft,
      paddingRight: mobilePaddingRight,
      offsetTop: mobileOffsetTop,
      offsetBottom: mobileOffsetBottom,
      offsetLeft: mobileOffsetLeft,
      offsetRight: mobileOffsetRight,
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
      showButtonPaddingTop: mobileShowButtonPaddingTop,
      showButtonPaddingBottom: mobileShowButtonPaddingBottom,
      showButtonPaddingLeft: mobileShowButtonPaddingLeft,
      showButtonPaddingRight: mobileShowButtonPaddingRight,
      animationType: mobileAnimationType,
      followingMarkerWidth: mobileFollowingMarkerWidth,
      followingMarkerHeight: mobileFollowingMarkerHeight,
      followingMarkerColor: mobileFollowingMarkerColor,
      followingMarkerOffset: mobileFollowingMarkerOffset,
      followingMarkerBorderRadius: mobileFollowingMarkerBorderRadius,
      crawlingSnakeWidth: mobileCrawlingSnakeWidth,
      crawlingSnakeHeight: mobileCrawlingSnakeHeight,
      crawlingSnakeColor: mobileCrawlingSnakeColor,
      crawlingSnakeOffset: mobileCrawlingSnakeOffset,
      jumpingMarkerWidth: mobileJumpingMarkerWidth,
      jumpingMarkerHeight: mobileJumpingMarkerHeight,
      jumpingMarkerColor: mobileJumpingMarkerColor,
      jumpingMarkerOffset: mobileJumpingMarkerOffset,
      jumpingMarkerBorderRadius: mobileJumpingMarkerBorderRadius,
    },
  });
  useEffect(() => {
    if (previousHeadingLevelsKeyRef.current === headingLevelsKey) {
      return;
    }

    previousHeadingLevelsKeyRef.current = headingLevelsKey;
    setPreviewHeadingShuffleSeed(createPreviewShuffleSeed(headingLevelsKey));
  }, [headingLevelsKey]);

  const desktopPreview = buildPreviewState(
    currentConfig,
    previewHeadingShuffleSeed,
  );
  const mobilePreview = buildPreviewState(
    currentConfig,
    previewHeadingShuffleSeed,
  );
  const isDirty = !configsEqual(savedConfig, currentConfig);
  const isSaving = navigation.state === "submitting";
  const desktopPreviewReplayAvailable =
    currentConfig.desktop.animationType !== "none" && desktopPreview.showToc;
  const replayDesktopPreview = () => {
    setDesktopPreviewReplayToken((current) => current + 1);
  };
  const desktopPreviewPane = (
    <PreviewPanel.Pane>
      <div className="toc-preview-stage toc-preview-desktop">
        <TocPreview.Desktop
          preview={desktopPreview}
          indentation={currentConfig.indentation}
          textAlignment={currentConfig.textAlignment}
          markerFormat={currentConfig.markerFormat}
          desktopDevice={currentConfig.desktop}
          mobileDevice={currentConfig.mobile}
          replayToken={desktopPreviewReplayToken}
        />
      </div>
    </PreviewPanel.Pane>
  );
  const mobilePreviewPane = (
    <PreviewPanel.Pane>
      <div className="toc-preview-stage toc-preview-mobile">
        <TocPreview.Mobile
          preview={mobilePreview}
          indentation={currentConfig.indentation}
          textAlignment={currentConfig.textAlignment}
          markerFormat={currentConfig.markerFormat}
          desktopDevice={currentConfig.desktop}
          mobileDevice={currentConfig.mobile}
          replayToken={0}
        />
      </div>
    </PreviewPanel.Pane>
  );
  const renderPreviewPanel = () => {
    const desktopReplayAction = desktopPreviewReplayAvailable ? (
      <PreviewPanel.ReplayAction onReplay={replayDesktopPreview} />
    ) : null;

    if (activeTab === "general") {
      return (
        <PreviewPanel.Frame>
          <PreviewPanel.Header
            action={
              generalPreviewDevice === "desktop" ? desktopReplayAction : null
            }
          >
            <PreviewPanel.Title />
            <PreviewPanel.DeviceToggle
              value={generalPreviewDevice}
              onChange={setGeneralPreviewDevice}
            />
          </PreviewPanel.Header>
          <PreviewPanel.Content>
            {generalPreviewDevice === "desktop"
              ? desktopPreviewPane
              : mobilePreviewPane}
          </PreviewPanel.Content>
        </PreviewPanel.Frame>
      );
    }

    if (activeTab === "desktop") {
      return (
        <PreviewPanel.Frame>
          <PreviewPanel.Header action={desktopReplayAction}>
            <PreviewPanel.Title />
          </PreviewPanel.Header>
          <PreviewPanel.Content>{desktopPreviewPane}</PreviewPanel.Content>
        </PreviewPanel.Frame>
      );
    }

    return (
      <PreviewPanel.Frame>
        <PreviewPanel.Header>
          <PreviewPanel.Title />
        </PreviewPanel.Header>
        <PreviewPanel.Content>{mobilePreviewPane}</PreviewPanel.Content>
      </PreviewPanel.Frame>
    );
  };
  const sectionRefs = useRef<Record<SectionNavKey, HTMLDivElement | null>>({
    generalSettings: null,
    textFormatting: null,
    advancedSettings: null,
    general: null,
    title: null,
    headings: null,
    border: null,
    shadow: null,
    padding: null,
    offset: null,
    scroll: null,
    showButton: null,
    animation: null,
  });
  const customCssEditorViewRef = useRef<EditorView | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const activeSectionNavItems =
    activeTab === "general"
      ? GENERAL_SECTION_NAV_ITEMS
      : activeTab === "desktop"
        ? DESKTOP_DEVICE_SECTION_NAV_ITEMS
        : activeTab === "mobile"
          ? MOBILE_DEVICE_SECTION_NAV_ITEMS
          : [];

  const scrollToSection = (section: SectionNavKey) => {
    const sectionElement = sectionRefs.current[section];

    if (!sectionElement) {
      return;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    sectionElement.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };
  const [editorShellHeight, setEditorShellHeight] = useState<string | null>(
    null,
  );

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
      return {
        changedSinceSave: false,
        isApplied: false,
        showApplyAction: false,
      };
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
      changedSinceSave,
      isApplied,
      showApplyAction: !isApplied && changedSinceSave && differsFromOtherDevice,
    };
  };

  const resetDeviceSectionToInitial = (section: DeviceSectionKey) => {
    if (!activeDevice) {
      return;
    }

    const initialConfig = savedConfig[activeDevice];

    switch (section) {
      case "general":
        if (activeDevice === "desktop") {
          setDesktopPosition(normalizeDesktopPosition(initialConfig.position));
          setDesktopPositionSelector(initialConfig.positionSelector);
          setDesktopSwitchToMobileOnFloatOverflow(
            initialConfig.switchToMobileOnFloatOverflow,
          );
          setDesktopBackground(initialConfig.background);
          setDesktopMaxWidth(String(initialConfig.maxWidth));
        } else {
          setMobilePosition(normalizeMobilePosition(initialConfig.position));
          setMobilePositionSelector(initialConfig.positionSelector);
          setMobileBackground(initialConfig.background);
          setMobileMaxWidth(String(initialConfig.maxWidth));
        }
        break;
      case "title":
        if (activeDevice === "desktop") {
          setDesktopShowTitle(initialConfig.showTitle);
          setDesktopTitleFontSize(String(initialConfig.titleFontSize));
          setDesktopTitleFontColor(initialConfig.titleFontColor);
          setDesktopTitleFontWeight(String(initialConfig.titleFontWeight));
        } else {
          setMobileShowTitle(initialConfig.showTitle);
          setMobileTitleFontSize(String(initialConfig.titleFontSize));
          setMobileTitleFontColor(initialConfig.titleFontColor);
          setMobileTitleFontWeight(String(initialConfig.titleFontWeight));
        }
        break;
      case "headings":
        if (activeDevice === "desktop") {
          setDesktopHeadingsFontSize(String(initialConfig.headingsFontSize));
          setDesktopHeadingsFontColor(initialConfig.headingsFontColor);
          setDesktopHeadingsFontWeight(
            String(initialConfig.headingsFontWeight),
          );
        } else {
          setMobileHeadingsFontSize(String(initialConfig.headingsFontSize));
          setMobileHeadingsFontColor(initialConfig.headingsFontColor);
          setMobileHeadingsFontWeight(String(initialConfig.headingsFontWeight));
        }
        break;
      case "border":
        if (activeDevice === "desktop") {
          setDesktopBorderColor(initialConfig.color);
          setDesktopBorderWidth(String(initialConfig.width));
          setDesktopBorderRadius(String(initialConfig.radius));
        } else {
          setMobileBorderColor(initialConfig.color);
          setMobileBorderWidth(String(initialConfig.width));
          setMobileBorderRadius(String(initialConfig.radius));
        }
        break;
      case "shadow":
        if (activeDevice === "desktop") {
          setDesktopShadowPreset(initialConfig.shadowPreset);
          setDesktopShadowColor(initialConfig.shadowColor);
        } else {
          setMobileShadowPreset(initialConfig.shadowPreset);
          setMobileShadowColor(initialConfig.shadowColor);
        }
        break;
      case "padding":
        if (activeDevice === "desktop") {
          setDesktopPaddingTop(String(initialConfig.paddingTop));
          setDesktopPaddingBottom(String(initialConfig.paddingBottom));
          setDesktopPaddingLeft(String(initialConfig.paddingLeft));
          setDesktopPaddingRight(String(initialConfig.paddingRight));
        } else {
          setMobilePaddingTop(String(initialConfig.paddingTop));
          setMobilePaddingBottom(String(initialConfig.paddingBottom));
          setMobilePaddingLeft(String(initialConfig.paddingLeft));
          setMobilePaddingRight(String(initialConfig.paddingRight));
        }
        break;
      case "offset":
        if (activeDevice === "desktop") {
          setDesktopOffsetTop(String(initialConfig.offsetTop));
          setDesktopOffsetBottom(String(initialConfig.offsetBottom));
          setDesktopOffsetLeft(String(initialConfig.offsetLeft));
          setDesktopOffsetRight(String(initialConfig.offsetRight));
        } else {
          setMobileOffsetTop(String(initialConfig.offsetTop));
          setMobileOffsetBottom(String(initialConfig.offsetBottom));
          setMobileOffsetLeft(String(initialConfig.offsetLeft));
          setMobileOffsetRight(String(initialConfig.offsetRight));
        }
        break;
      case "scroll":
        if (activeDevice === "desktop") {
          setDesktopSmoothScroll(initialConfig.smoothScroll);
          setDesktopScrollOffset(String(initialConfig.scrollOffset));
        } else {
          setMobileSmoothScroll(initialConfig.smoothScroll);
          setMobileScrollOffset(String(initialConfig.scrollOffset));
        }
        break;
      case "showButton":
        if (activeDevice === "desktop") {
          setDesktopShowButton(initialConfig.showButton);
          setDesktopShowButtonHeight(String(initialConfig.showButtonHeight));
          setDesktopShowMoreButtonText(initialConfig.showMoreButtonText);
          setDesktopShowLessButtonText(initialConfig.showLessButtonText);
          setDesktopShowButtonFontSize(
            String(initialConfig.showButtonFontSize),
          );
          setDesktopShowButtonFontColor(initialConfig.showButtonFontColor);
          setDesktopShowButtonFontWeight(
            String(initialConfig.showButtonFontWeight),
          );
          setDesktopShowButtonBorderColor(initialConfig.showButtonBorderColor);
          setDesktopShowButtonBorderWidth(
            String(initialConfig.showButtonBorderWidth),
          );
          setDesktopShowButtonBorderRadius(
            String(initialConfig.showButtonBorderRadius),
          );
          setDesktopShowButtonPaddingTop(
            String(initialConfig.showButtonPaddingTop),
          );
          setDesktopShowButtonPaddingBottom(
            String(initialConfig.showButtonPaddingBottom),
          );
          setDesktopShowButtonPaddingLeft(
            String(initialConfig.showButtonPaddingLeft),
          );
          setDesktopShowButtonPaddingRight(
            String(initialConfig.showButtonPaddingRight),
          );
        } else {
          setMobileShowButton(initialConfig.showButton);
          setMobileShowButtonHeight(String(initialConfig.showButtonHeight));
          setMobileShowMoreButtonText(initialConfig.showMoreButtonText);
          setMobileShowLessButtonText(initialConfig.showLessButtonText);
          setMobileShowButtonFontSize(String(initialConfig.showButtonFontSize));
          setMobileShowButtonFontColor(initialConfig.showButtonFontColor);
          setMobileShowButtonFontWeight(
            String(initialConfig.showButtonFontWeight),
          );
          setMobileShowButtonBorderColor(initialConfig.showButtonBorderColor);
          setMobileShowButtonBorderWidth(
            String(initialConfig.showButtonBorderWidth),
          );
          setMobileShowButtonBorderRadius(
            String(initialConfig.showButtonBorderRadius),
          );
          setMobileShowButtonPaddingTop(
            String(initialConfig.showButtonPaddingTop),
          );
          setMobileShowButtonPaddingBottom(
            String(initialConfig.showButtonPaddingBottom),
          );
          setMobileShowButtonPaddingLeft(
            String(initialConfig.showButtonPaddingLeft),
          );
          setMobileShowButtonPaddingRight(
            String(initialConfig.showButtonPaddingRight),
          );
        }
        break;
      case "animation":
        if (activeDevice === "desktop") {
          setDesktopAnimationType(initialConfig.animationType);
          setDesktopFollowingMarkerWidth(
            String(initialConfig.followingMarkerWidth),
          );
          setDesktopFollowingMarkerHeight(
            String(initialConfig.followingMarkerHeight),
          );
          setDesktopFollowingMarkerColor(initialConfig.followingMarkerColor);
          setDesktopFollowingMarkerOffset(
            String(initialConfig.followingMarkerOffset),
          );
          setDesktopFollowingMarkerBorderRadius(
            String(initialConfig.followingMarkerBorderRadius),
          );
          setDesktopCrawlingSnakeWidth(
            String(initialConfig.crawlingSnakeWidth),
          );
          setDesktopCrawlingSnakeHeight(
            String(initialConfig.crawlingSnakeHeight),
          );
          setDesktopCrawlingSnakeColor(initialConfig.crawlingSnakeColor);
          setDesktopCrawlingSnakeOffset(
            String(initialConfig.crawlingSnakeOffset),
          );
          setDesktopJumpingMarkerWidth(
            String(initialConfig.jumpingMarkerWidth),
          );
          setDesktopJumpingMarkerHeight(
            String(initialConfig.jumpingMarkerHeight),
          );
          setDesktopJumpingMarkerColor(initialConfig.jumpingMarkerColor);
          setDesktopJumpingMarkerOffset(
            String(initialConfig.jumpingMarkerOffset),
          );
          setDesktopJumpingMarkerBorderRadius(
            String(initialConfig.jumpingMarkerBorderRadius),
          );
        } else {
          setMobileAnimationType(initialConfig.animationType);
          setMobileFollowingMarkerWidth(
            String(initialConfig.followingMarkerWidth),
          );
          setMobileFollowingMarkerHeight(
            String(initialConfig.followingMarkerHeight),
          );
          setMobileFollowingMarkerColor(initialConfig.followingMarkerColor);
          setMobileFollowingMarkerOffset(
            String(initialConfig.followingMarkerOffset),
          );
          setMobileFollowingMarkerBorderRadius(
            String(initialConfig.followingMarkerBorderRadius),
          );
          setMobileCrawlingSnakeWidth(String(initialConfig.crawlingSnakeWidth));
          setMobileCrawlingSnakeHeight(
            String(initialConfig.crawlingSnakeHeight),
          );
          setMobileCrawlingSnakeColor(initialConfig.crawlingSnakeColor);
          setMobileCrawlingSnakeOffset(
            String(initialConfig.crawlingSnakeOffset),
          );
          setMobileJumpingMarkerWidth(String(initialConfig.jumpingMarkerWidth));
          setMobileJumpingMarkerHeight(
            String(initialConfig.jumpingMarkerHeight),
          );
          setMobileJumpingMarkerColor(initialConfig.jumpingMarkerColor);
          setMobileJumpingMarkerOffset(
            String(initialConfig.jumpingMarkerOffset),
          );
          setMobileJumpingMarkerBorderRadius(
            String(initialConfig.jumpingMarkerBorderRadius),
          );
        }
        break;
    }

    clearAppliedSection(section);
  };

  const applySectionToOtherDevice = (section: DeviceSectionKey) => {
    if (!activeDevice) {
      return;
    }

    const sourceConfig = currentConfig[activeDevice];
    const targetDevice = getOtherDevice(activeDevice);

    switch (section) {
      case "general": {
        const payload = getGeneralSectionApplyPayload(
          activeDevice,
          sourceConfig,
        );

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
      case "shadow":
        if (targetDevice === "desktop") {
          setDesktopShadowPreset(sourceConfig.shadowPreset);
          setDesktopShadowColor(sourceConfig.shadowColor);
        } else {
          setMobileShadowPreset(sourceConfig.shadowPreset);
          setMobileShadowColor(sourceConfig.shadowColor);
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
      case "offset":
        if (targetDevice === "desktop") {
          setDesktopOffsetTop(String(sourceConfig.offsetTop));
          setDesktopOffsetBottom(String(sourceConfig.offsetBottom));
          setDesktopOffsetLeft(String(sourceConfig.offsetLeft));
          setDesktopOffsetRight(String(sourceConfig.offsetRight));
        } else {
          setMobileOffsetTop(String(sourceConfig.offsetTop));
          setMobileOffsetBottom(String(sourceConfig.offsetBottom));
          setMobileOffsetLeft(String(sourceConfig.offsetLeft));
          setMobileOffsetRight(String(sourceConfig.offsetRight));
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
          setDesktopShowButtonPaddingTop(
            String(sourceConfig.showButtonPaddingTop),
          );
          setDesktopShowButtonPaddingBottom(
            String(sourceConfig.showButtonPaddingBottom),
          );
          setDesktopShowButtonPaddingLeft(
            String(sourceConfig.showButtonPaddingLeft),
          );
          setDesktopShowButtonPaddingRight(
            String(sourceConfig.showButtonPaddingRight),
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
          setMobileShowButtonPaddingTop(
            String(sourceConfig.showButtonPaddingTop),
          );
          setMobileShowButtonPaddingBottom(
            String(sourceConfig.showButtonPaddingBottom),
          );
          setMobileShowButtonPaddingLeft(
            String(sourceConfig.showButtonPaddingLeft),
          );
          setMobileShowButtonPaddingRight(
            String(sourceConfig.showButtonPaddingRight),
          );
        }
        break;
      case "animation":
        if (targetDevice === "desktop") {
          setDesktopAnimationType(sourceConfig.animationType);
        } else {
          setMobileAnimationType(sourceConfig.animationType);
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
    children: ReactNode,
    options?: { allowApplyAction?: boolean },
  ) => {
    if (!activeDevice) {
      return null;
    }

    const sectionState = getSectionState(section);
    const allowApplyAction = options?.allowApplyAction ?? true;
    const sharedProps = {
      label: SECTION_NAV_METADATA[section].label,
      icon: SECTION_NAV_METADATA[section].icon,
      sectionRef: (node: HTMLDivElement | null) => {
        sectionRefs.current[section] = node;
      },
      onEdit: () => clearAppliedSection(section),
      children,
    };

    const resetAction = sectionState.changedSinceSave ? (
      <s-clickable-chip
        color="strong"
        accessibilityLabel={`Reset ${SECTION_NAV_METADATA[section].label} to its initial state`}
        onClick={() => resetDeviceSectionToInitial(section)}
      >
        Reset
      </s-clickable-chip>
    ) : null;
    const applyAction =
      allowApplyAction && sectionState.showApplyAction ? (
        <s-clickable-chip
          color="strong"
          accessibilityLabel={`Apply this section to ${getDeviceLabel(getOtherDevice(activeDevice))}`}
          onClick={() => applySectionToOtherDevice(section)}
        >
          Apply to {getDeviceLabel(getOtherDevice(activeDevice))}
        </s-clickable-chip>
      ) : null;
    const syncAction = sectionState.isApplied ? (
      <s-badge tone="success" icon="check-circle">
        Applied
      </s-badge>
    ) : (
      applyAction
    );
    const action =
      resetAction || syncAction ? (
        <div className="toc-device-section__actions">
          {resetAction}
          {syncAction}
        </div>
      ) : null;

    return <DeviceSettingsSection.Section {...sharedProps} action={action} />;
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
      setEnableJsonLd,
      setCustomCss,
      setDesktopPosition,
      setDesktopPositionSelector,
      setDesktopSwitchToMobileOnFloatOverflow,
      setDesktopBorderColor,
      setDesktopBorderWidth,
      setDesktopBorderRadius,
      setDesktopShadowPreset,
      setDesktopShadowColor,
      setDesktopPaddingTop,
      setDesktopPaddingBottom,
      setDesktopPaddingLeft,
      setDesktopPaddingRight,
      setDesktopOffsetTop,
      setDesktopOffsetBottom,
      setDesktopOffsetLeft,
      setDesktopOffsetRight,
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
      setDesktopShowButtonPaddingTop,
      setDesktopShowButtonPaddingBottom,
      setDesktopShowButtonPaddingLeft,
      setDesktopShowButtonPaddingRight,
      setDesktopAnimationType,
      setDesktopFollowingMarkerWidth,
      setDesktopFollowingMarkerHeight,
      setDesktopFollowingMarkerColor,
      setDesktopFollowingMarkerOffset,
      setDesktopFollowingMarkerBorderRadius,
      setDesktopCrawlingSnakeWidth,
      setDesktopCrawlingSnakeHeight,
      setDesktopCrawlingSnakeColor,
      setDesktopCrawlingSnakeOffset,
      setDesktopJumpingMarkerWidth,
      setDesktopJumpingMarkerHeight,
      setDesktopJumpingMarkerColor,
      setDesktopJumpingMarkerOffset,
      setDesktopJumpingMarkerBorderRadius,
      setMobilePosition,
      setMobilePositionSelector,
      setMobileBorderColor,
      setMobileBorderWidth,
      setMobileBorderRadius,
      setMobileShadowPreset,
      setMobileShadowColor,
      setMobilePaddingTop,
      setMobilePaddingBottom,
      setMobilePaddingLeft,
      setMobilePaddingRight,
      setMobileOffsetTop,
      setMobileOffsetBottom,
      setMobileOffsetLeft,
      setMobileOffsetRight,
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
      setMobileShowButtonPaddingTop,
      setMobileShowButtonPaddingBottom,
      setMobileShowButtonPaddingLeft,
      setMobileShowButtonPaddingRight,
      setMobileAnimationType,
      setMobileFollowingMarkerWidth,
      setMobileFollowingMarkerHeight,
      setMobileFollowingMarkerColor,
      setMobileFollowingMarkerOffset,
      setMobileFollowingMarkerBorderRadius,
      setMobileCrawlingSnakeWidth,
      setMobileCrawlingSnakeHeight,
      setMobileCrawlingSnakeColor,
      setMobileCrawlingSnakeOffset,
      setMobileJumpingMarkerWidth,
      setMobileJumpingMarkerHeight,
      setMobileJumpingMarkerColor,
      setMobileJumpingMarkerOffset,
      setMobileJumpingMarkerBorderRadius,
    });
  }, [config]);

  useEffect(() => {
    setAppliedSections(createEmptyDeviceSectionApplyState());
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "general" || !customCssEditorViewRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      customCssEditorViewRef.current?.requestMeasure();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
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
    if (typeof window === "undefined") {
      return;
    }

    const updateEditorShellHeight = () => {
      const editorShell = editorShellRef.current;

      if (!editorShell) {
        return;
      }

      const top = editorShell.getBoundingClientRect().top;
      const nextHeight = `${Math.max(window.innerHeight - top - 16, 320)}px`;

      setEditorShellHeight((current) =>
        current === nextHeight ? current : nextHeight,
      );
    };

    updateEditorShellHeight();

    const frame = window.requestAnimationFrame(updateEditorShellHeight);
    window.addEventListener("resize", updateEditorShellHeight);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateEditorShellHeight);
    };
  }, []);

  const editorShellStyle = editorShellHeight
    ? ({
        "--toc-editor-shell-height": editorShellHeight,
      } as CSSProperties)
    : undefined;

  return (
    <PolarisAppProvider i18n={enTranslations}>
      <CrispChat />
      <s-page heading="Tocito settings">
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
        <div
          ref={editorShellRef}
          className="toc-editor-shell"
          style={editorShellStyle}
        >
          <EditorToolbar
            activeDevice={activeDevice}
            activeSectionNavItems={activeSectionNavItems}
            activeTab={activeTab}
            appEmbedStatus={appEmbedStatus}
            deepLink={deepLink}
            onTabChange={setActiveTab}
            onScrollToSection={scrollToSection}
          />
          <div className="toc-main-layout">
            <Form
              id={FORM_ID}
              method="post"
              className="toc-settings-form"
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
                  setEnableJsonLd,
                  setCustomCss,
                  setDesktopPosition,
                  setDesktopPositionSelector,
                  setDesktopSwitchToMobileOnFloatOverflow,
                  setDesktopBorderColor,
                  setDesktopBorderWidth,
                  setDesktopBorderRadius,
                  setDesktopShadowPreset,
                  setDesktopShadowColor,
                  setDesktopPaddingTop,
                  setDesktopPaddingBottom,
                  setDesktopPaddingLeft,
                  setDesktopPaddingRight,
                  setDesktopOffsetTop,
                  setDesktopOffsetBottom,
                  setDesktopOffsetLeft,
                  setDesktopOffsetRight,
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
                  setDesktopShowButtonPaddingTop,
                  setDesktopShowButtonPaddingBottom,
                  setDesktopShowButtonPaddingLeft,
                  setDesktopShowButtonPaddingRight,
                  setDesktopAnimationType,
                  setDesktopFollowingMarkerWidth,
                  setDesktopFollowingMarkerHeight,
                  setDesktopFollowingMarkerColor,
                  setDesktopFollowingMarkerOffset,
                  setDesktopFollowingMarkerBorderRadius,
                  setDesktopCrawlingSnakeWidth,
                  setDesktopCrawlingSnakeHeight,
                  setDesktopCrawlingSnakeColor,
                  setDesktopCrawlingSnakeOffset,
                  setDesktopJumpingMarkerWidth,
                  setDesktopJumpingMarkerHeight,
                  setDesktopJumpingMarkerColor,
                  setDesktopJumpingMarkerOffset,
                  setDesktopJumpingMarkerBorderRadius,
                  setMobilePosition,
                  setMobilePositionSelector,
                  setMobileBorderColor,
                  setMobileBorderWidth,
                  setMobileBorderRadius,
                  setMobileShadowPreset,
                  setMobileShadowColor,
                  setMobilePaddingTop,
                  setMobilePaddingBottom,
                  setMobilePaddingLeft,
                  setMobilePaddingRight,
                  setMobileOffsetTop,
                  setMobileOffsetBottom,
                  setMobileOffsetLeft,
                  setMobileOffsetRight,
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
                  setMobileShowButtonPaddingTop,
                  setMobileShowButtonPaddingBottom,
                  setMobileShowButtonPaddingLeft,
                  setMobileShowButtonPaddingRight,
                  setMobileAnimationType,
                  setMobileFollowingMarkerWidth,
                  setMobileFollowingMarkerHeight,
                  setMobileFollowingMarkerColor,
                  setMobileFollowingMarkerOffset,
                  setMobileFollowingMarkerBorderRadius,
                  setMobileCrawlingSnakeWidth,
                  setMobileCrawlingSnakeHeight,
                  setMobileCrawlingSnakeColor,
                  setMobileCrawlingSnakeOffset,
                  setMobileJumpingMarkerWidth,
                  setMobileJumpingMarkerHeight,
                  setMobileJumpingMarkerColor,
                  setMobileJumpingMarkerOffset,
                  setMobileJumpingMarkerBorderRadius,
                });
                setAppliedSections(createEmptyDeviceSectionApplyState());
              }}
            >
              <s-stack direction="block" gap="base">
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
                <div
                  className={`toc-tab-panel${activeTab === "general" ? "" : " toc-tab-panel--hidden"}`}
                  aria-hidden={activeTab === "general" ? undefined : "true"}
                >
                  <>
                    <div
                      ref={(node) => {
                        sectionRefs.current.generalSettings = node;
                      }}
                      className="toc-editor-section"
                    >
                      <s-section>
                        <TocSectionHeading
                          icon={SECTION_NAV_METADATA.generalSettings.icon}
                          label={SECTION_NAV_METADATA.generalSettings.label}
                        />
                        <s-stack direction="block" gap="base">
                          <s-text-field
                            name="title"
                            label="Title"
                            details="Shown above the table of contents."
                            value={title}
                            onInput={(event) =>
                              setTitle(event.currentTarget.value)
                            }
                            onChange={(event) =>
                              setTitle(event.currentTarget.value)
                            }
                          ></s-text-field>
                          <div className="toc-field">
                            <s-text>Headings to include</s-text>
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
                                        ? normalizeHeadingLevels([
                                            ...current,
                                            level,
                                          ])
                                        : current.filter(
                                            (currentLevel) =>
                                              currentLevel !== level,
                                          );

                                      return next.length ? next : current;
                                    });
                                  }}
                                ></s-checkbox>
                              ))}
                            </div>
                            <div className="toc-field-details">
                              Choose which heading levels to show in the table
                              of contents.
                            </div>
                          </div>
                          <s-text-field
                            name="minHeadings"
                            label="Minimum headings required"
                            details="Hide the table of contents until this number of selected headings is found."
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
                            details="Apply mobile settings at this width and below."
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
                            label="Hide on blog posts"
                            details="Hide the table of contents on these blog posts. Use comma-separated article IDs, exact tags, or wildcard patterns like news/*"
                            placeholder="news/*, news/today-is-the-best-day, 671373295959"
                            value={excludedBlogs}
                            onInput={(event) =>
                              setExcludedBlogs(event.currentTarget.value)
                            }
                            onChange={(event) =>
                              setExcludedBlogs(event.currentTarget.value)
                            }
                          ></s-text-field>
                          <s-checkbox
                            name="enableJsonLd"
                            label="Enable SEO JSON-LD schema"
                            details="Add structured data for the generated table of contents links."
                            checked={enableJsonLd}
                            onChange={(event) =>
                              setEnableJsonLd(event.currentTarget.checked)
                            }
                          ></s-checkbox>
                        </s-stack>
                      </s-section>
                    </div>
                    <div
                      ref={(node) => {
                        sectionRefs.current.textFormatting = node;
                      }}
                      className="toc-editor-section"
                    >
                      <s-section>
                        <TocSectionHeading
                          icon={SECTION_NAV_METADATA.textFormatting.icon}
                          label={SECTION_NAV_METADATA.textFormatting.label}
                        />
                        <s-stack direction="block" gap="base">
                          <s-select
                            name="textAlignment"
                            label="Text alignment"
                            details="Choose how the heading and links are aligned."
                            value={textAlignment}
                            onChange={(event) =>
                              setTextAlignment(
                                normalizeTextAlignment(
                                  event.currentTarget.value,
                                ),
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
                            label="List style"
                            details="Choose whether to show no marker, bullets, or numbers."
                            value={markerFormat}
                            onChange={(event) =>
                              setMarkerFormat(
                                normalizeMarkerFormat(
                                  event.currentTarget.value,
                                ),
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
                            label="Indent nested items"
                            details="Show lower-level headings as nested items."
                            checked={
                              textAlignment === "center" ? false : indentation
                            }
                            disabled={textAlignment === "center"}
                            onChange={(event) =>
                              setIndentation(event.currentTarget.checked)
                            }
                          ></s-checkbox>
                        </s-stack>
                      </s-section>
                    </div>
                    <div
                      ref={(node) => {
                        sectionRefs.current.advancedSettings = node;
                      }}
                      className="toc-editor-section"
                    >
                      <s-section>
                        <TocSectionHeading
                          icon={SECTION_NAV_METADATA.advancedSettings.icon}
                          label={SECTION_NAV_METADATA.advancedSettings.label}
                        />
                        <div className="toc-field">
                          <div className="toc-code-field">
                            <span className="toc-code-field__label">
                              Custom CSS
                            </span>
                            <span className="toc-field-details">
                              These class names work on both desktop and mobile.
                              Use {CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN} for
                              mobile-only rules.
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
                                onCreateEditor={(view) => {
                                  customCssEditorViewRef.current = view;
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </s-section>
                    </div>
                  </>
                </div>
                {activeDeviceForm ? (
                  <>
                    {renderDeviceSection(
                      "general",
                      <s-stack direction="block" gap="base">
                        {activeDeviceForm.kind === "desktop" ? (
                          <input
                            type="hidden"
                            name="desktopSwitchToMobileOnFloatOverflow"
                            value={
                              activeDeviceForm.general
                                .switchToMobileOnFloatOverflow
                                ? "on"
                                : ""
                            }
                          />
                        ) : null}
                        <s-select
                          name={`${activeDeviceForm.namePrefix}Position`}
                          label="Placement"
                          value={activeDeviceForm.general.position}
                          onChange={(event) => {
                            activeDeviceForm.general.setPosition(
                              event.currentTarget.value,
                            );
                          }}
                        >
                          {activeDeviceForm.positionOptions.map((option) => (
                            <s-option key={option.value} value={option.value}>
                              {option.label}
                            </s-option>
                          ))}
                        </s-select>
                        {activeDeviceForm.general.showFloatOverflowToggle ? (
                          <div className="toc-field">
                            <s-checkbox
                              label="Use mobile layout when desktop layout no longer fits"
                              checked={
                                activeDeviceForm.general
                                  .switchToMobileOnFloatOverflow
                              }
                              onChange={(event) =>
                                activeDeviceForm.general.setSwitchToMobileOnFloatOverflow(
                                  event.currentTarget.checked,
                                )
                              }
                            ></s-checkbox>
                            <div className="toc-field-details">
                              Automatically switch to the mobile layout when the
                              desktop TOC no longer fits beside the article.
                            </div>
                          </div>
                        ) : null}
                        {activeDeviceForm.general.position ===
                        "css-selector" ? (
                          <s-text-field
                            name={`${activeDeviceForm.namePrefix}PositionSelector`}
                            label="Inside selected element"
                            details={activeDeviceForm.positionSelectorDetails}
                            value={activeDeviceForm.general.positionSelector}
                            onInput={(event) =>
                              activeDeviceForm.general.setPositionSelector(
                                event.currentTarget.value,
                              )
                            }
                            onChange={(event) =>
                              activeDeviceForm.general.setPositionSelector(
                                event.currentTarget.value,
                              )
                            }
                          ></s-text-field>
                        ) : null}
                        <s-color-field
                          name={`${activeDeviceForm.namePrefix}Background`}
                          label="Background color"
                          alpha
                          value={activeDeviceForm.general.background}
                          onInput={(event) =>
                            activeDeviceForm.general.setBackground(
                              event.currentTarget.value,
                            )
                          }
                          onChange={(event) =>
                            activeDeviceForm.general.setBackground(
                              event.currentTarget.value,
                            )
                          }
                        ></s-color-field>
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}MaxWidth`}
                          label="Maximum width"
                          details="Set the maximum width of the table of contents. Use 0 for no limit."
                          range={SLIDER_RANGES.maxWidth}
                          value={activeDeviceForm.general.maxWidth}
                          onValueChange={activeDeviceForm.general.setMaxWidth}
                        />
                      </s-stack>,
                    )}
                    {renderDeviceSection(
                      "title",
                      <s-stack direction="block" gap="base">
                        <s-checkbox
                          name={`${activeDeviceForm.namePrefix}ShowTitle`}
                          label="Show title"
                          checked={activeDeviceForm.title.showTitle}
                          onChange={(event) =>
                            activeDeviceForm.title.setShowTitle(
                              event.currentTarget.checked,
                            )
                          }
                        ></s-checkbox>
                        <div className="toc-compact-fields">
                          <s-color-field
                            name={`${activeDeviceForm.namePrefix}TitleFontColor`}
                            label="Text color"
                            alpha
                            disabled={!isTitleEnabled}
                            value={activeDeviceForm.title.fontColor}
                            onInput={(event) =>
                              activeDeviceForm.title.setFontColor(
                                event.currentTarget.value,
                              )
                            }
                            onChange={(event) =>
                              activeDeviceForm.title.setFontColor(
                                event.currentTarget.value,
                              )
                            }
                          ></s-color-field>
                          <s-select
                            name={`${activeDeviceForm.namePrefix}TitleFontWeight`}
                            label="Font weight"
                            disabled={!isTitleEnabled}
                            value={activeDeviceForm.title.fontWeight}
                            onChange={(event) =>
                              activeDeviceForm.title.setFontWeight(
                                event.currentTarget.value,
                              )
                            }
                          >
                            {FONT_WEIGHT_OPTIONS.map((option) => (
                              <s-option key={option.value} value={option.value}>
                                {option.label}
                              </s-option>
                            ))}
                          </s-select>

                          <TocSliderField
                            name={`${activeDeviceForm.namePrefix}TitleFontSize`}
                            label="Font size"
                            range={SLIDER_RANGES.fontSize}
                            disabled={!isTitleEnabled}
                            value={activeDeviceForm.title.fontSize}
                            onValueChange={activeDeviceForm.title.setFontSize}
                          />
                        </div>
                      </s-stack>,
                    )}
                    {renderDeviceSection(
                      "headings",
                      <div className="toc-compact-fields">
                        <s-color-field
                          name={`${activeDeviceForm.namePrefix}HeadingsFontColor`}
                          label="Color"
                          alpha
                          value={activeDeviceForm.headings.fontColor}
                          onInput={(event) =>
                            activeDeviceForm.headings.setFontColor(
                              event.currentTarget.value,
                            )
                          }
                          onChange={(event) =>
                            activeDeviceForm.headings.setFontColor(
                              event.currentTarget.value,
                            )
                          }
                        ></s-color-field>
                        <s-select
                          name={`${activeDeviceForm.namePrefix}HeadingsFontWeight`}
                          label="Font weight"
                          value={activeDeviceForm.headings.fontWeight}
                          onChange={(event) =>
                            activeDeviceForm.headings.setFontWeight(
                              event.currentTarget.value,
                            )
                          }
                        >
                          {FONT_WEIGHT_OPTIONS.map((option) => (
                            <s-option key={option.value} value={option.value}>
                              {option.label}
                            </s-option>
                          ))}
                        </s-select>
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}HeadingsFontSize`}
                          label="Font size"
                          range={SLIDER_RANGES.fontSize}
                          value={activeDeviceForm.headings.fontSize}
                          onValueChange={activeDeviceForm.headings.setFontSize}
                        />
                      </div>,
                    )}
                    {renderDeviceSection(
                      "border",
                      <div className="toc-compact-fields">
                        <s-color-field
                          name={`${activeDeviceForm.namePrefix}BorderColor`}
                          label="Border color"
                          alpha
                          value={activeDeviceForm.border.color}
                          onInput={(event) =>
                            activeDeviceForm.border.setColor(
                              event.currentTarget.value,
                            )
                          }
                          onChange={(event) =>
                            activeDeviceForm.border.setColor(
                              event.currentTarget.value,
                            )
                          }
                        ></s-color-field>
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}BorderWidth`}
                          label="Corder width"
                          range={SLIDER_RANGES.borderWidth}
                          value={activeDeviceForm.border.width}
                          onValueChange={activeDeviceForm.border.setWidth}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}BorderRadius`}
                          label="Cornder radius"
                          range={SLIDER_RANGES.borderRadius}
                          value={activeDeviceForm.border.radius}
                          onValueChange={activeDeviceForm.border.setRadius}
                        />
                      </div>,
                    )}
                    {renderDeviceSection(
                      "shadow",
                      <s-stack direction="block" gap="base">
                        <s-select
                          name={`${activeDeviceForm.namePrefix}ShadowPreset`}
                          label="Shadow style"
                          value={activeDeviceForm.shadow.preset}
                          onChange={(event) => {
                            const value = normalizeShadowPreset(
                              event.currentTarget.value,
                            );
                            activeDeviceForm.shadow.setPreset(value);
                          }}
                        >
                          {SHADOW_PRESET_OPTIONS.map((option) => (
                            <s-option key={option.value} value={option.value}>
                              {option.label}
                            </s-option>
                          ))}
                        </s-select>
                        <s-color-field
                          name={`${activeDeviceForm.namePrefix}ShadowColor`}
                          label="Shadow color"
                          alpha
                          value={activeDeviceForm.shadow.color}
                          onInput={(event) =>
                            activeDeviceForm.shadow.setColor(
                              event.currentTarget.value,
                            )
                          }
                          onChange={(event) =>
                            activeDeviceForm.shadow.setColor(
                              event.currentTarget.value,
                            )
                          }
                        ></s-color-field>
                      </s-stack>,
                    )}
                    {renderDeviceSection(
                      "padding",
                      <div className="toc-compact-fields-four">
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}PaddingTop`}
                          label="Top"
                          range={SLIDER_RANGES.padding}
                          value={activeDeviceForm.padding.top}
                          onValueChange={activeDeviceForm.padding.setTop}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}PaddingBottom`}
                          label="Bottom"
                          range={SLIDER_RANGES.padding}
                          value={activeDeviceForm.padding.bottom}
                          onValueChange={activeDeviceForm.padding.setBottom}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}PaddingLeft`}
                          label="Left"
                          range={SLIDER_RANGES.padding}
                          value={activeDeviceForm.padding.left}
                          onValueChange={activeDeviceForm.padding.setLeft}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}PaddingRight`}
                          label="Right"
                          range={SLIDER_RANGES.padding}
                          value={activeDeviceForm.padding.right}
                          onValueChange={activeDeviceForm.padding.setRight}
                        />
                      </div>,
                    )}
                    {renderDeviceSection(
                      "offset",
                      <div className="toc-compact-fields-four">
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}OffsetTop`}
                          label="Top"
                          range={SLIDER_RANGES.layoutOffset}
                          value={activeDeviceForm.offset.top}
                          onValueChange={activeDeviceForm.offset.setTop}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}OffsetBottom`}
                          label="Bottom"
                          range={SLIDER_RANGES.layoutOffset}
                          value={activeDeviceForm.offset.bottom}
                          onValueChange={activeDeviceForm.offset.setBottom}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}OffsetLeft`}
                          label="Left"
                          range={SLIDER_RANGES.layoutOffset}
                          value={activeDeviceForm.offset.left}
                          onValueChange={activeDeviceForm.offset.setLeft}
                        />
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}OffsetRight`}
                          label="Right"
                          range={SLIDER_RANGES.layoutOffset}
                          value={activeDeviceForm.offset.right}
                          onValueChange={activeDeviceForm.offset.setRight}
                        />
                      </div>,
                    )}
                    {renderDeviceSection(
                      "scroll",
                      <s-stack direction="block" gap="base">
                        <s-checkbox
                          name={`${activeDeviceForm.namePrefix}SmoothScroll`}
                          label="Enable smooth scroll"
                          details="Smoothly scroll to the selected heading when a table of contents link is clicked."
                          checked={activeDeviceForm.scroll.smoothScroll}
                          onChange={(event) =>
                            activeDeviceForm.scroll.setSmoothScroll(
                              event.currentTarget.checked,
                            )
                          }
                        ></s-checkbox>
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}ScrollOffset`}
                          label="Scroll offset"
                          details="Top offset in pixels"
                          range={SLIDER_RANGES.scrollOffset}
                          value={activeDeviceForm.scroll.offset}
                          onValueChange={activeDeviceForm.scroll.setOffset}
                        />
                      </s-stack>,
                    )}
                    {renderDeviceSection(
                      "showButton",
                      <s-stack direction="block" gap="base">
                        <s-checkbox
                          name={`${activeDeviceForm.namePrefix}ShowButton`}
                          label="Enable show more"
                          checked={activeDeviceForm.showButton.enabled}
                          onChange={(event) =>
                            activeDeviceForm.showButton.setEnabled(
                              event.currentTarget.checked,
                            )
                          }
                        ></s-checkbox>
                        <TocSliderField
                          name={`${activeDeviceForm.namePrefix}ShowButtonHeight`}
                          label="Collapsed height"
                          details="Show the button when the table of contents exceeds this height."
                          range={SLIDER_RANGES.collapsedHeight}
                          disabled={!isShowMoreEnabled}
                          value={activeDeviceForm.showButton.height}
                          onValueChange={activeDeviceForm.showButton.setHeight}
                        />
                        <div className="toc-subsection">
                          <p className="toc-subsection-title">Text</p>
                          <div className="toc-compact-fields-two">
                            <s-text-field
                              name={`${activeDeviceForm.namePrefix}ShowMoreButtonText`}
                              label="Show more"
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.showMoreText}
                              onInput={(event) =>
                                activeDeviceForm.showButton.setShowMoreText(
                                  event.currentTarget.value,
                                )
                              }
                              onChange={(event) =>
                                activeDeviceForm.showButton.setShowMoreText(
                                  event.currentTarget.value,
                                )
                              }
                            ></s-text-field>
                            <s-text-field
                              name={`${activeDeviceForm.namePrefix}ShowLessButtonText`}
                              label="Show less"
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.showLessText}
                              onInput={(event) =>
                                activeDeviceForm.showButton.setShowLessText(
                                  event.currentTarget.value,
                                )
                              }
                              onChange={(event) =>
                                activeDeviceForm.showButton.setShowLessText(
                                  event.currentTarget.value,
                                )
                              }
                            ></s-text-field>
                          </div>
                        </div>
                        <div className="toc-subsection">
                          <p className="toc-subsection-title">Padding</p>
                          <div className="toc-compact-fields-two">
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonPaddingTop`}
                              label="Top"
                              range={SLIDER_RANGES.padding}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.paddingTop}
                              onValueChange={
                                activeDeviceForm.showButton.setPaddingTop
                              }
                            />
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonPaddingBottom`}
                              label="Bottom"
                              range={SLIDER_RANGES.padding}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.paddingBottom}
                              onValueChange={
                                activeDeviceForm.showButton.setPaddingBottom
                              }
                            />
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonPaddingLeft`}
                              label="Left"
                              range={SLIDER_RANGES.padding}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.paddingLeft}
                              onValueChange={
                                activeDeviceForm.showButton.setPaddingLeft
                              }
                            />
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonPaddingRight`}
                              label="Right"
                              range={SLIDER_RANGES.padding}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.paddingRight}
                              onValueChange={
                                activeDeviceForm.showButton.setPaddingRight
                              }
                            />
                          </div>
                        </div>
                        <div className="toc-subsection">
                          <p className="toc-subsection-title">Font</p>
                          <div className="toc-compact-fields">
                            <s-color-field
                              name={`${activeDeviceForm.namePrefix}ShowButtonFontColor`}
                              label="Color"
                              alpha
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.fontColor}
                              onInput={(event) =>
                                activeDeviceForm.showButton.setFontColor(
                                  event.currentTarget.value,
                                )
                              }
                              onChange={(event) =>
                                activeDeviceForm.showButton.setFontColor(
                                  event.currentTarget.value,
                                )
                              }
                            ></s-color-field>
                            <s-select
                              name={`${activeDeviceForm.namePrefix}ShowButtonFontWeight`}
                              label="Weight"
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.fontWeight}
                              onChange={(event) =>
                                activeDeviceForm.showButton.setFontWeight(
                                  event.currentTarget.value,
                                )
                              }
                            >
                              {FONT_WEIGHT_OPTIONS.map((option) => (
                                <s-option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </s-option>
                              ))}
                            </s-select>
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonFontSize`}
                              label="Size"
                              range={SLIDER_RANGES.fontSize}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.fontSize}
                              onValueChange={
                                activeDeviceForm.showButton.setFontSize
                              }
                            />
                          </div>
                        </div>
                        <div className="toc-subsection">
                          <p className="toc-subsection-title">Border</p>
                          <div className="toc-compact-fields">
                            <s-color-field
                              name={`${activeDeviceForm.namePrefix}ShowButtonBorderColor`}
                              label="Color"
                              alpha
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.borderColor}
                              onInput={(event) =>
                                activeDeviceForm.showButton.setBorderColor(
                                  event.currentTarget.value,
                                )
                              }
                              onChange={(event) =>
                                activeDeviceForm.showButton.setBorderColor(
                                  event.currentTarget.value,
                                )
                              }
                            ></s-color-field>
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonBorderWidth`}
                              label="Width"
                              range={SLIDER_RANGES.borderWidth}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.borderWidth}
                              onValueChange={
                                activeDeviceForm.showButton.setBorderWidth
                              }
                            />
                            <TocSliderField
                              name={`${activeDeviceForm.namePrefix}ShowButtonBorderRadius`}
                              label="Corner radius"
                              range={SLIDER_RANGES.borderRadius}
                              disabled={!isShowMoreEnabled}
                              value={activeDeviceForm.showButton.borderRadius}
                              onValueChange={
                                activeDeviceForm.showButton.setBorderRadius
                              }
                            />
                          </div>
                        </div>
                      </s-stack>,
                    )}
                    {activeTab === "desktop"
                      ? renderDeviceSection(
                          "animation",
                          <s-stack direction="block" gap="base">
                            <s-select
                              name="desktopAnimationType"
                              label="Type"
                              value={desktopAnimationType}
                              onChange={(event) => {
                                setDesktopAnimationType(
                                  normalizeAnimationType(
                                    event.currentTarget.value,
                                  ),
                                );
                              }}
                            >
                              {ANIMATION_TYPE_OPTIONS.map((option) => (
                                <s-option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </s-option>
                              ))}
                            </s-select>
                            {desktopFollowingMarkerSelected ? (
                              <>
                                <s-color-field
                                  name="desktopFollowingMarkerColor"
                                  label="Color"
                                  alpha
                                  value={desktopFollowingMarkerColor}
                                  onInput={(event) =>
                                    setDesktopFollowingMarkerColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                  onChange={(event) =>
                                    setDesktopFollowingMarkerColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                ></s-color-field>
                                <TocSliderField
                                  name="desktopFollowingMarkerBorderRadius"
                                  label="Roundness"
                                  range={SLIDER_RANGES.markerRadius}
                                  value={desktopFollowingMarkerBorderRadius}
                                  onValueChange={
                                    setDesktopFollowingMarkerBorderRadius
                                  }
                                />
                                <TocSliderField
                                  name="desktopFollowingMarkerWidth"
                                  label="Width"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopFollowingMarkerWidth}
                                  onValueChange={setDesktopFollowingMarkerWidth}
                                />
                                <TocSliderField
                                  name="desktopFollowingMarkerHeight"
                                  label="Height"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopFollowingMarkerHeight}
                                  onValueChange={
                                    setDesktopFollowingMarkerHeight
                                  }
                                />
                                <TocSliderField
                                  name="desktopFollowingMarkerOffset"
                                  label="Offset"
                                  range={SLIDER_RANGES.markerOffset}
                                  value={desktopFollowingMarkerOffset}
                                  onValueChange={
                                    setDesktopFollowingMarkerOffset
                                  }
                                />
                              </>
                            ) : null}
                            {desktopCrawlingSnakeSelected ? (
                              <>
                                <s-color-field
                                  name="desktopCrawlingSnakeColor"
                                  label="Color"
                                  alpha
                                  value={desktopCrawlingSnakeColor}
                                  onInput={(event) =>
                                    setDesktopCrawlingSnakeColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                  onChange={(event) =>
                                    setDesktopCrawlingSnakeColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                ></s-color-field>
                                <TocSliderField
                                  name="desktopCrawlingSnakeWidth"
                                  label="Width"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopCrawlingSnakeWidth}
                                  onValueChange={setDesktopCrawlingSnakeWidth}
                                />
                                <TocSliderField
                                  name="desktopCrawlingSnakeHeight"
                                  label="Height"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopCrawlingSnakeHeight}
                                  onValueChange={setDesktopCrawlingSnakeHeight}
                                />
                                <TocSliderField
                                  name="desktopCrawlingSnakeOffset"
                                  label="Offset"
                                  range={SLIDER_RANGES.markerOffset}
                                  value={desktopCrawlingSnakeOffset}
                                  onValueChange={setDesktopCrawlingSnakeOffset}
                                />
                              </>
                            ) : null}
                            {desktopJumpingMarkerSelected ? (
                              <>
                                <s-color-field
                                  name="desktopJumpingMarkerColor"
                                  label="Color"
                                  alpha
                                  value={desktopJumpingMarkerColor}
                                  onInput={(event) =>
                                    setDesktopJumpingMarkerColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                  onChange={(event) =>
                                    setDesktopJumpingMarkerColor(
                                      event.currentTarget.value,
                                    )
                                  }
                                ></s-color-field>
                                <TocSliderField
                                  name="desktopJumpingMarkerBorderRadius"
                                  label="Roundness"
                                  range={SLIDER_RANGES.markerRadius}
                                  value={desktopJumpingMarkerBorderRadius}
                                  onValueChange={
                                    setDesktopJumpingMarkerBorderRadius
                                  }
                                />
                                <TocSliderField
                                  name="desktopJumpingMarkerWidth"
                                  label="Width"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopJumpingMarkerWidth}
                                  onValueChange={setDesktopJumpingMarkerWidth}
                                />
                                <TocSliderField
                                  name="desktopJumpingMarkerHeight"
                                  label="Height"
                                  range={SLIDER_RANGES.markerSize}
                                  value={desktopJumpingMarkerHeight}
                                  onValueChange={setDesktopJumpingMarkerHeight}
                                />
                                <TocSliderField
                                  name="desktopJumpingMarkerOffset"
                                  label="Offset"
                                  range={SLIDER_RANGES.markerOffset}
                                  value={desktopJumpingMarkerOffset}
                                  onValueChange={setDesktopJumpingMarkerOffset}
                                />
                              </>
                            ) : null}
                          </s-stack>,
                          { allowApplyAction: false },
                        )
                      : null}
                  </>
                ) : null}
                {actionData?.userErrors?.length ? (
                  <s-paragraph>
                    {actionData.userErrors
                      .map((error: { message: string }) => error.message)
                      .join(" ")}
                  </s-paragraph>
                ) : null}
              </s-stack>
            </Form>
            {renderPreviewPanel()}
          </div>
        </div>
      </s-page>
    </PolarisAppProvider>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
