import { Component, For } from "solid-js";
import { FormField, Input, Chip, TextArea } from "coles-solid-library";
import { Chat } from "coles-solid-library/icons";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const LanguageSection: Component<Props> = (p) => {
  const { form } = p.api;
  const fixed = () => form.getR("langFixed") as string[];
  const options = () => form.getR("langOptions") as string[];
  return (
    <FlatCard icon={Chat} headerName="languages" transparent>
      <div class="inlineRow inlineDense" style={{ "margin-top": ".25rem" }}>
        <FormField name="Add Lang">
          <Input
            transparent
            value=""
            placeholder="e.g. Common"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget as HTMLInputElement).value.trim();
                if (v && !fixed().includes(v)) {
                  form.set("langFixed", [...fixed(), v]);
                  (e.currentTarget as HTMLInputElement).value = "";
                }
              }
            }}
          />
        </FormField>
        <FormField name="Choice Amt">
          <Input
            type="number"
            min={0}
            transparent
            style={{ width: "70px" }}
            value={form.getR("langAmount") as number}
            onChange={(e) =>
              form.set("langAmount", parseInt(e.currentTarget.value || "0"))
            }
          />
        </FormField>
        <FormField name="Choice Opt">
          <Input
            transparent
            value=""
            placeholder="Optional Lang"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget as HTMLInputElement).value.trim();
                if (!v) return;
                form.set(
                  "langOptions",
                  Array.from(new Set([...options(), v]))
                );
                (e.currentTarget as HTMLInputElement).value = "";
              }
            }}
          />
        </FormField>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <For each={fixed()}>
          {(l) => (
            <Chip
              value={l}
              remove={() => form.set("langFixed", fixed().filter((x) => x !== l))}
            />
          )}
        </For>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <For each={options()}>
          {(l) => (
            <Chip
              value={l}
              remove={() =>
                form.set("langOptions", options().filter((o) => o !== l))
              }
            />
          )}
        </For>
      </div>
      <FormField name="Language Description">
        <TextArea
          transparent
          rows={2}
          text={() => form.getR("langDesc") as string}
          setText={((v: string | ((prev: string) => string)) =>
            form.set(
              "langDesc",
              typeof v === "function" ? v(form.getR("langDesc") as string) : v
            )) as any
          }
        />
      </FormField>
    </FlatCard>
  );
};
