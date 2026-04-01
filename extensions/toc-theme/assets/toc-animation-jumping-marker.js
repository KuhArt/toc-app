(() => {
  const registry =
    window.__shopifyTocAnimations || (window.__shopifyTocAnimations = {});
  const shared = window.__shopifyTocAnimationShared;

  if (!shared) {
    throw new Error("Missing shared TOC animation helpers");
  }

  registry["jumping-marker"] = function createJumpingMarkerController(
    context,
  ) {
    let lastGeometry = null;
    let pendingScrollTargetId = "";
    let pendingScrollTargetLink = null;
    let pendingScrollTargetDeadline = 0;
    let jumpingMarkerFlight = null;
    let jumpingMarkerFrame = null;
    let jumpingMarkerRotation = 0;

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

    function clearJumpingMarkerFlight() {
      jumpingMarkerFlight = null;
      if (jumpingMarkerFrame !== null) {
        cancelAnimationFrame(jumpingMarkerFrame);
        jumpingMarkerFrame = null;
      }
      context.setAnimating(false);
    }

    function startJumpingMarkerFlight(fromLink, toLink) {
      const fallbackStartPoint =
        (fromLink && shared.measureListLinkHeadPoint(context.list, fromLink)) ||
        (toLink && shared.measureListLinkHeadPoint(context.list, toLink));

      if (!fallbackStartPoint || !(toLink instanceof HTMLAnchorElement)) {
        clearJumpingMarkerFlight();
        context.requestSync();
        return;
      }

      const startPoint = lastGeometry
        ? { x: lastGeometry.headX, y: lastGeometry.headY }
        : fallbackStartPoint;
      const startRotation = lastGeometry
        ? lastGeometry.headAngle
        : jumpingMarkerRotation;
      const snappedStartRotation = shared.snapRotationToQuarterTurn(
        startRotation,
      );
      const nextFlight = shared.buildJumpingMarkerFlight(
        context.list,
        startPoint,
        snappedStartRotation,
        toLink,
      );

      if (!nextFlight) {
        jumpingMarkerRotation = snappedStartRotation;
        clearJumpingMarkerFlight();
        context.requestSync();
        return;
      }

      jumpingMarkerFlight = nextFlight;
      context.setAnimating(true);

      if (jumpingMarkerFrame !== null) {
        cancelAnimationFrame(jumpingMarkerFrame);
      }

      jumpingMarkerFrame = requestAnimationFrame(runJumpingMarkerFlight);
    }

    function runJumpingMarkerFlight() {
      const activeLink = context.getCurrentLink();

      if (!(activeLink instanceof HTMLAnchorElement) || !jumpingMarkerFlight) {
        jumpingMarkerFrame = null;
        context.requestSync();
        return;
      }

      const progress = shared.getJumpingMarkerProgress(
        jumpingMarkerFlight,
        context.now(),
      );

      renderGeometry(
        shared.measureTocJumpingMarkerGeometry(
          context.list,
          activeLink,
          jumpingMarkerRotation,
          jumpingMarkerFlight,
          progress,
        ),
      );

      if (progress >= 1) {
        jumpingMarkerRotation = shared.snapRotationToQuarterTurn(
          jumpingMarkerFlight.startRotation +
            jumpingMarkerFlight.rotationDelta,
        );
        clearJumpingMarkerFlight();
        context.requestSync();
        return;
      }

      jumpingMarkerFrame = requestAnimationFrame(runJumpingMarkerFlight);
    }

    function clearState(resetRotation) {
      clearPendingScrollTarget();
      clearJumpingMarkerFlight();
      if (resetRotation) {
        jumpingMarkerRotation = 0;
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
          startJumpingMarkerFlight(previousLink, nextLink);
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
        startJumpingMarkerFlight(previousLink, targetLink);
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

        const progress = jumpingMarkerFlight
          ? shared.getJumpingMarkerProgress(jumpingMarkerFlight, context.now())
          : 1;

        renderGeometry(
          shared.measureTocJumpingMarkerGeometry(
            context.list,
            activeLink,
            jumpingMarkerRotation,
            jumpingMarkerFlight,
            progress,
          ),
        );

        if (jumpingMarkerFlight && progress >= 1) {
          jumpingMarkerRotation = shared.snapRotationToQuarterTurn(
            jumpingMarkerFlight.startRotation +
              jumpingMarkerFlight.rotationDelta,
          );
          jumpingMarkerFlight = null;
          jumpingMarkerFrame = null;
          context.setAnimating(false);
        }
      },
    };
  };
})();
