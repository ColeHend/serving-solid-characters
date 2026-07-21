import { Button, NumberInput } from "coles-solid-library";
import { Favorite } from "coles-solid-library/icons";
import { Accessor, Component, Setter, Show } from "solid-js";
import { SectionCard } from "../SectionCard/SectionCard";
import { Character } from "../../../../../../models/character.model";
import styles from "../../sheet.module.scss";

interface props {
    onSetTempHp: (n: number) => void;
    currentCharacter: Accessor<Character | undefined>;
    displayCharacter: Accessor<Character | undefined>;
    onDamage: (n: number) => void;
    onHeal: (n: number) => void;
    dmgAmount: [Accessor<number>, Setter<number>];
    editingTemp: [Accessor<boolean>, Setter<boolean>];
}

export const HitPointsCard:Component<props> = (props) => {
    const cur = () => props.currentCharacter()?.health?.current ?? 0;
    const max = () => props.displayCharacter()?.health?.max ?? 0;
    const temp = () => props.currentCharacter()?.health?.temp ?? 0;
    const pct = () => (max() > 0 ? Math.max(0, Math.min(100, (cur() / max()) * 100)) : 0);
    
    const [dmgAmount, setDmgAmount] = props.dmgAmount;
    const [editingTemp, setEditingTemp] = props.editingTemp;

    const commitTemp = (n: number) => {
      props.onSetTempHp(Math.max(0, Number.isFinite(n) ? n : 0));
      setEditingTemp(false);
    };

    return <SectionCard icon={Favorite} title="Hit Points">
        <div class={styles.hpTop}>
          <span class={styles.hpNumbers}>
            {cur()} <span class={styles.hpMax}>/ {max()}</span>
          </span>
          <Show
            when={editingTemp()}
            fallback={
              <div
                class={styles.tempBox}
                title="Click: set value · +: add 1 · Right-click: reset"
                onClick={() => setEditingTemp(true)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  props.onSetTempHp(0);
                }}
              >
                <Button
                  class={styles.tempAdd}
                  title="Add 1"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onSetTempHp(temp() + 1);
                  }}
                  transparent
                >
                  +
                </Button>
                <span class={styles.tempValue}>{temp()}</span>
                <span class={styles.tempLabel}>Temp</span>
              </div>
            }
          >
            <div class={styles.tempBox}>
              <NumberInput
                hideSteppers
                min={0}
                class={styles.tempInput}
                value={temp()}
                ref={(el) => queueMicrotask(() => { el.focus(); el.select(); })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTemp(+e.currentTarget.value);
                  if (e.key === "Escape") setEditingTemp(false);
                }}
                onBlur={(e) => commitTemp(+e.currentTarget.value)}
              />
              <span class={styles.tempLabel}>Temp</span>
            </div>
          </Show>
        </div>
        <div class={styles.hpBar}>
          <div class={styles.hpBarFill} style={{ width: `${pct()}%` }} />
        </div>
        <div class={styles.hpControls}>
          <Button theme="error" onClick={() => props.onDamage(dmgAmount())}>Damage</Button>
          <div class={styles.stepper}>
            <button class={styles.stepBtn} onClick={() => setDmgAmount((n) => Math.max(1, n - 1))}>−</button>
            <input
              class={styles.stepperInput}
              type="number"
              value={dmgAmount()}
              onInput={(e) => setDmgAmount(Math.max(1, +e.currentTarget.value || 1))}
            />
            <button class={styles.stepBtn} onClick={() => setDmgAmount((n) => n + 1)}>+</button>
          </div>
          <Button theme="primary" onClick={() => props.onHeal(dmgAmount())}>Heal</Button>
        </div>
    </SectionCard>
  };