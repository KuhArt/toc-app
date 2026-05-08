import {
  ANIMATION_TYPE_OPTIONS,
  CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN,
  DEFAULT_CONFIG,
  DESKTOP_POSITION_OPTIONS,
  DEVICE_SECTION_FIELDS,
  HEADING_LEVEL_OPTIONS,
  MARKER_FORMAT_OPTIONS,
  MOBILE_POSITION_OPTIONS,
  SHADOW_PRESET_OPTIONS,
  TEXT_ALIGNMENT_OPTIONS,
} from "./constants";
import type {
  DeviceSectionApplyState,
  DeviceSectionKey,
  DeviceTab,
  TocAnimationType,
  TocConfig,
  TocConfigInput,
  TocDesktopPosition,
  TocDeviceConfig,
  TocDeviceConfigInput,
  TocMarkerFormat,
  TocMobilePosition,
  TocShadowPreset,
  TocTextAlignment,
} from "./types";

type GeneralSectionApplyPayload = Pick<
  TocDeviceConfig,
  "background" | "maxWidth"
> &
  Partial<Pick<TocDeviceConfig, "position" | "positionSelector">>;

export type TocFormControls = {
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
  setDesktopSwitchToMobileOnFloatOverflow: (value: boolean) => void;
  setDesktopBorderColor: (value: string) => void;
  setDesktopBorderWidth: (value: string) => void;
  setDesktopBorderRadius: (value: string) => void;
  setDesktopShadowPreset: (value: TocShadowPreset) => void;
  setDesktopShadowColor: (value: string) => void;
  setDesktopPaddingTop: (value: string) => void;
  setDesktopPaddingBottom: (value: string) => void;
  setDesktopPaddingLeft: (value: string) => void;
  setDesktopPaddingRight: (value: string) => void;
  setDesktopOffsetTop: (value: string) => void;
  setDesktopOffsetBottom: (value: string) => void;
  setDesktopOffsetLeft: (value: string) => void;
  setDesktopOffsetRight: (value: string) => void;
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
  setDesktopShowButtonPaddingTop: (value: string) => void;
  setDesktopShowButtonPaddingBottom: (value: string) => void;
  setDesktopShowButtonPaddingLeft: (value: string) => void;
  setDesktopShowButtonPaddingRight: (value: string) => void;
  setDesktopAnimationType: (value: TocAnimationType) => void;
  setDesktopFollowingMarkerWidth: (value: string) => void;
  setDesktopFollowingMarkerHeight: (value: string) => void;
  setDesktopFollowingMarkerColor: (value: string) => void;
  setDesktopFollowingMarkerOffset: (value: string) => void;
  setDesktopFollowingMarkerBorderRadius: (value: string) => void;
  setDesktopCrawlingSnakeWidth: (value: string) => void;
  setDesktopCrawlingSnakeHeight: (value: string) => void;
  setDesktopCrawlingSnakeColor: (value: string) => void;
  setDesktopCrawlingSnakeOffset: (value: string) => void;
  setDesktopJumpingMarkerWidth: (value: string) => void;
  setDesktopJumpingMarkerHeight: (value: string) => void;
  setDesktopJumpingMarkerColor: (value: string) => void;
  setDesktopJumpingMarkerOffset: (value: string) => void;
  setDesktopJumpingMarkerBorderRadius: (value: string) => void;
  setMobilePosition: (value: TocMobilePosition) => void;
  setMobilePositionSelector: (value: string) => void;
  setMobileBorderColor: (value: string) => void;
  setMobileBorderWidth: (value: string) => void;
  setMobileBorderRadius: (value: string) => void;
  setMobileShadowPreset: (value: TocShadowPreset) => void;
  setMobileShadowColor: (value: string) => void;
  setMobilePaddingTop: (value: string) => void;
  setMobilePaddingBottom: (value: string) => void;
  setMobilePaddingLeft: (value: string) => void;
  setMobilePaddingRight: (value: string) => void;
  setMobileOffsetTop: (value: string) => void;
  setMobileOffsetBottom: (value: string) => void;
  setMobileOffsetLeft: (value: string) => void;
  setMobileOffsetRight: (value: string) => void;
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
  setMobileShowButtonPaddingTop: (value: string) => void;
  setMobileShowButtonPaddingBottom: (value: string) => void;
  setMobileShowButtonPaddingLeft: (value: string) => void;
  setMobileShowButtonPaddingRight: (value: string) => void;
  setMobileAnimationType: (value: TocAnimationType) => void;
  setMobileFollowingMarkerWidth: (value: string) => void;
  setMobileFollowingMarkerHeight: (value: string) => void;
  setMobileFollowingMarkerColor: (value: string) => void;
  setMobileFollowingMarkerOffset: (value: string) => void;
  setMobileFollowingMarkerBorderRadius: (value: string) => void;
  setMobileCrawlingSnakeWidth: (value: string) => void;
  setMobileCrawlingSnakeHeight: (value: string) => void;
  setMobileCrawlingSnakeColor: (value: string) => void;
  setMobileCrawlingSnakeOffset: (value: string) => void;
  setMobileJumpingMarkerWidth: (value: string) => void;
  setMobileJumpingMarkerHeight: (value: string) => void;
  setMobileJumpingMarkerColor: (value: string) => void;
  setMobileJumpingMarkerOffset: (value: string) => void;
  setMobileJumpingMarkerBorderRadius: (value: string) => void;
};

