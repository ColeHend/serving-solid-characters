import { Component, For } from "solid-js";
import { FormField, Input, Chip, TextArea } from "coles-solid-library";
import styles from "./subraces.module.scss";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const LanguageSection: Component<Props> = (p) => {
  const {
    draft,
    addLanguageFixed,
    removeLanguageFixed,
    setLanguageChoice,
    removeLanguageOption,
    setLangDesc,
    collapsed,
    toggle,
  } = p.api;
  return (
    <FlatCard icon="chat" headerName="languages">
      <div class="inlineRow inlineDense" style={{ "margin-top": ".25rem" }}>
        <FormField name="Add Lang">
          <Input
            transparent
            value=""
            placeholder="e.g. Common"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = (e.currentTarget as HTMLInputElement).value.trim();
                if (v) {
                  addLanguageFixed(v);
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
            value={draft()!.languages.amount}
            onInput={(e) =>
              setLanguageChoice(
                parseInt(e.currentTarget.value || "0"),
                draft()!.languages.options
              )
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
                const opts = Array.from(
                  new Set([...draft()!.languages.options, v])
                );
                setLanguageChoice(draft()!.languages.amount, opts);
                (e.currentTarget as HTMLInputElement).value = "";
              }
            }}
          />
        </FormField>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <For each={draft()!.languages.fixed}>
          {(l) => <Chip value={l} remove={() => removeLanguageFixed(l)} />}
        </For>
      </div>
      <div class="chipsRowSingle" style={{ "margin-top": ".25rem" }}>
        <For each={draft()!.languages.options}>
          {(l) => <Chip value={l} remove={() => removeLanguageOption(l)} />}
        </For>
      </div>
      <FormField name="Language Description">
        <TextArea
          transparent
          rows={2}
          text={() => draft()!.languages.desc}
          setText={(v) =>
            setLangDesc(
              typeof v === "function" ? v(draft()!.languages.desc) : v
            )
          }
        />
      </FormField>
    </FlatCard>
  );
};
