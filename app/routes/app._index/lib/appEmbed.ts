import type {
  AppBridgeExtensionRecord,
  AppEmbedStatus,
  ThemeExtensionActivationRecord,
} from "./types";

export function formatAppEmbedStatus(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "Activated";
    case "inactive":
      return "Not activated";
    case "checking":
      return "Checking...";
    default:
      return "Unavailable";
  }
}

export function getAppEmbedBadgeTone(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "caution";
    case "checking":
      return "info";
    default:
      return "warning";
  }
}

export function getAppEmbedBadgeIcon(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "check-circle";
    case "checking":
      return "clock";
    case "inactive":
      return "alert-triangle";
    default:
      return "alert-triangle";
  }
}

export function getAppEmbedButtonLabel(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "Manage status";
    case "inactive":
      return "Activate";
    case "checking":
      return "Open theme editor";
    default:
      return "Open theme editor";
  }
}

export function getAppEmbedButtonVariant(status: AppEmbedStatus) {
  switch (status) {
    case "active":
      return "secondary";
    case "inactive":
      return "primary";
    default:
      return "secondary";
  }
}

export function getAppEmbedButtonTone(): "auto" {
  return "auto";
}

export function getAppEmbedRecord(
  extensions: AppBridgeExtensionRecord[],
  appEmbedHandle: string,
): AppEmbedStatus | null {
  for (const extension of extensions) {
    const nestedActivation = extension.activations?.find((activation) => {
      const record = activation as ThemeExtensionActivationRecord;
      return record.handle === appEmbedHandle;
    }) as ThemeExtensionActivationRecord | undefined;

    if (!nestedActivation) {
      if (extension.handle === appEmbedHandle) {
        return extension.activations?.length ? "active" : "inactive";
      }

      continue;
    }

    if (
      nestedActivation.status === "active" ||
      (nestedActivation.activations?.length ?? 0) > 0
    ) {
      return "active";
    }

    if (
      nestedActivation.status === "available" ||
      nestedActivation.status === "unavailable"
    ) {
      return "inactive";
    }

    return "inactive";
  }

  return null;
}
