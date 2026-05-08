import type { TocDeviceConfig } from "../lib/types";

type HiddenDeviceFieldsProps = {
  config: TocDeviceConfig;
  prefix: "desktop" | "mobile";
};

export function HiddenDeviceFields({
  prefix,
  config,
}: HiddenDeviceFieldsProps) {
  return (
    <>
      <input type="hidden" name={`${prefix}Position`} value={config.position} />
      <input
        type="hidden"
        name={`${prefix}PositionSelector`}
        value={config.positionSelector}
      />
      <input
        type="hidden"
        name={`${prefix}SwitchToMobileOnFloatOverflow`}
        value={config.switchToMobileOnFloatOverflow ? "on" : ""}
      />
      <input type="hidden" name={`${prefix}BorderColor`} value={config.color} />
      <input type="hidden" name={`${prefix}BorderWidth`} value={config.width} />
      <input type="hidden" name={`${prefix}BorderRadius`} value={config.radius} />
      <input
        type="hidden"
        name={`${prefix}ShadowPreset`}
        value={config.shadowPreset}
      />
      <input
        type="hidden"
        name={`${prefix}ShadowColor`}
        value={config.shadowColor}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingTop`}
        value={config.paddingTop}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingBottom`}
        value={config.paddingBottom}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingLeft`}
        value={config.paddingLeft}
      />
      <input
        type="hidden"
        name={`${prefix}PaddingRight`}
        value={config.paddingRight}
      />
      <input type="hidden" name={`${prefix}OffsetTop`} value={config.offsetTop} />
      <input
        type="hidden"
        name={`${prefix}OffsetBottom`}
        value={config.offsetBottom}
      />
      <input type="hidden" name={`${prefix}OffsetLeft`} value={config.offsetLeft} />
      <input
        type="hidden"
        name={`${prefix}OffsetRight`}
        value={config.offsetRight}
      />
      <input
        type="hidden"
        name={`${prefix}Background`}
        value={config.background}
      />
      <input type="hidden" name={`${prefix}MaxWidth`} value={config.maxWidth} />
      {config.smoothScroll ? (
        <input type="hidden" name={`${prefix}SmoothScroll`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}ScrollOffset`}
        value={config.scrollOffset}
      />
      {config.showTitle ? (
        <input type="hidden" name={`${prefix}ShowTitle`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}HeadingsFontSize`}
        value={config.headingsFontSize}
      />
      <input
        type="hidden"
        name={`${prefix}HeadingsFontColor`}
        value={config.headingsFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}HeadingsFontWeight`}
        value={config.headingsFontWeight}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontSize`}
        value={config.titleFontSize}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontColor`}
        value={config.titleFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}TitleFontWeight`}
        value={config.titleFontWeight}
      />
      {config.showButton ? (
        <input type="hidden" name={`${prefix}ShowButton`} value="on" />
      ) : null}
      <input
        type="hidden"
        name={`${prefix}ShowButtonHeight`}
        value={config.showButtonHeight}
      />
      <input
        type="hidden"
        name={`${prefix}ShowMoreButtonText`}
        value={config.showMoreButtonText}
      />
      <input
        type="hidden"
        name={`${prefix}ShowLessButtonText`}
        value={config.showLessButtonText}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontSize`}
        value={config.showButtonFontSize}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontColor`}
        value={config.showButtonFontColor}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonFontWeight`}
        value={config.showButtonFontWeight}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderColor`}
        value={config.showButtonBorderColor}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderWidth`}
        value={config.showButtonBorderWidth}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonBorderRadius`}
        value={config.showButtonBorderRadius}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonPaddingTop`}
        value={config.showButtonPaddingTop}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonPaddingBottom`}
        value={config.showButtonPaddingBottom}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonPaddingLeft`}
        value={config.showButtonPaddingLeft}
      />
      <input
        type="hidden"
        name={`${prefix}ShowButtonPaddingRight`}
        value={config.showButtonPaddingRight}
      />
      <input
        type="hidden"
        name={`${prefix}AnimationType`}
        value={config.animationType}
      />
      <input
        type="hidden"
        name={`${prefix}FollowingMarkerWidth`}
        value={config.followingMarkerWidth}
      />
      <input
        type="hidden"
        name={`${prefix}FollowingMarkerHeight`}
        value={config.followingMarkerHeight}
      />
      <input
        type="hidden"
        name={`${prefix}FollowingMarkerColor`}
        value={config.followingMarkerColor}
      />
      <input
        type="hidden"
        name={`${prefix}FollowingMarkerOffset`}
        value={config.followingMarkerOffset}
      />
      <input
        type="hidden"
        name={`${prefix}FollowingMarkerBorderRadius`}
        value={config.followingMarkerBorderRadius}
      />
      <input
        type="hidden"
        name={`${prefix}CrawlingSnakeWidth`}
        value={config.crawlingSnakeWidth}
      />
      <input
        type="hidden"
        name={`${prefix}CrawlingSnakeHeight`}
        value={config.crawlingSnakeHeight}
      />
      <input
        type="hidden"
        name={`${prefix}CrawlingSnakeColor`}
        value={config.crawlingSnakeColor}
      />
      <input
        type="hidden"
        name={`${prefix}CrawlingSnakeOffset`}
        value={config.crawlingSnakeOffset}
      />
      <input
        type="hidden"
        name={`${prefix}JumpingMarkerWidth`}
        value={config.jumpingMarkerWidth}
      />
      <input
        type="hidden"
        name={`${prefix}JumpingMarkerHeight`}
        value={config.jumpingMarkerHeight}
      />
      <input
        type="hidden"
        name={`${prefix}JumpingMarkerColor`}
        value={config.jumpingMarkerColor}
      />
      <input
        type="hidden"
        name={`${prefix}JumpingMarkerOffset`}
        value={config.jumpingMarkerOffset}
      />
      <input
        type="hidden"
        name={`${prefix}JumpingMarkerBorderRadius`}
        value={config.jumpingMarkerBorderRadius}
      />
    </>
  );
}
