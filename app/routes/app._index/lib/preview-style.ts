import type { CSSProperties } from "react";

import type { TocDeviceConfig, TocShadowPreset } from "./types";

type TocShadowColor = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
};

type TocShadowLayer = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  alpha: number;
};

export function getPreviewContainerStyle(device: TocDeviceConfig): CSSProperties {
  return {
    "--toc-background": device.background,
    "--toc-max-width": device.maxWidth > 0 ? `${device.maxWidth}px` : "none",
    "--toc-border-color": device.color,
    "--toc-border-width": `${device.width}px`,
    "--toc-border-radius": `${device.radius}px`,
    "--toc-shadow": buildShadowValue(device),
    "--toc-padding-top": `${device.paddingTop}px`,
    "--toc-padding-bottom": `${device.paddingBottom}px`,
    "--toc-padding-left": `${device.paddingLeft}px`,
    "--toc-padding-right": `${device.paddingRight}px`,
    "--toc-offset-top": `${clampPreviewOffset(device.offsetTop)}px`,
    "--toc-offset-bottom": `${clampPreviewOffset(device.offsetBottom)}px`,
    "--toc-offset-left": `${clampPreviewOffset(device.offsetLeft)}px`,
    "--toc-offset-right": `${clampPreviewOffset(device.offsetRight)}px`,
    "--toc-following-marker-width": `${device.followingMarkerWidth}px`,
    "--toc-following-marker-height": `${device.followingMarkerHeight}px`,
    "--toc-following-marker-color": device.followingMarkerColor,
    "--toc-following-marker-head-offset": `${device.followingMarkerOffset}px`,
    "--toc-following-marker-border-radius": `${device.followingMarkerBorderRadius}px`,
    "--toc-crawling-snake-width": `${device.crawlingSnakeWidth}px`,
    "--toc-crawling-snake-height": `${device.crawlingSnakeHeight}px`,
    "--toc-crawling-snake-color": device.crawlingSnakeColor,
    "--toc-crawling-snake-head-offset": `${device.crawlingSnakeOffset}px`,
    "--toc-jumping-marker-width": `${device.jumpingMarkerWidth}px`,
    "--toc-jumping-marker-height": `${device.jumpingMarkerHeight}px`,
    "--toc-jumping-marker-color": device.jumpingMarkerColor,
    "--toc-jumping-marker-head-offset": `${device.jumpingMarkerOffset}px`,
    "--toc-jumping-marker-border-radius": `${device.jumpingMarkerBorderRadius}px`,
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
    "--toc-show-button-padding-top": `${device.showButtonPaddingTop}px`,
    "--toc-show-button-padding-bottom": `${device.showButtonPaddingBottom}px`,
    "--toc-show-button-padding-left": `${device.showButtonPaddingLeft}px`,
    "--toc-show-button-padding-right": `${device.showButtonPaddingRight}px`,
    "--toc-mobile-border-color": device.color,
    "--toc-mobile-border-width": `${device.width}px`,
    "--toc-mobile-border-radius": `${device.radius}px`,
    "--toc-mobile-shadow": buildShadowValue(device),
    "--toc-mobile-padding-top": `${device.paddingTop}px`,
    "--toc-mobile-padding-bottom": `${device.paddingBottom}px`,
    "--toc-mobile-padding-left": `${device.paddingLeft}px`,
    "--toc-mobile-padding-right": `${device.paddingRight}px`,
    "--toc-mobile-offset-top": `${clampPreviewOffset(device.offsetTop)}px`,
    "--toc-mobile-offset-bottom": `${clampPreviewOffset(device.offsetBottom)}px`,
    "--toc-mobile-offset-left": `${clampPreviewOffset(device.offsetLeft)}px`,
    "--toc-mobile-offset-right": `${clampPreviewOffset(device.offsetRight)}px`,
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
    "--toc-mobile-show-button-padding-top": `${device.showButtonPaddingTop}px`,
    "--toc-mobile-show-button-padding-bottom": `${device.showButtonPaddingBottom}px`,
    "--toc-mobile-show-button-padding-left": `${device.showButtonPaddingLeft}px`,
    "--toc-mobile-show-button-padding-right": `${device.showButtonPaddingRight}px`,
  } as CSSProperties;
}

export function getPreviewPlacementClass(
  previewDevice: "desktop" | "mobile",
  device: TocDeviceConfig,
) {
  if (previewDevice !== "desktop") {
    return "toc-preview-flow toc-preview-flow--mobile";
  }

  if (device.position === "float-left") {
    return "toc-preview-float toc-preview-float--left";
  }

  if (device.position === "float-right") {
    return "toc-preview-float";
  }

  return "toc-preview-flow";
}

