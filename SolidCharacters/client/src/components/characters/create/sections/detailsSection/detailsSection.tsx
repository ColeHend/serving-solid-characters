import { Component, For, Setter } from "solid-js";
import { Input, TextArea } from "coles-solid-library";
import { CharacterDetails } from "../../../../../models/character.model";
import { useCreate } from "../../state/createContext";
import { PortraitDrop } from "./portraitDrop";
import styles from "./detailsSection.module.scss";

type TextDetailKey = Exclude<keyof CharacterDetails, "portrait">;

const IDENTITY_FIELDS: { key: TextDetailKey; label: string; placeholder: string }[] = [
  { key: "gender", label: "Gender", placeholder: "e.g. Female" },
  { key: "pronouns", label: "Pronouns", placeholder: "e.g. she/her" },
  { key: "age", label: "Age", placeholder: "e.g. 127" },
  { key: "height", label: "Height", placeholder: "e.g. 5'9\"" },
  { key: "weight", label: "Weight", placeholder: "e.g. 140 lb" },
  { key: "eyes", label: "Eyes", placeholder: "e.g. Amber" },
  { key: "hair", label: "Hair", placeholder: "e.g. Silver" },
  { key: "skin", label: "Skin", placeholder: "e.g. Copper" },
  { key: "faith", label: "Faith / Deity", placeholder: "e.g. Selûne" },
];

const PERSONALITY_BOXES: { key: TextDetailKey; label: string; placeholder: string }[] = [
  { key: "personalityTraits", label: "Personality Traits", placeholder: "I judge people by their deeds…" },
  { key: "ideals", label: "Ideals", placeholder: "Freedom. Chains are meant to be broken…" },
  { key: "bonds", label: "Bonds", placeholder: "I owe my life to…" },
  { key: "flaws", label: "Flaws", placeholder: "I can't resist…" },
];

export const DetailsSection: Component = () => {
  const { draft, actions } = useCreate();

  const textAccessor = (key: TextDetailKey) => () => draft.details[key] ?? "";
  // TextArea wants a Setter; a plain value-or-updater handler is behaviorally identical.
  const textSetter = (key: TextDetailKey) =>
    ((value: string | ((prev: string) => string)) => {
      const next = typeof value === "function" ? value(draft.details[key] ?? "") : value;
      actions.setDetail(key, next);
      return next;
    }) as Setter<string>;

  return (
    <div>
      <div class={styles.identityRow}>
        <PortraitDrop
          portrait={draft.details.portrait}
          onChange={(dataUrl) => actions.setDetail("portrait", dataUrl)}
        />
        <div class={styles.identityFields}>
          <For each={IDENTITY_FIELDS}>
            {(field) => (
              <label class={styles.field}>
                <span class={styles.fieldLabel}>{field.label}</span>
                <Input
                  value={draft.details[field.key] ?? ""}
                  onInput={(e) => actions.setDetail(field.key, e.currentTarget.value)}
                  placeholder={field.placeholder}
                />
              </label>
            )}
          </For>
          <label class={`${styles.field} ${styles.fieldWide}`}>
            <span class={styles.fieldLabel}>Appearance</span>
            <TextArea
              text={textAccessor("appearance")}
              setText={textSetter("appearance")}
              placeholder="Scarred hands, a traveling cloak two sizes too big…"
            />
          </label>
        </div>
      </div>

      <h5 class={styles.blockLabel}>Personality</h5>
      <div class={styles.personalityGrid}>
        <For each={PERSONALITY_BOXES}>
          {(box) => (
            <label class={styles.field}>
              <span class={styles.fieldLabel}>{box.label}</span>
              <TextArea
                text={textAccessor(box.key)}
                setText={textSetter(box.key)}
                placeholder={box.placeholder}
              />
            </label>
          )}
        </For>
      </div>

      <label class={`${styles.field} ${styles.fieldWide}`}>
        <span class={styles.fieldLabel}>Backstory</span>
        <TextArea
          text={textAccessor("backstory")}
          setText={textSetter("backstory")}
          placeholder="Where do they come from? What do they run from — or toward?"
        />
      </label>
    </div>
  );
};
