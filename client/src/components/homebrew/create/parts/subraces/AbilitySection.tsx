import { Component, For } from "solid-js";
import { FormField, Select, Option, Chip, Input } from "coles-solid-library";
import styles from "./subraces.module.scss";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const AbilitySection: Component<Props> = (p) => {
  const {
    draft,
    addAbility,
    removeAbility,
    setAbilityValue,
    ABILITIES,
    collapsed,
    toggle,
  } = p.api;
  return (
    <FlatCard icon="equalizer" headerName="Ability Bonus">
      <div class="inlineRow inlineDense" style={{ "margin-top": ".25rem" }}>
        <FormField name="Ability">
          <Select
            transparent
            value=""
            onChange={(v) => {
              if (!v) return;
              addAbility(v, 1);
            }}
          >
            <Option value="">-- ability --</Option>
            <For
              each={ABILITIES.filter(
                (a) => !draft()!.abilityBonuses.some((b) => b.name === a)
              )}
            >
              {(a) => <Option value={a}>{a}</Option>}
            </For>
          </Select>
        </FormField>
      </div>
      <div
        class="chipsRowSingle"
        style={{ "align-items": "center", gap: ".35rem" }}
      >
        <For each={draft()!.abilityBonuses}>
          {(b) => (
            <span
              style={{
                display: "inline-flex",
                "align-items": "center",
                gap: ".25rem",
              }}
            >
              <Chip
                value={`${b.name}+${b.value}`}
                remove={() => removeAbility(b.name)}
              />
              <Input
                type="number"
                min={1}
                max={4}
                transparent
                style={{ width: "60px" }}
                value={b.value}
                onInput={(e) => {
                  const v = parseInt(e.currentTarget.value || "0");
                  if (v > 0) setAbilityValue(b.name, v);
                }}
              />
            </span>
          )}
        </For>
      </div>
    </FlatCard>
  );
};
