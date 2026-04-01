(() => {
  const registry =
    window.__shopifyTocAnimations || (window.__shopifyTocAnimations = {});
  const shared = window.__shopifyTocAnimationShared;

  if (!shared) {
    throw new Error("Missing shared TOC animation helpers");
  }

  registry["crawling-snake"] = function createCrawlingSnakeController(
    context,
  ) {
    let crawlingSnakeClickFlight = null;
    let crawlingSnakeClickFrame = null;
    let crawlingSnakeTargetLink = null;
    let crawlingSnakeTargetDeadline = 0;

    function clearCrawlingSnakeClickFlight() {
      crawlingSnakeClickFlight = null;
      if (crawlingSnakeClickFrame !== null) {
        cancelAnimationFrame(crawlingSnakeClickFrame);
        crawlingSnakeClickFrame = null;
      }
      context.setAnimating(false);
    }

    function clearCrawlingSnakeTarget() {
      crawlingSnakeTargetLink = null;
      crawlingSnakeTargetDeadline = 0;
      clearCrawlingSnakeClickFlight();
    }

    function setCrawlingSnakeTarget(targetLink, targetHeading) {
      const scrollDistance = targetHeading
        ? Math.abs(targetHeading.offsetTop - window.scrollY)
        : 0;
      crawlingSnakeTargetLink = targetLink;
      crawlingSnakeTargetDeadline =
        context.now() +
        shared.clampNumber(900 + scrollDistance * 0.45, 1200, 3200);
    }

    function startCrawlingSnakeClickFlight(fromLink, toLink) {
      if (
        !(fromLink instanceof HTMLAnchorElement) ||
        !(toLink instanceof HTMLAnchorElement) ||
        fromLink === toLink ||
        !shared.isSnakeLinkMovingUp(context.list, fromLink, toLink)
      ) {
        clearCrawlingSnakeClickFlight();
        return;
      }

      const nextFlight = shared.buildSnakeClickFlight(
        context.list,
        fromLink,
        toLink,
        "linear",
      );

      if (!nextFlight) {
        clearCrawlingSnakeClickFlight();
        context.requestSync();
        return;
      }

      crawlingSnakeClickFlight = nextFlight;
      context.setAnimating(true);

      if (crawlingSnakeClickFrame !== null) {
        cancelAnimationFrame(crawlingSnakeClickFrame);
      }

      crawlingSnakeClickFrame = requestAnimationFrame(
        runCrawlingSnakeClickFlight,
      );
    }

    function runCrawlingSnakeClickFlight() {
      if (!crawlingSnakeClickFlight) {
        crawlingSnakeClickFrame = null;
        context.requestSync();
        return;
      }

      const progress = shared.getSnakeClickFlightProgress(
        crawlingSnakeClickFlight,
        context.now(),
      );

      context.renderGeometry(
        shared.measureTocSnakeClickFlightGeometry(
          context.list,
          crawlingSnakeClickFlight.fromLink,
          crawlingSnakeClickFlight.toLink,
          progress,
        ),
      );

      if (progress >= 1) {
        clearCrawlingSnakeClickFlight();
        context.requestSync();
        return;
      }

      crawlingSnakeClickFrame = requestAnimationFrame(
        runCrawlingSnakeClickFlight,
      );
    }

    function clearState() {
      clearCrawlingSnakeTarget();
      context.renderGeometry(null);
    }

    return {
      clear() {
        clearState();
      },
      destroy() {
        clearState();
      },
      handleCurrentLinkChange({ nextLink, previousLink }) {
        if (crawlingSnakeTargetLink) {
          startCrawlingSnakeClickFlight(previousLink, nextLink);
          return;
        }

        clearCrawlingSnakeClickFlight();
      },
      handleLinkClick({ targetHeading, targetLink }) {
        if (targetLink instanceof HTMLAnchorElement) {
          setCrawlingSnakeTarget(targetLink, targetHeading);
        } else {
          clearCrawlingSnakeTarget();
        }

        return null;
      },
      resolveTrackedLink({ detectedLink }) {
        if (
          crawlingSnakeTargetLink &&
          (!crawlingSnakeTargetLink.isConnected ||
            context.now() > crawlingSnakeTargetDeadline)
        ) {
          clearCrawlingSnakeTarget();
        }

        return detectedLink;
      },
      sync({ activeLink, transitionLink, transitionProgress }) {
        if (!(activeLink instanceof HTMLAnchorElement)) {
          context.renderGeometry(null);
          return;
        }

        const centeredCrawlingSnakeTargetActive =
          crawlingSnakeTargetLink &&
          context.now() <= crawlingSnakeTargetDeadline &&
          crawlingSnakeTargetLink.isConnected &&
          activeLink === crawlingSnakeTargetLink;

        if (
          crawlingSnakeTargetLink &&
          (!crawlingSnakeTargetLink.isConnected ||
            context.now() > crawlingSnakeTargetDeadline)
        ) {
          clearCrawlingSnakeTarget();
        }

        if (crawlingSnakeClickFlight) {
          const progress = shared.getSnakeClickFlightProgress(
            crawlingSnakeClickFlight,
            context.now(),
          );

          context.renderGeometry(
            shared.measureTocSnakeClickFlightGeometry(
              context.list,
              crawlingSnakeClickFlight.fromLink,
              crawlingSnakeClickFlight.toLink,
              progress,
            ),
          );

          if (progress >= 1) {
            clearCrawlingSnakeClickFlight();
          }

          return;
        }

        context.renderGeometry(
          shared.measureTocSnakeGeometry(
            context.list,
            activeLink,
            centeredCrawlingSnakeTargetActive ? null : transitionLink,
            centeredCrawlingSnakeTargetActive ? 0 : transitionProgress,
            centeredCrawlingSnakeTargetActive,
          ),
        );
      },
    };
  };
})();
