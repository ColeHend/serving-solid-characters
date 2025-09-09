import { Component, For, Show } from "solid-js";
import { FormField, Input, Button, Chip, TextArea } from "coles-solid-library";
import styles from "./subraces.module.scss";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const TraitsSection: Component<Props> = (p) => {
  const {
    draft,
    addTrait,
    removeTrait,
    updateTraitText,
    editingTrait,
    setEditingTrait,
    collapsed,
    toggle,
  } = p.api;
  return <FlatCard icon="star" headerName="Traits">
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
                  addTrait(v, "");
                  (e.currentTarget as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </FormField>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <Show when={draft()!.traits.length} fallback={<Chip value="None" />}>
          {" "}
          <For each={draft()!.traits}>
            {(t) => (
              <span
                style={{ display: "inline-flex", "align-items": "stretch" }}
              >
                <Button
                  onClick={() => setEditingTrait(t.name)}
                  style={{ padding: 0 }}
                >
                  <Chip value={t.name} remove={() => removeTrait(t.name)} />
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
              text={() =>
                draft()!
                  .traits.find((t) => t.name === editingTrait())
                  ?.value.join("\n") || ""
              }
              setText={(v) => {
                const txt =
                  typeof v === "function"
                    ? v(
                        draft()!
                          .traits.find((t) => t.name === editingTrait())
                          ?.value.join("\n") || ""
                      )
                    : v;
                updateTraitText(editingTrait()!, txt);
              }}
            />
          </FormField>
          <div class="inlineRow" style={{ "margin-top": ".35rem" }}>
            <Button onClick={() => setEditingTrait(null)}>Done</Button>
          </div>
        </div>
      </Show>
  </FlatCard>
};
