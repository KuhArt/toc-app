(() => {
  const DEFAULT_TOP_OFFSET = 80;

  // 1) Read config from Liquid-injected JSON
  const el = document.getElementById("toc-config");
  const cfg = el ? JSON.parse(el.textContent || "{}") : {};
  console.log("TOC config:", cfg);

  // defaults
  const headingLevels = cfg.headingLevels?.length ? cfg.headingLevels : [2, 3, 4];
  const minHeadings = typeof cfg.minHeadings === "number" ? cfg.minHeadings : 3;

  const selectors = [
    ".article-template__content",
    "article .rte",
    ".article__content",
    "main article"
  ].filter(Boolean);

  let wrapper = null;
  for (const s of selectors) {
    const found = document.querySelector(s);
    if (found) { wrapper = found; break; }
  }
  if (!wrapper) return;

  // 3) Collect headings
  const headingSelector = headingLevels.map(l => `h${l}`).join(",");
  const headings = Array.from(wrapper.querySelectorAll(headingSelector))
    .filter(h => (h.textContent || "").trim().length > 0);

  if (headings.length < minHeadings) return;

  // 4) Ensure each heading has an id
  headings.forEach((h, i) => {
    if (!h.id) h.id = `toc-${i}-${slugify(h.textContent)}`;
    // helps sticky headers not cover anchors
    h.style.scrollMarginTop = `${DEFAULT_TOP_OFFSET + 12}px`;
  });

  // 5) Build TOC markup
  const toc = document.createElement("nav");
  toc.className = "shopify-toc";
  if (cfg.indentation === false) {
    toc.classList.add("shopify-toc--flat");
  }
  toc.classList.add(`shopify-toc--align-${normalizeTextAlignment(cfg.textAlignment)}`);
  toc.classList.add(`shopify-toc--markers-${normalizeMarkerFormat(cfg.markerFormat)}`);
  const title = document.createElement("div");
  title.className = "shopify-toc__title";
  title.textContent = cfg.title || "Contents";
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
    Array.from(list.querySelectorAll("a"))
      .map((a) => [decodeURIComponent((a.getAttribute("href") || "").slice(1)), a])
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
  toggle.textContent = "Show more";
  toc.appendChild(toggle);

  const mq = window.matchMedia("(min-width: 990px)");
  wrapper.insertBefore(toc, headings[0]);

  requestAnimationFrame(() => {
    const listMaxHeight = Number.parseFloat(getComputedStyle(list).maxHeight) || 0;
    const needsToggle = list.scrollHeight > listMaxHeight + 1;
    const refreshFades = () => {
      topFade.hidden = list.scrollTop <= 1;
      bottomFade.hidden = false;
    };
    const syncToggleLabel = () => {
      const expanded = toc.classList.contains("shopify-toc--expanded");
      toggle.textContent = expanded ? "Show less" : "Show more";
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    };
    const applyResponsiveState = () => {
      if (!mq.matches) {
        // Mobile/tablet: always expanded, no fades, no toggle.
        toc.classList.add("shopify-toc--expanded");
        toggle.hidden = true;
        topFade.hidden = true;
        bottomFade.hidden = true;
        return;
      }

      if (!needsToggle) {
        toggle.hidden = true;
        topFade.hidden = true;
        bottomFade.hidden = true;
        return;
      }

      toggle.hidden = false;
      syncToggleLabel();
      refreshFades();
    };

    if (!needsToggle) {
      applyResponsiveState();
      return;
    }

    applyResponsiveState();
    list.addEventListener("scroll", () => {
      if (!mq.matches) return;
      refreshFades();
    }, { passive: true });
    toggle.addEventListener("click", () => {
      if (!mq.matches) return;
      toc.classList.toggle("shopify-toc--expanded");
      syncToggleLabel();
      refreshFades();
    });
    mq.addEventListener?.("change", applyResponsiveState);
  });

  const refreshCurrentLink = () => {
    const scrollY = window.scrollY + DEFAULT_TOP_OFFSET + 24;
    let currentId = headings[0]?.id;

    for (const h of headings) {
      if (h.offsetTop <= scrollY) currentId = h.id;
      else break;
    }

    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - 4)) {
      currentId = headings[headings.length - 1]?.id;
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

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  refreshCurrentLink();

  // smooth scroll
  toc.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute("href").slice(1);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: cfg.smoothScroll === false ? "auto" : "smooth" });
      refreshCurrentLink();
    }
  });

  function slugify(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  function normalizeTextAlignment(value) {
    return ["left", "center", "right"].includes(value) ? value : "left";
  }

  function normalizeMarkerFormat(value) {
    return ["none", "bullet", "numeric"].includes(value) ? value : "none";
  }

  function keepCurrentLinkVisible(link) {
    if (!link || list.scrollHeight <= list.clientHeight) return;
    const containerRect = list.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const padding = 8;

    if (linkRect.top < containerRect.top + padding) {
      list.scrollTop -= (containerRect.top + padding) - linkRect.top;
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
      const rawDepth = Math.max(0, Number(h.tagName.replace("H", "")) - minLevel);
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
      label.className = "shopify-toc__link-label";
      a.href = `#${h.id}`;
      label.textContent = (h.textContent || "").trim();
      a.appendChild(label);
      li.appendChild(a);
      stack[stack.length - 1].appendChild(li);
      prevItem = li;
    });

    return root;
  }
})();
