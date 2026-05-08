import {
  getAppEmbedBadgeIcon,
  getAppEmbedBadgeTone,
  getAppEmbedButtonLabel,
  getAppEmbedButtonTone,
  getAppEmbedButtonVariant,
  formatAppEmbedStatus,
} from "../lib/appEmbed";
import { getDeviceLabel } from "../lib/config";
import { EDITOR_TABS } from "../lib/constants";
import type {
  AppEmbedStatus,
  DeviceTab,
  EditorTab,
  SectionNavItem,
  SectionNavKey,
} from "../lib/types";

type EditorToolbarProps = {
  activeDevice: DeviceTab | null;
  activeSectionNavItems: Array<SectionNavItem<SectionNavKey>>;
  activeTab: EditorTab;
  appEmbedStatus: AppEmbedStatus;
  deepLink: string | null;
  onTabChange: (tab: EditorTab) => void;
  onScrollToSection: (section: SectionNavKey) => void;
};

export function EditorToolbar({
  activeDevice,
  activeSectionNavItems,
  activeTab,
  appEmbedStatus,
  deepLink,
  onScrollToSection,
  onTabChange,
}: EditorToolbarProps) {
  return (
    <div className="toc-tab-group">
      <div className="toc-top-row">
        <ul className="toc-segmented-control" aria-label="Settings view">
          {EDITOR_TABS.map((tab) => (
            <li key={tab.id} className="toc-segmented-item">
              <button
                type="button"
                className="toc-segmented-button"
                aria-current={activeTab === tab.id ? "true" : "false"}
                onClick={() => onTabChange(tab.id)}
              >
                <s-icon type={tab.icon}></s-icon>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="toc-embed-actions">
          <s-badge
            tone={getAppEmbedBadgeTone(appEmbedStatus)}
            icon={getAppEmbedBadgeIcon(appEmbedStatus)}
          >
            {formatAppEmbedStatus(appEmbedStatus)}
          </s-badge>
          {deepLink ? (
            <s-button
              href={deepLink}
              target="_blank"
              variant={getAppEmbedButtonVariant(appEmbedStatus)}
              tone={getAppEmbedButtonTone()}
            >
              {getAppEmbedButtonLabel(appEmbedStatus)}
            </s-button>
          ) : null}
        </div>
      </div>
      {activeSectionNavItems.length ? (
        <nav
          className="toc-section-nav"
          aria-label={
            activeTab === "general"
              ? "General section navigation"
              : activeDevice
                ? `${getDeviceLabel(activeDevice)} section navigation`
                : "Section navigation"
          }
        >
          <ul className="toc-section-nav__list">
            {activeSectionNavItems.map((section) => (
              <li key={section.key} className="toc-section-nav__item">
                <s-clickable-chip
                  accessibilityLabel={`Scroll to ${section.label}`}
                  onClick={() => onScrollToSection(section.key)}
                >
                  <s-icon slot="graphic" type={section.icon}></s-icon>
                  {section.label}
                </s-clickable-chip>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
