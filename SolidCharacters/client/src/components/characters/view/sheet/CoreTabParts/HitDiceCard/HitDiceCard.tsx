import { Casino } from "coles-solid-library/icons";
import { Accessor, Component, createMemo, For } from "solid-js";
import { SectionCard } from "../SectionCard/SectionCard";
import { SheetDerived } from "../../useSheetDerived";
import { Character } from "../../../../../../models/character.model";
import styles from "../../sheet.module.scss";

interface props {
    derived: Accessor<SheetDerived>;
    currentCharacter: Accessor<Character | undefined>;
    onSpendHitDie: (sides: number, used: number) => void;
}

export const HitDiceCard:Component<props> = (props) => {
    const d = createMemo(() => props.derived());

    const label = () => d().hitDicePools.map((p) => `${p.total}d${p.sides}`).join(", ");
    
    return (
      <SectionCard icon={Casino} title={`Hit Dice${label() ? ` — ${label()}` : ""}`}>
        <For each={d().hitDicePools}>
          {(pool) => {

            const used = () => props.currentCharacter()?.hitDiceUsed?.[pool.sides] ?? 0;
            const remaining = () => pool.total - used();
            
            return (
              <div class={styles.diceRow}>
                <For each={Array.from({ length: pool.total }, (_, i) => i)}>
                  {(i) => (
                    <button
                      class={styles.die}
                      classList={{ [styles.dieSpent]: i >= remaining() }}
                      onClick={() =>
                        props.onSpendHitDie(pool.sides, i >= remaining() ? i : i + 1)
                      }
                    >
                      d{pool.sides}
                    </button>
                  )}
                </For>
              </div>
            );
          }}
        </For>
        <div class={styles.hint}>Click a die to spend or restore it.</div>
      </SectionCard>
    );
  };