import { Component, Show, onMount, createEffect, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Button, Body, FormField, Input, TextArea } from "coles-solid-library";
import { useFeatsForm } from "./useHomeFeats";
import { PrerequisiteSelector } from "./PrerequisiteSelector";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";
import styles from "./feats.module.scss";

const Feats: Component = () => {
  const [searchParams] = useSearchParams();
  const store = useFeatsForm();

  onMount(() => {
    document.body.classList.add('feats-bg');
  });

  createEffect(() => {
    const name = typeof searchParams.name === "string"
      ? searchParams.name
      : searchParams.name?.join(" ");
    if (name) store.prefillFromQuery(name);
  });

  onCleanup(() => {
    document.body.classList.remove('feats-bg');
  });

  const handleFill = () => {
    const chosen = store.findFeatByName(store.featName());
    if (chosen) store.fillFromFeat(chosen);
  };

  return (
    <Body class={`${styles.body}`}>
      <h1>Feats</h1>
      <div class="featHomebrew">
        <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} transparent>
          <div class={`${styles.name}`}>
            <h2>Add Name</h2>
            <FormField name="Add Name">
              <Input
                type="text"
                transparent
                id="featName"
                value={store.featName()}
                onChange={(e) => store.setFeatName(e.currentTarget.value)}
                onInput={(e) => store.setFeatName((e.target as HTMLInputElement).value)}
              />
            </FormField>
            <Show when={store.featExists()}>
              <Button onClick={handleFill}>Fill</Button>
            </Show>
          </div>
        </FlatCard>
        <FlatCard icon="deployed_code" headerName="Prerequisites" startOpen transparent>
          <PrerequisiteSelector store={store} />
        </FlatCard>
        <FlatCard icon="equalizer" headerName="Description" startOpen transparent>
          <div class={`${styles.Description}`}>
            <h2>Description</h2>
            <FormField name="Description">
              <TextArea
                id="featDescription"
                name="featDescription"
                text={store.featDescription}
                setText={store.setFeatDescription}
                transparent
              />
            </FormField>
          </div>
        </FlatCard>
        <FlatCard icon="save" headerName="Saving" alwaysOpen transparent>
          <Show when={!store.featExists()}>
            <Button
              disabled={!store.isValid()}
              class={`${styles.addButton}`}
              onClick={store.saveFeat}
            >
              Save Feat
            </Button>
          </Show>
          <Show when={store.featExists()}>
            <Button
              disabled={!store.isValid()}
              class={`${styles.addButton}`}
              onClick={store.updateFeat}
            >
              Update Feat
            </Button>
          </Show>
        </FlatCard>
      </div>
    </Body>
  );
};

export default Feats;
