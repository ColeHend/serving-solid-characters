import { Component, Show } from "solid-js";
import { Button } from "coles-solid-library";
import styles from "./subraces.module.scss";
import { SubraceEditorApi } from "./useSubraceEditor";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  api: SubraceEditorApi;
}
export const SaveSection: Component<Props> = (p) => {
  const { validationErrors, save, state, deleteCurrent } = p.api;

  return <FlatCard icon="save" headerName="Save" alwaysOpen transparent>
    <div class="inlineRow" style={{ "margin-top": ".5rem" }}>
        <Button disabled={!!validationErrors().length} onClick={save}>
          {state.editingExisting ? "Update Subrace" : "Create Subrace"}
        </Button>
        <Show when={state.editingExisting}>
          <Button onClick={deleteCurrent}>Delete</Button>
        </Show>
        <Show when={validationErrors().length}>
          <span style={{ color: "orangered", "font-size": ".8rem" }}>
            {validationErrors().join(" | ")}
          </span>
        </Show>
      </div>
  </FlatCard>
};