import { css as cssLanguage } from "@codemirror/lang-css";

import type {
  DeviceSectionKey,
  SectionIcon,
  SectionNavItem,
  SectionNavKey,
  TocConfig,
  TocDeviceConfig,
  TocSliderRange,
} from "./types";

export const DEFAULT_MOBILE_BREAKPOINT = 768;
export const CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN = "{{mobileBreakpoint}}";
export const CUSTOM_CSS_EDITOR_EXTENSIONS = [cssLanguage()];
export const CUSTOM_CSS_REFERENCE_SELECTORS = [
  ".toc-widget",
  ".toc-widget__title",
  ".toc-widget__list-shell",
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

export const DEFAULT_DESKTOP_CONFIG: TocDeviceConfig = {
  position: "float-right",
  positionSelector: "",
  switchToMobileOnFloatOverflow: true,
  color: "#0000001f",
  width: 1,
  radius: 12,
  shadowPreset: "none",
  shadowColor: "#000000",
  paddingTop: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  paddingRight: 16,
  offsetTop: 0,
  offsetBottom: 0,
  offsetLeft: 0,
  offsetRight: 0,
  followingMarkerWidth: 6,
  followingMarkerHeight: 6,
  followingMarkerColor: "#575757cf",
  followingMarkerOffset: 8,
  followingMarkerBorderRadius: 2,
  crawlingSnakeWidth: 10,
  crawlingSnakeHeight: 3,
  crawlingSnakeColor: "#575757cf",
  crawlingSnakeOffset: 8,
  jumpingMarkerWidth: 6,
  jumpingMarkerHeight: 6,
  jumpingMarkerColor: "#575757CF",
  jumpingMarkerOffset: 9,
  jumpingMarkerBorderRadius: 999,
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
  showButtonPaddingTop: 0,
  showButtonPaddingBottom: 0,
  showButtonPaddingLeft: 0,
  showButtonPaddingRight: 0,
  animationType: "jumping-marker",
};

export const DEFAULT_MOBILE_CONFIG: TocDeviceConfig = {
  position: "before-first-heading",
  positionSelector: "",
  switchToMobileOnFloatOverflow: false,
  color: "#0000001f",
  width: 0,
  radius: 12,
  shadowPreset: "none",
  shadowColor: "#000000",
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  offsetTop: 0,
  offsetBottom: 0,
  offsetLeft: 0,
  offsetRight: 0,
  followingMarkerWidth: 6,
  followingMarkerHeight: 6,
  followingMarkerColor: "#575757cf",
  followingMarkerOffset: 8,
  followingMarkerBorderRadius: 2,
  crawlingSnakeWidth: 10,
  crawlingSnakeHeight: 3,
  crawlingSnakeColor: "#575757cf",
  crawlingSnakeOffset: 8,
  jumpingMarkerWidth: 6,
  jumpingMarkerHeight: 6,
  jumpingMarkerColor: "#575757CF",
  jumpingMarkerOffset: 9,
  jumpingMarkerBorderRadius: 999,
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
  showButtonPaddingTop: 0,
  showButtonPaddingBottom: 0,
  showButtonPaddingLeft: 0,
  showButtonPaddingRight: 0,
  animationType: "none",
};

export const DEFAULT_CONFIG: TocConfig = {
  title: "Contents",
  headingLevels: [2, 3, 4],
  indentation: true,
  textAlignment: "left",
  markerFormat: "none",
  minHeadings: 3,
  mobileBreakpoint: DEFAULT_MOBILE_BREAKPOINT,
  excludedBlogs: "",
  enableJsonLd: true,
  customCss: buildDefaultCustomCss(),
  desktop: DEFAULT_DESKTOP_CONFIG,
  mobile: DEFAULT_MOBILE_CONFIG,
};

export const HEADING_LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export const TEXT_ALIGNMENT_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
] as const;
export const MARKER_FORMAT_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Bullet", value: "bullet" },
  { label: "Numeric", value: "numeric" },
] as const;
export const ANIMATION_TYPE_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Following marker", value: "following-marker" },
  { label: "Crawling snake", value: "crawling-snake" },
  { label: "Jumping marker", value: "jumping-marker" },
] as const;
export const SHADOW_PRESET_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Extra small", value: "extra-small" },
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
  { label: "Extra large", value: "extra-large" },
] as const;
export const FONT_WEIGHT_OPTIONS = [
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
export const DESKTOP_POSITION_OPTIONS = [
  { label: "Right side", value: "float-right" },
  { label: "Left side", value: "float-left" },
  { label: "Before first heading", value: "before-first-heading" },
  { label: "After first heading", value: "after-first-heading" },
  { label: "CSS selector", value: "css-selector" },
] as const;
export const MOBILE_POSITION_OPTIONS = [
  { label: "Before first heading", value: "before-first-heading" },
  { label: "After first heading", value: "after-first-heading" },
  { label: "CSS selector", value: "css-selector" },
] as const;
export const APP_EMBED_HANDLE = "toc-embed";
export const FORM_ID = "toc-settings-form";
export const SAVE_BAR_ID = "toc-settings-save-bar";
export const EDITOR_TABS = [
  { id: "general", label: "General", icon: "settings" },
  { id: "desktop", label: "Desktop", icon: "desktop" },
  { id: "mobile", label: "Mobile", icon: "mobile" },
] as const;

export const SLIDER_RANGES = {
  fontSize: { min: 0, max: 48, step: 1, suffix: "px" },
  borderWidth: { min: 0, max: 12, step: 1, suffix: "px" },
  borderRadius: { min: 0, max: 64, step: 1, suffix: "px" },
  markerSize: { min: 0, max: 48, step: 1, suffix: "px" },
  markerOffset: { min: 0, max: 48, step: 1, suffix: "px" },
  markerRadius: { min: 0, max: 999, step: 1, suffix: "px" },
  padding: { min: 0, max: 64, step: 1, suffix: "px" },
  layoutOffset: { min: -80, max: 80, step: 1, suffix: "px" },
  scrollOffset: { min: 0, max: 300, step: 1, suffix: "px" },
  maxWidth: { min: 0, max: 1000, step: 1, suffix: "px" },
  collapsedHeight: { min: 0, max: 800, step: 1, suffix: "px" },
} as const satisfies Record<string, TocSliderRange>;

export const SECTION_NAV_METADATA = {
  generalSettings: { label: "Basics", icon: "inventory" },
  textFormatting: { label: "Text Formatting", icon: "text-indent" },
  advancedSettings: { label: "Advanced settings", icon: "wrench" },
  general: { label: "Layout", icon: "layout-buy-button-horizontal" },
  title: { label: "Title", icon: "text-title" },
  headings: { label: "Links", icon: "book-open" },
  border: { label: "Border", icon: "corner-round" },
  shadow: { label: "Shadow", icon: "remove-background" },
  padding: { label: "Padding", icon: "measurement-size" },
  offset: { label: "Offset", icon: "drag-drop" },
  scroll: { label: "Scroll behavior", icon: "sort" },
  showButton: { label: "Show more button", icon: "eyeglasses" },
  animation: { label: "Animation", icon: "incentive" },
} as const satisfies Record<
  SectionNavKey,
  { label: string; icon: SectionIcon }
>;

export function createSectionNavItems<Key extends SectionNavKey>(
  keys: readonly Key[],
): Array<SectionNavItem<Key>> {
  return keys.map((key) => {
    const metadata = SECTION_NAV_METADATA[key];

    return {
      key,
      label: metadata.label,
      icon: metadata.icon,
    } as SectionNavItem<Key>;
  });
}

export const GENERAL_SECTION_NAV_ITEMS = createSectionNavItems([
  "generalSettings",
  "textFormatting",
  "advancedSettings",
]);

export const DESKTOP_DEVICE_SECTION_NAV_ITEMS = createSectionNavItems([
  "general",
  "title",
  "headings",
  "border",
  "shadow",
  "padding",
  "offset",
  "scroll",
  "showButton",
  "animation",
]);

export const MOBILE_DEVICE_SECTION_NAV_ITEMS = createSectionNavItems([
  "general",
  "title",
  "headings",
  "border",
  "shadow",
  "padding",
  "offset",
  "scroll",
  "showButton",
]);

export const DEVICE_SECTION_FIELDS = {
  general: [
    "position",
    "positionSelector",
    "switchToMobileOnFloatOverflow",
    "background",
    "maxWidth",
  ],
  title: ["showTitle", "titleFontSize", "titleFontColor", "titleFontWeight"],
  headings: ["headingsFontSize", "headingsFontColor", "headingsFontWeight"],
  border: ["color", "width", "radius"],
  shadow: ["shadowPreset", "shadowColor"],
  padding: ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"],
  offset: ["offsetTop", "offsetBottom", "offsetLeft", "offsetRight"],
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
    "showButtonPaddingTop",
    "showButtonPaddingBottom",
    "showButtonPaddingLeft",
    "showButtonPaddingRight",
  ],
  animation: [
    "animationType",
    "followingMarkerWidth",
    "followingMarkerHeight",
    "followingMarkerColor",
    "followingMarkerOffset",
    "followingMarkerBorderRadius",
    "crawlingSnakeWidth",
    "crawlingSnakeHeight",
    "crawlingSnakeColor",
    "crawlingSnakeOffset",
    "jumpingMarkerWidth",
    "jumpingMarkerHeight",
    "jumpingMarkerColor",
    "jumpingMarkerOffset",
    "jumpingMarkerBorderRadius",
  ],
} as const satisfies Record<
  DeviceSectionKey,
  readonly (keyof TocDeviceConfig)[]
