import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, Chip, Input } from "coles-solid-library";
import { Spell } from "../../../../../models/generated";
import SpellModal from "../../../../../shared/components/modals/spellModal/spellModal.component";
import {
  entitySelectorKey,
  selectorKeyDisplayName,
} from "../../../../../shared/customHooks/utility/tools/entityKey";
import { ABILITY_LABELS } from "../../rules/constants";
import { isOffList, multiclassCasterLevel } from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { useCreate } from "../../state/createContext";
import { GrimoireModal } from "./grimoireModal";
import styles from "./spellsSection.module.scss";

export const spellLevelLabel = (level: string | number | undefined): string =>
  `${level}` === "0" ? "Cantrip" : `Level ${level}`;

export const SpellsSection: Component = () => {
  const { draft, actions, derived, data } = useCreate();
  const [quickAdd, setQuickAdd] = createSignal("");
  const [showGrimoire, setShowGrimoire] = createSignal(false);

  // The spell detail dialog lives here (not inside the grimoire) so it can stack on
  // top of the grimoire modal and also serve the quick-add list and known chips.
  const [viewedSpell, setViewedSpell] = createSignal<Spell>();
  const [showSpellView, setShowSpellView] = createSignal(false);
  const viewSpell = (spell: Spell) => {
    setViewedSpell(spell);
    setShowSpellView(true);
  };

  const classNames = () => draft.classes.map((c) => c.name);

  const castingLine = createMemo(() => {
    const casters = derived.spellcasting();
    if (casters.length === 0) {
      return "No spellcasting classes yet — you can still inscribe any spell.";
    }
    const parts = casters
      .map((c) => `${c.className} (${ABILITY_LABELS[c.ability]}, save DC ${c.saveDc})`)
      .join(", ");
    const combined =
      casters.length > 1
        ? ` Combined caster level ${multiclassCasterLevel(draft.classes, derived.classByKey)} for multiclass slots.`
        : "";
    return `Spellcasting: ${parts}.${combined} Add anything — even spells outside your lists.`;
  });

  const suggestions = createMemo(() => {
    const query = quickAdd().trim().toLowerCase();
    if (query.length < 2) return [];
    return data
      .spells()
      .filter(
        (spell) =>
          spell.name.toLowerCase().includes(query) &&
          !draft.spells.includes(entitySelectorKey(spell)),
      )
      .slice(0, 8);
  });

  const knownByLevel = createMemo(() => {
    const byKey = new Map(data.spells().map((spell) => [entitySelectorKey(spell), spell]));
    const groups = new Map<string, { key: string; name: string; spell?: Spell }[]>();
    draft.spells.forEach((key) => {
      const spell = byKey.get(key);
      const level = `${spell?.level ?? "?"}`;
      groups.set(level, [
        ...(groups.get(level) ?? []),
        { key, name: spell?.name ?? selectorKeyDisplayName(key), spell },
      ]);
    });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  });

  const hasOffList = createMemo(() =>
    knownByLevel().some(([, spells]) =>
      spells.some(({ spell }) => spell && isOffList(spell, classNames()))));

  return (
    <div>
      <p class={styles.castingLine}>{castingLine()}</p>

      <div class={styles.quickAddRow}>
        <div class={styles.quickAddField}>
          <Input
            value={quickAdd()}
            onInput={(e) => setQuickAdd(e.currentTarget.value)}
            placeholder="Quick add — type a spell name, any class…"
          />
          <Show when={suggestions().length > 0}>
            <div class={styles.suggestions}>
              <For each={suggestions()}>
                {(spell) => (
                  <button
                    type="button"
                    class={styles.suggestion}
                    onClick={() => {
                      actions.addSpell(entitySelectorKey(spell));
                      setQuickAdd("");
                    }}
                  >
                    <span>
                      {spell.name}
                      <Show when={isOffList(spell, classNames())}> ✦</Show>{" "}
                      <Show when={draft.edition === "both" && spell.legacy === true}>
                        <LegacyBadge />
                      </Show>
                    </span>
                    <span class={styles.suggestionMeta}>
                      {spell.school} · {spellLevelLabel(spell.level)}
                      <InfoButton label={`View ${spell.name} details`} onClick={() => viewSpell(spell)} />
                    </span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
        <Button onClick={() => setShowGrimoire(true)}>✦ Browse the Grimoire</Button>
      </div>

      <Show
        when={draft.spells.length > 0}
        fallback={<div class={styles.emptyState}>No spells inscribed yet.</div>}
      >
        <For each={knownByLevel()}>
          {([level, spells]) => (
            <div class={styles.levelGroup}>
              <h5 class={styles.levelLabel}>{`${level}` === "?" ? "Unplaced" : spellLevelLabel(level)}s</h5>
              <div class={styles.spellChips}>
                <For each={spells}>
                  {({ key, name, spell }) => (
                    <span class={styles.chipWithInfo}>
                      <Chip
                        value={spell && isOffList(spell, classNames()) ? `${name} ✦` : name}
                        remove={() => actions.removeSpell(key)}
                      />
                      <Show when={spell}>
                        {(known) => (
                          <InfoButton label={`View ${name} details`} onClick={() => viewSpell(known())} />
                        )}
                      </Show>
                    </span>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
        <Show when={hasOffList()}>
          <p class={styles.footnote}>
            ✦ marks a spell outside your class lists — kept on your sheet all the same.
          </p>
        </Show>
      </Show>

      {/* Spells handed out by mads (Magic Initiate, species cantrips) — read-only, not player picks. */}
      <Show when={derived.grantedSpells().length > 0}>
        <div class={styles.levelGroup}>
          <h5 class={styles.levelLabel}>Granted by features</h5>
          <div class={styles.spellChips}>
            <For each={derived.grantedSpells()}>
              {(name) => <Chip value={name} />}
            </For>
          </div>
        </div>
      </Show>

      <GrimoireModal show={[showGrimoire, setShowGrimoire]} onView={viewSpell} />

      <Show when={viewedSpell()} keyed>
        {(spell) => <SpellModal spell={() => spell} backgroundClick={[showSpellView, setShowSpellView]} />}
      </Show>
    </div>
  );
};
