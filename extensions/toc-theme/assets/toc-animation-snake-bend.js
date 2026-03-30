(() => {
  const registry =
    window.__shopifyTocAnimations || (window.__shopifyTocAnimations = {});
  const shared = window.__shopifyTocAnimationShared;

  if (!shared) {
    throw new Error("Missing shared TOC animation helpers");
  }

  registry["snake-rect-bend"] = function createSnakeRectBendController(
    context,
  ) {
    let bentClickFlight = null;
    let bentClickFrame = null;
    let bentClickTargetLink = null;
    let bentClickTargetDeadline = 0;

    function clearBentClickFlight() {
      bentClickFlight = null;
      if (bentClickFrame !== null) {
        cancelAnimationFrame(bentClickFrame);
        bentClickFrame = null;
      }
      context.setAnimating(false);
    }

    function clearBentClickTarget() {
      bentClickTargetLink = null;
      bentClickTargetDeadline = 0;
      clearBentClickFlight();
    }

    function setBentClickTarget(targetLink, targetHeading) {
      const scrollDistance = targetHeading
        ? Math.abs(targetHeading.offsetTop - window.scrollY)
        : 0;
      bentClickTargetLink = targetLink;
      bentClickTargetDeadline =
        context.now() +
        shared.clampNumber(900 + scrollDistance * 0.45, 1200, 3200);
    }

    function startBentClickFlight(fromLink, toLink) {
      if (
        !(fromLink instanceof HTMLAnchorElement) ||
        !(toLink instanceof HTMLAnchorElement) ||
        fromLink === toLink ||
        !shared.isSnakeLinkMovingUp(context.list, fromLink, toLink)
      ) {
        clearBentClickFlight();
        return;
      }

      const nextFlight = shared.buildSnakeClickFlight(
        context.list,
        fromLink,
        toLink,
      );

      if (!nextFlight) {
        clearBentClickFlight();
        context.requestSync();
        return;
      }

      bentClickFlight = nextFlight;
      context.setAnimating(true);

      if (bentClickFrame !== null) {
        cancelAnimationFrame(bentClickFrame);
      }

      bentClickFrame = requestAnimationFrame(runBentClickFlight);
    }

    function runBentClickFlight() {
      if (!bentClickFlight) {
        bentClickFrame = null;
        context.requestSync();
        return;
      }

      const progress = shared.getSnakeClickFlightProgress(
        bentClickFlight,
        context.now(),
      );

      context.renderGeometry(
        shared.measureTocSnakeClickFlightGeometry(
          context.list,
          bentClickFlight.fromLink,
          bentClickFlight.toLink,
          progress,
        ),
      );

      if (progress >= 1) {
        clearBentClickFlight();
        context.requestSync();
        return;
      }

      bentClickFrame = requestAnimationFrame(runBentClickFlight);
    }

    function clearState() {
      clearBentClickTarget();
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
        if (bentClickTargetLink) {
          startBentClickFlight(previousLink, nextLink);
          return;
        }

        clearBentClickFlight();
      },
      handleLinkClick({ targetHeading, targetLink }) {
        if (targetLink instanceof HTMLAnchorElement) {
          setBentClickTarget(targetLink, targetHeading);
        } else {
          clearBentClickTarget();
        }

        return null;
      },
      resolveTrackedLink({ detectedLink }) {
        if (
          bentClickTargetLink &&
          (!bentClickTargetLink.isConnected ||
            context.now() > bentClickTargetDeadline)
        ) {
          clearBentClickTarget();
        }

        return detectedLink;
      },
      sync({ activeLink, transitionLink, transitionProgress }) {
        if (!(activeLink instanceof HTMLAnchorElement)) {
          context.renderGeometry(null);
          return;
        }

        const centeredBentTargetActive =
          bentClickTargetLink &&
          context.now() <= bentClickTargetDeadline &&
          bentClickTargetLink.isConnected &&
          activeLink === bentClickTargetLink;

        if (
          bentClickTargetLink &&
          (!bentClickTargetLink.isConnected ||
            context.now() > bentClickTargetDeadline)
        ) {
          clearBentClickTarget();
        }

        if (bentClickFlight) {
          const progress = shared.getSnakeClickFlightProgress(
            bentClickFlight,
            context.now(),
          );

          context.renderGeometry(
            shared.measureTocSnakeClickFlightGeometry(
              context.list,
              bentClickFlight.fromLink,
              bentClickFlight.toLink,
              progress,
            ),
          );

          if (progress >= 1) {
            clearBentClickFlight();
          }

          return;
        }

        context.renderGeometry(
          shared.measureTocSnakeGeometry(
            context.list,
            activeLink,
            centeredBentTargetActive ? null : transitionLink,
            centeredBentTargetActive ? 0 : transitionProgress,
            centeredBentTargetActive,
          ),
        );
      },
    };
  };
})();