>;

export const FORM_STYLES = `
  .toc-editor-shell {
    display: grid;
    gap: 16px;
    margin-bottom: 16px;
  }

  .toc-tab-group {
    display: grid;
    gap: 12px;
  }

  .toc-main-layout {
    display: grid;
    gap: 16px;
    align-items: start;
    grid-template-columns: minmax(0, 1.2fr) minmax(280px, 360px);
  }

  .toc-settings-form {
    min-width: 0;
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

  .toc-section-nav {
    min-width: 0;
  }

  .toc-section-nav__list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc-section-nav__item {
    flex: 0 0 auto;
  }

  .toc-section-heading {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-bottom: 12px;
    color: #303030;
  }

  .toc-section-heading__label {
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
  }

  .toc-editor-section {
    scroll-margin-top: 20px;
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
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 16px;
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

  .toc-code-editor .cm-cursorLayer {
    animation: none !important;
    opacity: 1 !important;
  }

  .toc-code-editor .cm-cursor,
  .toc-code-editor .cm-dropCursor {
    border-left-color: var(--p-color-text, #303030) !important;
  }

  .toc-code-editor .cm-focused > .cm-scroller > .cm-cursorLayer .cm-cursor {
    display: block !important;
  }

  .toc-tab-panel {
    display: grid;
    gap: 1rem;
  }

  .toc-tab-panel--hidden {
    position: absolute;
    inline-size: 0;
    block-size: 0;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
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
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  .toc-compact-fields-two {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
  }

  .toc-compact-fields-four {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(0, 1fr);
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
    scroll-margin-top: 20px;
  }

  .toc-device-section__chip {
    position: absolute;
    top: 12px;
    right: 16px;
    z-index: 1;
    max-width: calc(100% - 32px);
  }

  .toc-device-section__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  .toc-device-section__actions s-clickable-chip {
    inline-size: 144px;
    text-align: center;
  }

  .toc-slider-field {
    min-width: 0;
  }

  .toc-slider-field__header {
    display: grid;
    gap: 4px;
    min-width: 0;
    margin-bottom: 4px;
  }

  .toc-slider-field__label {
    color: var(--p-color-text, #303030);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 16px;
  }

  .toc-slider-field__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 100px;
    gap: 12px;
    align-items: center;
  }

  .toc-slider-field__range {
    min-width: 0;
  }

  .toc-slider-field__value {
    min-width: 0;
  }

  @media (max-width: 900px) {
    .toc-editor-shell {
      height: auto;
    }

    .toc-main-layout {
      grid-template-columns: minmax(0, 1fr);
      height: auto;
    }

    .toc-tab-group {
      position: static;
      padding-bottom: 0;
    }

    .toc-settings-form {
      overflow: visible;
      padding-right: 0;
      padding-bottom: 0;
    }
  }

  @media (min-width: 901px) {
    .toc-editor-shell {
      grid-template-rows: auto minmax(0, 1fr);
      min-height: 0;
      height: var(--toc-editor-shell-height, auto);
      margin-bottom: 0;
    }

    .toc-tab-group {
      position: sticky;
      top: 0;
      z-index: 2;
      padding-bottom: 4px;
      background: var(--p-color-bg, #f1f1f1);
    }

    .toc-main-layout {
      height: 100%;
      min-height: 0;
      align-items: stretch;
    }

    .toc-main-layout > * {
      min-height: 0;
    }

    .toc-settings-form {
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      padding-right: 4px;
      padding-bottom: 16px;
      scrollbar-gutter: stable;
    }
  }

  @media (max-width: 640px) {
    .toc-section-nav__list {
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .toc-slider-field__row {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;

export const PREVIEW_STYLES = `
  .toc-preview-column {
    min-width: 0;
    min-height: 0;
  }

  .toc-preview-column--sticky {
    position: sticky;
    top: 16px;
    align-self: start;
  }

  .toc-settings-preview {
    display: grid;
    gap: 16px;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .toc-preview-section {
    display: grid;
    gap: 10px;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .toc-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .toc-preview-header-top {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  .toc-preview-header-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    flex-wrap: wrap;
  }

  .toc-preview-heading {
    margin: 0;
    color: #303030;
    font-size: 13px;
    font-weight: 600;
    line-height: 16px;
  }

  .toc-preview-device-toggle {
    width: fit-content;
  }

  .toc-preview-header-action {
    margin-left: auto;
  }

  .toc-preview-pane {
    min-width: 0;
    min-height: 0;
    width: 100%;
    height: 100%;
    display: grid;
    align-content: start;
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
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .toc-preview-shell {
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
  }

  .toc-preview-desktop {
    overflow: visible;
  }

  .toc-preview-float {
    display: flex;
    align-items: flex-start;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    max-width: 100%;
  }

  .toc-preview-float .toc-widget,
  .toc-preview-flow .toc-widget {
    box-sizing: border-box;
    width: min(320px, 100%);
    margin: 0;
  }

  .toc-preview-flow {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    max-width: 100%;
  }

  .toc-preview-flow--mobile {
    max-width: 360px;
    margin: 0 auto;
  }

  .toc-preview-mobile {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    max-width: 100%;
  }

  @media (max-width: 900px) {
    .toc-preview-column--sticky {
      position: static;
    }
  }

  @media (max-width: 640px) {
    .toc-preview-header-top {
      align-items: flex-start;
    }
  }
`;

function buildDefaultCustomCss() {
  return CUSTOM_CSS_REFERENCE_SELECTORS.map(
    (selector) =>
      `${selector} {\n\n}\n\n@media (max-width: ${CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN}) {\n  ${selector} {\n\n  }\n}`,
  ).join("\n\n");
}
