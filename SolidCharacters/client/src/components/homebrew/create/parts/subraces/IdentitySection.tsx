import { Component, For, Show, runWithOwner } from "solid-js";
import {
  FormField,
  Input,
  Select,
  Option,
  Chip,
  TextArea,
} from "coles-solid-library";
import { IdentityPlatform } from "coles-solid-library/icons";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const IdentitySection: Component<Props> = (p) => {
  const { form, SIZE_TOKENS } = p.api;
  const sizes = () => form.getR("sizes") as string[];
  const addSize = (sz: string) => {
    if (!sz.trim() || sizes().includes(sz)) return;
    form.set("sizes", [...sizes(), sz]);
  };
  const removeSize = (sz: string) =>
    form.set("sizes", sizes().filter((s) => s !== sz));
  return <FlatCard icon={IdentityPlatform} headerName="Identity" startOpen={true} transparent>
      <div style={{
        display: "flex",
        "flex-direction": "row",
        "justify-content": "space-around",
        "margin-bottom": "10px",
      }}>
        <FormField name="Subrace Name">
          <Input
            transparent
            value={form.getR("name") as string}
            onChange={(e) => form.set("name", e.currentTarget.value)}
          />
        </FormField>
        <FormField name="Speed">
          <Input
            type="number"
            min={0}
            transparent
            style={{ width: "90px" }}
            value={form.getR("speed") as number}
            onChange={(e) =>
              form.set("speed", parseInt(e.currentTarget.value || "0"))
            }
          />
        </FormField>
      </div>
      <FormField name="Short Description">
        <TextArea
          transparent
          rows={2}
          text={() => form.getR("desc") as string}
          setText={((v: string | ((prev: string) => string)) =>
            form.set(
              "desc",
              typeof v === "function" ? v(form.getR("desc") as string) : v
            )) as any
          }
        />
      </FormField>
      <div class="inlineRow inlineDense">
        <FormField name="Add Size">
          {/* runWithOwner(null) — see AbilitySection: onChange is fired from a
              tracked library effect; untracked/unowned keeps removed sizes
              from being resurrected by echoes. */}
          <Select
            transparent
            value=""
            onChange={(v) => {
              if (v) runWithOwner(null, () => addSize(v));
            }}
          >
            <Option value="">-- size --</Option>
            <For each={SIZE_TOKENS.filter((s) => !sizes().includes(s))}>
              {(s) => <Option value={s}>{s}</Option>}
            </For>
          </Select>
        </FormField>
        <div class="chipsRowSingle" aria-label="Sizes">
          <Show when={sizes().length} fallback={<Chip value="None" />}>
            {" "}
            <For each={sizes()}>
              {(s) => <Chip value={s} remove={() => removeSize(s)} />}
            </For>
          </Show>
        </div>
      </div>
    </FlatCard>
};
