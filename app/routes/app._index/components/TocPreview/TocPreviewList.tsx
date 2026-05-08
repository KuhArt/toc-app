import type { Ref } from "react";

import type { PreviewTocItem } from "../../lib/types";

type TocPreviewListProps = {
  activeId: string;
  items: PreviewTocItem[];
  listId: string;
  listRef: Ref<HTMLUListElement>;
  onItemSelect: (itemId: string) => void;
};

export function TocPreviewList({
  activeId,
  items,
  listId,
  listRef,
  onItemSelect,
}: TocPreviewListProps) {
  return (
    <ul id={listId} ref={listRef} className="toc-widget__list">
      {items.map((item) => (
        <TocPreviewListItem
          key={item.id}
          item={item}
          activeId={activeId}
          onItemSelect={onItemSelect}
        />
      ))}
    </ul>
  );
}

type TocPreviewListItemProps = {
  activeId: string;
  item: PreviewTocItem;
  onItemSelect: (itemId: string) => void;
};

function TocPreviewListItem({
  item,
  activeId,
  onItemSelect,
}: TocPreviewListItemProps) {
  return (
    <li className="toc-widget__item">
      <a
        href={`#${item.id}`}
        className={`toc-widget__link${item.id === activeId ? " toc-widget__link--current" : ""}`}
        aria-current={item.id === activeId ? "location" : undefined}
        onClick={(event) => {
          event.preventDefault();
          onItemSelect(item.id);
        }}
      >
        <span className="toc-widget__link-label">{item.title}</span>
      </a>
      {item.children.length ? (
        <ul className="toc-widget__sublist">
          {item.children.map((child) => (
            <TocPreviewListItem
              key={child.id}
              item={child}
              activeId={activeId}
              onItemSelect={onItemSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
