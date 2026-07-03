import { Component, For, runWithOwner } from "solid-js";
import { FormField, Select, Option, Chip, Input } from "coles-solid-library";
import { ElectricBolt } from "coles-solid-library/icons";
import { SubraceEditorApi } from "./useSubraceEditor";
import { makeAbilityRow } from "../shared/raceLikeForm.shared";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const AbilitySection: Component<Props> = (p) => {
  const { abilityBonuses, ABILITIES } = p.api;
  return (
    <FlatCard icon={ElectricBolt} headerName="Ability Bonus" transparent>
      <div class="inlineRow inlineDense" style={{ "margin-top": ".25rem" }}>
        <FormField name="Ability">
          {/* The library Select delivers picks via onChange fired from a
              TRACKED internal effect (inside a FormField, onSelect never
              fires on click). runWithOwner(null) detaches the handler from
              that effect: without it the effect tracks abilityBonuses via
              the guard's .get() — removing a chip re-fired the echo and
              resurrected the row — and owns (then disposes) the FormGroups
              created here. */}
          <Select
            transparent
            value=""
            onChange={(v) => {
              if (!v) return;
              runWithOwner(null, () => {
                if (abilityBonuses.get().some((b) => b.name === v)) return;
                abilityBonuses.add(makeAbilityRow(v, 1));
              });
            }}
          >
            <Option value="">-- ability --</Option>
            <For
              each={ABILITIES.filter(
                (a) => !abilityBonuses.get().some((b) => b.name === a)
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
        {/* Iterate the stable FormGroup rows (not .get() clones) so editing a
            value doesn't recreate the row and drop input focus. */}
        <For each={abilityBonuses.getGroups()}>
          {(row, i) => (
            <span
              style={{
                display: "inline-flex",
                "align-items": "center",
                gap: ".25rem",
              }}
            >
              <Chip
                value={`${row.getR("name")}+${row.getR("value")}`}
                remove={() => abilityBonuses.remove(i())}
              />
              <Input
                type="number"
                min={1}
                max={4}
                transparent
                style={{ width: "60px" }}
                value={row.getR("value") as number}
                onChange={(e) => {
                  const v = parseInt(e.currentTarget.value || "0");
                  if (v > 0) row.set("value", v);
                }}
              />
            </span>
          )}
        </For>
      </div>
    </FlatCard>
  );
};
