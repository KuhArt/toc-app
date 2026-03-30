(() => {
  const registry =
    window.__shopifyTocAnimations || (window.__shopifyTocAnimations = {});
  const shared = window.__shopifyTocAnimationShared;

  if (!shared) {
    throw new Error("Missing shared TOC animation helpers");
  }

  registry["square-parabola"] = function createSquareParabolaController(
    context,
  ) {
    let lastGeometry = null;
    let pendingScrollTargetId = "";
    let pendingScrollTargetLink = null;
    let pendingScrollTargetDeadline = 0;
    let squareParabolaFlight = null;
    let squareParabolaFrame = null;
    let squareParabolaRotation = 0;

    function clearPendingScrollTarget() {
      pendingScrollTargetId = "";
      pendingScrollTargetLink = null;
      pendingScrollTargetDeadline = 0;
    }

    function setPendingScrollTarget(targetId, targetLink, targetHeading) {
      pendingScrollTargetId = targetId;
      pendingScrollTargetLink = targetLink;
      const scrollDistance = targetHeading
        ? Math.abs(targetHeading.offsetTop - window.scrollY)
        : 0;
      pendingScrollTargetDeadline =
        context.now() +
        shared.clampNumber(900 + scrollDistance * 0.45, 1200, 3200);
    }

    function renderGeometry(geometry) {
      lastGeometry = geometry;
      context.renderGeometry(geometry);
    }

    function clearSquareParabolaFlight() {
      squareParabolaFlight = null;
      if (squareParabolaFrame !== null) {
        cancelAnimationFrame(squareParabolaFrame);
        squareParabolaFrame = null;
      }
      context.setAnimating(false);
    }

    function startSquareParabolaFlight(fromLink, toLink) {
      const fallbackStartPoint =
        (fromLink && shared.measureListLinkHeadPoint(context.list, fromLink)) ||
        (toLink && shared.measureListLinkHeadPoint(context.list, toLink));

      if (!fallbackStartPoint || !(toLink instanceof HTMLAnchorElement)) {
        clearSquareParabolaFlight();
        context.requestSync();
        return;
      }

      const startPoint = lastGeometry
        ? { x: lastGeometry.headX, y: lastGeometry.headY }
        : fallbackStartPoint;
      const startRotation = lastGeometry
        ? lastGeometry.headAngle
        : squareParabolaRotation;
      const snappedStartRotation = shared.snapRotationToQuarterTurn(
        startRotation,
      );
      const nextFlight = shared.buildSquareParabolaFlight(
        context.list,
        startPoint,
        snappedStartRotation,
        toLink,
      );

      if (!nextFlight) {
        squareParabolaRotation = snappedStartRotation;
        clearSquareParabolaFlight();
        context.requestSync();
        return;
      }

      squareParabolaFlight = nextFlight;
      context.setAnimating(true);

      if (squareParabolaFrame !== null) {
        cancelAnimationFrame(squareParabolaFrame);
      }

      squareParabolaFrame = requestAnimationFrame(runSquareParabolaFlight);
    }

    function runSquareParabolaFlight() {
      const activeLink = context.getCurrentLink();

      if (!(activeLink instanceof HTMLAnchorElement) || !squareParabolaFlight) {
        squareParabolaFrame = null;
        context.requestSync();
        return;
      }

      const progress = shared.getSquareParabolaProgress(
        squareParabolaFlight,
        context.now(),
      );

      renderGeometry(
        shared.measureTocSquareParabolaGeometry(
          context.list,
          activeLink,
          squareParabolaRotation,
          squareParabolaFlight,
          progress,
        ),
      );

      if (progress >= 1) {
        squareParabolaRotation = shared.snapRotationToQuarterTurn(
          squareParabolaFlight.startRotation +
            squareParabolaFlight.rotationDelta,
        );
        clearSquareParabolaFlight();
        context.requestSync();
        return;
      }

      squareParabolaFrame = requestAnimationFrame(runSquareParabolaFlight);
    }

    function clearState(resetRotation) {
      clearPendingScrollTarget();
      clearSquareParabolaFlight();
      if (resetRotation) {
        squareParabolaRotation = 0;
      }
      renderGeometry(null);
    }

    return {
      clear() {
        clearState(false);
      },
      destroy() {
        clearState(true);
      },
      handleCurrentLinkChange({ nextLink, previousLink }) {
        if (nextLink !== previousLink) {
          startSquareParabolaFlight(previousLink, nextLink);
        }
      },
      handleLinkClick({
        previousLink,
        smoothScroll,
        targetHeading,
        targetId,
        targetLink,
      }) {
        if (!smoothScroll || !(targetLink instanceof HTMLAnchorElement)) {
          clearPendingScrollTarget();
          return null;
        }

        setPendingScrollTarget(targetId, targetLink, targetHeading);
        startSquareParabolaFlight(previousLink, targetLink);
        return { nextCurrentLink: targetLink };
      },
      resolveTrackedLink({ currentId, detectedLink }) {
        const pendingTargetActive =
          pendingScrollTargetLink &&
          context.now() <= pendingScrollTargetDeadline &&
          pendingScrollTargetLink.isConnected;

        if (!pendingTargetActive) {
          clearPendingScrollTarget();
        }

        if (!pendingScrollTargetLink) {
          return detectedLink;
        }

        if (currentId === pendingScrollTargetId) {
          clearPendingScrollTarget();
          return detectedLink;
        }

        return pendingScrollTargetLink;
      },
      sync({ activeLink }) {
        if (!(activeLink instanceof HTMLAnchorElement)) {
          renderGeometry(null);
          return;
        }

        const progress = squareParabolaFlight
          ? shared.getSquareParabolaProgress(squareParabolaFlight, context.now())
          : 1;

        renderGeometry(
          shared.measureTocSquareParabolaGeometry(
            context.list,
            activeLink,
            squareParabolaRotation,
            squareParabolaFlight,
            progress,
          ),
        );

        if (squareParabolaFlight && progress >= 1) {
          squareParabolaRotation = shared.snapRotationToQuarterTurn(
            squareParabolaFlight.startRotation +
              squareParabolaFlight.rotationDelta,
          );
          squareParabolaFlight = null;
          squareParabolaFrame = null;
          context.setAnimating(false);
        }
      },
    };
  };
})();
