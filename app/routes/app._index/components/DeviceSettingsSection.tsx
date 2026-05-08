import type { ReactNode } from "react";

import type { SectionIcon } from "../lib/types";

export function TocSectionHeading({
  icon,
  label,
}: {
  icon: SectionIcon;
  label: string;
}) {
  return (
    <div className="toc-section-heading">
      <s-icon type={icon}></s-icon>
      <span className="toc-section-heading__label">{label}</span>
    </div>
  );
}

type DeviceSettingsSectionFrameProps = {
  label: string;
  icon: SectionIcon;
  sectionRef?: (node: HTMLDivElement | null) => void;
  onEdit: () => void;
  action?: ReactNode;
  children: ReactNode;
};

function DeviceSettingsSectionFrame({
  label,
  icon,
  sectionRef,
  onEdit,
  action,
  children,
}: DeviceSettingsSectionFrameProps) {
  return (
    <div
      ref={sectionRef}
      className="toc-device-section"
      onInputCapture={onEdit}
      onChangeCapture={onEdit}
    >
      <div className="toc-device-section__chip" hidden={!action}>
        {action}
      </div>
      <s-section>
        <TocSectionHeading icon={icon} label={label} />
        {children}
      </s-section>
    </div>
  );
}

type DeviceSettingsSectionProps = Omit<
  DeviceSettingsSectionFrameProps,
  "action"
>;

type SyncableDeviceSettingsSectionProps = DeviceSettingsSectionProps & {
  targetLabel: string;
  onApply: () => void;
};

function StaticDeviceSettingsSection(props: DeviceSettingsSectionProps) {
  return <DeviceSettingsSectionFrame {...props} />;
}

function AppliedDeviceSettingsSection(props: DeviceSettingsSectionProps) {
  return (
    <DeviceSettingsSectionFrame
      {...props}
      action={
        <s-badge tone="success" icon="check-circle">
          Applied
        </s-badge>
      }
    />
  );
}

function SyncableDeviceSettingsSection({
  targetLabel,
  onApply,
  ...props
}: SyncableDeviceSettingsSectionProps) {
  return (
    <DeviceSettingsSectionFrame
      {...props}
      action={
        <s-clickable-chip
          color="strong"
          accessibilityLabel={`Apply this section to ${targetLabel}`}
          onClick={onApply}
        >
          Apply to {targetLabel}
        </s-clickable-chip>
      }
    />
  );
}

export const DeviceSettingsSection = {
  Section: DeviceSettingsSectionFrame,
  Static: StaticDeviceSettingsSection,
  Applied: AppliedDeviceSettingsSection,
  Syncable: SyncableDeviceSettingsSection,
};
