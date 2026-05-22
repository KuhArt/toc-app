import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import {
  TOC_CRAWLING_SNAKE_VISIBLE_LENGTH,
  buildJumpingMarkerFlight,
  buildPreviewReplaySequence,
  buildSnakeClickFlight,
  flattenPreviewItemIds,
  getJumpingMarkerProgress,
  getMarkerSettingsForList,
  getPreviewReplayStepDelay,
  getSnakeClickFlightProgress,
  getSnakeFlightCurrentLinkId,
  isCrawlingSnakeAnimation,
  isDesktopMarkerAnimation,
  isFollowingMarkerAnimation,
  isJumpingMarkerAnimation,
  measureListLinkHeadPoint,
  measureTocJumpingMarkerGeometry,
  measureTocSnakeClickFlightGeometry,
  measureTocSnakeGeometry,
  snakeGeometryEqual,
  snapRotationToQuarterTurn,
  type TocJumpingMarkerFlight,
  type TocSnakeClickFlight,
  type TocSnakeGeometry,
} from "../../lib/preview-animation";
import { type TocPreviewState } from "../../lib/preview-data";
import type {
  DeviceTab,
  TocDeviceConfig,
  TocMarkerFormat,
  TocTextAlignment,
} from "../../lib/types";

type UseTocPreviewControllerArgs = {
  device: TocDeviceConfig;
  indentation: boolean;
  markerFormat: TocMarkerFormat;
  preview: TocPreviewState;
  previewDevice: DeviceTab;
  replayToken: number;
  textAlignment: TocTextAlignment;
};

export type TocPreviewControllerResult = {
  activeId: string;
  crawlingSnakeActive: boolean;
  crawlingSnakePathStyle?: CSSProperties;
  expanded: boolean;
  followingMarkerActive: boolean;
  jumpingMarkerActive: boolean;
  listRef: RefObject<HTMLUListElement>;
  markerActive: boolean;
  onItemSelect: (itemId: string) => void;
  onToggleExpanded: () => void;
  showBottomFade: boolean;
  showToggle: boolean;
  showTopFade: boolean;
  snakeGeometry: TocSnakeGeometry | null;
};

