import { Component, For, Show } from "solid-js";
import { FormField, Input, Button, Chip, TextArea } from "coles-solid-library";
import { Star } from "coles-solid-library/icons";
import { SubraceEditorApi } from "./useSubraceEditor";
import { makeTraitRow } from "../shared/raceLikeForm.shared";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const TraitsSection: Component<Props> = (p) => {
  const { traits, editingTrait, setEditingTrait } = p.api;
  const editingIndex = () =>
    traits.get().findIndex((t) => t.name === editingTrait());
  const editingBody = () => {
    const i = editingIndex();
    return i > -1 ? traits.get()[i].body : "";
  };
  const setEditingBody = (txt: string) => {
    const i = editingIndex();
    if (i > -1) traits.getGroup(i)?.set("body", txt);
  };
  const addTrait = (name: string) => {
    if (
      !name.trim() ||
      traits.get().some((t) => t.name.toLowerCase() === name.toLowerCase())
    )
      return;
    traits.add(makeTraitRow(name.trim(), ""));
  };
  const removeTrait = (index: number, name: string) => {
    traits.remove(index);
    if (editingTrait() === name) setEditingTrait(null);
  };
  return <FlatCard icon={Star} headerName="Traits" transparent>
      <div class="inlineRow inlineDense" style={{ "margin-top": ".25rem" }}>
        <FormField name="Trait Name">
          <Input
            transparent
            value=""
            placeholder="Trait name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget as HTMLInputElement).value.trim();
                if (v) {
                  addTrait(v);
                  (e.currentTarget as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </FormField>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <Show when={traits.get().length} fallback={<Chip value="None" />}>
          {" "}
          <For each={traits.get()}>
            {(t, i) => (
              <span
                style={{ display: "inline-flex", "align-items": "stretch" }}
              >
                <Button
                  onClick={() => setEditingTrait(t.name)}
                  style={{ padding: 0 }}
                >
                  <Chip value={t.name} remove={() => removeTrait(i(), t.name)} />
                </Button>
              </span>
            )}
          </For>
        </Show>
      </div>
      <Show when={editingTrait()}>
        <div style={{ "margin-top": ".5rem" }}>
          <FormField name={`Editing: ${editingTrait()}`}>
            <TextArea
              rows={4}
              transparent
              text={editingBody}
              setText={((v: string | ((prev: string) => string)) =>
                setEditingBody(
                  typeof v === "function" ? v(editingBody()) : v
                )) as any
              }
            />
          </FormField>
          <div class="inlineRow" style={{ "margin-top": ".35rem" }}>
            <Button onClick={() => setEditingTrait(null)}>Done</Button>
          </div>
        </div>
      </Show>
  </FlatCard>
};
