(() => {
  const registry =
    window.__shopifyTocAnimations || (window.__shopifyTocAnimations = {});
  const shared = window.__shopifyTocAnimationShared;

  if (!shared) {
    throw new Error("Missing shared TOC animation helpers");
  }

  registry["following-marker"] = function createFollowingMarkerController(
    context,
  ) {
    let lastGeometry = null;
    let snakeClickFlight = null;
    let snakeClickFrame = null;
    let pendingScrollTargetId = "";
    let pendingScrollTargetLink = null;
    let pendingScrollTargetDeadline = 0;

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

    function clearSnakeClickFlight() {
      snakeClickFlight = null;
      if (snakeClickFrame !== null) {
        cancelAnimationFrame(snakeClickFrame);
        snakeClickFrame = null;
      }
      context.setAnimating(false);
    }

    function renderGeometry(geometry) {
      lastGeometry = geometry;
      context.renderGeometry(geometry);
    }

    function runSnakeClickFlight() {
      if (!snakeClickFlight) {
        snakeClickFrame = null;
        context.requestSync();
        return;
      }

      const progress = shared.getSnakeClickFlightProgress(
        snakeClickFlight,
        context.now(),
      );

      renderGeometry(
        shared.measureTocSnakeClickFlightGeometry(
          context.list,
          snakeClickFlight.fromLink,
          snakeClickFlight.toLink,
          progress,
        ),
      );

      if (progress >= 1) {
        clearSnakeClickFlight();
        context.requestSync();
        return;
      }

      snakeClickFrame = requestAnimationFrame(runSnakeClickFlight);
    }

    function startSnakeClickFlight(fromLink, toLink) {
      if (
        !(fromLink instanceof HTMLAnchorElement) ||
        !(toLink instanceof HTMLAnchorElement) ||
        fromLink === toLink
      ) {
        clearSnakeClickFlight();
        return;
      }

      const nextFlight = shared.buildSnakeClickFlight(
        context.list,
        fromLink,
        toLink,
      );

      if (!nextFlight) {
        clearSnakeClickFlight();
        context.requestSync();
        return;
      }

      snakeClickFlight = nextFlight;
      context.setAnimating(true);

      if (snakeClickFrame !== null) {
        cancelAnimationFrame(snakeClickFrame);
      }

      snakeClickFrame = requestAnimationFrame(runSnakeClickFlight);
    }

    function clearState() {
      clearPendingScrollTarget();
      clearSnakeClickFlight();
      renderGeometry(null);
    }

    return {
      clear() {
        clearState();
      },
      destroy() {
        clearState();
      },
      handleCurrentLinkChange() {},
      handleLinkClick({
        previousLink,
        smoothScroll,
        targetHeading,
        targetId,
        targetLink,
      }) {
        if (!smoothScroll || !(targetLink instanceof HTMLAnchorElement)) {
          clearPendingScrollTarget();
          clearSnakeClickFlight();
          return null;
        }

        setPendingScrollTarget(targetId, targetLink, targetHeading);

        if (targetLink !== previousLink) {
          startSnakeClickFlight(previousLink, targetLink);
        } else if (lastGeometry) {
          context.requestSync();
        }

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

        if (snakeClickFlight) {
          const progress = shared.getSnakeClickFlightProgress(
            snakeClickFlight,
            context.now(),
          );

          renderGeometry(
            shared.measureTocSnakeClickFlightGeometry(
              context.list,
              snakeClickFlight.fromLink,
              snakeClickFlight.toLink,
              progress,
            ),
          );

          if (progress >= 1) {
            clearSnakeClickFlight();
          }

          return;
        }

        renderGeometry(shared.measureTocSnakeGeometry(context.list, activeLink));
      },
    };
  };
})();