export function useTocPreviewController({
  device,
  indentation,
  markerFormat,
  preview,
  previewDevice,
  replayToken,
  textAlignment,
}: UseTocPreviewControllerArgs): TocPreviewControllerResult {
  const [expanded, setExpanded] = useState(false);
  const [activeId, setActiveId] = useState(preview.activeId);
  const [highlightedId, setHighlightedId] = useState(preview.activeId);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [snakeGeometry, setSnakeGeometry] = useState<TocSnakeGeometry | null>(
    null,
  );
  const listRef = useRef<HTMLUListElement>(null);
  const snakeFrameRef = useRef<number | null>(null);
  const crawlingSnakeClickFrameRef = useRef<number | null>(null);
  const replayStepTimeoutRef = useRef<number | null>(null);
  const replayNonceRef = useRef(0);
  const jumpingMarkerFrameRef = useRef<number | null>(null);
  const snakeGeometryRef = useRef<TocSnakeGeometry | null>(null);
  const crawlingSnakeTargetIdRef = useRef<string | null>(null);
  const crawlingSnakeClickFlightRef = useRef<TocSnakeClickFlight | null>(null);
  const crawlingSnakeReplayCompletionIdRef = useRef<string | null>(null);
  const crawlingSnakeReplayResetIdRef = useRef<string | null>(null);
  const previousActiveIdRef = useRef(preview.activeId);
  const previousAnimationTypeRef = useRef(device.animationType);
  const previousReplayTokenRef = useRef(replayToken);
  const jumpingMarkerFlightRef = useRef<TocJumpingMarkerFlight | null>(null);
  const jumpingMarkerRotationRef = useRef(0);
  const previewItemIds = flattenPreviewItemIds(preview.items);
  const markerActive = isDesktopMarkerAnimation(
    previewDevice,
    device.animationType,
  );
  const followingMarkerActive =
    markerActive && isFollowingMarkerAnimation(device.animationType);
  const crawlingSnakeActive =
    markerActive && isCrawlingSnakeAnimation(device.animationType);
  const jumpingMarkerActive =
    markerActive && isJumpingMarkerAnimation(device.animationType);

  const commitSnakeGeometry = useCallback(
    (nextGeometry: TocSnakeGeometry | null) => {
      snakeGeometryRef.current = nextGeometry;
      setSnakeGeometry((current) =>
        snakeGeometryEqual(current, nextGeometry) ? current : nextGeometry,
      );
    },
    [],
  );

  const cancelReplay = useCallback(() => {
    replayNonceRef.current += 1;

    if (replayStepTimeoutRef.current !== null) {
      window.clearTimeout(replayStepTimeoutRef.current);
      replayStepTimeoutRef.current = null;
    }
  }, []);

  const resetPreviewFlights = useCallback((targetId: string | null) => {
    crawlingSnakeTargetIdRef.current = targetId;
    crawlingSnakeClickFlightRef.current = null;
    crawlingSnakeReplayCompletionIdRef.current = null;
    crawlingSnakeReplayResetIdRef.current = null;
    jumpingMarkerFlightRef.current = null;
    jumpingMarkerRotationRef.current = 0;

    if (crawlingSnakeClickFrameRef.current !== null) {
      cancelAnimationFrame(crawlingSnakeClickFrameRef.current);
      crawlingSnakeClickFrameRef.current = null;
    }

    if (jumpingMarkerFrameRef.current !== null) {
      cancelAnimationFrame(jumpingMarkerFrameRef.current);
      jumpingMarkerFrameRef.current = null;
    }
  }, []);

  const keepPreviewLinkVisible = useCallback((link: HTMLAnchorElement | null) => {
    const list = listRef.current;

    if (!list || !link || list.scrollHeight <= list.clientHeight) {
      return;
    }

    const containerRect = list.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const padding = 8;

    if (linkRect.top < containerRect.top + padding) {
      list.scrollTop -= containerRect.top + padding - linkRect.top;
      return;
    }

    if (linkRect.bottom > containerRect.bottom - padding) {
      list.scrollTop += linkRect.bottom - (containerRect.bottom - padding);
    }
  }, []);

  const findPreviewLinkById = useCallback(
    (list: HTMLUListElement, itemId: string) =>
      Array.from(
        list.querySelectorAll<HTMLAnchorElement>(".toc-widget__link"),
      ).find((link) => (link.getAttribute("href") || "").slice(1) === itemId) ||
      null,
    [],
  );

  const measureSnake = useCallback(() => {
    if (!markerActive) {
      crawlingSnakeClickFlightRef.current = null;
      jumpingMarkerFlightRef.current = null;
      commitSnakeGeometry(null);
      return;
    }

    const list = listRef.current;
    const activeLink = list?.querySelector<HTMLAnchorElement>(
      ".toc-widget__link--current",
    );
    const centerCrawlingSnake =
      crawlingSnakeActive && crawlingSnakeTargetIdRef.current === activeId;
    let nextGeometry: TocSnakeGeometry | null = null;

    if (list && activeLink) {
      if (jumpingMarkerActive) {
        const flight = jumpingMarkerFlightRef.current;
        const progress = flight
          ? getJumpingMarkerProgress(flight, performance.now())
          : 1;

        nextGeometry = measureTocJumpingMarkerGeometry(
          list,
          activeLink,
          jumpingMarkerRotationRef.current,
          flight,
          progress,
        );

        if (flight && progress >= 1) {
          jumpingMarkerRotationRef.current = snapRotationToQuarterTurn(
            flight.startRotation + flight.rotationDelta,
          );
          jumpingMarkerFlightRef.current = null;
        }
      } else if (crawlingSnakeActive && crawlingSnakeClickFlightRef.current) {
        const progress = getSnakeClickFlightProgress(
          crawlingSnakeClickFlightRef.current,
          performance.now(),
        );

        nextGeometry = measureTocSnakeClickFlightGeometry(
          list,
          crawlingSnakeClickFlightRef.current.fromLink,
          crawlingSnakeClickFlightRef.current.toLink,
          progress,
        );

        if (progress >= 1) {
          crawlingSnakeClickFlightRef.current = null;
        }
      } else {
        nextGeometry = measureTocSnakeGeometry(
          list,
          activeLink,
          null,
          0,
          centerCrawlingSnake,
        );
      }
    }

    commitSnakeGeometry(nextGeometry);
  }, [
    activeId,
    commitSnakeGeometry,
    crawlingSnakeActive,
    jumpingMarkerActive,
    markerActive,
  ]);

  const scheduleSnakeMeasurement = useCallback(() => {
    if (snakeFrameRef.current !== null) {
      cancelAnimationFrame(snakeFrameRef.current);
    }

    snakeFrameRef.current = requestAnimationFrame(() => {
      snakeFrameRef.current = null;
      measureSnake();
    });
  }, [measureSnake]);

  const resetReplayMarker = useCallback(
    (itemId: string) => {
      crawlingSnakeTargetIdRef.current = crawlingSnakeActive ? itemId : null;
      previousActiveIdRef.current = itemId;
      setActiveId(itemId);
      setHighlightedId(itemId);
      scheduleSnakeMeasurement();
    },
    [crawlingSnakeActive, scheduleSnakeMeasurement],
  );

  const onItemSelect = useCallback(
    (itemId: string) => {
      cancelReplay();
      crawlingSnakeTargetIdRef.current = itemId;
      setActiveId(itemId);
      setHighlightedId(itemId);

      if (itemId === activeId) {
        scheduleSnakeMeasurement();
      }
    },
    [activeId, cancelReplay, scheduleSnakeMeasurement],
  );

  const runJumpingMarkerFlight = useCallback(() => {
    const list = listRef.current;
    const activeLink = list?.querySelector<HTMLAnchorElement>(
      ".toc-widget__link--current",
    );
    const flight = jumpingMarkerFlightRef.current;

    if (!list || !activeLink || !flight) {
      jumpingMarkerFrameRef.current = null;
      measureSnake();
      return;
    }

    const progress = getJumpingMarkerProgress(flight, performance.now());
    commitSnakeGeometry(
      measureTocJumpingMarkerGeometry(
        list,
        activeLink,
        jumpingMarkerRotationRef.current,
        flight,
        progress,
      ),
    );

    if (progress >= 1) {
      jumpingMarkerRotationRef.current = snapRotationToQuarterTurn(
        flight.startRotation + flight.rotationDelta,
      );
      jumpingMarkerFlightRef.current = null;
      jumpingMarkerFrameRef.current = null;
      measureSnake();
      return;
    }

    jumpingMarkerFrameRef.current = requestAnimationFrame(runJumpingMarkerFlight);
  }, [commitSnakeGeometry, measureSnake]);

  const runCrawlingSnakeClickFlight = useCallback(() => {
    const list = listRef.current;
    const flight = crawlingSnakeClickFlightRef.current;

    if (!list || !flight) {
      crawlingSnakeClickFrameRef.current = null;
      measureSnake();
      return;
    }

    const progress = getSnakeClickFlightProgress(flight, performance.now());
    const replayHighlightId = crawlingSnakeReplayCompletionIdRef.current
      ? getSnakeFlightCurrentLinkId(
          list,
          flight.fromLink,
          flight.toLink,
          progress,
        )
      : null;

    if (replayHighlightId) {
      setHighlightedId((current) =>
        current === replayHighlightId ? current : replayHighlightId,
      );
    }

    commitSnakeGeometry(
      measureTocSnakeClickFlightGeometry(
        list,
        flight.fromLink,
        flight.toLink,
        progress,
      ),
    );

    if (progress >= 1) {
      crawlingSnakeClickFlightRef.current = null;
      crawlingSnakeClickFrameRef.current = null;

      if (crawlingSnakeReplayCompletionIdRef.current) {
        const resetId =
          crawlingSnakeReplayResetIdRef.current ||
          crawlingSnakeReplayCompletionIdRef.current;

        crawlingSnakeReplayCompletionIdRef.current = null;
        crawlingSnakeReplayResetIdRef.current = null;
        resetReplayMarker(resetId);
        return;
      }

      measureSnake();
      return;
    }

    crawlingSnakeClickFrameRef.current = requestAnimationFrame(
      runCrawlingSnakeClickFlight,
    );
  }, [commitSnakeGeometry, measureSnake, resetReplayMarker]);

  const replayFromTop = useCallback(() => {
    if (!markerActive || !previewItemIds.length) {
      cancelReplay();
      return;
    }

    cancelReplay();

    const replayNonce = replayNonceRef.current;
    const [firstId] = previewItemIds;
    const stepDelay = getPreviewReplayStepDelay(device.animationType);
    const replaySequence = buildPreviewReplaySequence(previewItemIds, 3);

    resetPreviewFlights(firstId);
    resetReplayMarker(firstId);

    if (!replaySequence.length || stepDelay <= 0) {
      return;
    }

    const queueReplayStep = (index: number) => {
      replayStepTimeoutRef.current = window.setTimeout(() => {
        if (replayNonceRef.current !== replayNonce) {
          return;
        }

        const nextId = replaySequence[index];

        if (!nextId) {
          replayStepTimeoutRef.current = null;
          return;
        }

        crawlingSnakeTargetIdRef.current = nextId;
        setActiveId(nextId);
        setHighlightedId(nextId);

        if (index + 1 < replaySequence.length) {
          queueReplayStep(index + 1);
          return;
        }

        replayStepTimeoutRef.current = null;
      }, stepDelay);
    };

    queueReplayStep(0);
  }, [
    cancelReplay,
    device.animationType,
    markerActive,
    previewItemIds,
    resetPreviewFlights,
    resetReplayMarker,
  ]);

  const startJumpingMarkerFlight = useCallback(
    (targetId: string) => {
      const list = listRef.current;

      if (!list) {
        return;
      }

      const targetLink = findPreviewLinkById(list, targetId);
      if (!targetLink) {
        jumpingMarkerFlightRef.current = null;
        measureSnake();
        return;
      }

      const previousLink = findPreviewLinkById(list, previousActiveIdRef.current);
      const currentGeometry = snakeGeometryRef.current;
      const fallbackStartPoint =
        (previousLink && measureListLinkHeadPoint(list, previousLink)) ||
        measureListLinkHeadPoint(list, targetLink);

      if (!fallbackStartPoint) {
        jumpingMarkerFlightRef.current = null;
        measureSnake();
        return;
      }

      const startPoint = currentGeometry
        ? { x: currentGeometry.headX, y: currentGeometry.headY }
        : fallbackStartPoint;
      const startRotation =
        currentGeometry?.headAngle ?? jumpingMarkerRotationRef.current;
      const snappedStartRotation = snapRotationToQuarterTurn(startRotation);
      const nextFlight = buildJumpingMarkerFlight(
        list,
        startPoint,
        snappedStartRotation,
        targetLink,
      );

      if (!nextFlight) {
        jumpingMarkerRotationRef.current = snappedStartRotation;
        jumpingMarkerFlightRef.current = null;
        measureSnake();
        return;
      }

      jumpingMarkerFlightRef.current = nextFlight;

      if (jumpingMarkerFrameRef.current !== null) {
        cancelAnimationFrame(jumpingMarkerFrameRef.current);
      }

      jumpingMarkerFrameRef.current = requestAnimationFrame(runJumpingMarkerFlight);
    },
    [findPreviewLinkById, measureSnake, runJumpingMarkerFlight],
  );

  const startCrawlingSnakeClickFlight = useCallback(
    (targetId: string) => {
      const list = listRef.current;

      if (!list || !crawlingSnakeActive) {
        crawlingSnakeClickFlightRef.current = null;
        measureSnake();
        return;
      }

      const targetLink = findPreviewLinkById(list, targetId);
      const previousLink = findPreviewLinkById(list, previousActiveIdRef.current);
      const nextFlight = buildSnakeClickFlight(
        list,
        previousLink,
        targetLink,
        "linear",
      );

      if (!nextFlight) {
        crawlingSnakeClickFlightRef.current = null;
        measureSnake();
        return;
      }

      crawlingSnakeClickFlightRef.current = nextFlight;

      if (crawlingSnakeClickFrameRef.current !== null) {
        cancelAnimationFrame(crawlingSnakeClickFrameRef.current);
      }

      crawlingSnakeClickFrameRef.current = requestAnimationFrame(
        runCrawlingSnakeClickFlight,
      );
    },
    [
      crawlingSnakeActive,
      findPreviewLinkById,
      measureSnake,
      runCrawlingSnakeClickFlight,
    ],
  );

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
    cancelReplay();
    resetPreviewFlights(crawlingSnakeActive ? preview.activeId : null);
    previousActiveIdRef.current = preview.activeId;
    setActiveId(preview.activeId);
    setHighlightedId(preview.activeId);
  }, [
    cancelReplay,
    crawlingSnakeActive,
    preview.activeId,
    preview.items,
    resetPreviewFlights,
  ]);

  useEffect(() => {
    if (!needsToggle) {
      setExpanded(false);
    }
  }, [needsToggle]);

  useEffect(() => {
    return () => {
      cancelReplay();
      if (snakeFrameRef.current !== null) {
        cancelAnimationFrame(snakeFrameRef.current);
      }
      if (crawlingSnakeClickFrameRef.current !== null) {
        cancelAnimationFrame(crawlingSnakeClickFrameRef.current);
      }
      if (jumpingMarkerFrameRef.current !== null) {
        cancelAnimationFrame(jumpingMarkerFrameRef.current);
      }
    };
  }, [cancelReplay]);

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

    const handleListScroll = () => {
      refreshFades();
      scheduleSnakeMeasurement();
    };

    refreshFades();
    scheduleSnakeMeasurement();
    list.addEventListener("scroll", handleListScroll, { passive: true });

    return () => list.removeEventListener("scroll", handleListScroll);
  }, [expanded, refreshFades, scheduleSnakeMeasurement]);

  useEffect(() => {
    const list = listRef.current;
    const currentLink = list ? findPreviewLinkById(list, highlightedId) : null;

    keepPreviewLinkVisible(currentLink);
    refreshFades();

    if (!jumpingMarkerActive) {
      if (crawlingSnakeActive && previousActiveIdRef.current !== activeId) {
        startCrawlingSnakeClickFlight(activeId);
        previousActiveIdRef.current = activeId;
        return;
      }

      previousActiveIdRef.current = activeId;
      scheduleSnakeMeasurement();
      return;
    }

    if (previousActiveIdRef.current === activeId) {
      scheduleSnakeMeasurement();
      return;
    }

    startJumpingMarkerFlight(activeId);
    previousActiveIdRef.current = activeId;
  }, [
    activeId,
    crawlingSnakeActive,
    findPreviewLinkById,
    highlightedId,
    jumpingMarkerActive,
    keepPreviewLinkVisible,
    refreshFades,
    scheduleSnakeMeasurement,
    startCrawlingSnakeClickFlight,
    startJumpingMarkerFlight,
  ]);

  useEffect(() => {
    if (!jumpingMarkerActive) {
      jumpingMarkerFlightRef.current = null;
      jumpingMarkerRotationRef.current = 0;
    }

    if (!crawlingSnakeActive) {
      crawlingSnakeClickFlightRef.current = null;
      if (crawlingSnakeClickFrameRef.current !== null) {
        cancelAnimationFrame(crawlingSnakeClickFrameRef.current);
        crawlingSnakeClickFrameRef.current = null;
      }
    }

    scheduleSnakeMeasurement();
  }, [
    activeId,
    crawlingSnakeActive,
    device.animationType,
    device.showTitle,
    expanded,
    indentation,
    jumpingMarkerActive,
    markerFormat,
    needsToggle,
    preview.items,
    preview.showToc,
    preview.title,
    scheduleSnakeMeasurement,
    textAlignment,
  ]);

  useEffect(() => {
    if (previousAnimationTypeRef.current === device.animationType) {
      return;
    }

    previousAnimationTypeRef.current = device.animationType;

    if (!markerActive) {
      cancelReplay();
      return;
    }

    replayFromTop();
  }, [cancelReplay, device.animationType, markerActive, replayFromTop]);

  useEffect(() => {
    if (previousReplayTokenRef.current === replayToken) {
      return;
    }

    previousReplayTokenRef.current = replayToken;

    if (markerActive) {
      replayFromTop();
    }
  }, [markerActive, replayFromTop, replayToken]);

  useEffect(() => {
    if (!markerActive) {
      return;
    }

    const handleResize = () => {
      scheduleSnakeMeasurement();
    };

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [markerActive, scheduleSnakeMeasurement]);

  const showToggle = device.showButton && needsToggle;
  const crawlingSnakeVisibleLength =
    crawlingSnakeActive && listRef.current
      ? getMarkerSettingsForList(listRef.current).crawlingSnakeWidth
      : TOC_CRAWLING_SNAKE_VISIBLE_LENGTH;
  const crawlingSnakePathStyle =
    crawlingSnakeActive && snakeGeometry
      ? ({
          strokeDasharray: `${Math.min(crawlingSnakeVisibleLength, snakeGeometry.pathLength)} ${Math.max(snakeGeometry.pathLength, 1)}`,
          strokeDashoffset: `-${Math.max(snakeGeometry.pathLength - crawlingSnakeVisibleLength, 0)}`,
        } as CSSProperties)
      : undefined;

  return {
    activeId: highlightedId,
    crawlingSnakeActive,
    crawlingSnakePathStyle,
    expanded,
    followingMarkerActive,
    jumpingMarkerActive,
    listRef,
    markerActive,
    onItemSelect,
    onToggleExpanded: () => {
      setExpanded((current) => !current);
    },
    showBottomFade,
    showToggle,
    showTopFade,
    snakeGeometry,
  };
}
