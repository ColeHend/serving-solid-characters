import { Accessor, Component, For, Show, createMemo } from "solid-js";
import { Button, Icon, Option, Select } from "coles-solid-library";
import { Star, StarFill, Bedtime } from "coles-solid-library/icons";
import { Character } from "../../../../models/character.model";
import { CreateSheetButton } from "../../createSheetButton";
import { SheetDerived } from "./useSheetDerived";
import { RechargeType, SHORT_REST, LONG_REST } from "../../../../shared/customHooks/mads/commands/useUsesFeature";
import styles from "./sheet.module.scss";

const titleCase = (s?: string): string => (s ?? "").replace(/\b\w/g, (m) => m.toUpperCase());

type Props = {
  currentCharacter: Accessor<Character | undefined>;
  characters: Accessor<Character[]>;
  setCurrentCharacter: (c: Character) => void;
  derived: Accessor<SheetDerived>;
  onToggleInspiration: () => void;
  onRest: (rest: RechargeType) => void;
};

const CharacterHeader: Component<Props> = (props) => {
  // "Bard (College of Lore) 5" — one segment per distinct class, multiclass-aware.
  const classText = createMemo(() => {
    const c = props.currentCharacter();
    if (!c) return "";
    const order: string[] = [];
    const byClass = new Map<string, { sub?: string; count: number }>();
    for (const lvl of c.levels ?? []) {
      const key = lvl.class || c.className || "";
      if (!byClass.has(key)) order.push(key);
      const entry = byClass.get(key) ?? { sub: undefined, count: 0 };
      entry.count += 1;
      if (lvl.subclass) entry.sub = lvl.subclass;
      byClass.set(key, entry);
    }
    if (order.length === 0) return c.className || "";
    return order
      .map((cls) => {
        const e = byClass.get(cls)!;
        return `${cls}${e.sub ? ` (${e.sub})` : ""} ${e.count}`;
      })
      .join(" / ");
  });

  const raceText = createMemo(() => {
    const r = props.currentCharacter()?.race;
    return [r?.subrace, r?.species].filter(Boolean).join(" ");
  });

  const fields = createMemo(() => [
    { label: "Class & Level", value: classText() },
    { label: "Background", value: props.currentCharacter()?.background ?? "" },
    { label: "Race", value: raceText() },
    { label: "Alignment", value: titleCase(props.currentCharacter()?.alignment) },
    { label: "Experience", value: "—" },
  ]);

  const inspired = () => props.currentCharacter()?.inspiration ?? false;

  return (
    <div class={styles.header}>
      <div class={styles.headerName}>
        <span class={styles.fieldLabel}>Character Name</span>
        <Select value={props.currentCharacter()} onChange={(c: Character) => props.setCurrentCharacter(c)}>
          <For each={props.characters()}>
            {(character) => <Option value={character}>{character.name}</Option>}
          </For>
        </Select>
      </div>

      <div class={styles.headerFields}>
        <For each={fields()}>
          {(field) => (
            <div class={styles.headerField}>
              <span class={styles.fieldValue}>{field.value || "—"}</span>
              <span class={styles.fieldLabel}>{field.label}</span>
            </div>
          )}
        </For>
      </div>

      <div class={styles.headerActions}>
        <button
          class={styles.inspoBtn}
          classList={{ [styles.inspoOn]: inspired() }}
          onClick={() => props.onToggleInspiration()}
          title="Toggle heroic inspiration"
        >
          <Icon icon={inspired() ? StarFill : Star} />
          <span class={styles.inspoLabel}>Inspiration</span>
        </button>

        <div class={styles.restGroup}>
          <Icon icon={Bedtime} size="small" color="var(--primary-color)" />
          <span class={styles.restLabel}>Rest</span>
          <Button borderTheme="primary" transparent onClick={() => props.onRest(SHORT_REST as RechargeType)}>
            Short
          </Button>
          <Button borderTheme="primary" transparent onClick={() => props.onRest(LONG_REST as RechargeType)}>
            Long
          </Button>
        </div>

        <Show when={props.currentCharacter()}>
          <CreateSheetButton character={props.currentCharacter()} />
        </Show>
      </div>
    </div>
  );
};

export default CharacterHeader;
