import {
  getPreviewPlacementClass,
  getPreviewPlacementStyle,
} from "../lib/preview-style";
import { type TocPreviewState } from "../lib/preview-data";
import type {
  DeviceTab,
  TocDeviceConfig,
  TocMarkerFormat,
  TocTextAlignment,
} from "../lib/types";
import { TocPreviewNav } from "./TocPreview/TocPreviewNav";
import { useTocPreviewController } from "./TocPreview/useTocPreviewController";

type TocPreviewVariantProps = {
  desktopDevice: TocDeviceConfig;
  indentation: boolean;
  markerFormat: TocMarkerFormat;
  mobileDevice: TocDeviceConfig;
  preview: TocPreviewState;
  replayToken: number;
  textAlignment: TocTextAlignment;
};

type TocPreviewFrameProps = TocPreviewVariantProps & {
  previewDevice: DeviceTab;
};

function TocPreviewFrame({
  desktopDevice,
  indentation,
  markerFormat,
  mobileDevice,
  preview,
  previewDevice,
  replayToken,
  textAlignment,
}: TocPreviewFrameProps) {
  const device = previewDevice === "desktop" ? desktopDevice : mobileDevice;
  const controller = useTocPreviewController({
    device,
    indentation,
    markerFormat,
    preview,
    previewDevice,
    replayToken,
    textAlignment,
  });

  if (!preview.showToc) {
    return null;
  }

  return (
    <div className="toc-preview-shell">
      <div
        className={getPreviewPlacementClass(previewDevice, device)}
        style={getPreviewPlacementStyle(previewDevice, device)}
      >
        <TocPreviewNav
          device={device}
          indentation={indentation}
          markerFormat={markerFormat}
          preview={preview}
          previewDevice={previewDevice}
          textAlignment={textAlignment}
          {...controller}
        />
      </div>
    </div>
  );
}

function DesktopTocPreview(props: TocPreviewVariantProps) {
  return <TocPreviewFrame {...props} previewDevice="desktop" />;
}

function MobileTocPreview(props: TocPreviewVariantProps) {
  return <TocPreviewFrame {...props} previewDevice="mobile" />;
}

export const TocPreview = {
  Desktop: DesktopTocPreview,
  Mobile: MobileTocPreview,
};
