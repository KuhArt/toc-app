(() => {
  const DEFAULT_TOP_OFFSET = 80;
  const DEFAULT_MOBILE_BREAKPOINT = 768;
  const DEFAULT_FLOAT_VIEWPORT_GUTTER = 24;
  const DEFAULT_FLOAT_HOST_WIDTH = 320;
  const CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN = "{{mobileBreakpoint}}";
  const CUSTOM_CSS_STYLE_ID = "toc-custom-css";
  const DEBUG_PREFIX = "[TOC]";
  const TOC_JSON_LD_SCRIPT_ID = "toc-json-ld";
  const TOC_HEADING_ID_ATTRIBUTE = "data-shopify-toc-id";
  const TOC_GENERATED_ID_ATTRIBUTE = "data-shopify-toc-generated-id";
  const TOC_CRAWLING_SNAKE_VISIBLE_LENGTH = 16;
  const TOC_MARKER_ANIMATION_TYPES = [
    "following-marker",
    "crawling-snake",
    "jumping-marker",
  ];
  const TOC_MARKER_ANIMATION_CLASS_NAMES = {
    "following-marker": "toc-widget--animation-following-marker",
    "crawling-snake": "toc-widget--animation-crawling-snake",
    "jumping-marker": "toc-widget--animation-jumping-marker",
  };
  const TOC_ANIMATION_REGISTRY_KEY = "__shopifyTocAnimations";
  const TOC_ANIMATION_SCRIPT_ATTRIBUTE = "data-shopify-toc-animation-src";
  const loadedAnimationScripts = new Map();
  const DEFAULT_DESKTOP_CONTAINER = {
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
    offsetLeft: 16,
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
    scrollOffset: DEFAULT_TOP_OFFSET,
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
  const DEFAULT_MOBILE_CONTAINER = {
    position: "before-first-heading",
    positionSelector: "",
    switchToMobileOnFloatOverflow: false,
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
    background: "#FFFFFF",
    maxWidth: 0,
    smoothScroll: true,
    scrollOffset: DEFAULT_TOP_OFFSET,
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
    animationType: "none",
  };

  const readJsonScript = (id) => {
    const element = document.getElementById(id);
    if (!element) return null;

    try {
      return JSON.parse(element.textContent || "{}");
    } catch (error) {
      console.error(`${DEBUG_PREFIX} Failed to parse ${id}`, error);
      return null;
    }
  };

  // 1) Read config from Liquid-injected JSON
  const el = document.getElementById("toc-config");
  if (!el) {
    return;
  }
  const cfg = readJsonScript("toc-config") || {};

  // defaults
  const headingLevels = cfg.headingLevels?.length
    ? cfg.headingLevels
    : [2, 3, 4];
  const minHeadings = typeof cfg.minHeadings === "number" ? cfg.minHeadings : 3;
  const mobileBreakpoint = normalizeMobileBreakpoint(
    cfg.mobileBreakpoint,
    DEFAULT_MOBILE_BREAKPOINT,
  );
  const desktopConfig = normalizeDeviceConfig(
    cfg.desktop,
    DEFAULT_DESKTOP_CONTAINER,
    "desktop",
  );
  const mobileConfig = normalizeDeviceConfig(
    cfg.mobile,
    DEFAULT_MOBILE_CONTAINER,
    "mobile",
  );
  const customCss = compileCustomCss(cfg.customCss, mobileBreakpoint);
  const animationAssetUrls = normalizeAnimationAssetUrls(
    readJsonScript("toc-animation-assets") || cfg.animationAssets,
  );

  const selectors = [
    ".article-template__content",
    ".blog-post-content.rte",
    ".blog-post-content",
    '[data-template="article"] .rte',
    "article .rte",
    ".article__content",
    "main article",
  ].filter(Boolean);

  let wrapper = null;
  for (const s of selectors) {
    const found = document.querySelector(s);
    if (found) {
      wrapper = found;
      break;
    }
  }
  if (!wrapper) {
    return;
  }

  // 3) Collect headings
  const headingSelector = headingLevels.map((l) => `h${l}`).join(",");
  const headings = Array.from(wrapper.querySelectorAll(headingSelector)).filter(
    (h) => (h.textContent || "").trim().length > 0,
  );

  if (headings.length < minHeadings) {
    return;
  }

  const isDesktopViewport = () => window.innerWidth > mobileBreakpoint;
  const isDesktopFloatPosition = (position) =>
    position === "float-left" || position === "float-right";
  const getValidWrapperRect = () => {
    const rect = wrapper.getBoundingClientRect();

    if (
      !Number.isFinite(rect.left) ||
      !Number.isFinite(rect.right) ||
      rect.width <= 0
    ) {
      return null;
    }

    return rect;
  };
  const getDesktopFloatHostWidth = (measuredWidth = null) => {
    if (
      typeof measuredWidth === "number" &&
      Number.isFinite(measuredWidth) &&
      measuredWidth > 0
    ) {
      return measuredWidth;
    }

    return Math.min(
      DEFAULT_FLOAT_HOST_WIDTH,
      Math.max(window.innerWidth - DEFAULT_FLOAT_VIEWPORT_GUTTER * 2, 0),
    );
  };
  const getDesktopFloatOffsetDifference = (kind, config) =>
    kind === "float-left"
      ? config.offsetRight - config.offsetLeft
      : config.offsetLeft - config.offsetRight;
  const clampDesktopFloatLeft = (preferredLeft, hostWidth) => {
    const maxLeft = Math.max(0, window.innerWidth - hostWidth);

    return Math.min(Math.max(preferredLeft, 0), maxLeft);
  };
  const resolveDesktopFloatLeft = (kind, config, wrapperRect, hostWidth) => {
    const offsetDifference = getDesktopFloatOffsetDifference(kind, config);
    const preferredLeft = wrapperRect
      ? kind === "float-left"
        ? wrapperRect.left - hostWidth - offsetDifference
        : wrapperRect.right + offsetDifference
      : kind === "float-left"
        ? DEFAULT_FLOAT_VIEWPORT_GUTTER - offsetDifference
        : window.innerWidth -
          DEFAULT_FLOAT_VIEWPORT_GUTTER -
          hostWidth +
          offsetDifference;

    return clampDesktopFloatLeft(preferredLeft, hostWidth);
  };
  const shouldUseMobileFloatOverflowFallback = () => {
    if (
      !isDesktopViewport() ||
      !desktopConfig.switchToMobileOnFloatOverflow ||
      !isDesktopFloatPosition(desktopConfig.position)
    ) {
      return false;
    }

    const wrapperRect = getValidWrapperRect();

    if (!wrapperRect) {
      return false;
    }

    const hostWidth = getDesktopFloatHostWidth();
    const resolvedLeft = resolveDesktopFloatLeft(
      desktopConfig.position,
      desktopConfig,
      wrapperRect,
      hostWidth,
    );

    return desktopConfig.position === "float-left"
      ? resolvedLeft + hostWidth > wrapperRect.left
      : resolvedLeft < wrapperRect.right;
  };
  const getResolvedDevice = () =>
    isDesktopViewport() && !shouldUseMobileFloatOverflowFallback()
      ? "desktop"
      : "mobile";
  const getActiveConfig = () =>
    getResolvedDevice() === "desktop" ? desktopConfig : mobileConfig;
  const getDefaultPosition = () =>
    getResolvedDevice() === "desktop"
      ? DEFAULT_DESKTOP_CONTAINER.position
      : DEFAULT_MOBILE_CONTAINER.position;
  const getMarkerAnimationType = () =>
    getResolvedDevice() === "desktop" &&
    TOC_MARKER_ANIMATION_TYPES.includes(desktopConfig.animationType)
      ? desktopConfig.animationType
      : "none";
  const getHeadingLabel = (heading) =>
    (heading.innerText || heading.textContent || "").replace(/\s+/g, " ").trim();
  const getHeadingAnchorId = (heading) =>
    (heading.getAttribute(TOC_HEADING_ID_ATTRIBUTE) || heading.id || "").trim();
  const getCanonicalPageUrl = () => {
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href;
    const pageUrl = new URL(
      canonicalUrl || window.location.href,
      window.location.origin,
    );

    pageUrl.hash = "";

    return pageUrl.toString();
  };
  const getHeadingUrl = (pageUrl, anchorId) => {
    const headingUrl = new URL(pageUrl);
    headingUrl.hash = anchorId;

    return headingUrl.toString();
  };
  const injectTocJsonLd = () => {
    document.getElementById(TOC_JSON_LD_SCRIPT_ID)?.remove();

    const pageUrl = getCanonicalPageUrl();
    const graph = headings
      .map((heading, index) => {
        const anchorId = getHeadingAnchorId(heading);
        const name = getHeadingLabel(heading);

        if (!anchorId || !name) {
          return null;
        }

        const headingUrl = getHeadingUrl(pageUrl, anchorId);

        return {
          "@type": "SiteNavigationElement",
          "@id": headingUrl,
          position: index + 1,
          name,
          url: headingUrl,
        };
      })
      .filter(Boolean);

    if (!graph.length) {
      return;
    }

    const script = document.createElement("script");
    script.id = TOC_JSON_LD_SCRIPT_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": graph,
    });

    (document.head || document.documentElement).appendChild(script);
  };
  const getHeadingByAnchorId = (anchorId) =>
    headings.find((heading) => getHeadingAnchorId(heading) === anchorId) ||
    document.getElementById(anchorId);
  const scrollToInitialHash = () => {
    if (!window.location.hash) {
      return;
    }

    let anchorId = "";

    try {
      anchorId = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      anchorId = window.location.hash.slice(1);
    }

    if (!anchorId) {
      return;
    }

    const target = getHeadingByAnchorId(anchorId);

    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "auto" });
    });
  };
  const applyHeadingScrollMargins = () => {
    const activeOffset = Math.max(0, getActiveConfig().scrollOffset || 0);

    headings.forEach((h) => {
      h.style.scrollMarginTop = `${activeOffset + 12}px`;
    });
  };

  // 4) Ensure each heading has a stable TOC anchor marker.
  const headingElements = new Set(headings);
  const usedHeadingIds = new Set(
    Array.from(document.querySelectorAll("[id]"))
      .filter((element) => !headingElements.has(element))
      .map((element) => element.id.trim())
      .filter(Boolean),
  );

  headings.forEach((h) => {
    const existingId = h.id.trim();
    const baseAnchorId = existingId || slugify(getHeadingLabel(h)) || "section";
    let anchorId = existingId || `toc-${baseAnchorId}`;
    let suffix = 2;

    while (usedHeadingIds.has(anchorId)) {
      anchorId = existingId
        ? `${existingId}-${suffix}`
        : `toc-${baseAnchorId}-${suffix}`;
      suffix += 1;
    }

    usedHeadingIds.add(anchorId);

    h.setAttribute(TOC_HEADING_ID_ATTRIBUTE, anchorId);

    if (!existingId || h.id !== anchorId) {
      h.id = anchorId;
      h.setAttribute(TOC_GENERATED_ID_ATTRIBUTE, "true");
      return;
    }

    h.removeAttribute(TOC_GENERATED_ID_ATTRIBUTE);
  });
  if (cfg.enableJsonLd !== false) {
    injectTocJsonLd();
  } else {
    document.getElementById(TOC_JSON_LD_SCRIPT_ID)?.remove();
  }
  applyHeadingScrollMargins();

  // 5) Build TOC markup
  const tocLabel = (cfg.title || "Table of contents").trim();
  const toc = document.createElement("nav");
  toc.className = "toc-widget";
  toc.setAttribute("aria-label", tocLabel || "Table of contents");
  if (cfg.indentation === false) {
    toc.classList.add("toc-widget--flat");
  }
  toc.classList.add(
    `toc-widget--align-${normalizeTextAlignment(cfg.textAlignment)}`,
  );
  toc.classList.add(
    `toc-widget--markers-${normalizeMarkerFormat(cfg.markerFormat)}`,
  );
  const syncDeviceState = () => {
    toc.dataset.device = getResolvedDevice();
  };
  syncDeviceState();
  applyDeviceConfig(toc, desktopConfig, mobileConfig);
  applyCustomCss(customCss);
  const title = document.createElement("div");
  title.className = "toc-widget__title";
  title.textContent = cfg.title || "Contents";
  const syncTitleVisibility = () => {
    title.hidden = !getActiveConfig().showTitle;
  };
  syncTitleVisibility();
  toc.appendChild(title);

  const topFade = document.createElement("div");
  topFade.className = "toc-widget__fade toc-widget__fade--top";
  const topFadeShim = document.createElement("span");
  topFadeShim.className = "toc-widget__fade-shim";
  topFade.setAttribute("aria-hidden", "true");
  topFade.appendChild(topFadeShim);
  topFade.hidden = true;
  toc.appendChild(topFade);

  const list = buildNestedList(headings);
  list.id = `toc-widget-list-${Math.random().toString(36).slice(2, 9)}`;
  const listShell = document.createElement("div");
  listShell.className = "toc-widget__list-shell";
  const snakeOverlay = createSnakeOverlay();
  listShell.appendChild(snakeOverlay.root);
  listShell.appendChild(list);
  toc.appendChild(listShell);

  const linksById = new Map(
    Array.from(list.querySelectorAll(".toc-widget__link")).map((a) => [
      decodeURIComponent((a.getAttribute("href") || "").slice(1)),
      a,
    ]),
  );
  let currentLink = null;
  let markerTransitionLink = null;
  let markerTransitionProgress = 0;
  let snakeFrame = null;
  let activeAnimationType = "none";
  let pendingAnimationType = "";
  let animationLoadPromise = Promise.resolve(null);
  let animationLoadNonce = 0;
  let refreshCurrentLink = () => {};
  const setSnakeClickAnimating = (animating) => {
    snakeOverlay.root.classList.toggle(
      "toc-widget__snake--animating",
      animating,
    );
  };
  const syncAnimationClasses = (animationType) => {
    TOC_MARKER_ANIMATION_TYPES.forEach((type) => {
      toc.classList.toggle(
        TOC_MARKER_ANIMATION_CLASS_NAMES[type],
        animationType === type,
      );
    });
    snakeOverlay.root.hidden = animationType === "none";
    if (animationType === "none") {
      setSnakeClickAnimating(false);
    }
  };
  const renderAnimationGeometry = (geometry) => {
    updateSnakeOverlay(snakeOverlay, geometry, activeAnimationType);
  };
  let animationController = createNullAnimationController({
    renderGeometry: renderAnimationGeometry,
    setAnimating: setSnakeClickAnimating,
  });

  function createAnimationContext() {
    return {
      getCurrentLink: () => currentLink,
      list,
      now: () => performance.now(),
      renderGeometry: renderAnimationGeometry,
      requestSync: requestSnakeSync,
      setAnimating: setSnakeClickAnimating,
    };
  }

  function replaceAnimationController(nextController, nextType) {
    if (animationController && animationController !== nextController) {
      animationController.destroy();
    }
    animationController = nextController;
    activeAnimationType = nextType;
    syncAnimationClasses(nextType);
  }

  function resetAnimationController() {
    pendingAnimationType = "";
    animationLoadNonce += 1;
    replaceAnimationController(
      createNullAnimationController(createAnimationContext()),
      "none",
    );
    animationController.clear();
  }

  function ensureAnimationController() {
    const requestedType = getMarkerAnimationType();

    syncAnimationClasses(requestedType);

    if (requestedType === activeAnimationType && !pendingAnimationType) {
      return Promise.resolve(animationController);
    }

    if (requestedType === pendingAnimationType) {
      return animationLoadPromise;
    }

    const loadNonce = ++animationLoadNonce;
    pendingAnimationType = requestedType;
    replaceAnimationController(
      createNullAnimationController(createAnimationContext()),
      "none",
    );

    if (requestedType === "none") {
      pendingAnimationType = "";
      animationController.clear();
      return Promise.resolve(animationController);
    }

    animationLoadPromise = loadAnimationControllerFactory(
      requestedType,
      animationAssetUrls,
    )
      .then((factory) => {
        if (loadNonce !== animationLoadNonce) {
          return animationController;
        }

        pendingAnimationType = "";
        replaceAnimationController(
          factory(createAnimationContext()),
          requestedType,
        );
        refreshCurrentLink();
        requestSnakeSync();
        return animationController;
      })
      .catch((error) => {
        if (loadNonce !== animationLoadNonce) {
          return animationController;
        }

        pendingAnimationType = "";
        console.error(`${DEBUG_PREFIX} Failed to load animation controller`, {
          animationType: requestedType,
          error,
        });
        replaceAnimationController(
          createNullAnimationController(createAnimationContext()),
          "none",
        );
        animationController.clear();
        return animationController;
      });

    return animationLoadPromise;
  }

  function syncSnake() {
    const requestedType = getMarkerAnimationType();
    const activeLink =
      currentLink || list.querySelector(".toc-widget__link--current") || null;

    syncAnimationClasses(requestedType);

    if (requestedType === "none") {
      animationController.clear();
      return;
    }

    if (requestedType !== activeAnimationType || pendingAnimationType) {
      ensureAnimationController();
      return;
    }

    animationController.sync({
      activeLink,
      transitionLink: markerTransitionLink,
      transitionProgress: markerTransitionProgress,
    });
  }

  function requestSnakeSync() {
    ensureAnimationController();

    if (snakeFrame !== null) {
      return;
    }

    snakeFrame = requestAnimationFrame(() => {
      snakeFrame = null;
      syncSnake();
    });
  }

  const bottomFade = document.createElement("div");
  bottomFade.className = "toc-widget__fade toc-widget__fade--bottom";
  const bottomFadeShim = document.createElement("span");
  bottomFadeShim.className = "toc-widget__fade-shim";
  bottomFade.setAttribute("aria-hidden", "true");
  bottomFade.appendChild(bottomFadeShim);
  bottomFade.hidden = true;
  toc.appendChild(bottomFade);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toc-widget__toggle";
  toggle.hidden = true;
  toggle.setAttribute("aria-controls", list.id);
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = desktopConfig.showMoreButtonText;
  toc.appendChild(toggle);

  let floatHost = null;
  const removeFloatHost = () => {
    floatHost?.remove();
    floatHost = null;
  };
  const syncFloatHostPlacement = (kind, activeConfig) => {
    if (!floatHost || !isDesktopViewport()) {
      return;
    }

    const hostWidth = getDesktopFloatHostWidth(
      floatHost.getBoundingClientRect().width,
    );
    const resolvedLeft = resolveDesktopFloatLeft(
      kind,
      activeConfig,
      getValidWrapperRect(),
      hostWidth,
    );

    floatHost.style.setProperty("--toc-offset-left", "0px");
    floatHost.style.setProperty("--toc-offset-right", "0px");
    floatHost.style.left = `${Math.round(resolvedLeft)}px`;
    floatHost.style.right = "auto";
  };
  const resolveMountTarget = (position, selector) => {
    switch (position) {
      case "before-first-heading":
        return { kind: "before-heading", element: headings[0] };
      case "after-first-heading":
        return { kind: "after-heading", element: headings[0] };
      case "css-selector": {
        let target = null;

        if (selector) {
          try {
            target = document.querySelector(selector);
          } catch (error) {
            console.warn(`${DEBUG_PREFIX} Invalid position selector`, {
              selector,
              error,
            });
          }
        }

        if (target) {
          return { kind: "inside-element", element: target };
        }

        return resolveMountTarget(getDefaultPosition(), "");
      }
      case "float-left":
      case "float-right":
        return { kind: position, element: null };
      default:
        return { kind: getDefaultPosition(), element: null };
    }
  };
  const mount = () => {
    toc.remove();
    const activeConfig = getActiveConfig();
    const target = resolveMountTarget(
      activeConfig.position,
      activeConfig.positionSelector,
    );

    if (target.kind === "float-left" || target.kind === "float-right") {
      floatHost = floatHost || document.createElement("div");
      floatHost.className = `toc-widget-float toc-widget-float--${target.kind.replace("float-", "")}`;
      floatHost.style.setProperty(
        "--toc-offset-top",
        `${activeConfig.offsetTop}px`,
      );
      floatHost.style.setProperty(
        "--toc-offset-bottom",
        `${activeConfig.offsetBottom}px`,
      );
      floatHost.style.setProperty(
        "--toc-offset-left",
        "0px",
      );
      floatHost.style.setProperty(
        "--toc-offset-right",
        "0px",
      );
      if (!floatHost.isConnected) {
        document.body.appendChild(floatHost);
      }
      floatHost.appendChild(toc);
      syncFloatHostPlacement(target.kind, activeConfig);
      return;
    }

    removeFloatHost();

    if (target.kind === "before-heading" && target.element) {
      target.element.insertAdjacentElement("beforebegin", toc);
      return;
    }

    if (target.kind === "after-heading" && target.element) {
      target.element.insertAdjacentElement("afterend", toc);
      return;
    }

    if (target.kind === "inside-element" && target.element) {
      target.element.appendChild(toc);
      return;
    }

    wrapper.insertBefore(toc, headings[0]);
  };

  mount();
  ensureAnimationController();
  scrollToInitialHash();

  let applyResponsiveState = () => {};
  let refreshFades = () => {};
  requestAnimationFrame(() => {
    const needsToggle = (activeConfig) => {
      const toggleHeight = Math.max(0, activeConfig.showButtonHeight || 0);
      return list.scrollHeight > toggleHeight + 1;
    };
    refreshFades = () => {
      if (!toc.classList.contains("toc-widget--show-more-active")) {
        topFade.hidden = true;
        bottomFade.hidden = true;
        return;
      }

      const maxScrollTop = list.scrollHeight - list.clientHeight;
      if (maxScrollTop <= 1) {
        topFade.hidden = true;
        bottomFade.hidden = true;
        return;
      }

      topFade.hidden = list.scrollTop <= 1;
      bottomFade.hidden = maxScrollTop - list.scrollTop <= 1;
    };
    const syncToggleLabel = (activeConfig) => {
      const expanded = toc.classList.contains("toc-widget--expanded");
      toggle.textContent = expanded
        ? activeConfig.showLessButtonText
        : activeConfig.showMoreButtonText;
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    };
    applyResponsiveState = () => {
      const activeConfig = getActiveConfig();
      const showToggle = activeConfig.showButton && needsToggle(activeConfig);

      syncTitleVisibility();
      ensureAnimationController();
      toc.classList.toggle("toc-widget--show-more-active", showToggle);

      if (!showToggle) {
        toc.classList.remove("toc-widget--expanded");
        toggle.hidden = true;
        topFade.hidden = true;
        bottomFade.hidden = true;
        requestSnakeSync();
        return;
      }

      toggle.hidden = false;
      syncToggleLabel(activeConfig);
      refreshFades();
      requestSnakeSync();
    };

    applyResponsiveState();
    list.addEventListener(
      "scroll",
      () => {
        refreshFades();
        requestSnakeSync();
      },
      { passive: true },
    );
    toggle.addEventListener("click", () => {
      toc.classList.toggle("toc-widget--expanded");
      syncToggleLabel(getActiveConfig());
      refreshFades();
      requestSnakeSync();
    });
  });

  const setCurrentLink = (nextLink) => {
    if (nextLink === currentLink) {
      return;
    }

    currentLink?.classList.remove("toc-widget__link--current");
    currentLink?.removeAttribute("aria-current");

    if (nextLink) {
      nextLink.classList.add("toc-widget__link--current");
      nextLink.setAttribute("aria-current", "location");
    }

    currentLink = nextLink;
  };

  refreshCurrentLink = () => {
    const scrollY = window.scrollY + getActiveConfig().scrollOffset + 24;
    let currentIndex = headings.length ? 0 : -1;

    for (let index = 0; index < headings.length; index += 1) {
      if (headings[index].offsetTop <= scrollY) {
        currentIndex = index;
        continue;
      }

      break;
    }

    const isAtBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4;

    if (isAtBottom) {
      currentIndex = headings.length - 1;
    }

    const currentId =
      currentIndex >= 0 ? getHeadingAnchorId(headings[currentIndex]) : "";

    if (
      currentIndex >= 0 &&
      currentIndex < headings.length - 1 &&
      !isAtBottom
    ) {
      const currentHeading = headings[currentIndex];
      const nextHeading = headings[currentIndex + 1];
      const span = Math.max(
        nextHeading.offsetTop - currentHeading.offsetTop,
        1,
      );

      markerTransitionProgress = Math.min(
        Math.max((scrollY - currentHeading.offsetTop) / span, 0),
        1,
      );
      markerTransitionLink =
        linksById.get(getHeadingAnchorId(nextHeading) || "") || null;
    } else {
      markerTransitionProgress = 0;
      markerTransitionLink = null;
    }

    let nextLink = linksById.get(currentId || "") || null;

    nextLink =
      animationController.resolveTrackedLink({
        currentId,
        detectedLink: nextLink,
      }) || null;

    if (!nextLink) {
      setCurrentLink(null);
      markerTransitionLink = null;
      markerTransitionProgress = 0;
      animationController.clear();
      requestSnakeSync();
      return;
    }

    const previousLink = currentLink;

    setCurrentLink(nextLink);

    keepCurrentLinkVisible(nextLink);
    refreshFades();

    if (nextLink !== previousLink) {
      animationController.handleCurrentLinkChange({
        nextLink,
        previousLink,
      });
    }

    requestSnakeSync();
  };

  let ticking = false;
  const onScrollOrResize = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      refreshCurrentLink();
      ticking = false;
    });
  };

  const handleResize = () => {
    const previousDevice = toc.dataset.device;
    resetAnimationController();
    syncDeviceState();
    mount();
    applyHeadingScrollMargins();
    if (toc.dataset.device !== previousDevice) {
      list.scrollTop = 0;
      toc.classList.remove("toc-widget--expanded");
    }
    applyResponsiveState();
    onScrollOrResize();
    requestSnakeSync();
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", handleResize);
  refreshCurrentLink();
  requestSnakeSync();

  // smooth scroll
  toc.addEventListener("click", (e) => {
    const a = e.target.closest(".toc-widget__link");
    if (!a) return;
    e.preventDefault();
    const id = decodeURIComponent((a.getAttribute("href") || "").slice(1));
    const target = getHeadingByAnchorId(id);
    if (target) {
      const activeConfig = getActiveConfig();
      const previousLink = currentLink;
      const targetLink = linksById.get(id || "") || a;
      const clickResult = animationController.handleLinkClick({
        previousLink,
        smoothScroll: activeConfig.smoothScroll,
        targetHeading: target,
        targetId: id,
        targetLink,
      });

      if (clickResult?.nextCurrentLink) {
        setCurrentLink(clickResult.nextCurrentLink);
        keepCurrentLinkVisible(clickResult.nextCurrentLink);
        refreshFades();
        requestSnakeSync();
      }

      target.scrollIntoView({
        behavior: activeConfig.smoothScroll ? "smooth" : "auto",
      });
      if (window.history?.pushState) {
        window.history.pushState(null, "", `#${encodeURIComponent(id)}`);
      }
      refreshCurrentLink();
    }
  });

  function slugify(s) {
    return String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function normalizeTextAlignment(value) {
    return ["left", "center", "right"].includes(value) ? value : "left";
  }

  function normalizeMarkerFormat(value) {
    return ["none", "bullet", "numeric"].includes(value) ? value : "none";
  }

  function normalizeAnimationType(value) {
    return [
      "none",
      "following-marker",
      "crawling-snake",
      "jumping-marker",
    ].includes(value)
      ? value
      : "none";
  }

  function normalizeMobileBreakpoint(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, value)
      : fallback;
  }

  function compileCustomCss(value, mobileBreakpointValue) {
    if (typeof value !== "string") return "";

    return value.replaceAll(
      CUSTOM_CSS_MOBILE_BREAKPOINT_TOKEN,
      `${mobileBreakpointValue}px`,
    );
  }

  function applyCustomCss(cssText) {
    const existing = document.getElementById(CUSTOM_CSS_STYLE_ID);

    if (!cssText || !cssText.trim()) {
      existing?.remove();
      return;
    }

    const style =
      existing ||
      Object.assign(document.createElement("style"), {
        id: CUSTOM_CSS_STYLE_ID,
      });

    style.textContent = cssText;

    if (!style.isConnected) {
      document.head.appendChild(style);
    }
  }

  function normalizeDesktopPosition(value) {
    return [
      "float-right",
      "float-left",
      "before-first-heading",
      "after-first-heading",
      "css-selector",
    ].includes(value)
      ? value
      : DEFAULT_DESKTOP_CONTAINER.position;
  }

  function normalizeMobilePosition(value) {
    return [
      "before-first-heading",
      "after-first-heading",
      "css-selector",
    ].includes(value)
      ? value
      : DEFAULT_MOBILE_CONTAINER.position;
  }

  function normalizeShadowPreset(value) {
    return [
      "none",
      "extra-small",
      "small",
      "medium",
      "large",
      "extra-large",
    ].includes(value)
      ? value
      : DEFAULT_DESKTOP_CONTAINER.shadowPreset;
  }

  function deriveLegacyShadowPreset(config, fallback) {
    const strength =
      typeof config.shadowStrength === "number" &&
      Number.isFinite(config.shadowStrength)
        ? Math.max(0, Math.min(100, config.shadowStrength))
        : null;
    const distance =
      typeof config.shadowDistance === "number" &&
      Number.isFinite(config.shadowDistance)
        ? Math.max(0, config.shadowDistance)
        : null;
    const blur =
      typeof config.shadowBlur === "number" &&
      Number.isFinite(config.shadowBlur)
        ? Math.max(0, config.shadowBlur)
        : null;

    if (strength === null || strength <= 0) {
      return fallback;
    }

    if ((blur ?? 0) <= 2 && (distance ?? 0) <= 1) {
      return "extra-small";
    }

    if ((blur ?? 0) <= 3 && (distance ?? 0) <= 1) {
      return "small";
    }

    if ((blur ?? 0) <= 6 && (distance ?? 0) <= 4) {
      return "medium";
    }

    if ((blur ?? 0) <= 15 && (distance ?? 0) <= 10) {
      return "large";
    }

    return "extra-large";
  }

  function getLegacyShowButtonPaddingValue(borderWidth, side) {
    return borderWidth * (side === "left" || side === "right" ? 6 : 2);
  }

  function normalizeDeviceConfig(value, fallback, device) {
    const config = value && typeof value === "object" ? value : {};
    const legacyJumpingMarkerSize =
      typeof config.jumpingMarkerSize === "number" &&
      Number.isFinite(config.jumpingMarkerSize)
        ? Math.max(0, config.jumpingMarkerSize)
        : null;
    const legacyShadowPreset = deriveLegacyShadowPreset(
      config,
      fallback.shadowPreset,
    );
    const normalizedShowButtonBorderWidth =
      typeof config.showButtonBorderWidth === "number" &&
      Number.isFinite(config.showButtonBorderWidth)
        ? Math.max(0, config.showButtonBorderWidth)
        : fallback.showButtonBorderWidth;

    return {
      position:
        device === "desktop"
          ? normalizeDesktopPosition(config.position)
          : normalizeMobilePosition(config.position),
      positionSelector:
        typeof config.positionSelector === "string"
          ? config.positionSelector.trim()
          : fallback.positionSelector,
      switchToMobileOnFloatOverflow:
        device === "desktop"
          ? typeof config.switchToMobileOnFloatOverflow === "boolean"
            ? config.switchToMobileOnFloatOverflow
            : fallback.switchToMobileOnFloatOverflow
          : false,
      color:
        typeof config.color === "string" && config.color.trim()
          ? config.color.trim()
          : fallback.color,
      width:
        typeof config.width === "number" && Number.isFinite(config.width)
          ? Math.max(0, config.width)
          : fallback.width,
      radius:
        typeof config.radius === "number" && Number.isFinite(config.radius)
          ? Math.max(0, config.radius)
          : fallback.radius,
      shadowPreset:
        typeof config.shadowPreset === "string"
          ? normalizeShadowPreset(config.shadowPreset)
          : legacyShadowPreset,
      shadowColor:
        typeof config.shadowColor === "string" && config.shadowColor.trim()
          ? config.shadowColor.trim()
          : fallback.shadowColor,
      paddingTop:
        typeof config.paddingTop === "number" &&
        Number.isFinite(config.paddingTop)
          ? Math.max(0, config.paddingTop)
          : fallback.paddingTop,
      paddingBottom:
        typeof config.paddingBottom === "number" &&
        Number.isFinite(config.paddingBottom)
          ? Math.max(0, config.paddingBottom)
          : fallback.paddingBottom,
      paddingLeft:
        typeof config.paddingLeft === "number" &&
        Number.isFinite(config.paddingLeft)
          ? Math.max(0, config.paddingLeft)
          : fallback.paddingLeft,
      paddingRight:
        typeof config.paddingRight === "number" &&
        Number.isFinite(config.paddingRight)
          ? Math.max(0, config.paddingRight)
          : fallback.paddingRight,
      offsetTop:
        typeof config.offsetTop === "number" &&
        Number.isFinite(config.offsetTop)
          ? config.offsetTop
          : fallback.offsetTop,
      offsetBottom:
        typeof config.offsetBottom === "number" &&
        Number.isFinite(config.offsetBottom)
          ? config.offsetBottom
          : fallback.offsetBottom,
      offsetLeft:
        typeof config.offsetLeft === "number" &&
        Number.isFinite(config.offsetLeft)
          ? config.offsetLeft
          : fallback.offsetLeft,
      offsetRight:
        typeof config.offsetRight === "number" &&
        Number.isFinite(config.offsetRight)
          ? config.offsetRight
          : fallback.offsetRight,
      followingMarkerWidth:
        typeof config.followingMarkerWidth === "number" &&
        Number.isFinite(config.followingMarkerWidth)
          ? Math.max(0, config.followingMarkerWidth)
          : fallback.followingMarkerWidth,
      followingMarkerHeight:
        typeof config.followingMarkerHeight === "number" &&
        Number.isFinite(config.followingMarkerHeight)
          ? Math.max(0, config.followingMarkerHeight)
          : fallback.followingMarkerHeight,
      followingMarkerColor:
        typeof config.followingMarkerColor === "string" &&
        config.followingMarkerColor.trim()
          ? config.followingMarkerColor.trim()
          : fallback.followingMarkerColor,
      followingMarkerOffset:
        typeof config.followingMarkerOffset === "number" &&
        Number.isFinite(config.followingMarkerOffset)
          ? Math.max(0, config.followingMarkerOffset)
          : fallback.followingMarkerOffset,
      followingMarkerBorderRadius:
        typeof config.followingMarkerBorderRadius === "number" &&
        Number.isFinite(config.followingMarkerBorderRadius)
          ? Math.max(0, config.followingMarkerBorderRadius)
          : fallback.followingMarkerBorderRadius,
      crawlingSnakeWidth:
        typeof config.crawlingSnakeWidth === "number" &&
        Number.isFinite(config.crawlingSnakeWidth)
          ? Math.max(0, config.crawlingSnakeWidth)
          : fallback.crawlingSnakeWidth,
      crawlingSnakeHeight:
        typeof config.crawlingSnakeHeight === "number" &&
        Number.isFinite(config.crawlingSnakeHeight)
          ? Math.max(0, config.crawlingSnakeHeight)
          : fallback.crawlingSnakeHeight,
      crawlingSnakeColor:
        typeof config.crawlingSnakeColor === "string" &&
        config.crawlingSnakeColor.trim()
          ? config.crawlingSnakeColor.trim()
          : fallback.crawlingSnakeColor,
      crawlingSnakeOffset:
        typeof config.crawlingSnakeOffset === "number" &&
        Number.isFinite(config.crawlingSnakeOffset)
          ? Math.max(0, config.crawlingSnakeOffset)
          : fallback.crawlingSnakeOffset,
      jumpingMarkerWidth:
        typeof config.jumpingMarkerWidth === "number" &&
        Number.isFinite(config.jumpingMarkerWidth)
          ? Math.max(0, config.jumpingMarkerWidth)
          : (legacyJumpingMarkerSize ?? fallback.jumpingMarkerWidth),
      jumpingMarkerHeight:
        typeof config.jumpingMarkerHeight === "number" &&
        Number.isFinite(config.jumpingMarkerHeight)
          ? Math.max(0, config.jumpingMarkerHeight)
          : (legacyJumpingMarkerSize ?? fallback.jumpingMarkerHeight),
      jumpingMarkerColor:
        typeof config.jumpingMarkerColor === "string" &&
        config.jumpingMarkerColor.trim()
          ? config.jumpingMarkerColor.trim()
          : fallback.jumpingMarkerColor,
      jumpingMarkerOffset:
        typeof config.jumpingMarkerOffset === "number" &&
        Number.isFinite(config.jumpingMarkerOffset)
          ? Math.max(0, config.jumpingMarkerOffset)
          : fallback.jumpingMarkerOffset,
      jumpingMarkerBorderRadius:
        typeof config.jumpingMarkerBorderRadius === "number" &&
        Number.isFinite(config.jumpingMarkerBorderRadius)
          ? Math.max(0, config.jumpingMarkerBorderRadius)
          : fallback.jumpingMarkerBorderRadius,
      background:
        typeof config.background === "string" && config.background.trim()
          ? config.background.trim()
          : fallback.background,
      maxWidth:
        typeof config.maxWidth === "number" && Number.isFinite(config.maxWidth)
          ? Math.max(0, config.maxWidth)
          : fallback.maxWidth,
      smoothScroll:
        typeof config.smoothScroll === "boolean"
          ? config.smoothScroll
          : fallback.smoothScroll,
      scrollOffset:
        typeof config.scrollOffset === "number" &&
        Number.isFinite(config.scrollOffset)
          ? Math.max(0, config.scrollOffset)
          : fallback.scrollOffset,
      showTitle:
        typeof config.showTitle === "boolean"
          ? config.showTitle
          : fallback.showTitle,
      headingsFontSize:
        typeof config.headingsFontSize === "number" &&
        Number.isFinite(config.headingsFontSize)
          ? Math.max(0, config.headingsFontSize)
          : fallback.headingsFontSize,
      headingsFontColor:
        typeof config.headingsFontColor === "string" &&
        config.headingsFontColor.trim()
          ? config.headingsFontColor.trim()
          : fallback.headingsFontColor,
      headingsFontWeight:
        typeof config.headingsFontWeight === "number" &&
        Number.isFinite(config.headingsFontWeight)
          ? Math.max(0, config.headingsFontWeight)
          : fallback.headingsFontWeight,
      titleFontSize:
        typeof config.titleFontSize === "number" &&
        Number.isFinite(config.titleFontSize)
          ? Math.max(0, config.titleFontSize)
          : fallback.titleFontSize,
      titleFontColor:
        typeof config.titleFontColor === "string" &&
        config.titleFontColor.trim()
          ? config.titleFontColor.trim()
          : fallback.titleFontColor,
      titleFontWeight:
        typeof config.titleFontWeight === "number" &&
        Number.isFinite(config.titleFontWeight)
          ? Math.max(0, config.titleFontWeight)
          : fallback.titleFontWeight,
      showButton:
        typeof config.showButton === "boolean"
          ? config.showButton
          : fallback.showButton,
      showButtonHeight:
        typeof config.showButtonHeight === "number" &&
        Number.isFinite(config.showButtonHeight)
          ? Math.max(0, config.showButtonHeight)
          : fallback.showButtonHeight,
      showMoreButtonText:
        typeof config.showMoreButtonText === "string" &&
        config.showMoreButtonText.trim()
          ? config.showMoreButtonText.trim()
          : fallback.showMoreButtonText,
      showLessButtonText:
        typeof config.showLessButtonText === "string" &&
        config.showLessButtonText.trim()
          ? config.showLessButtonText.trim()
          : fallback.showLessButtonText,
      showButtonFontSize:
        typeof config.showButtonFontSize === "number" &&
        Number.isFinite(config.showButtonFontSize)
          ? Math.max(0, config.showButtonFontSize)
          : fallback.showButtonFontSize,
      showButtonFontColor:
        typeof config.showButtonFontColor === "string" &&
        config.showButtonFontColor.trim()
          ? config.showButtonFontColor.trim()
          : fallback.showButtonFontColor,
      showButtonFontWeight:
        typeof config.showButtonFontWeight === "number" &&
        Number.isFinite(config.showButtonFontWeight)
          ? Math.max(0, config.showButtonFontWeight)
          : fallback.showButtonFontWeight,
      showButtonBorderColor:
        typeof config.showButtonBorderColor === "string" &&
        config.showButtonBorderColor.trim()
          ? config.showButtonBorderColor.trim()
          : fallback.showButtonBorderColor,
      showButtonBorderWidth: normalizedShowButtonBorderWidth,
      showButtonBorderRadius:
        typeof config.showButtonBorderRadius === "number" &&
        Number.isFinite(config.showButtonBorderRadius)
          ? Math.max(0, config.showButtonBorderRadius)
          : fallback.showButtonBorderRadius,
      showButtonPaddingTop:
        typeof config.showButtonPaddingTop === "number" &&
        Number.isFinite(config.showButtonPaddingTop)
          ? Math.max(0, config.showButtonPaddingTop)
          : getLegacyShowButtonPaddingValue(
              normalizedShowButtonBorderWidth,
              "top",
            ),
      showButtonPaddingBottom:
        typeof config.showButtonPaddingBottom === "number" &&
        Number.isFinite(config.showButtonPaddingBottom)
          ? Math.max(0, config.showButtonPaddingBottom)
          : getLegacyShowButtonPaddingValue(
              normalizedShowButtonBorderWidth,
              "bottom",
            ),
      showButtonPaddingLeft:
        typeof config.showButtonPaddingLeft === "number" &&
        Number.isFinite(config.showButtonPaddingLeft)
          ? Math.max(0, config.showButtonPaddingLeft)
          : getLegacyShowButtonPaddingValue(
              normalizedShowButtonBorderWidth,
              "left",
            ),
      showButtonPaddingRight:
        typeof config.showButtonPaddingRight === "number" &&
        Number.isFinite(config.showButtonPaddingRight)
          ? Math.max(0, config.showButtonPaddingRight)
          : getLegacyShowButtonPaddingValue(
              normalizedShowButtonBorderWidth,
              "right",
            ),
      animationType: normalizeAnimationType(config.animationType),
    };
  }

  function clampShadowChannel(value) {
    return Math.max(0, Math.min(255, value));
  }

  function clampShadowAlpha(value) {
    return Math.max(0, Math.min(1, value));
  }

  function getTailwindShadowLayers() {
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

  function parseShadowColorValue(value) {
    const normalized = String(value || "").trim();

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
    const parseChannel = (token) =>
      token.endsWith("%")
        ? (Number.parseFloat(token) / 100) * 255
        : Number.parseFloat(token);
    const parseAlpha = (token) =>
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

  function buildShadowValue(device) {
    const layers = getTailwindShadowLayers()[device.shadowPreset] || [];

    if (!layers.length) {
      return "none";
    }
    const parsedColor = parseShadowColorValue(device.shadowColor);
    const baseColor = parsedColor || { red: 0, green: 0, blue: 0, alpha: 1 };

    return layers
      .map((layer) => {
        const alpha = clampShadowAlpha(baseColor.alpha * layer.alpha);

        return `${layer.x}px ${layer.y}px ${layer.blur}px ${layer.spread}px rgb(${baseColor.red} ${baseColor.green} ${baseColor.blue} / ${Number(alpha.toFixed(3))})`;
      })
      .join(", ");
  }

  function applyDeviceConfig(toc, desktop, mobile) {
    toc.style.setProperty("--toc-background", desktop.background);
    toc.style.setProperty(
      "--toc-max-width",
      desktop.maxWidth > 0 ? `${desktop.maxWidth}px` : "none",
    );
    toc.style.setProperty("--toc-border-color", desktop.color);
    toc.style.setProperty("--toc-border-width", `${desktop.width}px`);
    toc.style.setProperty("--toc-border-radius", `${desktop.radius}px`);
    toc.style.setProperty("--toc-shadow", buildShadowValue(desktop));
    toc.style.setProperty("--toc-padding-top", `${desktop.paddingTop}px`);
    toc.style.setProperty("--toc-padding-bottom", `${desktop.paddingBottom}px`);
    toc.style.setProperty("--toc-padding-left", `${desktop.paddingLeft}px`);
    toc.style.setProperty("--toc-padding-right", `${desktop.paddingRight}px`);
    toc.style.setProperty("--toc-offset-top", `${desktop.offsetTop}px`);
    toc.style.setProperty("--toc-offset-bottom", `${desktop.offsetBottom}px`);
    toc.style.setProperty("--toc-offset-left", `${desktop.offsetLeft}px`);
    toc.style.setProperty("--toc-offset-right", `${desktop.offsetRight}px`);
    toc.style.setProperty(
      "--toc-following-marker-width",
      `${desktop.followingMarkerWidth}px`,
    );
    toc.style.setProperty(
      "--toc-following-marker-height",
      `${desktop.followingMarkerHeight}px`,
    );
    toc.style.setProperty(
      "--toc-following-marker-color",
      desktop.followingMarkerColor,
    );
    toc.style.setProperty(
      "--toc-following-marker-head-offset",
      `${desktop.followingMarkerOffset}px`,
    );
    toc.style.setProperty(
      "--toc-following-marker-border-radius",
      `${desktop.followingMarkerBorderRadius}px`,
    );
    toc.style.setProperty(
      "--toc-crawling-snake-width",
      `${desktop.crawlingSnakeWidth}px`,
    );
    toc.style.setProperty(
      "--toc-crawling-snake-height",
      `${desktop.crawlingSnakeHeight}px`,
    );
    toc.style.setProperty(
      "--toc-crawling-snake-color",
      desktop.crawlingSnakeColor,
    );
    toc.style.setProperty(
      "--toc-crawling-snake-head-offset",
      `${desktop.crawlingSnakeOffset}px`,
    );
    toc.style.setProperty(
      "--toc-jumping-marker-width",
      `${desktop.jumpingMarkerWidth}px`,
    );
    toc.style.setProperty(
      "--toc-jumping-marker-height",
      `${desktop.jumpingMarkerHeight}px`,
    );
    toc.style.setProperty(
      "--toc-jumping-marker-color",
      desktop.jumpingMarkerColor,
    );
    toc.style.setProperty(
      "--toc-jumping-marker-head-offset",
      `${desktop.jumpingMarkerOffset}px`,
    );
    toc.style.setProperty(
      "--toc-jumping-marker-border-radius",
      `${desktop.jumpingMarkerBorderRadius}px`,
    );
    toc.style.setProperty(
      "--toc-title-font-size",
      `${desktop.titleFontSize}px`,
    );
    toc.style.setProperty("--toc-title-font-color", desktop.titleFontColor);
    toc.style.setProperty(
      "--toc-title-font-weight",
      String(desktop.titleFontWeight),
    );
    toc.style.setProperty(
      "--toc-show-button-height",
      `${desktop.showButtonHeight}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-font-size",
      `${desktop.showButtonFontSize}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-font-color",
      desktop.showButtonFontColor,
    );
    toc.style.setProperty(
      "--toc-show-button-font-weight",
      String(desktop.showButtonFontWeight),
    );
    toc.style.setProperty(
      "--toc-show-button-border-color",
      desktop.showButtonBorderColor,
    );
    toc.style.setProperty(
      "--toc-show-button-border-width",
      `${desktop.showButtonBorderWidth}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-border-radius",
      `${desktop.showButtonBorderRadius}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-padding-top",
      `${desktop.showButtonPaddingTop}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-padding-bottom",
      `${desktop.showButtonPaddingBottom}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-padding-left",
      `${desktop.showButtonPaddingLeft}px`,
    );
    toc.style.setProperty(
      "--toc-show-button-padding-right",
      `${desktop.showButtonPaddingRight}px`,
    );
    toc.style.setProperty("--toc-mobile-border-color", mobile.color);
    toc.style.setProperty("--toc-mobile-border-width", `${mobile.width}px`);
    toc.style.setProperty("--toc-mobile-border-radius", `${mobile.radius}px`);
    toc.style.setProperty("--toc-mobile-shadow", buildShadowValue(mobile));
    toc.style.setProperty("--toc-mobile-background", mobile.background);
    toc.style.setProperty(
      "--toc-mobile-max-width",
      mobile.maxWidth > 0 ? `${mobile.maxWidth}px` : "none",
    );
    toc.style.setProperty(
      "--toc-headings-font-size",
      `${desktop.headingsFontSize}px`,
    );
    toc.style.setProperty(
      "--toc-headings-font-color",
      desktop.headingsFontColor,
    );
    toc.style.setProperty(
      "--toc-headings-font-weight",
      String(desktop.headingsFontWeight),
    );
    toc.style.setProperty("--toc-mobile-padding-top", `${mobile.paddingTop}px`);
    toc.style.setProperty(
      "--toc-mobile-padding-bottom",
      `${mobile.paddingBottom}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-padding-left",
      `${mobile.paddingLeft}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-padding-right",
      `${mobile.paddingRight}px`,
    );
    toc.style.setProperty("--toc-mobile-offset-top", `${mobile.offsetTop}px`);
    toc.style.setProperty(
      "--toc-mobile-offset-bottom",
      `${mobile.offsetBottom}px`,
    );
    toc.style.setProperty("--toc-mobile-offset-left", `${mobile.offsetLeft}px`);
    toc.style.setProperty(
      "--toc-mobile-offset-right",
      `${mobile.offsetRight}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-title-font-size",
      `${mobile.titleFontSize}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-title-font-color",
      mobile.titleFontColor,
    );
    toc.style.setProperty(
      "--toc-mobile-title-font-weight",
      String(mobile.titleFontWeight),
    );
    toc.style.setProperty(
      "--toc-mobile-headings-font-size",
      `${mobile.headingsFontSize}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-headings-font-color",
      mobile.headingsFontColor,
    );
    toc.style.setProperty(
      "--toc-mobile-headings-font-weight",
      String(mobile.headingsFontWeight),
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-height",
      `${mobile.showButtonHeight}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-font-size",
      `${mobile.showButtonFontSize}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-font-color",
      mobile.showButtonFontColor,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-font-weight",
      String(mobile.showButtonFontWeight),
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-border-color",
      mobile.showButtonBorderColor,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-border-width",
      `${mobile.showButtonBorderWidth}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-border-radius",
      `${mobile.showButtonBorderRadius}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-padding-top",
      `${mobile.showButtonPaddingTop}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-padding-bottom",
      `${mobile.showButtonPaddingBottom}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-padding-left",
      `${mobile.showButtonPaddingLeft}px`,
    );
    toc.style.setProperty(
      "--toc-mobile-show-button-padding-right",
      `${mobile.showButtonPaddingRight}px`,
    );
  }

  function keepCurrentLinkVisible(link) {
    if (!link || list.scrollHeight <= list.clientHeight) return;
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
  }

  function createSnakeOverlay() {
    const root = document.createElement("div");
    root.className = "toc-widget__snake";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("toc-widget__snake-svg");
    svg.setAttribute("preserveAspectRatio", "none");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.classList.add("toc-widget__snake-path");
    svg.appendChild(path);

    const head = document.createElement("span");
    head.className = "toc-widget__snake-head";
    head.hidden = true;

    root.appendChild(svg);
    root.appendChild(head);

    return { root, svg, path, head };
  }

  function readOverlayWidgetCssPixels(overlayRoot, propertyName, fallback) {
    const widget = overlayRoot.closest(".toc-widget");
    if (!(widget instanceof Element)) {
      return fallback;
    }

    const rawValue = window
      .getComputedStyle(widget)
      .getPropertyValue(propertyName);
    const parsedValue = Number.parseFloat(rawValue);

    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  function updateSnakeOverlay(overlay, geometry, animationType) {
    if (!geometry) {
      overlay.svg.setAttribute("viewBox", "0 0 0 0");
      overlay.svg.setAttribute("width", "0");
      overlay.svg.setAttribute("height", "0");
      overlay.path.setAttribute("d", "");
      overlay.path.style.removeProperty("stroke-dasharray");
      overlay.path.style.removeProperty("stroke-dashoffset");
      overlay.head.hidden = true;
      overlay.head.style.removeProperty("--toc-snake-head-rotation");
      overlay.head.style.removeProperty("--toc-snake-head-bend");
      return;
    }

    overlay.svg.setAttribute(
      "viewBox",
      `0 0 ${geometry.width} ${geometry.height}`,
    );
    overlay.svg.setAttribute("width", String(geometry.width));
    overlay.svg.setAttribute("height", String(geometry.height));
    overlay.path.setAttribute("d", geometry.path);
    if (animationType === "crawling-snake") {
      const crawlingSnakeVisibleLength = readOverlayWidgetCssPixels(
        overlay.root,
        "--toc-crawling-snake-width",
        TOC_CRAWLING_SNAKE_VISIBLE_LENGTH,
      );
      overlay.path.style.setProperty(
        "stroke-dasharray",
        `${Math.min(crawlingSnakeVisibleLength, geometry.pathLength)} ${Math.max(geometry.pathLength, 1)}`,
      );
      overlay.path.style.setProperty(
        "stroke-dashoffset",
        `-${Math.max(geometry.pathLength - crawlingSnakeVisibleLength, 0)}`,
      );
    } else {
      overlay.path.style.removeProperty("stroke-dasharray");
      overlay.path.style.removeProperty("stroke-dashoffset");
    }
    overlay.head.hidden = false;
    overlay.head.style.left = `${geometry.headX}px`;
    overlay.head.style.top = `${geometry.headY}px`;
    overlay.head.style.setProperty(
      "--toc-snake-head-rotation",
      `${geometry.headAngle}deg`,
    );
    overlay.head.style.setProperty(
      "--toc-snake-head-bend",
      `${geometry.headBend}deg`,
    );
  }

  function normalizeAnimationAssetUrls(value) {
    const assetUrls = value && typeof value === "object" ? value : {};

    return TOC_MARKER_ANIMATION_TYPES.reduce(
      (normalized, animationType) => {
        if (
          typeof assetUrls[animationType] === "string" &&
          assetUrls[animationType].trim()
        ) {
          normalized[animationType] = assetUrls[animationType].trim();
        }

        return normalized;
      },
      {
        shared:
          typeof assetUrls.shared === "string" && assetUrls.shared.trim()
            ? assetUrls.shared.trim()
            : "",
      },
    );
  }

  function getTocAnimationRegistry() {
    if (!window[TOC_ANIMATION_REGISTRY_KEY]) {
      window[TOC_ANIMATION_REGISTRY_KEY] = {};
    }

    return window[TOC_ANIMATION_REGISTRY_KEY];
  }

  function loadAnimationControllerFactory(animationType, assetUrls) {
    const registry = getTocAnimationRegistry();

    if (typeof registry[animationType] === "function") {
      return Promise.resolve(registry[animationType]);
    }

    const scriptUrl = assetUrls[animationType];

    if (!scriptUrl) {
      return Promise.reject(
        new Error(`Missing animation asset URL for ${animationType}`),
      );
    }

    const sharedAssetPromise = assetUrls.shared
      ? loadAnimationScript(assetUrls.shared)
      : Promise.resolve();

    return sharedAssetPromise
      .then(() => loadAnimationScript(scriptUrl))
      .then(() => {
        const factory = getTocAnimationRegistry()[animationType];

        if (typeof factory !== "function") {
          throw new Error(
            `Animation factory ${animationType} did not register`,
          );
        }

        return factory;
      });
  }

  function loadAnimationScript(url) {
    if (!url) {
      return Promise.reject(new Error("Missing animation script URL"));
    }

    if (loadedAnimationScripts.has(url)) {
      return loadedAnimationScripts.get(url);
    }

    const promise = new Promise((resolve, reject) => {
      let script = Array.from(
        document.querySelectorAll(`script[${TOC_ANIMATION_SCRIPT_ATTRIBUTE}]`),
      ).find(
        (element) =>
          element.getAttribute(TOC_ANIMATION_SCRIPT_ATTRIBUTE) === url,
      );

      const handleLoad = () => {
        script?.setAttribute("data-shopify-toc-animation-loaded", "true");
        cleanup();
        resolve();
      };
      const handleError = () => {
        loadedAnimationScripts.delete(url);
        cleanup();
        reject(new Error(`Failed to load animation script: ${url}`));
      };
      const cleanup = () => {
        script?.removeEventListener("load", handleLoad);
        script?.removeEventListener("error", handleError);
      };

      if (!script) {
        script = document.createElement("script");
        script.async = true;
        script.src = url;
        script.setAttribute(TOC_ANIMATION_SCRIPT_ATTRIBUTE, url);
        document.head.appendChild(script);
      }

      if (script.getAttribute("data-shopify-toc-animation-loaded") === "true") {
        cleanup();
        resolve();
        return;
      }

      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
    });

    loadedAnimationScripts.set(url, promise);
    return promise;
  }

  function createNullAnimationController(context) {
    return {
      clear() {
        context.setAnimating?.(false);
        context.renderGeometry?.(null);
      },
      destroy() {
        context.setAnimating?.(false);
        context.renderGeometry?.(null);
      },
      handleCurrentLinkChange() {},
      handleLinkClick() {
        return null;
      },
      resolveTrackedLink({ detectedLink }) {
        return detectedLink;
      },
      sync() {
        context.setAnimating?.(false);
        context.renderGeometry?.(null);
      },
    };
  }

  function buildNestedList(nodes) {
    const root = document.createElement("ul");
    root.className = "toc-widget__list";

    const levels = nodes.map((h) => Number(h.tagName.replace("H", "")));
    const minLevel = Math.min(...levels);
    const stack = [root];
    let currentDepth = 0;
    let prevItem = null;

    nodes.forEach((h) => {
      const rawDepth = Math.max(
        0,
        Number(h.tagName.replace("H", "")) - minLevel,
      );
      const targetDepth = Math.min(rawDepth, currentDepth + 1);

      while (currentDepth > targetDepth) {
        stack.pop();
        currentDepth -= 1;
      }

      while (currentDepth < targetDepth && prevItem) {
        const nested = document.createElement("ul");
        nested.className = "toc-widget__sublist";
        prevItem.appendChild(nested);
        stack.push(nested);
        currentDepth += 1;
      }

      const li = document.createElement("li");
      li.className = "toc-widget__item";
      const a = document.createElement("a");
      a.className = "toc-widget__link";
      const label = document.createElement("span");
      const anchorId = getHeadingAnchorId(h);
      label.className = "toc-widget__link-label";
      a.setAttribute("href", `#${encodeURIComponent(anchorId)}`);
      label.textContent = getHeadingLabel(h);
      a.appendChild(label);
      li.appendChild(a);
      stack[stack.length - 1].appendChild(li);
      prevItem = li;
    });

    return root;
  }
})();
