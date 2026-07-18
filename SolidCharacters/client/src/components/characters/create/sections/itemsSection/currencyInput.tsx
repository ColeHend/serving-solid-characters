import { Component } from "solid-js";
import { NumberInput } from "coles-solid-library";

interface CurrencyInputProps {
  value: number;
  onCommit: (value: number) => void;
  transparent?: boolean;
}

/**
 * Coin field that tolerates a blank box mid-edit: unparseable input is not committed
 * (so the field doesn't snap to 0 while typing) and blur restores the draft value.
 */
export const CurrencyInput: Component<CurrencyInputProps> = (props) => (
  <NumberInput
    value={props.value}
    min={0}
    transparent={props.transparent}
    onInput={(e) => {
      const parsed = parseInt(e.currentTarget.value, 10);
      if (!Number.isNaN(parsed)) props.onCommit(parsed);
    }}
    onBlur={(e) => {
      e.currentTarget.value = `${Math.max(0, props.value)}`;
    }}
  />
);