export function createEmptyDeviceSectionApplyState(): DeviceSectionApplyState {
  return { desktop: {}, mobile: {} };
}

export function getOtherDevice(device: DeviceTab): DeviceTab {
  return device === "desktop" ? "mobile" : "desktop";
}

export function getDeviceLabel(device: DeviceTab): "Desktop" | "Mobile" {
  return device === "desktop" ? "Desktop" : "Mobile";
}

export function deviceSectionFieldsEqual(
  left: TocDeviceConfig,
  right: TocDeviceConfig,
  section: DeviceSectionKey,
) {
  return DEVICE_SECTION_FIELDS[section].every(
    (field) => left[field] === right[field],
  );
}

export function getGeneralSectionApplyPayload(
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

export function isDesktopFloatPosition(
  value: string,
): value is Extract<TocDesktopPosition, "float-left" | "float-right"> {
  return value === "float-left" || value === "float-right";
}

export function deviceSectionDiffersForApply(
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

export function parseConfig(value: unknown): TocConfig {
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

export function applyConfigToForm(config: TocConfig, controls: TocFormControls) {
  controls.setTitle(config.title);
  controls.setHeadingLevels(normalizeHeadingLevels(config.headingLevels));
  controls.setIndentation(config.indentation);
  controls.setTextAlignment(config.textAlignment);
  controls.setMarkerFormat(config.markerFormat);
  controls.setMinHeadings(String(config.minHeadings));
  controls.setMobileBreakpoint(String(config.mobileBreakpoint));
  controls.setExcludedBlogs(config.excludedBlogs);
  controls.setCustomCss(config.customCss);
  controls.setDesktopPosition(normalizeDesktopPosition(config.desktop.position));
  controls.setDesktopPositionSelector(config.desktop.positionSelector);
  controls.setDesktopSwitchToMobileOnFloatOverflow(
    config.desktop.switchToMobileOnFloatOverflow,
  );
  controls.setDesktopBorderColor(config.desktop.color);
  controls.setDesktopBorderWidth(String(config.desktop.width));
  controls.setDesktopBorderRadius(String(config.desktop.radius));
  controls.setDesktopShadowPreset(config.desktop.shadowPreset);
  controls.setDesktopShadowColor(config.desktop.shadowColor);
  controls.setDesktopPaddingTop(String(config.desktop.paddingTop));
  controls.setDesktopPaddingBottom(String(config.desktop.paddingBottom));
  controls.setDesktopPaddingLeft(String(config.desktop.paddingLeft));
  controls.setDesktopPaddingRight(String(config.desktop.paddingRight));
  controls.setDesktopOffsetTop(String(config.desktop.offsetTop));
  controls.setDesktopOffsetBottom(String(config.desktop.offsetBottom));
  controls.setDesktopOffsetLeft(String(config.desktop.offsetLeft));
  controls.setDesktopOffsetRight(String(config.desktop.offsetRight));
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
  controls.setDesktopShowButtonPaddingTop(
    String(config.desktop.showButtonPaddingTop),
  );
  controls.setDesktopShowButtonPaddingBottom(
    String(config.desktop.showButtonPaddingBottom),
  );
  controls.setDesktopShowButtonPaddingLeft(
    String(config.desktop.showButtonPaddingLeft),
  );
  controls.setDesktopShowButtonPaddingRight(
    String(config.desktop.showButtonPaddingRight),
  );
  controls.setDesktopAnimationType(config.desktop.animationType);
  controls.setDesktopFollowingMarkerWidth(
    String(config.desktop.followingMarkerWidth),
  );
  controls.setDesktopFollowingMarkerHeight(
    String(config.desktop.followingMarkerHeight),
  );
  controls.setDesktopFollowingMarkerColor(config.desktop.followingMarkerColor);
  controls.setDesktopFollowingMarkerOffset(
    String(config.desktop.followingMarkerOffset),
  );
  controls.setDesktopFollowingMarkerBorderRadius(
    String(config.desktop.followingMarkerBorderRadius),
  );
  controls.setDesktopCrawlingSnakeWidth(
    String(config.desktop.crawlingSnakeWidth),
  );
  controls.setDesktopCrawlingSnakeHeight(
    String(config.desktop.crawlingSnakeHeight),
  );
  controls.setDesktopCrawlingSnakeColor(config.desktop.crawlingSnakeColor);
  controls.setDesktopCrawlingSnakeOffset(
    String(config.desktop.crawlingSnakeOffset),
  );
  controls.setDesktopJumpingMarkerWidth(
    String(config.desktop.jumpingMarkerWidth),
  );
  controls.setDesktopJumpingMarkerHeight(
    String(config.desktop.jumpingMarkerHeight),
  );
  controls.setDesktopJumpingMarkerColor(config.desktop.jumpingMarkerColor);
  controls.setDesktopJumpingMarkerOffset(
    String(config.desktop.jumpingMarkerOffset),
  );
  controls.setDesktopJumpingMarkerBorderRadius(
    String(config.desktop.jumpingMarkerBorderRadius),
  );
  controls.setMobilePosition(normalizeMobilePosition(config.mobile.position));
  controls.setMobilePositionSelector(config.mobile.positionSelector);
  controls.setMobileBorderColor(config.mobile.color);
  controls.setMobileBorderWidth(String(config.mobile.width));
  controls.setMobileBorderRadius(String(config.mobile.radius));
  controls.setMobileShadowPreset(config.mobile.shadowPreset);
  controls.setMobileShadowColor(config.mobile.shadowColor);
  controls.setMobilePaddingTop(String(config.mobile.paddingTop));
  controls.setMobilePaddingBottom(String(config.mobile.paddingBottom));
  controls.setMobilePaddingLeft(String(config.mobile.paddingLeft));
  controls.setMobilePaddingRight(String(config.mobile.paddingRight));
  controls.setMobileOffsetTop(String(config.mobile.offsetTop));
  controls.setMobileOffsetBottom(String(config.mobile.offsetBottom));
  controls.setMobileOffsetLeft(String(config.mobile.offsetLeft));
  controls.setMobileOffsetRight(String(config.mobile.offsetRight));
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
  controls.setMobileShowButtonFontSize(String(config.mobile.showButtonFontSize));
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
  controls.setMobileShowButtonPaddingTop(
    String(config.mobile.showButtonPaddingTop),
  );
  controls.setMobileShowButtonPaddingBottom(
    String(config.mobile.showButtonPaddingBottom),
  );
  controls.setMobileShowButtonPaddingLeft(
    String(config.mobile.showButtonPaddingLeft),
  );
  controls.setMobileShowButtonPaddingRight(
    String(config.mobile.showButtonPaddingRight),
  );
  controls.setMobileAnimationType(config.mobile.animationType);
  controls.setMobileFollowingMarkerWidth(
    String(config.mobile.followingMarkerWidth),
  );
  controls.setMobileFollowingMarkerHeight(
    String(config.mobile.followingMarkerHeight),
  );
  controls.setMobileFollowingMarkerColor(config.mobile.followingMarkerColor);
  controls.setMobileFollowingMarkerOffset(
    String(config.mobile.followingMarkerOffset),
  );
  controls.setMobileFollowingMarkerBorderRadius(
    String(config.mobile.followingMarkerBorderRadius),
  );
  controls.setMobileCrawlingSnakeWidth(
    String(config.mobile.crawlingSnakeWidth),
  );
  controls.setMobileCrawlingSnakeHeight(
    String(config.mobile.crawlingSnakeHeight),
  );
  controls.setMobileCrawlingSnakeColor(config.mobile.crawlingSnakeColor);
  controls.setMobileCrawlingSnakeOffset(
    String(config.mobile.crawlingSnakeOffset),
  );
  controls.setMobileJumpingMarkerWidth(
    String(config.mobile.jumpingMarkerWidth),
  );
  controls.setMobileJumpingMarkerHeight(
    String(config.mobile.jumpingMarkerHeight),
  );
  controls.setMobileJumpingMarkerColor(config.mobile.jumpingMarkerColor);
  controls.setMobileJumpingMarkerOffset(
    String(config.mobile.jumpingMarkerOffset),
  );
  controls.setMobileJumpingMarkerBorderRadius(
    String(config.mobile.jumpingMarkerBorderRadius),
  );
}

export function configsEqual(left: TocConfig, right: TocConfig) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function coerceConfig(input: TocConfigInput): TocConfig {
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

export function coerceConfigFromForm(formData: FormData): TocConfig {
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
      switchToMobileOnFloatOverflow:
        formData.get("desktopSwitchToMobileOnFloatOverflow") === "on",
      color: String(
        formData.get("desktopBorderColor") || DEFAULT_CONFIG.desktop.color,
      ),
      width: String(formData.get("desktopBorderWidth") || ""),
      radius: String(formData.get("desktopBorderRadius") || ""),
      shadowPreset: String(
        formData.get("desktopShadowPreset") || DEFAULT_CONFIG.desktop.shadowPreset,
      ),
      shadowColor: String(
        formData.get("desktopShadowColor") || DEFAULT_CONFIG.desktop.shadowColor,
      ),
      paddingTop: String(formData.get("desktopPaddingTop") || ""),
      paddingBottom: String(formData.get("desktopPaddingBottom") || ""),
      paddingLeft: String(formData.get("desktopPaddingLeft") || ""),
      paddingRight: String(formData.get("desktopPaddingRight") || ""),
      offsetTop: String(formData.get("desktopOffsetTop") || ""),
      offsetBottom: String(formData.get("desktopOffsetBottom") || ""),
      offsetLeft: String(formData.get("desktopOffsetLeft") || ""),
      offsetRight: String(formData.get("desktopOffsetRight") || ""),
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
      headingsFontWeight: String(formData.get("desktopHeadingsFontWeight") || ""),
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
      showButtonFontSize: String(formData.get("desktopShowButtonFontSize") || ""),
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
      showButtonPaddingTop: String(
        formData.get("desktopShowButtonPaddingTop") || "",
      ),
      showButtonPaddingBottom: String(
        formData.get("desktopShowButtonPaddingBottom") || "",
      ),
      showButtonPaddingLeft: String(
        formData.get("desktopShowButtonPaddingLeft") || "",
      ),
      showButtonPaddingRight: String(
        formData.get("desktopShowButtonPaddingRight") || "",
      ),
      animationType: String(
        formData.get("desktopAnimationType") ||
          DEFAULT_CONFIG.desktop.animationType,
      ),
      followingMarkerWidth: String(
        formData.get("desktopFollowingMarkerWidth") || "",
      ),
      followingMarkerHeight: String(
        formData.get("desktopFollowingMarkerHeight") || "",
      ),
      followingMarkerColor: String(
        formData.get("desktopFollowingMarkerColor") ||
          DEFAULT_CONFIG.desktop.followingMarkerColor,
      ),
      followingMarkerOffset: String(
        formData.get("desktopFollowingMarkerOffset") || "",
      ),
      followingMarkerBorderRadius: String(
        formData.get("desktopFollowingMarkerBorderRadius") || "",
      ),
      crawlingSnakeWidth: String(
        formData.get("desktopCrawlingSnakeWidth") || "",
      ),
      crawlingSnakeHeight: String(
        formData.get("desktopCrawlingSnakeHeight") || "",
      ),
      crawlingSnakeColor: String(
        formData.get("desktopCrawlingSnakeColor") ||
          DEFAULT_CONFIG.desktop.crawlingSnakeColor,
      ),
      crawlingSnakeOffset: String(
        formData.get("desktopCrawlingSnakeOffset") || "",
      ),
      jumpingMarkerWidth: String(
        formData.get("desktopJumpingMarkerWidth") || "",
      ),
      jumpingMarkerHeight: String(
        formData.get("desktopJumpingMarkerHeight") || "",
      ),
      jumpingMarkerColor: String(
        formData.get("desktopJumpingMarkerColor") ||
          DEFAULT_CONFIG.desktop.jumpingMarkerColor,
      ),
      jumpingMarkerOffset: String(
        formData.get("desktopJumpingMarkerOffset") || "",
      ),
      jumpingMarkerBorderRadius: String(
        formData.get("desktopJumpingMarkerBorderRadius") || "",
      ),
    },
    mobile: {
      position: String(
        formData.get("mobilePosition") || DEFAULT_CONFIG.mobile.position,
      ),
      positionSelector: String(formData.get("mobilePositionSelector") || ""),
      switchToMobileOnFloatOverflow:
        formData.get("mobileSwitchToMobileOnFloatOverflow") === "on",
      color: String(
        formData.get("mobileBorderColor") || DEFAULT_CONFIG.mobile.color,
      ),
      width: String(formData.get("mobileBorderWidth") || ""),
      radius: String(formData.get("mobileBorderRadius") || ""),
      shadowPreset: String(
        formData.get("mobileShadowPreset") || DEFAULT_CONFIG.mobile.shadowPreset,
      ),
      shadowColor: String(
        formData.get("mobileShadowColor") || DEFAULT_CONFIG.mobile.shadowColor,
      ),
      paddingTop: String(formData.get("mobilePaddingTop") || ""),
      paddingBottom: String(formData.get("mobilePaddingBottom") || ""),
      paddingLeft: String(formData.get("mobilePaddingLeft") || ""),
      paddingRight: String(formData.get("mobilePaddingRight") || ""),
      offsetTop: String(formData.get("mobileOffsetTop") || ""),
      offsetBottom: String(formData.get("mobileOffsetBottom") || ""),
      offsetLeft: String(formData.get("mobileOffsetLeft") || ""),
      offsetRight: String(formData.get("mobileOffsetRight") || ""),
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
      headingsFontWeight: String(formData.get("mobileHeadingsFontWeight") || ""),
      titleFontSize: String(formData.get("mobileTitleFontSize") || ""),
      titleFontColor: String(
        formData.get("mobileTitleFontColor") ||
          DEFAULT_CONFIG.mobile.titleFontColor,
      ),
      titleFontWeight: String(formData.get("mobileTitleFontWeight") || ""),
      showButton: formData.get("mobileShowButton") === "on",
      showButtonHeight: String(formData.get("mobileShowButtonHeight") || ""),
      showMoreButtonText: String(formData.get("mobileShowMoreButtonText") || ""),
      showLessButtonText: String(formData.get("mobileShowLessButtonText") || ""),
      showButtonFontSize: String(formData.get("mobileShowButtonFontSize") || ""),
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
      showButtonPaddingTop: String(
        formData.get("mobileShowButtonPaddingTop") || "",
      ),
      showButtonPaddingBottom: String(
        formData.get("mobileShowButtonPaddingBottom") || "",
      ),
      showButtonPaddingLeft: String(
        formData.get("mobileShowButtonPaddingLeft") || "",
      ),
      showButtonPaddingRight: String(
        formData.get("mobileShowButtonPaddingRight") || "",
      ),
      animationType: String(
        formData.get("mobileAnimationType") || DEFAULT_CONFIG.mobile.animationType,
      ),
      followingMarkerWidth: String(
        formData.get("mobileFollowingMarkerWidth") || "",
      ),
      followingMarkerHeight: String(
        formData.get("mobileFollowingMarkerHeight") || "",
      ),
      followingMarkerColor: String(
        formData.get("mobileFollowingMarkerColor") ||
          DEFAULT_CONFIG.mobile.followingMarkerColor,
      ),
      followingMarkerOffset: String(
        formData.get("mobileFollowingMarkerOffset") || "",
      ),
      followingMarkerBorderRadius: String(
        formData.get("mobileFollowingMarkerBorderRadius") || "",
      ),
      crawlingSnakeWidth: String(formData.get("mobileCrawlingSnakeWidth") || ""),
      crawlingSnakeHeight: String(
        formData.get("mobileCrawlingSnakeHeight") || "",
      ),
      crawlingSnakeColor: String(
        formData.get("mobileCrawlingSnakeColor") ||
          DEFAULT_CONFIG.mobile.crawlingSnakeColor,
      ),
      crawlingSnakeOffset: String(
        formData.get("mobileCrawlingSnakeOffset") || "",
      ),
      jumpingMarkerWidth: String(
        formData.get("mobileJumpingMarkerWidth") || "",
      ),
      jumpingMarkerHeight: String(
        formData.get("mobileJumpingMarkerHeight") || "",
      ),
      jumpingMarkerColor: String(
        formData.get("mobileJumpingMarkerColor") ||
          DEFAULT_CONFIG.mobile.jumpingMarkerColor,
      ),
      jumpingMarkerOffset: String(
        formData.get("mobileJumpingMarkerOffset") || "",
      ),
      jumpingMarkerBorderRadius: String(
        formData.get("mobileJumpingMarkerBorderRadius") || "",
      ),
    },
  });
}

export function buildActivateDeepLink(
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

export function normalizeExcludedBlogsInput(value: string): string {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(", ");
}

export function normalizeCustomCssInput(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export function compileCustomCss(customCss: string, mobileBreakpoint: number) {
  return normalizeCustomCssInput(customCss).replaceAll(
    CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN,
    `${mobileBreakpoint}px`,
  );
}

export function compilePreviewCustomCss(
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

export function normalizeDesktopPosition(value: unknown): TocDesktopPosition {
  return DESKTOP_POSITION_OPTIONS.some((option) => option.value === value)
    ? (value as TocDesktopPosition)
    : "float-right";
}

export function normalizeMobilePosition(value: unknown): TocMobilePosition {
  return MOBILE_POSITION_OPTIONS.some((option) => option.value === value)
    ? (value as TocMobilePosition)
    : "before-first-heading";
}

export function normalizeTextAlignment(value: unknown): TocTextAlignment {
  return TEXT_ALIGNMENT_OPTIONS.some((option) => option.value === value)
    ? (value as TocTextAlignment)
    : DEFAULT_CONFIG.textAlignment;
}

export function normalizeMarkerFormat(value: unknown): TocMarkerFormat {
  return MARKER_FORMAT_OPTIONS.some((option) => option.value === value)
    ? (value as TocMarkerFormat)
    : DEFAULT_CONFIG.markerFormat;
}

export function normalizeAnimationType(value: unknown): TocAnimationType {
  return ANIMATION_TYPE_OPTIONS.some((option) => option.value === value)
    ? (value as TocAnimationType)
    : DEFAULT_CONFIG.desktop.animationType;
}

export function normalizeShadowPreset(value: unknown): TocShadowPreset {
  return SHADOW_PRESET_OPTIONS.some((option) => option.value === value)
    ? (value as TocShadowPreset)
    : DEFAULT_CONFIG.desktop.shadowPreset;
}

export function normalizeHeadingLevels(levels: number[]): number[] {
  return [...new Set(levels)]
    .filter((level) =>
      HEADING_LEVEL_OPTIONS.includes(level as (typeof HEADING_LEVEL_OPTIONS)[number]),
    )
    .sort((left, right) => left - right);
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

function deriveLegacyShadowPreset(
  config: Partial<{
    shadowStrength: unknown;
    shadowDistance: unknown;
    shadowBlur: unknown;
  }>,
  fallback: TocShadowPreset,
) {
  const strength =
    typeof config.shadowStrength === "number" &&
    Number.isFinite(config.shadowStrength)
      ? Math.max(0, Math.min(100, config.shadowStrength))
      : null;
  const distance =
    typeof config.shadowDistance === "number" &&
    Number.isFinite(config.shadowDistance)
      ? Math.max(0, config.shadowDistance)
      : null;
  const blur =
    typeof config.shadowBlur === "number" && Number.isFinite(config.shadowBlur)
      ? Math.max(0, config.shadowBlur)
      : null;

  if (strength === null || strength <= 0) {
    return fallback;
  }

  if ((blur ?? 0) <= 2 && (distance ?? 0) <= 1) {
    return "extra-small";
  }

  if ((blur ?? 0) <= 3 && (distance ?? 0) <= 1) {
    return "small";
  }

  if ((blur ?? 0) <= 6 && (distance ?? 0) <= 4) {
    return "medium";
  }

  if ((blur ?? 0) <= 15 && (distance ?? 0) <= 10) {
    return "large";
  }

  return "extra-large";
}

function getLegacyShowButtonPaddingValue(
  borderWidth: number,
  side: "top" | "bottom" | "left" | "right",
) {
  return borderWidth * (side === "left" || side === "right" ? 6 : 2);
}

function normalizeDeviceConfig(
  value: unknown,
  fallback: TocDeviceConfig,
  device: "desktop" | "mobile",
): TocDeviceConfig {
  if (!value || typeof value !== "object") return { ...fallback };

  const config = value as Partial<TocDeviceConfig>;
  const legacyJumpingMarkerSize =
    typeof (config as { jumpingMarkerSize?: unknown }).jumpingMarkerSize ===
      "number" &&
    Number.isFinite((config as { jumpingMarkerSize?: number }).jumpingMarkerSize)
      ? Math.max(
          0,
          (config as { jumpingMarkerSize?: number }).jumpingMarkerSize ?? 0,
        )
      : null;
  const legacyShadowPreset = deriveLegacyShadowPreset(
    config as Partial<{
      shadowStrength: unknown;
      shadowDistance: unknown;
      shadowBlur: unknown;
    }>,
    fallback.shadowPreset,
  );
  const normalizedShowButtonBorderWidth =
    typeof config.showButtonBorderWidth === "number" &&
    Number.isFinite(config.showButtonBorderWidth)
      ? Math.max(0, config.showButtonBorderWidth)
      : fallback.showButtonBorderWidth;

  return {
    position:
      device === "desktop"
        ? normalizeDesktopPosition(config.position)
        : normalizeMobilePosition(config.position),
    positionSelector:
      typeof config.positionSelector === "string"
        ? config.positionSelector.trim()
        : fallback.positionSelector,
    switchToMobileOnFloatOverflow:
      device === "desktop"
        ? typeof config.switchToMobileOnFloatOverflow === "boolean"
          ? config.switchToMobileOnFloatOverflow
          : fallback.switchToMobileOnFloatOverflow
        : false,
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
    shadowPreset:
      typeof config.shadowPreset === "string"
        ? normalizeShadowPreset(config.shadowPreset)
        : legacyShadowPreset,
    shadowColor:
      typeof config.shadowColor === "string" && config.shadowColor.trim()
        ? config.shadowColor.trim()
        : fallback.shadowColor,
    paddingTop:
      typeof config.paddingTop === "number" && Number.isFinite(config.paddingTop)
        ? Math.max(0, config.paddingTop)
        : fallback.paddingTop,
    paddingBottom:
      typeof config.paddingBottom === "number" &&
      Number.isFinite(config.paddingBottom)
        ? Math.max(0, config.paddingBottom)
        : fallback.paddingBottom,
    paddingLeft:
      typeof config.paddingLeft === "number" && Number.isFinite(config.paddingLeft)
        ? Math.max(0, config.paddingLeft)
        : fallback.paddingLeft,
    paddingRight:
      typeof config.paddingRight === "number" &&
      Number.isFinite(config.paddingRight)
        ? Math.max(0, config.paddingRight)
        : fallback.paddingRight,
    offsetTop:
      typeof config.offsetTop === "number" && Number.isFinite(config.offsetTop)
        ? config.offsetTop
        : fallback.offsetTop,
    offsetBottom:
      typeof config.offsetBottom === "number" &&
      Number.isFinite(config.offsetBottom)
        ? config.offsetBottom
        : fallback.offsetBottom,
    offsetLeft:
      typeof config.offsetLeft === "number" && Number.isFinite(config.offsetLeft)
        ? config.offsetLeft
        : fallback.offsetLeft,
    offsetRight:
      typeof config.offsetRight === "number" &&
      Number.isFinite(config.offsetRight)
        ? config.offsetRight
        : fallback.offsetRight,
    followingMarkerWidth:
      typeof config.followingMarkerWidth === "number" &&
      Number.isFinite(config.followingMarkerWidth)
        ? Math.max(0, config.followingMarkerWidth)
        : fallback.followingMarkerWidth,
    followingMarkerHeight:
      typeof config.followingMarkerHeight === "number" &&
      Number.isFinite(config.followingMarkerHeight)
        ? Math.max(0, config.followingMarkerHeight)
        : fallback.followingMarkerHeight,
    followingMarkerColor:
      typeof config.followingMarkerColor === "string" &&
      config.followingMarkerColor.trim()
        ? config.followingMarkerColor.trim()
        : fallback.followingMarkerColor,
    followingMarkerOffset:
      typeof config.followingMarkerOffset === "number" &&
      Number.isFinite(config.followingMarkerOffset)
        ? Math.max(0, config.followingMarkerOffset)
        : fallback.followingMarkerOffset,
    followingMarkerBorderRadius:
      typeof config.followingMarkerBorderRadius === "number" &&
      Number.isFinite(config.followingMarkerBorderRadius)
        ? Math.max(0, config.followingMarkerBorderRadius)
        : fallback.followingMarkerBorderRadius,
    crawlingSnakeWidth:
      typeof config.crawlingSnakeWidth === "number" &&
      Number.isFinite(config.crawlingSnakeWidth)
        ? Math.max(0, config.crawlingSnakeWidth)
        : fallback.crawlingSnakeWidth,
    crawlingSnakeHeight:
      typeof config.crawlingSnakeHeight === "number" &&
      Number.isFinite(config.crawlingSnakeHeight)
        ? Math.max(0, config.crawlingSnakeHeight)
        : fallback.crawlingSnakeHeight,
    crawlingSnakeColor:
      typeof config.crawlingSnakeColor === "string" &&
      config.crawlingSnakeColor.trim()
        ? config.crawlingSnakeColor.trim()
        : fallback.crawlingSnakeColor,
    crawlingSnakeOffset:
      typeof config.crawlingSnakeOffset === "number" &&
      Number.isFinite(config.crawlingSnakeOffset)
        ? Math.max(0, config.crawlingSnakeOffset)
        : fallback.crawlingSnakeOffset,
    jumpingMarkerWidth:
      typeof config.jumpingMarkerWidth === "number" &&
      Number.isFinite(config.jumpingMarkerWidth)
        ? Math.max(0, config.jumpingMarkerWidth)
        : (legacyJumpingMarkerSize ?? fallback.jumpingMarkerWidth),
    jumpingMarkerHeight:
      typeof config.jumpingMarkerHeight === "number" &&
      Number.isFinite(config.jumpingMarkerHeight)
        ? Math.max(0, config.jumpingMarkerHeight)
        : (legacyJumpingMarkerSize ?? fallback.jumpingMarkerHeight),
    jumpingMarkerColor:
      typeof config.jumpingMarkerColor === "string" &&
      config.jumpingMarkerColor.trim()
        ? config.jumpingMarkerColor.trim()
        : fallback.jumpingMarkerColor,
    jumpingMarkerOffset:
      typeof config.jumpingMarkerOffset === "number" &&
      Number.isFinite(config.jumpingMarkerOffset)
        ? Math.max(0, config.jumpingMarkerOffset)
        : fallback.jumpingMarkerOffset,
    jumpingMarkerBorderRadius:
      typeof config.jumpingMarkerBorderRadius === "number" &&
      Number.isFinite(config.jumpingMarkerBorderRadius)
        ? Math.max(0, config.jumpingMarkerBorderRadius)
        : fallback.jumpingMarkerBorderRadius,
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
    showButtonBorderWidth: normalizedShowButtonBorderWidth,
    showButtonBorderRadius:
      typeof config.showButtonBorderRadius === "number" &&
      Number.isFinite(config.showButtonBorderRadius)
        ? Math.max(0, config.showButtonBorderRadius)
        : fallback.showButtonBorderRadius,
    showButtonPaddingTop:
      typeof config.showButtonPaddingTop === "number" &&
      Number.isFinite(config.showButtonPaddingTop)
        ? Math.max(0, config.showButtonPaddingTop)
        : getLegacyShowButtonPaddingValue(normalizedShowButtonBorderWidth, "top"),
    showButtonPaddingBottom:
      typeof config.showButtonPaddingBottom === "number" &&
      Number.isFinite(config.showButtonPaddingBottom)
        ? Math.max(0, config.showButtonPaddingBottom)
        : getLegacyShowButtonPaddingValue(normalizedShowButtonBorderWidth, "bottom"),
    showButtonPaddingLeft:
      typeof config.showButtonPaddingLeft === "number" &&
      Number.isFinite(config.showButtonPaddingLeft)
        ? Math.max(0, config.showButtonPaddingLeft)
        : getLegacyShowButtonPaddingValue(normalizedShowButtonBorderWidth, "left"),
    showButtonPaddingRight:
      typeof config.showButtonPaddingRight === "number" &&
      Number.isFinite(config.showButtonPaddingRight)
        ? Math.max(0, config.showButtonPaddingRight)
        : getLegacyShowButtonPaddingValue(normalizedShowButtonBorderWidth, "right"),
    animationType: normalizeAnimationType(config.animationType),
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
  const offsetTop = parseIntegerInput(input.offsetTop);
  const offsetBottom = parseIntegerInput(input.offsetBottom);
  const offsetLeft = parseIntegerInput(input.offsetLeft);
  const offsetRight = parseIntegerInput(input.offsetRight);
  const followingMarkerWidth = parseNonNegativeIntegerInput(
    input.followingMarkerWidth,
  );
  const followingMarkerHeight = parseNonNegativeIntegerInput(
    input.followingMarkerHeight,
  );
  const followingMarkerOffset = parseNonNegativeIntegerInput(
    input.followingMarkerOffset,
  );
  const followingMarkerBorderRadius = parseNonNegativeIntegerInput(
    input.followingMarkerBorderRadius,
  );
  const crawlingSnakeWidth = parseNonNegativeIntegerInput(
    input.crawlingSnakeWidth,
  );
  const crawlingSnakeHeight = parseNonNegativeIntegerInput(
    input.crawlingSnakeHeight,
  );
  const crawlingSnakeOffset = parseNonNegativeIntegerInput(
    input.crawlingSnakeOffset,
  );
  const jumpingMarkerWidth = parseNonNegativeIntegerInput(
    input.jumpingMarkerWidth,
  );
  const jumpingMarkerHeight = parseNonNegativeIntegerInput(
    input.jumpingMarkerHeight,
  );
  const jumpingMarkerOffset = parseNonNegativeIntegerInput(
    input.jumpingMarkerOffset,
  );
  const jumpingMarkerBorderRadius = parseNonNegativeIntegerInput(
    input.jumpingMarkerBorderRadius,
  );
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
  const showButtonPaddingTop = parseNonNegativeIntegerInput(
    input.showButtonPaddingTop,
  );
  const showButtonPaddingBottom = parseNonNegativeIntegerInput(
    input.showButtonPaddingBottom,
  );
  const showButtonPaddingLeft = parseNonNegativeIntegerInput(
    input.showButtonPaddingLeft,
  );
  const showButtonPaddingRight = parseNonNegativeIntegerInput(
    input.showButtonPaddingRight,
  );
  const resolvedShowButtonBorderWidth = Number.isFinite(showButtonBorderWidth)
    ? showButtonBorderWidth
    : fallback.showButtonBorderWidth;

  return {
    position:
      device === "desktop"
        ? normalizeDesktopPosition(input.position)
        : normalizeMobilePosition(input.position),
    positionSelector: input.positionSelector.trim(),
    switchToMobileOnFloatOverflow:
      device === "desktop" ? input.switchToMobileOnFloatOverflow : false,
    color: input.color.trim() || fallback.color,
    width: Number.isFinite(width) ? width : fallback.width,
    radius: Number.isFinite(radius) ? radius : fallback.radius,
    shadowPreset: normalizeShadowPreset(input.shadowPreset),
    shadowColor: input.shadowColor.trim() || fallback.shadowColor,
    paddingTop: Number.isFinite(paddingTop) ? paddingTop : fallback.paddingTop,
    paddingBottom: Number.isFinite(paddingBottom)
      ? paddingBottom
      : fallback.paddingBottom,
    paddingLeft: Number.isFinite(paddingLeft) ? paddingLeft : fallback.paddingLeft,
    paddingRight: Number.isFinite(paddingRight)
      ? paddingRight
      : fallback.paddingRight,
    offsetTop: Number.isFinite(offsetTop) ? offsetTop : fallback.offsetTop,
    offsetBottom: Number.isFinite(offsetBottom)
      ? offsetBottom
      : fallback.offsetBottom,
    offsetLeft: Number.isFinite(offsetLeft) ? offsetLeft : fallback.offsetLeft,
    offsetRight: Number.isFinite(offsetRight)
      ? offsetRight
      : fallback.offsetRight,
    followingMarkerWidth: Number.isFinite(followingMarkerWidth)
      ? followingMarkerWidth
      : fallback.followingMarkerWidth,
    followingMarkerHeight: Number.isFinite(followingMarkerHeight)
      ? followingMarkerHeight
      : fallback.followingMarkerHeight,
    followingMarkerColor:
      input.followingMarkerColor.trim() || fallback.followingMarkerColor,
    followingMarkerOffset: Number.isFinite(followingMarkerOffset)
      ? followingMarkerOffset
      : fallback.followingMarkerOffset,
    followingMarkerBorderRadius: Number.isFinite(followingMarkerBorderRadius)
      ? followingMarkerBorderRadius
      : fallback.followingMarkerBorderRadius,
    crawlingSnakeWidth: Number.isFinite(crawlingSnakeWidth)
      ? crawlingSnakeWidth
      : fallback.crawlingSnakeWidth,
    crawlingSnakeHeight: Number.isFinite(crawlingSnakeHeight)
      ? crawlingSnakeHeight
      : fallback.crawlingSnakeHeight,
    crawlingSnakeColor:
      input.crawlingSnakeColor.trim() || fallback.crawlingSnakeColor,
    crawlingSnakeOffset: Number.isFinite(crawlingSnakeOffset)
      ? crawlingSnakeOffset
      : fallback.crawlingSnakeOffset,
    jumpingMarkerWidth: Number.isFinite(jumpingMarkerWidth)
      ? jumpingMarkerWidth
      : fallback.jumpingMarkerWidth,
    jumpingMarkerHeight: Number.isFinite(jumpingMarkerHeight)
      ? jumpingMarkerHeight
      : fallback.jumpingMarkerHeight,
    jumpingMarkerColor:
      input.jumpingMarkerColor.trim() || fallback.jumpingMarkerColor,
    jumpingMarkerOffset: Number.isFinite(jumpingMarkerOffset)
      ? jumpingMarkerOffset
      : fallback.jumpingMarkerOffset,
    jumpingMarkerBorderRadius: Number.isFinite(jumpingMarkerBorderRadius)
      ? jumpingMarkerBorderRadius
      : fallback.jumpingMarkerBorderRadius,
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
    showMoreButtonText: input.showMoreButtonText.trim() || fallback.showMoreButtonText,
    showLessButtonText: input.showLessButtonText.trim() || fallback.showLessButtonText,
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
    showButtonBorderWidth: resolvedShowButtonBorderWidth,
    showButtonBorderRadius: Number.isFinite(showButtonBorderRadius)
      ? showButtonBorderRadius
      : fallback.showButtonBorderRadius,
    showButtonPaddingTop: Number.isFinite(showButtonPaddingTop)
      ? showButtonPaddingTop
      : getLegacyShowButtonPaddingValue(resolvedShowButtonBorderWidth, "top"),
    showButtonPaddingBottom: Number.isFinite(showButtonPaddingBottom)
      ? showButtonPaddingBottom
      : getLegacyShowButtonPaddingValue(resolvedShowButtonBorderWidth, "bottom"),
    showButtonPaddingLeft: Number.isFinite(showButtonPaddingLeft)
      ? showButtonPaddingLeft
      : getLegacyShowButtonPaddingValue(resolvedShowButtonBorderWidth, "left"),
    showButtonPaddingRight: Number.isFinite(showButtonPaddingRight)
      ? showButtonPaddingRight
      : getLegacyShowButtonPaddingValue(resolvedShowButtonBorderWidth, "right"),
    animationType: normalizeAnimationType(input.animationType),
  };
}