export function getPreviewPlacementStyle(
  previewDevice: "desktop" | "mobile",
  device: TocDeviceConfig,
): CSSProperties | undefined {
  if (previewDevice !== "desktop") {
    return undefined;
  }

  const offsetTop = clampPreviewOffset(device.offsetTop);
  const offsetRight = clampPreviewOffset(device.offsetRight);
  const offsetBottom = clampPreviewOffset(device.offsetBottom);
  const offsetLeft = clampPreviewOffset(device.offsetLeft);

  return {
    paddingTop: `${offsetTop}px`,
    paddingRight: `${offsetRight}px`,
    paddingBottom: `${offsetBottom}px`,
    paddingLeft: `${offsetLeft}px`,
  };
}

function clampPreviewOffset(value: number) {
  return Math.max(-40, Math.min(40, value));
}

function getTailwindShadowLayers(): Record<TocShadowPreset, TocShadowLayer[]> {
  return {
    none: [],
    "extra-small": [{ x: 0, y: 1, blur: 2, spread: 0, alpha: 0.05 }],
    small: [
      { x: 0, y: 1, blur: 3, spread: 0, alpha: 0.1 },
      { x: 0, y: 1, blur: 2, spread: -1, alpha: 0.1 },
    ],
    medium: [
      { x: 0, y: 4, blur: 6, spread: -1, alpha: 0.1 },
      { x: 0, y: 2, blur: 4, spread: -2, alpha: 0.1 },
    ],
    large: [
      { x: 0, y: 10, blur: 15, spread: -3, alpha: 0.1 },
      { x: 0, y: 4, blur: 6, spread: -4, alpha: 0.1 },
    ],
    "extra-large": [
      { x: 0, y: 20, blur: 25, spread: -5, alpha: 0.1 },
      { x: 0, y: 8, blur: 10, spread: -6, alpha: 0.1 },
    ],
  };
}

function clampShadowChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

function clampShadowAlpha(value: number) {
  return Math.max(0, Math.min(1, value));
}

function parseShadowColorValue(value: string): TocShadowColor | null {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3 || hex.length === 4
        ? hex
            .split("")
            .map((character) => `${character}${character}`)
            .join("")
        : hex;

    if (expanded.length !== 6 && expanded.length !== 8) {
      return null;
    }

    const red = Number.parseInt(expanded.slice(0, 2), 16);
    const green = Number.parseInt(expanded.slice(2, 4), 16);
    const blue = Number.parseInt(expanded.slice(4, 6), 16);
    const alpha =
      expanded.length === 8
        ? Number.parseInt(expanded.slice(6, 8), 16) / 255
        : 1;

    if ([red, green, blue, alpha].some((channel) => Number.isNaN(channel))) {
      return null;
    }

    return { red, green, blue, alpha };
  }

  const rgbMatch = normalized.match(
    /^rgba?\(\s*([0-9.]+%?)\s*[, ]\s*([0-9.]+%?)\s*[, ]\s*([0-9.]+%?)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/i,
  );

  if (!rgbMatch) {
    return null;
  }

  const [, redToken, greenToken, blueToken, alphaToken] = rgbMatch;
  const parseChannel = (token: string) =>
    token.endsWith("%")
      ? (Number.parseFloat(token) / 100) * 255
      : Number.parseFloat(token);
  const parseAlpha = (token: string) =>
    token.endsWith("%")
      ? Number.parseFloat(token) / 100
      : Number.parseFloat(token);
  const red = parseChannel(redToken);
  const green = parseChannel(greenToken);
  const blue = parseChannel(blueToken);
  const alpha = alphaToken ? parseAlpha(alphaToken) : 1;

  if ([red, green, blue, alpha].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return {
    red: clampShadowChannel(Math.round(red)),
    green: clampShadowChannel(Math.round(green)),
    blue: clampShadowChannel(Math.round(blue)),
    alpha: clampShadowAlpha(alpha),
  };
}

function buildShadowValue(device: TocDeviceConfig) {
  const layers = getTailwindShadowLayers()[device.shadowPreset] ?? [];

  if (!layers.length) {
    return "none";
  }

  const parsedColor = parseShadowColorValue(device.shadowColor);
  const baseColor = parsedColor ?? { red: 0, green: 0, blue: 0, alpha: 1 };

  return layers
    .map((layer) => {
      const alpha = clampShadowAlpha(baseColor.alpha * layer.alpha);

      return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgb(${baseColor.red} ${baseColor.green} ${baseColor.blue} / ${Number(alpha.toFixed(3))})`;
    })
    .join(", ");
}
