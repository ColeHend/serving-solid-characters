import { Component, For, Show } from 'solid-js';
import { Body, Select, Option, FormField, Container } from 'coles-solid-library';
import styles from './subraces.module.scss';
import { useSubraceEditor } from './useSubraceEditor';
import { IdentitySection } from './IdentitySection';
import { AbilitySection } from './AbilitySection';
import { LanguageSection } from './LanguageSection';
import { TraitsSection } from './TraitsSection';
import { SaveSection } from './SaveSection';
import { homebrewManager } from '../../../../../shared';

const Subraces: Component = () => {
  const api = useSubraceEditor();
  const { parent, subraceName, parentNames, selectParent, selectSubrace } = api;

  // useSubraceEditor centralizes previous logic

  return (
    <Body>
      <h1>Subraces</h1>
      <Container theme="surface">
        <div style={{ display: "flex", gap: "1rem", "flex-wrap": "wrap" }}>
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
                <For
                  each={(
                    (
                      homebrewManager
                        .races()
                        .find((r) => r.name === parent()) as any
                    )?.subRaces || []
                  ).map((sr: any) => sr.name)}
                >
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
        <Show when={api.state.snackbar}><div class={styles.snackbar} data-type={api.state.snackbar!.type}>{api.state.snackbar!.msg}</div></Show>
      </Container>
    </Body>
  );
};

export default Subraces;
