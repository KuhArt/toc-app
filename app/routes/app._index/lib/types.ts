export type TocTextAlignment = "left" | "center" | "right";

export type TocMarkerFormat = "none" | "bullet" | "numeric";

export type TocAnimationType =
  | "none"
  | "following-marker"
  | "crawling-snake"
  | "jumping-marker";

export type TocDesktopPosition =
  | "float-right"
  | "float-left"
  | "before-first-heading"
  | "after-first-heading"
  | "css-selector";

export type TocMobilePosition =
  | "before-first-heading"
  | "after-first-heading"
  | "css-selector";

export type TocShadowPreset =
  | "none"
  | "extra-small"
  | "small"
  | "medium"
  | "large"
  | "extra-large";

export type TocBorderConfig = {
  color: string;
  width: number;
  radius: number;
  shadowPreset: TocShadowPreset;
  shadowColor: string;
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  offsetTop: number;
  offsetBottom: number;
  offsetLeft: number;
  offsetRight: number;
};

export type TocMarkerAnimationConfig = {
  followingMarkerWidth: number;
  followingMarkerHeight: number;
  followingMarkerColor: string;
  followingMarkerOffset: number;
  followingMarkerBorderRadius: number;
  crawlingSnakeWidth: number;
  crawlingSnakeHeight: number;
  crawlingSnakeColor: string;
  crawlingSnakeOffset: number;
  jumpingMarkerWidth: number;
  jumpingMarkerHeight: number;
  jumpingMarkerColor: string;
  jumpingMarkerOffset: number;
  jumpingMarkerBorderRadius: number;
};

export type TocDeviceConfig = TocBorderConfig &
  TocMarkerAnimationConfig & {
    position: TocDesktopPosition | TocMobilePosition;
    positionSelector: string;
    switchToMobileOnFloatOverflow: boolean;
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
    showButtonPaddingTop: number;
    showButtonPaddingBottom: number;
    showButtonPaddingLeft: number;
    showButtonPaddingRight: number;
    animationType: TocAnimationType;
  };

export type TocConfig = {
  title: string;
  headingLevels: number[];
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  minHeadings: number;
  mobileBreakpoint: number;
  excludedBlogs: string;
  enableJsonLd: boolean;
  customCss: string;
  desktop: TocDeviceConfig;
  mobile: TocDeviceConfig;
};

export type TocSliderRange = {
  min: number;
  max: number;
  step: number;
  suffix?: string;
};

export type EditorTab = "general" | "desktop" | "mobile";

export type DeviceTab = Extract<EditorTab, "desktop" | "mobile">;

export type GeneralSectionKey =
  | "generalSettings"
  | "textFormatting"
  | "advancedSettings";

export type DeviceSectionKey =
  | "general"
  | "title"
  | "headings"
  | "border"
  | "shadow"
  | "padding"
  | "offset"
  | "scroll"
  | "showButton"
  | "animation";

export type SectionNavKey = GeneralSectionKey | DeviceSectionKey;

export type SectionIcon =
  | "inventory"
  | "book"
  | "text-indent"
  | "wrench"
  | "layout-buy-button-horizontal"
  | "text-title"
  | "book-open"
  | "corner-round"
  | "remove-background"
  | "measurement-size"
  | "drag-drop"
  | "sort"
  | "eyeglasses"
  | "incentive";

export type SectionNavItem<Key extends SectionNavKey> = {
  key: Key;
  label: string;
  icon: SectionIcon;
};

export type DeviceSectionApplyState = Record<
  DeviceTab,
  Partial<Record<DeviceSectionKey, boolean>>
>;

export type TocConfigInput = {
  title: string;
  headingLevels: number[];
  indentation: boolean;
  textAlignment: TocTextAlignment;
  markerFormat: TocMarkerFormat;
  minHeadings: string;
  mobileBreakpoint: string;
  excludedBlogs: string;
  enableJsonLd: boolean;
  customCss: string;
  desktop: TocDeviceConfigInput;
  mobile: TocDeviceConfigInput;
};

export type TocDeviceConfigInput = {
  position: string;
  positionSelector: string;
  switchToMobileOnFloatOverflow: boolean;
  color: string;
  width: string;
  radius: string;
  shadowPreset: string;
  shadowColor: string;
  paddingTop: string;
  paddingBottom: string;
  paddingLeft: string;
  paddingRight: string;
  offsetTop: string;
  offsetBottom: string;
  offsetLeft: string;
  offsetRight: string;
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
  showButtonPaddingTop: string;
  showButtonPaddingBottom: string;
  showButtonPaddingLeft: string;
  showButtonPaddingRight: string;
  animationType: string;
  followingMarkerWidth: string;
  followingMarkerHeight: string;
  followingMarkerColor: string;
  followingMarkerOffset: string;
  followingMarkerBorderRadius: string;
  crawlingSnakeWidth: string;
  crawlingSnakeHeight: string;
  crawlingSnakeColor: string;
  crawlingSnakeOffset: string;
  jumpingMarkerWidth: string;
  jumpingMarkerHeight: string;
  jumpingMarkerColor: string;
  jumpingMarkerOffset: string;
  jumpingMarkerBorderRadius: string;
};

export type PreviewHeading = {
  id: string;
  title: string;
  level: number;
};

export type PreviewTocItem = {
  id: string;
  title: string;
  children: PreviewTocItem[];
};

export type AppEmbedStatus =
  | "checking"
  | "active"
  | "inactive"
  | "unavailable";

export type ThemeExtensionActivationRecord = {
  handle?: string;
  status?: string;
  activations?: Array<{ target?: string; themeId?: string | number }>;
};

export type AppBridgeExtensionRecord = {
  handle?: string;
  type?: string;
  activations?: Array<{ target?: string } | ThemeExtensionActivationRecord>;
};
