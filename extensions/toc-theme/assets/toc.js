(() => {
  const DEFAULT_TOP_OFFSET = 80;
  const DEFAULT_MOBILE_BREAKPOINT = 768;
  const DEBUG_PREFIX = "[TOC]";
  const TOC_HEADING_ID_ATTRIBUTE = "data-shopify-toc-id";
  const TOC_GENERATED_ID_ATTRIBUTE = "data-shopify-toc-generated-id";
  const DEFAULT_DESKTOP_CONTAINER = {
    position: "float-right",
    positionSelector: "",
    color: "#0000001f",
    width: 1,
    radius: 12,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
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
  };
  const DEFAULT_MOBILE_CONTAINER = {
    position: "before-first-heading",
    positionSelector: "",
    color: "#0000001f",
    width: 0,
    radius: 12,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    background: "#00000000",
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
    showButton: false,
    showButtonHeight: 300,
    showMoreButtonText: "Show more",
    showLessButtonText: "Show less",
    showButtonFontSize: 13,
    showButtonFontColor: "#575757",
    showButtonFontWeight: 600,
    showButtonBorderColor: "#575757",
    showButtonBorderWidth: 0,
    showButtonBorderRadius: 0,
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

  const debugContext = readJsonScript("toc-debug-context") || {};

  console.info(`${DEBUG_PREFIX} Boot`, debugContext);

  if (debugContext.renderEnabled === false) {
    console.info(`${DEBUG_PREFIX} Skipping render for excluded article`, {
      currentArticleHandle: debugContext.currentArticleHandle,
      currentArticleId: debugContext.currentArticleId,
      excludedBlogs: debugContext.excludedBlogs,
    });
    return;
  }

  // 1) Read config from Liquid-injected JSON
  const el = document.getElementById("toc-config");
  const cfg = el ? readJsonScript("toc-config") || {} : {};

  if (!el) {
    console.warn(
      `${DEBUG_PREFIX} Missing #toc-config, falling back to defaults`,
    );
  }

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

  const selectors = [
    ".article-template__content",
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
    console.info(`${DEBUG_PREFIX} No article wrapper found`, { selectors });
    return;
  }

  // 3) Collect headings
  const headingSelector = headingLevels.map((l) => `h${l}`).join(",");
  const headings = Array.from(wrapper.querySelectorAll(headingSelector)).filter(
    (h) => (h.textContent || "").trim().length > 0,
  );

  console.info(`${DEBUG_PREFIX} Heading scan`, {
    headingSelector,
    headingsFound: headings.length,
    minHeadings,
  });

  if (headings.length < minHeadings) {
    console.info(
      `${DEBUG_PREFIX} Skipping render because there are not enough headings`,
    );
    return;
  }

  const isDesktopViewport = () => window.innerWidth > mobileBreakpoint;
  const getActiveConfig = () =>
    isDesktopViewport() ? desktopConfig : mobileConfig;
  const getDefaultPosition = () =>
    isDesktopViewport()
      ? DEFAULT_DESKTOP_CONTAINER.position
      : DEFAULT_MOBILE_CONTAINER.position;
  const getHeadingAnchorId = (heading) =>
    (heading.getAttribute(TOC_HEADING_ID_ATTRIBUTE) || heading.id || "").trim();
  const getHeadingByAnchorId = (anchorId) =>
    headings.find((heading) => getHeadingAnchorId(heading) === anchorId) ||
    document.getElementById(anchorId);
  const applyHeadingScrollMargins = () => {
    const activeOffset = Math.max(0, getActiveConfig().scrollOffset || 0);

    headings.forEach((h) => {
      h.style.scrollMarginTop = `${activeOffset + 12}px`;
    });
  };

  // 4) Ensure each heading has a stable TOC anchor marker.
  headings.forEach((h, i) => {
    const anchorId =
      h.id.trim() || `toc-${i}-${slugify(h.textContent || "")}`;

    h.setAttribute(TOC_HEADING_ID_ATTRIBUTE, anchorId);

    if (!h.id) {
      h.id = anchorId;
      h.setAttribute(TOC_GENERATED_ID_ATTRIBUTE, "true");
      return;
    }

    h.removeAttribute(TOC_GENERATED_ID_ATTRIBUTE);
  });
  applyHeadingScrollMargins();

  // 5) Build TOC markup
  const toc = document.createElement("nav");
  toc.className = "shopify-toc";
  if (cfg.indentation === false) {
    toc.classList.add("shopify-toc--flat");
  }
  toc.classList.add(
    `shopify-toc--align-${normalizeTextAlignment(cfg.textAlignment)}`,
  );
  toc.classList.add(
    `shopify-toc--markers-${normalizeMarkerFormat(cfg.markerFormat)}`,
  );
  const syncDeviceState = () => {
    toc.dataset.device = isDesktopViewport() ? "desktop" : "mobile";
  };
  syncDeviceState();
  applyDeviceConfig(toc, desktopConfig, mobileConfig);
  const title = document.createElement("div");
  title.className = "shopify-toc__title";
  title.textContent = cfg.title || "Contents";
  const syncTitleVisibility = () => {
    title.hidden = !getActiveConfig().showTitle;
  };
  syncTitleVisibility();
  toc.appendChild(title);

  const topFade = document.createElement("div");
  topFade.className = "toc-fade toc-fade--top";
  const topFadeShim = document.createElement("span");
  topFadeShim.className = "toc-fade__shim";
  topFade.setAttribute("aria-hidden", "true");
  topFade.appendChild(topFadeShim);
  topFade.hidden = true;
  toc.appendChild(topFade);

  const list = buildNestedList(headings);
  toc.appendChild(list);

  const linksById = new Map(
    Array.from(list.querySelectorAll("a")).map((a) => [
      decodeURIComponent((a.getAttribute("href") || "").slice(1)),
      a,
    ]),
  );
  let currentLink = null;

  const bottomFade = document.createElement("div");
  bottomFade.className = "toc-fade toc-fade--bottom";
  const bottomFadeShim = document.createElement("span");
  bottomFadeShim.className = "toc-fade__shim";
  bottomFade.setAttribute("aria-hidden", "true");
  bottomFade.appendChild(bottomFadeShim);
  bottomFade.hidden = true;
  toc.appendChild(bottomFade);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "shopify-toc__toggle";
  toggle.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = desktopConfig.showMoreButtonText;
  toc.appendChild(toggle);

  let floatHost = null;
  const removeFloatHost = () => {
    floatHost?.remove();
    floatHost = null;
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
      floatHost.className = `shopify-toc-float shopify-toc-float--${target.kind.replace("float-", "")}`;
      if (!floatHost.isConnected) {
        document.body.appendChild(floatHost);
      }
      floatHost.appendChild(toc);
      return;
    }

    removeFloatHost();

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
  console.info(`${DEBUG_PREFIX} Rendered`, {
    headingCount: headings.length,
    title: cfg.title || "Contents",
  });

  let applyResponsiveState = () => {};
  requestAnimationFrame(() => {
    const needsToggle = (activeConfig) => {
      const toggleHeight = Math.max(0, activeConfig.showButtonHeight || 0);
      return list.scrollHeight > toggleHeight + 1;
    };
    const refreshFades = () => {
      if (!toc.classList.contains("shopify-toc--show-more-active")) {
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
      const expanded = toc.classList.contains("shopify-toc--expanded");
      toggle.textContent = expanded
        ? activeConfig.showLessButtonText
        : activeConfig.showMoreButtonText;
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    };
    applyResponsiveState = () => {
      const activeConfig = getActiveConfig();
      const showToggle = activeConfig.showButton && needsToggle(activeConfig);

      syncTitleVisibility();
      toc.classList.toggle("shopify-toc--show-more-active", showToggle);

      if (!showToggle) {
        toc.classList.remove("shopify-toc--expanded");
        toggle.hidden = true;
        topFade.hidden = true;
        bottomFade.hidden = true;
        return;
      }

      toggle.hidden = false;
      syncToggleLabel(activeConfig);
      refreshFades();
    };

    applyResponsiveState();
    list.addEventListener(
      "scroll",
      () => {
        refreshFades();
      },
      { passive: true },
    );
    toggle.addEventListener("click", () => {
      toc.classList.toggle("shopify-toc--expanded");
      syncToggleLabel(getActiveConfig());
      refreshFades();
    });
  });

  const refreshCurrentLink = () => {
    const scrollY = window.scrollY + getActiveConfig().scrollOffset + 24;
    let currentId = headings[0] ? getHeadingAnchorId(headings[0]) : "";

    for (const h of headings) {
      if (h.offsetTop <= scrollY) currentId = getHeadingAnchorId(h);
      else break;
    }

    if (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - 4
    ) {
      currentId = headings[headings.length - 1]
        ? getHeadingAnchorId(headings[headings.length - 1])
        : "";
    }

    const nextLink = linksById.get(currentId || "");
    if (!nextLink || nextLink === currentLink) return;
    currentLink?.classList.remove("is-current");
    nextLink.classList.add("is-current");
    currentLink = nextLink;
    keepCurrentLinkVisible(nextLink);
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
    syncDeviceState();
    mount();
    applyHeadingScrollMargins();
    if (toc.dataset.device !== previousDevice) {
      list.scrollTop = 0;
      toc.classList.remove("shopify-toc--expanded");
    }
    applyResponsiveState();
    onScrollOrResize();
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", handleResize);
  refreshCurrentLink();

  // smooth scroll
  toc.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    const id = decodeURIComponent((a.getAttribute("href") || "").slice(1));
    const target = getHeadingByAnchorId(id);
    if (target) {
      const activeConfig = getActiveConfig();
      target.scrollIntoView({
        behavior: activeConfig.smoothScroll ? "smooth" : "auto",
      });
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

  function normalizeMobileBreakpoint(value, fallback) {
    return typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, value)
      : fallback;
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

  function normalizeDeviceConfig(value, fallback, device) {
    const config = value && typeof value === "object" ? value : {};

    return {
      position:
        device === "desktop"
          ? normalizeDesktopPosition(config.position)
          : normalizeMobilePosition(config.position),
      positionSelector:
        typeof config.positionSelector === "string"
          ? config.positionSelector.trim()
          : fallback.positionSelector,
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
      showButtonBorderWidth:
        typeof config.showButtonBorderWidth === "number" &&
        Number.isFinite(config.showButtonBorderWidth)
          ? Math.max(0, config.showButtonBorderWidth)
          : fallback.showButtonBorderWidth,
      showButtonBorderRadius:
        typeof config.showButtonBorderRadius === "number" &&
        Number.isFinite(config.showButtonBorderRadius)
          ? Math.max(0, config.showButtonBorderRadius)
          : fallback.showButtonBorderRadius,
    };
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
    toc.style.setProperty("--toc-padding-top", `${desktop.paddingTop}px`);
    toc.style.setProperty("--toc-padding-bottom", `${desktop.paddingBottom}px`);
    toc.style.setProperty("--toc-padding-left", `${desktop.paddingLeft}px`);
    toc.style.setProperty("--toc-padding-right", `${desktop.paddingRight}px`);
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
    toc.style.setProperty("--toc-mobile-border-color", mobile.color);
    toc.style.setProperty("--toc-mobile-border-width", `${mobile.width}px`);
    toc.style.setProperty("--toc-mobile-border-radius", `${mobile.radius}px`);
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

  function buildNestedList(nodes) {
    const root = document.createElement("ul");
    root.className = "shopify-toc__list";

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
        nested.className = "shopify-toc__sublist";
        prevItem.appendChild(nested);
        stack.push(nested);
        currentDepth += 1;
      }

      const li = document.createElement("li");
      const a = document.createElement("a");
      const label = document.createElement("span");
      const anchorId = getHeadingAnchorId(h);
      label.className = "shopify-toc__link-label";
      a.setAttribute("href", `#${encodeURIComponent(anchorId)}`);
      label.textContent = (h.textContent || "").trim();
      a.appendChild(label);
      li.appendChild(a);
      stack[stack.length - 1].appendChild(li);
      prevItem = li;
    });

    return root;
  }
})();
