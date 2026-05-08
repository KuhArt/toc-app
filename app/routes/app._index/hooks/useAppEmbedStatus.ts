import { useEffect, useState } from "react";

import { getAppEmbedRecord } from "../lib/appEmbed";
import type {
  AppBridgeExtensionRecord,
  AppEmbedStatus,
} from "../lib/types";

type AppBridgeClient = {
  app: {
    extensions: () => Promise<unknown>;
  };
};

export function useAppEmbedStatus(
  shopify: AppBridgeClient,
  appEmbedHandle: string,
) {
  const [appEmbedStatus, setAppEmbedStatus] =
    useState<AppEmbedStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const refreshAppEmbedStatus = async (showLoadingState = false) => {
      if (showLoadingState) {
        setAppEmbedStatus("checking");
      }

      try {
        const extensions = await shopify.app.extensions();

        if (cancelled) {
          return;
        }

        const appEmbed = getAppEmbedRecord(
          extensions as AppBridgeExtensionRecord[],
          appEmbedHandle,
        );

        setAppEmbedStatus(appEmbed ?? "unavailable");
      } catch {
        if (!cancelled) {
          setAppEmbedStatus("unavailable");
        }
      }
    };

    const handleWindowFocus = () => {
      void refreshAppEmbedStatus();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAppEmbedStatus();
      }
    };

    void refreshAppEmbedStatus(true);

    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("pageshow", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("pageshow", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [appEmbedHandle, shopify]);

  return appEmbedStatus;
}
