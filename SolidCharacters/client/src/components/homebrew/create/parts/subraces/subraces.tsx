import { Component, For, onCleanup, onMount, Show } from 'solid-js';
import { Body, Select, Option, FormField } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { useSubraceEditor } from './useSubraceEditor';
import { IdentitySection } from './IdentitySection';
import { AbilitySection } from './AbilitySection';
import { LanguageSection } from './LanguageSection';
import { TraitsSection } from './TraitsSection';
import { SaveSection } from './SaveSection';

const Subraces: Component = () => {
  const api = useSubraceEditor();
  const { parent, subraceName, parentNames, existingSubraceNames, selectParent, selectSubrace } = api;

  onMount(()=>{
    document.body.classList.add('race-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('race-bg');
  })

  return (
    <Body class={`${styles.body}`}>
      <h1>Subraces</h1>
      <div style={{ display: "flex", gap: "1rem", "flex-wrap": "wrap" }}>
        {/* selectParent/selectSubrace internally run untracked & unowned
            (runWithOwner(null)) because the library Select fires onChange
            from a tracked effect — see useSubraceEditor. */}
        <FormField name="Parent Race">
          <Select
            transparent
            value={parent() || ""}
            onChange={(v) => selectParent(v)}
          >
            <Option value="">-- choose --</Option>
            <For each={parentNames()}>
              {(n: string) => <Option value={n}>{n}</Option>}
            </For>
          </Select>
        </FormField>
        <Show when={parent()}>
          <FormField name="Existing Subraces">
            <Select
              transparent
              value={subraceName() || ""}
              onChange={(v) => selectSubrace(v)}
            >
              <Option value="">+ New Subrace</Option>
              <For each={existingSubraceNames()}>
                {(n: string) => <Option value={n}>{n}</Option>}
              </For>
            </Select>
          </FormField>
        </Show>
      </div>
      <Show
        when={api.draft()}
        fallback={<div>Select a parent race to begin.</div>}
      >
        <div class={styles.sectionList}>
          <IdentitySection api={api} />
          <AbilitySection api={api} />
          <LanguageSection api={api} />
          <TraitsSection api={api} />
          <SaveSection api={api} />
        </div>
      </Show>
    </Body>
  );
};

export default Subraces;
