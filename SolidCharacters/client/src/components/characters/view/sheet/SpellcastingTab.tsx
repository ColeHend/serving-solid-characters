import { Accessor, Component, For, Setter, Show } from "solid-js";
import { WandStars } from "coles-solid-library/icons";
import { Character } from "../../../../models/character.model";
import { Spell } from "../../../../models/generated";
import { signed } from "../../../../shared/customHooks/utility/tools/dndMath";
import { SheetDerived } from "./useSheetDerived";
import { PipRow } from "./CoreTabParts/PipRow/PipRow";
import { SpellTable } from "../SpellTable/SpellTable";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
import styles from "./sheet.module.scss";
import { MiniStat } from "./CoreTabParts/MiniStat/MiniStat";
import { SectionCard } from "./CoreTabParts/SectionCard/SectionCard";
import { ConcBadge } from "./CoreTabParts/concBadge/concBadge";
import { LegacyBadge } from "./CoreTabParts/legacyBadge/legacyBadge";

const ordinal = (n: number): string =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

type Props = {
  currentCharacter: Accessor<Character | undefined>;
  derived: Accessor<SheetDerived>;
  spellGroups: Accessor<{ level: number; spells: Spell[] }[]>;
  showSpell: (spell: Spell) => void;
  selectedSpell: Accessor<Spell>;
  showSpellModal: [Accessor<boolean>, Setter<boolean>];
  onSetSlotUsed: (level: number, used: number) => void;
};

const SpellcastingTab: Component<Props> = (props) => {
  const sc = () => props.derived().spellcasting;
  const slots = () => props.derived().spellSlots;

  return (
    <div class={styles.tabPanel}>
      <Show
        when={sc()}
        fallback={<SectionCard><div class={styles.hint}>This character has no spellcasting.</div></SectionCard>}
      >
        <div class={styles.spellTopRow}>
          <MiniStat value={sc()!.abilityLabel} label="Spellcasting Ability" sub={props.currentCharacter()?.className} icon={WandStars} />
          <MiniStat value={sc()!.saveDc} label="Spell Save DC" />
          <MiniStat value={signed(sc()!.attack)} label="Spell Attack" />
        </div>

        <Show when={slots().length}>
          <div style={{ "margin-top": "var(--spacing-2)" }}>
            <SectionCard icon={WandStars} title="Spell Slots">
              <For each={slots()}>
                {(slot) => {
                  const used = () => props.currentCharacter()?.spellSlotsUsed?.[slot.level] ?? 0;
                  const remaining = () => Math.max(0, slot.max - used());
                  return (
                    <div class={styles.slotRow}>
                      <span class={styles.slotLabel}>{ordinal(slot.level)} Level</span>
                      <PipRow
                        total={slot.max}
                        filled={remaining()}
                        shape="diamond"
                        onToggle={(newRemaining) => props.onSetSlotUsed(slot.level, slot.max - newRemaining)}
                      />
                      <span class={styles.slotCount}>{remaining()} / {slot.max}</span>
                    </div>
                  );
                }}
              </For>
            </SectionCard>
          </div>
        </Show>
        
        <div class={styles.legend}>
          <span>
            <ConcBadge /> requires concentration.
          </span>
          <span>
            <LegacyBadge /> SRD 5.1
          </span>
        </div>

        <div class={styles.spellGrid}>
          <For each={props.spellGroups()}>
            {(group) => (
              <SectionCard>
                <SpellTable
                  spells={() => group.spells}
                  show={props.showSpell}
                  currentCharacter={props.currentCharacter as Accessor<Character>}
                />
              </SectionCard>
            )}
          </For>
        </div>

        

        <SpellModal spell={props.selectedSpell} backgroundClick={props.showSpellModal} />
      </Show>
    </div>
  );
};

export default SpellcastingTab;
