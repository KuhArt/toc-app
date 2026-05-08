import type { CSSProperties } from "react";

import { getPreviewContainerStyle } from "../../lib/preview-style";
import { type TocPreviewState } from "../../lib/preview-data";
import type {
  DeviceTab,
  TocDeviceConfig,
  TocMarkerFormat,
  TocTextAlignment,
} from "../../lib/types";
import { TocPreviewList } from "./TocPreviewList";
import type { TocPreviewControllerResult } from "./useTocPreviewController";

type TocPreviewNavProps = TocPreviewControllerResult & {
  device: TocDeviceConfig;
  indentation: boolean;
  markerFormat: TocMarkerFormat;
  preview: TocPreviewState;
  previewDevice: DeviceTab;
  textAlignment: TocTextAlignment;
};

export function TocPreviewNav({
  device,
  indentation,
  markerActive,
  markerFormat,
  preview,
  previewDevice,
  textAlignment,
  listRef,
  activeId,
  onItemSelect,
  showToggle,
  expanded,
  onToggleExpanded,
  showTopFade,
  showBottomFade,
  snakeGeometry,
  crawlingSnakeActive,
  crawlingSnakePathStyle,
  followingMarkerActive,
  jumpingMarkerActive,
}: TocPreviewNavProps) {
  const listId = `toc-preview-list-${previewDevice}`;

  return (
    <nav
      className={buildNavClassName({
        crawlingSnakeActive,
        expanded,
        followingMarkerActive,
        indentation,
        jumpingMarkerActive,
        markerFormat,
        showToggle,
        textAlignment,
      })}
      aria-label="Table of contents preview"
      data-device={previewDevice}
      style={getPreviewContainerStyle(device)}
    >
      {device.showTitle ? (
        <div className="toc-widget__title">{preview.title}</div>
      ) : null}
      {showToggle ? (
        <FadeOverlay position="top" visible={showTopFade} />
      ) : null}
      <div className="toc-widget__list-shell">
        {markerActive ? (
          <SnakeLayer
            crawlingSnakeActive={crawlingSnakeActive}
            pathStyle={crawlingSnakePathStyle}
            snakeGeometry={snakeGeometry}
          />
        ) : null}
        <TocPreviewList
          listRef={listRef}
          listId={listId}
          items={preview.items}
          activeId={activeId}
          onItemSelect={onItemSelect}
        />
      </div>
      {showToggle ? (
        <FadeOverlay position="bottom" visible={showBottomFade} />
      ) : null}
      {showToggle ? (
        <button
          type="button"
          className="toc-widget__toggle"
          aria-controls={listId}
          aria-expanded={expanded}
          onClick={onToggleExpanded}
        >
          {expanded ? device.showLessButtonText : device.showMoreButtonText}
        </button>
      ) : null}
    </nav>
  );
}

function buildNavClassName({
  crawlingSnakeActive,
  expanded,
  followingMarkerActive,
  indentation,
  jumpingMarkerActive,
  markerFormat,
  showToggle,
  textAlignment,
}: {
  crawlingSnakeActive: boolean;
  expanded: boolean;
  followingMarkerActive: boolean;
  indentation: boolean;
  jumpingMarkerActive: boolean;
  markerFormat: TocMarkerFormat;
  showToggle: boolean;
  textAlignment: TocTextAlignment;
}) {
  return [
    "toc-widget",
    `toc-widget--align-${textAlignment}`,
    `toc-widget--markers-${markerFormat}`,
    !indentation ? "toc-widget--flat" : null,
    showToggle ? "toc-widget--show-more-active" : null,
    showToggle && expanded ? "toc-widget--expanded" : null,
    followingMarkerActive ? "toc-widget--animation-following-marker" : null,
    crawlingSnakeActive ? "toc-widget--animation-crawling-snake" : null,
    jumpingMarkerActive ? "toc-widget--animation-jumping-marker" : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function FadeOverlay({
  position,
  visible,
}: {
  position: "top" | "bottom";
  visible: boolean;
}) {
  return (
    <div
      className={`toc-widget__fade toc-widget__fade--${position}`}
      aria-hidden={position === "bottom" ? "true" : undefined}
      hidden={!visible}
    >
      <span className="toc-widget__fade-shim"></span>
    </div>
  );
}

function SnakeLayer({
  crawlingSnakeActive,
  pathStyle,
  snakeGeometry,
}: {
  crawlingSnakeActive: boolean;
  pathStyle?: CSSProperties;
  snakeGeometry: TocPreviewControllerResult["snakeGeometry"];
}) {
  return (
    <div className="toc-widget__snake" aria-hidden="true">
      <svg
        className="toc-widget__snake-svg"
        viewBox={`0 0 ${snakeGeometry?.width || 0} ${snakeGeometry?.height || 0}`}
        width={snakeGeometry?.width || 0}
        height={snakeGeometry?.height || 0}
        preserveAspectRatio="none"
      >
        {snakeGeometry?.path ? (
          <path
            className="toc-widget__snake-path"
            d={snakeGeometry.path}
            style={pathStyle}
          />
        ) : null}
      </svg>
      {snakeGeometry && !crawlingSnakeActive ? (
        <span
          className="toc-widget__snake-head"
          style={
            {
              left: `${snakeGeometry.headX}px`,
              top: `${snakeGeometry.headY}px`,
              "--toc-snake-head-rotation": `${snakeGeometry.headAngle}deg`,
              "--toc-snake-head-bend": `${snakeGeometry.headBend}deg`,
            } as CSSProperties
          }
        ></span>
      ) : null}
    </div>
  );
}
