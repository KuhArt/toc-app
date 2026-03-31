(() => {
  if (window.__shopifyTocAnimationShared) {
    return;
  }

  const TOC_SNAKE_HEAD_OFFSET = 12;
  const TOC_SNAKE_TOP_OFFSET = 8;
  const TOC_SNAKE_CLICK_MIN_DURATION = 220;
  const TOC_SNAKE_CLICK_MAX_DURATION = 460;
  const TOC_SQUARE_PARABOLA_SIZE = 6;
  const TOC_SQUARE_PARABOLA_MIN_DURATION = 260;
  const TOC_SQUARE_PARABOLA_MAX_DURATION = 420;

  function readMarkerCssPixels(element, propertyName, fallback) {
    if (!(element instanceof Element)) {
      return fallback;
    }

    const rawValue = window.getComputedStyle(element).getPropertyValue(propertyName);
    const parsedValue = Number.parseFloat(rawValue);

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  function getMarkerWidget(listElement) {
    return listElement.closest(".toc-widget");
  }

  function getMarkerSettingsForList(listElement) {
    const widget = getMarkerWidget(listElement);
    let headOffsetPropertyName = "--toc-square-parabola-head-offset";

    if (widget?.classList.contains("toc-widget--animation-snake-rect")) {
      headOffsetPropertyName = "--toc-snake-rect-head-offset";
    } else if (
      widget?.classList.contains("toc-widget--animation-snake-rect-bend")
    ) {
      headOffsetPropertyName = "--toc-snake-rect-bend-head-offset";
    } else if (
      widget?.classList.contains("toc-widget--animation-square-parabola")
    ) {
      headOffsetPropertyName = "--toc-square-parabola-head-offset";
    }

    return {
      headOffset: readMarkerCssPixels(
        widget,
        headOffsetPropertyName,
        TOC_SNAKE_HEAD_OFFSET,
      ),
      snakeRectBendWidth: readMarkerCssPixels(
        widget,
        "--toc-snake-rect-bend-width",
        16,
      ),
      squareParabolaSize: readMarkerCssPixels(
        widget,
        "--toc-square-parabola-size",
        TOC_SQUARE_PARABOLA_SIZE,
      ),
    };
  }

  function normalizeAngleDelta(delta) {
    let normalized = delta;

    while (normalized > 180) {
      normalized -= 360;
    }

    while (normalized < -180) {
      normalized += 360;
    }

    return normalized;
  }

  function clampSnakeCoordinate(value, limit) {
    if (!Number.isFinite(value)) {
      return 0;
    }

    if (limit <= 0) {
      return 0;
    }

    return Math.min(Math.max(value, 0), limit);
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function createSnakeLinkMetric(listRect, link, headOffset = TOC_SNAKE_HEAD_OFFSET) {
    const linkRect = link.getBoundingClientRect();
    const rowTop = linkRect.top - listRect.top;
    const rowBottom = linkRect.bottom - listRect.top;
    const rowHeight = linkRect.height;
    const inset = Math.min(6, Math.max(2, rowHeight * 0.24));
    const entryY = rowTop + inset;
    const exitY = Math.max(entryY, rowBottom - inset);

    return {
      centerY: rowTop + rowHeight / 2,
      entryY,
      exitY,
      laneX: clampSnakeCoordinate(
        linkRect.left - listRect.left - headOffset,
        listRect.width,
      ),
    };
  }

  function getTocMarkerBounds(listRect, markerSize = TOC_SQUARE_PARABOLA_SIZE) {
    const horizontalInset = markerSize / 2 + 2;
    const verticalInset = markerSize / 2 + 2;

    return {
      maxX: Math.max(horizontalInset, listRect.width - horizontalInset),
      maxY: Math.max(verticalInset, listRect.height - verticalInset),
      minX: horizontalInset,
      minY: verticalInset,
    };
  }

  function clampPointToBounds(point, bounds) {
    return {
      x: clampNumber(point.x, bounds.minX, bounds.maxX),
      y: clampNumber(point.y, bounds.minY, bounds.maxY),
    };
  }

  function getSnakeHeadPoint(metric, bounds) {
    return clampPointToBounds(
      { x: metric.laneX, y: metric.centerY },
      bounds,
    );
  }

  function measureListLinkHeadPoint(listElement, link) {
    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const markerSettings = getMarkerSettingsForList(listElement);

    return getSnakeHeadPoint(
      createSnakeLinkMetric(listRect, link, markerSettings.headOffset),
      getTocMarkerBounds(listRect, markerSettings.squareParabolaSize),
    );
  }

  function measureRayToBounds(origin, direction, bounds) {
    let maxDistance = Number.POSITIVE_INFINITY;

    if (Math.abs(direction.x) > 0.0001) {
      const distanceX =
        direction.x > 0
          ? (bounds.maxX - origin.x) / direction.x
          : (bounds.minX - origin.x) / direction.x;
      if (distanceX >= 0) {
        maxDistance = Math.min(maxDistance, distanceX);
      }
    }

    if (Math.abs(direction.y) > 0.0001) {
      const distanceY =
        direction.y > 0
          ? (bounds.maxY - origin.y) / direction.y
          : (bounds.minY - origin.y) / direction.y;
      if (distanceY >= 0) {
        maxDistance = Math.min(maxDistance, distanceY);
      }
    }

    return Number.isFinite(maxDistance) ? Math.max(0, maxDistance) : 0;
  }

  function measurePointDistance(left, right) {
    return Math.hypot(right.x - left.x, right.y - left.y);
  }

  function chooseParabolaControlPoint(startPoint, endPoint, bounds) {
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    const distance = Math.hypot(deltaX, deltaY);
    const midpoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2,
    };

    if (distance <= 1) {
      return midpoint;
    }

    const perpendicular = {
      x: -deltaY / distance,
      y: deltaX / distance,
    };
    const oppositePerpendicular = {
      x: -perpendicular.x,
      y: -perpendicular.y,
    };
    const preferredHeight = clampNumber(distance * 0.24, 18, 56);
    const preferredDirection =
      perpendicular.x <= oppositePerpendicular.x
        ? perpendicular
        : oppositePerpendicular;
    const fallbackDirection =
      preferredDirection === perpendicular
        ? oppositePerpendicular
        : perpendicular;
    const preferredRoom = measureRayToBounds(
      midpoint,
      preferredDirection,
      bounds,
    );
    const fallbackRoom = measureRayToBounds(
      midpoint,
      fallbackDirection,
      bounds,
    );
    const chosenDirection =
      preferredRoom > 0 ? preferredDirection : fallbackDirection;
    const availableRoom = preferredRoom > 0 ? preferredRoom : fallbackRoom;

    const amplitude = Math.min(
      preferredHeight,
      Math.max(availableRoom * 0.92, 0),
    );

    if (amplitude < 6) {
      return midpoint;
    }

    return clampPointToBounds(
      {
        x: midpoint.x + chosenDirection.x * amplitude,
        y: midpoint.y + chosenDirection.y * amplitude,
      },
      bounds,
    );
  }

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function snapRotationToQuarterTurn(angle) {
    return Math.round(angle / 90) * 90;
  }

  function getQuadraticPoint(startPoint, controlPoint, endPoint, progress) {
    const inverse = 1 - progress;

    return {
      x:
        inverse * inverse * startPoint.x +
        2 * inverse * progress * controlPoint.x +
        progress * progress * endPoint.x,
      y:
        inverse * inverse * startPoint.y +
        2 * inverse * progress * controlPoint.y +
        progress * progress * endPoint.y,
    };
  }

  function buildSquareParabolaFlight(
    listElement,
    startPoint,
    startRotation,
    targetLink,
  ) {
    if (!(targetLink instanceof HTMLAnchorElement)) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const markerSettings = getMarkerSettingsForList(listElement);
    const bounds = getTocMarkerBounds(
      listRect,
      markerSettings.squareParabolaSize,
    );
    const targetMetric = createSnakeLinkMetric(
      listRect,
      targetLink,
      markerSettings.headOffset,
    );
    const boundedStartPoint = clampPointToBounds(startPoint, bounds);
    const endPoint = getSnakeHeadPoint(targetMetric, bounds);
    const distance = measurePointDistance(boundedStartPoint, endPoint);

    if (distance <= 1) {
      return null;
    }

    return {
      controlPoint: chooseParabolaControlPoint(
        boundedStartPoint,
        endPoint,
        bounds,
      ),
      duration: clampNumber(
        220 + distance * 0.45,
        TOC_SQUARE_PARABOLA_MIN_DURATION,
        TOC_SQUARE_PARABOLA_MAX_DURATION,
      ),
      endPoint,
      rotationDelta: endPoint.y > boundedStartPoint.y ? -90 : 90,
      startPoint: boundedStartPoint,
      startRotation,
      startTime: performance.now(),
    };
  }

  function getSquareParabolaProgress(flight, now) {
    return clampNumber((now - flight.startTime) / flight.duration, 0, 1);
  }

  function buildSnakeClickFlight(listElement, fromLink, toLink) {
    if (
      !(fromLink instanceof HTMLAnchorElement) ||
      !(toLink instanceof HTMLAnchorElement)
    ) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const links = Array.from(
      listElement.querySelectorAll(".toc-widget__link"),
    );
    const fromIndex = links.indexOf(fromLink);
    const toIndex = links.indexOf(toLink);

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return null;
    }

    const { headOffset } = getMarkerSettingsForList(listElement);
    const metrics = links.map((link) =>
      createSnakeLinkMetric(listRect, link, headOffset),
    );
    const routePoints =
      fromIndex < toIndex
        ? buildSnakeRoutePoints(metrics, fromIndex, toIndex)
        : buildSnakeRoutePoints(metrics, toIndex, fromIndex);
    const routeLength = measureSnakePathLength(routePoints);

    if (routeLength <= 0) {
      return null;
    }

    return {
      duration: clampNumber(
        180 + routeLength * 0.7,
        TOC_SNAKE_CLICK_MIN_DURATION,
        TOC_SNAKE_CLICK_MAX_DURATION,
      ),
      fromLink,
      toLink,
      startTime: performance.now(),
    };
  }

  function getSnakeClickFlightProgress(flight, now) {
    return clampNumber((now - flight.startTime) / flight.duration, 0, 1);
  }

  function isSnakeLinkMovingUp(listElement, fromLink, toLink) {
    if (
      !(fromLink instanceof HTMLAnchorElement) ||
      !(toLink instanceof HTMLAnchorElement)
    ) {
      return false;
    }

    const links = Array.from(
      listElement.querySelectorAll(".toc-widget__link"),
    );
    const fromIndex = links.indexOf(fromLink);
    const toIndex = links.indexOf(toLink);

    return fromIndex > toIndex;
  }

  function pushSnakePoint(points, point) {
    const previousPoint = points[points.length - 1];

    if (
      previousPoint &&
      previousPoint.x === point.x &&
      previousPoint.y === point.y
    ) {
      return;
    }

    points.push(point);
  }

  function buildSnakePath(points) {
    if (!points.length) {
      return "";
    }

    return points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      return `${path} L ${point.x} ${point.y}`;
    }, "");
  }

  function measureSnakePathLength(points) {
    return points.slice(1).reduce((total, point, index) => {
      const previousPoint = points[index];

      return (
        total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      );
    }, 0);
  }

  function buildSettledSnakePoints(metrics) {
    if (!metrics.length) {
      return [];
    }

    const firstMetric = metrics[0];
    const points = [];
    let currentX = firstMetric.laneX;

    pushSnakePoint(points, {
      x: currentX,
      y: Math.min(TOC_SNAKE_TOP_OFFSET, firstMetric.entryY),
    });

    metrics.forEach((metric, index) => {
      const turnY =
        index === 0
          ? metric.entryY
          : (metrics[index - 1].exitY + metric.entryY) / 2;

      pushSnakePoint(points, { x: currentX, y: turnY });

      if (metric.laneX !== currentX) {
        currentX = metric.laneX;
        pushSnakePoint(points, { x: currentX, y: turnY });
      }

      pushSnakePoint(points, { x: currentX, y: metric.entryY });
      pushSnakePoint(points, {
        x: currentX,
        y: index === metrics.length - 1 ? metric.centerY : metric.exitY,
      });
    });

    return points;
  }

  function buildSnakeRoutePoints(metrics, startIndex, endIndex) {
    if (
      startIndex < 0 ||
      endIndex < 0 ||
      startIndex >= metrics.length ||
      endIndex >= metrics.length
    ) {
      return [];
    }

    const points = [];
    const step = startIndex < endIndex ? 1 : -1;
    const startMetric = metrics[startIndex];

    pushSnakePoint(points, { x: startMetric.laneX, y: startMetric.centerY });

    for (let index = startIndex; index !== endIndex; index += step) {
      const currentMetric = metrics[index];
      const nextMetric = metrics[index + step];
      const currentEdgeY =
        step > 0 ? currentMetric.exitY : currentMetric.entryY;
      const nextEdgeY = step > 0 ? nextMetric.entryY : nextMetric.exitY;
      const turnY = (currentEdgeY + nextEdgeY) / 2;

      pushSnakePoint(points, { x: currentMetric.laneX, y: currentEdgeY });
      pushSnakePoint(points, { x: currentMetric.laneX, y: turnY });

      if (nextMetric.laneX !== currentMetric.laneX) {
        pushSnakePoint(points, { x: nextMetric.laneX, y: turnY });
      }

      pushSnakePoint(points, { x: nextMetric.laneX, y: nextEdgeY });
      pushSnakePoint(points, { x: nextMetric.laneX, y: nextMetric.centerY });
    }

    return points;
  }

  function appendSnakeRouteProgress(points, routePoints, progress) {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    if (clampedProgress <= 0 || routePoints.length < 2) {
      return;
    }

    const routeLength = measureSnakePathLength(routePoints);
    if (routeLength <= 0) {
      pushSnakePoint(points, routePoints[routePoints.length - 1]);
      return;
    }

    const targetLength = routeLength * clampedProgress;
    let traversed = 0;

    for (let index = 1; index < routePoints.length; index += 1) {
      const previousPoint = routePoints[index - 1];
      const point = routePoints[index];
      const segmentLength = Math.hypot(
        point.x - previousPoint.x,
        point.y - previousPoint.y,
      );

      if (segmentLength <= 0) {
        continue;
      }

      if (traversed + segmentLength <= targetLength) {
        pushSnakePoint(points, point);
        traversed += segmentLength;
        continue;
      }

      const segmentProgress = (targetLength - traversed) / segmentLength;
      pushSnakePoint(points, {
        x: previousPoint.x + (point.x - previousPoint.x) * segmentProgress,
        y: previousPoint.y + (point.y - previousPoint.y) * segmentProgress,
      });
      return;
    }
  }

  function appendSnakeTransitionPoints(
    points,
    currentMetric,
    nextMetric,
    progress,
  ) {
    appendSnakeRouteProgress(
      points,
      buildSnakeRoutePoints([currentMetric, nextMetric], 0, 1),
      progress,
    );
  }

  function appendCenteredBentMarkerTail(
    points,
    activeMetric,
    listHeight,
    visibleLength,
  ) {
    const centeredTailLength = visibleLength / 2;
    const tailEndY = clampSnakeCoordinate(
      activeMetric.centerY + centeredTailLength,
      listHeight,
    );

    if (tailEndY > activeMetric.centerY) {
      pushSnakePoint(points, { x: activeMetric.laneX, y: tailEndY });
    }
  }

  function measureTocSnakeGeometry(
    listElement,
    activeLink,
    nextLink = null,
    nextProgress = 0,
    centerBentMarker = false,
  ) {
    if (!(activeLink instanceof HTMLAnchorElement)) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const links = Array.from(
      listElement.querySelectorAll(".toc-widget__link"),
    );
    const activeIndex = links.indexOf(activeLink);

    if (activeIndex < 0) {
      return null;
    }

    const markerSettings = getMarkerSettingsForList(listElement);
    const allMetrics = links.map((link) =>
      createSnakeLinkMetric(listRect, link, markerSettings.headOffset),
    );
    if (!allMetrics.length) {
      return null;
    }

    const points = buildSettledSnakePoints(allMetrics.slice(0, activeIndex + 1));
    const nextIndex = nextLink ? links.indexOf(nextLink) : -1;

    if (nextIndex === activeIndex + 1 && nextIndex < allMetrics.length) {
      appendSnakeTransitionPoints(
        points,
        allMetrics[activeIndex],
        allMetrics[nextIndex],
        nextProgress,
      );
    }

    if (centerBentMarker) {
      appendCenteredBentMarkerTail(
        points,
        allMetrics[activeIndex],
        listRect.height,
        markerSettings.snakeRectBendWidth,
      );
    }

    const headPoint = points[points.length - 1];
    const segmentAngles = [];
    let headAngle = 0;
    let headBend = 0;

    for (let index = points.length - 1; index > 0; index -= 1) {
      const currentPoint = points[index];
      const previousPoint = points[index - 1];
      const deltaX = currentPoint.x - previousPoint.x;
      const deltaY = currentPoint.y - previousPoint.y;

      if (deltaX === 0 && deltaY === 0) {
        continue;
      }

      segmentAngles.push((Math.atan2(deltaY, deltaX) * 180) / Math.PI);
    }

    if (segmentAngles.length > 0) {
      headAngle = segmentAngles[0];
    }

    if (segmentAngles.length > 1) {
      headBend = Math.max(
        -18,
        Math.min(
          18,
          normalizeAngleDelta(segmentAngles[0] - segmentAngles[1]) * 0.22,
        ),
      );
    }

    return {
      headAngle,
      headBend,
      headX: headPoint?.x ?? allMetrics[activeIndex].laneX,
      headY: headPoint?.y ?? allMetrics[activeIndex].centerY,
      height: Math.ceil(listRect.height),
      path: buildSnakePath(points),
      pathLength: measureSnakePathLength(points),
      width: Math.ceil(listRect.width),
    };
  }

  function measureTocSnakeClickFlightGeometry(
    listElement,
    fromLink,
    toLink,
    progress,
  ) {
    if (
      !(fromLink instanceof HTMLAnchorElement) ||
      !(toLink instanceof HTMLAnchorElement)
    ) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const links = Array.from(
      listElement.querySelectorAll(".toc-widget__link"),
    );
    const fromIndex = links.indexOf(fromLink);
    const toIndex = links.indexOf(toLink);

    if (fromIndex < 0 || toIndex < 0) {
      return null;
    }

    if (fromIndex === toIndex) {
      return measureTocSnakeGeometry(listElement, toLink);
    }

    const { headOffset } = getMarkerSettingsForList(listElement);
    const allMetrics = links.map((link) =>
      createSnakeLinkMetric(listRect, link, headOffset),
    );
    const movingForward = fromIndex < toIndex;
    const anchorIndex = movingForward ? fromIndex : toIndex;
    const routeProgress = movingForward ? progress : 1 - progress;
    const points = buildSettledSnakePoints(
      allMetrics.slice(0, anchorIndex + 1),
    );

    appendSnakeRouteProgress(
      points,
      buildSnakeRoutePoints(
        allMetrics,
        anchorIndex,
        movingForward ? toIndex : fromIndex,
      ),
      routeProgress,
    );

    const headPoint = points[points.length - 1];
    const segmentAngles = [];
    let headAngle = 0;
    let headBend = 0;

    for (let index = points.length - 1; index > 0; index -= 1) {
      const currentPoint = points[index];
      const previousPoint = points[index - 1];
      const deltaX = currentPoint.x - previousPoint.x;
      const deltaY = currentPoint.y - previousPoint.y;

      if (deltaX === 0 && deltaY === 0) {
        continue;
      }

      segmentAngles.push((Math.atan2(deltaY, deltaX) * 180) / Math.PI);
    }

    if (segmentAngles.length > 0) {
      headAngle = segmentAngles[0];
    }

    if (segmentAngles.length > 1) {
      headBend = Math.max(
        -18,
        Math.min(
          18,
          normalizeAngleDelta(segmentAngles[0] - segmentAngles[1]) * 0.22,
        ),
      );
    }

    return {
      headAngle,
      headBend,
      headX: headPoint?.x ?? allMetrics[anchorIndex].laneX,
      headY: headPoint?.y ?? allMetrics[anchorIndex].centerY,
      height: Math.ceil(listRect.height),
      path: buildSnakePath(points),
      pathLength: measureSnakePathLength(points),
      width: Math.ceil(listRect.width),
    };
  }

  function measureTocSquareParabolaGeometry(
    listElement,
    activeLink,
    settledRotation,
    flight = null,
    flightProgress = 1,
  ) {
    if (!(activeLink instanceof HTMLAnchorElement)) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();
    if (listRect.width <= 0 || listRect.height <= 0) {
      return null;
    }

    const markerSettings = getMarkerSettingsForList(listElement);
    const bounds = getTocMarkerBounds(
      listRect,
      markerSettings.squareParabolaSize,
    );
    const activeMetric = createSnakeLinkMetric(
      listRect,
      activeLink,
      markerSettings.headOffset,
    );
    const settledPoint = getSnakeHeadPoint(activeMetric, bounds);
    const point =
      flight && flightProgress < 1
        ? clampPointToBounds(
            getQuadraticPoint(
              flight.startPoint,
              flight.controlPoint,
              flight.endPoint,
              easeInOutCubic(flightProgress),
            ),
            bounds,
          )
        : settledPoint;
    const rotation =
      flight && flightProgress < 1
        ? flight.startRotation +
          flight.rotationDelta * easeInOutCubic(flightProgress)
        : settledRotation;

    return {
      headAngle: rotation,
      headBend: 0,
      headX: point.x,
      headY: point.y,
      height: Math.ceil(listRect.height),
      path: "",
      pathLength: 0,
      width: Math.ceil(listRect.width),
    };
  }

  window.__shopifyTocAnimationShared = {
    buildSnakeClickFlight,
    buildSquareParabolaFlight,
    clampNumber,
    getSnakeClickFlightProgress,
    getSquareParabolaProgress,
    isSnakeLinkMovingUp,
    measureListLinkHeadPoint,
    measureTocSnakeClickFlightGeometry,
    measureTocSnakeGeometry,
    measureTocSquareParabolaGeometry,
    snapRotationToQuarterTurn,
  };
})();
