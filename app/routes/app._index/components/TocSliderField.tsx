import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { RangeSlider } from "@shopify/polaris";

import type { TocSliderRange } from "../lib/types";

type TocSliderFieldProps = {
  name: string;
  label: string;
  value: string;
  range: TocSliderRange;
  details?: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
};

function parseIntegerInput(value: string) {
  return Number.parseInt(value, 10) || 0;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampSliderStringValue(value: string, range: TocSliderRange) {
  if (value === "") {
    return String(range.min);
  }

  const parsed = parseIntegerInput(value);
  return String(clampNumber(parsed, range.min, range.max));
}

export function TocSliderField({
  name,
  label,
  value,
  range,
  details,
  disabled = false,
  onValueChange,
}: TocSliderFieldProps) {
  const clampedValue = clampSliderStringValue(value, range);
  const deferredClampedValue = useDeferredValue(clampedValue);
  const numericValue = parseIntegerInput(clampedValue);
  const [inputValue, setInputValue] = useState(clampedValue);
  const isNumberFieldFocusedRef = useRef(false);

  useEffect(() => {
    if (clampedValue !== value) {
      onValueChange(clampedValue);
    }
  }, [clampedValue, onValueChange, value]);

  useEffect(() => {
    if (!isNumberFieldFocusedRef.current) {
      setInputValue(deferredClampedValue);
    }
  }, [deferredClampedValue]);

  const commitInputValue = useCallback(
    (nextValue: string) => {
      const normalized = clampSliderStringValue(nextValue, range);
      setInputValue(normalized);

      if (normalized !== clampedValue) {
        onValueChange(normalized);
      }
    },
    [clampedValue, onValueChange, range],
  );

  const supportsNegativeValues = range.min < 0;

  return (
    <div className="toc-slider-field">
      <div className="toc-slider-field__header">
        <div className="toc-slider-field__label">{label}</div>
      </div>
      <div className="toc-slider-field__row">
        <div className="toc-slider-field__range">
          <RangeSlider
            id={name}
            label={label}
            labelHidden
            min={range.min}
            max={range.max}
            step={range.step}
            value={numericValue}
            output
            disabled={disabled}
            onChange={(nextValue) => {
              if (Array.isArray(nextValue)) {
                return;
              }

              onValueChange(
                String(clampNumber(nextValue, range.min, range.max)),
              );
            }}
          />
        </div>
        <div className="toc-slider-field__value">
          <s-number-field
            label={`${label} value`}
            labelAccessibilityVisibility="exclusive"
            step={range.step}
            min={range.min}
            max={range.max}
            suffix={range.suffix}
            disabled={disabled}
            value={inputValue}
            onFocus={() => {
              isNumberFieldFocusedRef.current = true;
            }}
            onInput={(event) => {
              if (!isNumberFieldFocusedRef.current) {
                return;
              }

              const nextValue = event.currentTarget.value;

              if (
                nextValue === "" ||
                (supportsNegativeValues && nextValue === "-")
              ) {
                setInputValue(nextValue);
                return;
              }

              setInputValue(nextValue);
            }}
            onChange={(event) => {
              if (!isNumberFieldFocusedRef.current) {
                return;
              }

              commitInputValue(event.currentTarget.value);
            }}
            onBlur={(event) => {
              isNumberFieldFocusedRef.current = false;
              commitInputValue(event.currentTarget.value);
            }}
          ></s-number-field>
        </div>
      </div>
      {details ? <div className="toc-field-details">{details}</div> : null}
      <input type="hidden" name={name} value={clampedValue} />
    </div>
  );
}
