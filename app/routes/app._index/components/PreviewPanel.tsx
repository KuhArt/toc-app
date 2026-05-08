import { useEffect, useRef, type ReactNode } from "react";

import type { DeviceTab } from "../lib/types";

function PreviewPanelFrame({ children }: { children: ReactNode }) {
  return (
    <div className="toc-preview-column toc-preview-column--sticky">
      <s-section>
        <div className="toc-preview-section">{children}</div>
      </s-section>
    </div>
  );
}

type PreviewPanelHeaderProps = {
  action?: ReactNode;
  children: ReactNode;
};

function PreviewPanelHeader({ action, children }: PreviewPanelHeaderProps) {
  return (
    <div className="toc-preview-header">
      <div className="toc-preview-header-top">
        <div className="toc-preview-header-left">{children}</div>
        {action ? <div className="toc-preview-header-action">{action}</div> : null}
      </div>
    </div>
  );
}

function PreviewPanelTitle() {
  return <h2 className="toc-preview-heading">Preview</h2>;
}

type PreviewPanelDeviceToggleProps = {
  value: DeviceTab;
  onChange: (device: DeviceTab) => void;
};

function PreviewPanelDeviceToggle({
  value,
  onChange,
}: PreviewPanelDeviceToggleProps) {
  const desktopChipRef =
    useRef<HTMLElementTagNameMap["s-clickable-chip"] | null>(null);
  const mobileChipRef =
    useRef<HTMLElementTagNameMap["s-clickable-chip"] | null>(null);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      [desktopChipRef.current, mobileChipRef.current].forEach((chip) => {
        const clickableChip = chip?.shadowRoot?.querySelector<HTMLElement>(
          ".clickable-chip",
        );

        if (!clickableChip) {
          return;
        }

        clickableChip.style.paddingBlock = "2px";
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="toc-preview-device-toggle">
      <s-stack direction="inline" gap="small-500">
        <s-clickable-chip
          id="toc-preview-device-chip-desktop"
          ref={desktopChipRef}
          accessibilityLabel="Show desktop preview"
          color={value === "desktop" ? "strong" : "subdued"}
          onClick={() => onChange("desktop")}
        >
          <s-icon type="desktop"></s-icon>
        </s-clickable-chip>
        <s-clickable-chip
          id="toc-preview-device-chip-mobile"
          ref={mobileChipRef}
          accessibilityLabel="Show mobile preview"
          color={value === "mobile" ? "strong" : "subdued"}
          onClick={() => onChange("mobile")}
        >
          <s-icon type="mobile"></s-icon>
        </s-clickable-chip>
      </s-stack>
    </div>
  );
}

function PreviewPanelReplayAction({ onReplay }: { onReplay: () => void }) {
  return (
    <s-clickable-chip
      accessibilityLabel="Replay preview animation"
      onClick={onReplay}
    >
      <s-icon slot="graphic" type="play-circle"></s-icon>
      Play animation
    </s-clickable-chip>
  );
}

function PreviewPanelContent({ children }: { children: ReactNode }) {
  return <div className="toc-settings-preview">{children}</div>;
}

function PreviewPanelPane({ children }: { children: ReactNode }) {
  return <div className="toc-preview-pane">{children}</div>;
}

export const PreviewPanel = {
  Content: PreviewPanelContent,
  DeviceToggle: PreviewPanelDeviceToggle,
  Frame: PreviewPanelFrame,
  Header: PreviewPanelHeader,
  Pane: PreviewPanelPane,
  ReplayAction: PreviewPanelReplayAction,
  Title: PreviewPanelTitle,
};
