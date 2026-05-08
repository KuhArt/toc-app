import { DEFAULT_CONFIG } from "./constants";
import type { PreviewHeading, PreviewTocItem, TocConfig } from "./types";

export type TocPreviewState = {
  activeId: string;
  items: PreviewTocItem[];
  showToc: boolean;
  title: string;
};

export function buildPreviewState(
  config: TocConfig,
  shuffleSeed: number | string = 0,
): TocPreviewState {
  const headings = buildPreviewHeadings(config.headingLevels, shuffleSeed);

  return {
    activeId: headings[0]?.id || "",
    items: buildPreviewTocItems(headings),
    showToc: headings.length >= config.minHeadings,
    title: config.title,
  };
}

export function createPreviewShuffleSeed(source: string) {
  return `${source}-${Date.now()}-${Math.random()}`;
}

function buildPreviewHeadings(
  levels: number[],
  shuffleSeed: number | string,
): PreviewHeading[] {
  const normalizedLevels = normalizeLevels(levels);
  const titles = [
    "Overview",
    "Key features",
    "Installation",
    "Theme setup",
    "Desktop placement",
    "Heading hierarchy",
    "Reader experience",
    "Mobile behavior",
    "Styling notes",
    "Anchor offsets",
    "Troubleshooting",
    "Theme compatibility",
    "Support",
  ];
  const levelPattern = buildPreviewLevelPattern(
    normalizedLevels.length,
    titles.length,
    shuffleSeed,
  );

  return titles.map((title, index) => {
    const level = normalizedLevels[levelPattern[index] ?? 0];

    return {
      id: `preview-${index}`,
      title: `H${level} ${title}`,
      level,
    };
  });
}

function normalizeLevels(levels: number[]) {
  const uniqueLevels = [...new Set(levels)].sort((left, right) => left - right);
  return uniqueLevels.length ? uniqueLevels : DEFAULT_CONFIG.headingLevels;
}

function buildPreviewLevelPattern(
  levelCount: number,
  titleCount: number,
  shuffleSeed: number | string,
) {
  if (levelCount <= 1) {
    return Array.from({ length: titleCount }, () => 0);
  }

  const branch = [
    ...Array.from({ length: levelCount }, (_, index) => index),
    ...Array.from(
      { length: Math.max(levelCount - 2, 0) },
      (_, index) => levelCount - 2 - index,
    ),
  ];
  const rootDepth = branch[0] ?? 0;
  const pattern = [rootDepth];

  while (pattern.length < titleCount) {
    pattern.push(
      ...shufflePreviewDepths(
        branch.slice(1),
        `${shuffleSeed}-${pattern.length}`,
      ),
    );
  }

  return pattern.slice(0, titleCount);
}

function shufflePreviewDepths(depths: number[], shuffleSeed: number | string) {
  const shuffledDepths = [...depths];
  const nextRandom = createSeededRandom(shuffleSeed);

  for (let index = shuffledDepths.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextRandom() * (index + 1));
    const currentDepth = shuffledDepths[index];
    shuffledDepths[index] = shuffledDepths[swapIndex];
    shuffledDepths[swapIndex] = currentDepth;
  }

  return shuffledDepths;
}

function createSeededRandom(seed: number | string) {
  let state = hashPreviewSeed(seed);

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hashPreviewSeed(seed: number | string) {
  const serializedSeed = String(seed);
  let hash = 2166136261;

  for (const character of serializedSeed) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function buildPreviewTocItems(headings: PreviewHeading[]): PreviewTocItem[] {
  const root: PreviewTocItem[] = [];
  const levels = headings.map((heading) => heading.level);
  const minLevel = Math.min(...levels);
  const stack: PreviewTocItem[][] = [root];
  let currentDepth = 0;
  let previousItem: PreviewTocItem | null = null;

  headings.forEach((heading) => {
    const rawDepth = Math.max(0, heading.level - minLevel);
    const targetDepth = Math.min(rawDepth, currentDepth + 1);

    while (currentDepth > targetDepth) {
      stack.pop();
      currentDepth -= 1;
    }

    while (currentDepth < targetDepth && previousItem) {
      stack.push(previousItem.children);
      currentDepth += 1;
    }

    const item: PreviewTocItem = {
      id: heading.id,
      title: heading.title,
      children: [],
    };

    stack[stack.length - 1].push(item);
    previousItem = item;
  });

  return root;
}
