import { Accessor, Component, For, Setter, Show, createMemo, createSignal } from "solid-js";
import { Button, Input, Modal, Option, Select } from "coles-solid-library";
import { Spell } from "../../../../../models/generated";
import { isOffList, spellFlavor } from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { useCreate } from "../../state/createContext";
import { spellLevelLabel } from "./spellsSection";
import styles from "./spellsSection.module.scss";

interface GrimoireModalProps {
  show: [Accessor<boolean>, Setter<boolean>];
  /** Opens the spell detail dialog (rendered by the section so it stacks above this modal). */
  onView: (spell: Spell) => void;
}

const ALL_LEVELS = "All levels";
const ALL_SCHOOLS = "All schools";
const ANY_CLASS = "Any class";

export const GrimoireModal: Component<GrimoireModalProps> = (props) => {
  const { draft, actions, data } = useCreate();
  const [search, setSearch] = createSignal("");
  const [levelFilter, setLevelFilter] = createSignal(ALL_LEVELS);
  const [schoolFilter, setSchoolFilter] = createSignal(ALL_SCHOOLS);
  const [classFilter, setClassFilter] = createSignal(ANY_CLASS);

  const classNames = () => draft.classes.map((c) => c.name);

  const levels = createMemo(() => {
    const distinct = [...new Set(data.spells().map((spell) => `${spell.level}`))];
    return distinct.sort((a, b) => Number(a) - Number(b));
  });
  const schools = createMemo(() =>
    [...new Set(data.spells().map((spell) => spell.school).filter(Boolean))].sort());
  const spellClasses = createMemo(() =>
    [...new Set(data.spells().flatMap((spell) => spell.classes ?? []))].sort());

  const filtered = createMemo(() => {
    const query = search().trim().toLowerCase();
    return data
      .spells()
      .filter((spell) => {
        if (query && !spell.name.toLowerCase().includes(query)) return false;
        if (levelFilter() !== ALL_LEVELS && `${spell.level}` !== levelFilter()) return false;
        if (schoolFilter() !== ALL_SCHOOLS && spell.school !== schoolFilter()) return false;
        if (
          classFilter() !== ANY_CLASS &&
          !(spell.classes ?? []).some((c) => c.toLowerCase() === classFilter().toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => Number(a.level) - Number(b.level) || a.name.localeCompare(b.name));
  });

  const isKnown = (name: string) => draft.spells.includes(name);

  return (
    <Modal title="✦ The Grimoire" show={props.show} width="720px" height="80vh">
      <div class={styles.grimoire}>
        <div class={styles.grimoireFilters}>
          <Input
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search spells…"
          />
          <Select value={levelFilter()} onChange={(value: string) => setLevelFilter(value)}>
            <Option value={ALL_LEVELS}>{ALL_LEVELS}</Option>
            <For each={levels()}>
              {(level) => <Option value={level}>{spellLevelLabel(level)}</Option>}
            </For>
          </Select>
          <Select value={schoolFilter()} onChange={(value: string) => setSchoolFilter(value)}>
            <Option value={ALL_SCHOOLS}>{ALL_SCHOOLS}</Option>
            <For each={schools()}>{(school) => <Option value={school}>{school}</Option>}</For>
          </Select>
          <Select value={classFilter()} onChange={(value: string) => setClassFilter(value)}>
            <Option value={ANY_CLASS}>{ANY_CLASS}</Option>
            <For each={spellClasses()}>{(name) => <Option value={name}>{name}</Option>}</For>
          </Select>
        </div>

        <p class={styles.grimoireCount}>
          {filtered().length} spells — spells outside your class lists are marked ✦ and can be added freely.
        </p>

        <div class={styles.grimoireList}>
          <For each={filtered()}>
            {(spell) => (
              <div class={styles.grimoireRow}>
                <div class={styles.grimoireText}>
                  <span class={styles.grimoireName}>
                    {spell.name}
                    <Show when={isOffList(spell, classNames())}>
                      <span class={styles.offListMark}> ✦</span>
                    </Show>
                    <Show when={draft.edition === "both" && spell.legacy === true}>
                      <LegacyBadge />
                    </Show>
                    <InfoButton label={`View ${spell.name} details`} onClick={() => props.onView(spell)} />
                  </span>
                  <span class={styles.grimoireMeta}>
                    {[spell.school, spellLevelLabel(spell.level), (spell.classes ?? []).join(", ")]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <span class={styles.grimoireFlavor}>{spellFlavor(spell)}</span>
                <Show
                  when={isKnown(spell.name)}
                  fallback={<Button onClick={() => actions.addSpell(spell.name)}>Add</Button>}
                >
                  <Button transparent onClick={() => actions.removeSpell(spell.name)}>
                    ✓ Known
                  </Button>
                </Show>
              </div>
            )}
          </For>
        </div>
      </div>
    </Modal>
  );
};
