import { Accessor, Component, For, Show, createSignal } from "solid-js";
import { Icon } from "coles-solid-library";
import { Image as ImageIcon, MenuBook, Badge, Backpack, Paid } from "coles-solid-library/icons";
import { Character, itemRefName } from "../../../../models/character.model";
import { SectionCard } from "./CoreTabParts/SectionCard/SectionCard";
import styles from "./sheet.module.scss";

type Props = {
  currentCharacter: Accessor<Character | undefined>;
  equipLines: Accessor<string[]>;
  onSetPortrait: (dataUrl: string) => void;
};

/** Downscale a dropped/selected image to a ≤512px JPEG data-URL before persisting it. */
const readPortrait = (file: File, onDone: (dataUrl: string) => void) => {
  if (!file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxEdge = 512;
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      onDone(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
};

const DetailsTab: Component<Props> = (props) => {
  const details = () => props.currentCharacter()?.details;
  const [dragOver, setDragOver] = createSignal(false);
  let fileInput: HTMLInputElement | undefined;

  const physical = () => {
    const de = details();
    return [
      { label: "Age", value: de?.age },
      { label: "Height", value: de?.height },
      { label: "Weight", value: de?.weight },
      { label: "Eyes", value: de?.eyes },
      { label: "Skin", value: de?.skin },
      { label: "Hair", value: de?.hair },
    ].filter((cell) => cell.value);
  };

  const proseCards = () => {
    const de = details();
    return [
      { title: "Personality Traits", value: de?.personalityTraits },
      { title: "Ideals", value: de?.ideals },
      { title: "Bonds", value: de?.bonds },
      { title: "Flaws", value: de?.flaws },
    ].filter((c) => c.value);
  };

  const currencyLine = () => {
    const c = props.currentCharacter()?.items?.currency;
    if (!c) return "";
    return [
      c.platinumPieces ? `${c.platinumPieces} pp` : "",
      c.goldPieces ? `${c.goldPieces} gp` : "",
      c.electrumPieces ? `${c.electrumPieces} ep` : "",
      c.sliverPieces ? `${c.sliverPieces} sp` : "",
      c.copperPieces ? `${c.copperPieces} cp` : "",
    ].filter(Boolean).join(" · ");
  };

  return (
    <div class={styles.detailsGrid}>
      <div class={styles.detailsCol}>
        <div
          class={styles.portrait}
          classList={{ [styles.dragOver]: dragOver() }}
          onClick={() => fileInput?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer?.files?.[0];
            if (file) readPortrait(file, props.onSetPortrait);
          }}
        >
          <Show when={details()?.portrait} fallback={<span><Icon icon={ImageIcon} size="large" /><br />Drop character art</span>}>
            <img src={details()?.portrait} alt="Character portrait" />
          </Show>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) readPortrait(file, props.onSetPortrait);
            }}
          />
        </div>

        <Show when={physical().length}>
          <SectionCard title="Physical">
            <div class={styles.physicalGrid}>
              <For each={physical()}>
                {(cell) => (
                  <div class={styles.physicalCell}>
                    <span class={styles.physicalValue}>{cell.value}</span>
                    <span class={styles.physicalLabel}>{cell.label}</span>
                  </div>
                )}
              </For>
            </div>
          </SectionCard>
        </Show>

        <For each={proseCards()}>
          {(card) => (
            <SectionCard title={card.title} class={styles.proseCard}>
              <p>{card.value}</p>
            </SectionCard>
          )}
        </For>
      </div>

      <div class={styles.detailsCol}>
        <Show when={details()?.backstory}>
          <SectionCard icon={MenuBook} title="Backstory" class={styles.proseCard}>
            <p>{details()?.backstory}</p>
          </SectionCard>
        </Show>

        <Show when={details()?.appearance}>
          <SectionCard title="Appearance" class={styles.proseCard}>
            <p>{details()?.appearance}</p>
          </SectionCard>
        </Show>

        <SectionCard icon={Badge} title="Proficiencies & Languages">
          <Show when={props.currentCharacter()?.languages?.length}>
            <div class={styles.profGroup}>
              <div class={styles.profGroupLabel}>Languages</div>
              <div>{props.currentCharacter()?.languages?.join(", ")}</div>
            </div>
          </Show>
          <For each={props.equipLines()}>
            {(line) => {
              const [label, ...rest] = line.split(":");
              return (
                <div class={styles.profGroup}>
                  <div class={styles.profGroupLabel}>{label}</div>
                  <div>{rest.join(":").trim()}</div>
                </div>
              );
            }}
          </For>
        </SectionCard>

        <SectionCard icon={Backpack} title="Equipment">
          <div class={styles.equipList}>
            <For each={props.currentCharacter()?.items?.inventory ?? []} fallback={<div class={styles.hint}>No items.</div>}>
              {(entry) => <div class={styles.equipRow}><span>{itemRefName(entry)}</span></div>}
            </For>
          </div>
          <Show when={currencyLine()}>
            <div class={styles.currencyLine}>
              <Icon icon={Paid} size="small" color="var(--primary-color)" />
              {currencyLine()}
            </div>
          </Show>
        </SectionCard>
      </div>
    </div>
  );
};

export default DetailsTab;
