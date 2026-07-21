import { Button, Icon } from "coles-solid-library";
import { Backpack, Paid } from "coles-solid-library/icons";
import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
import { Character, itemRefName } from "../../../../../../models/character.model";
import { SectionCard } from "../SectionCard/SectionCard";
import styles from "../../sheet.module.scss";

type view = "inventory" | "equipped" | "attuned";

interface props {
    currentCharacter: Accessor<Character | undefined>;
    itemView: [Accessor<view>, Setter<view>];
}
 
export const EquipmentCard:Component<props> = (props) => {
    const [itemView, setItemView] = props.itemView;

    const equipmentEntries = createMemo(() => {
        const gear = props.currentCharacter()?.items;
        if (!gear) return [];
        return (itemView() === "equipped" ? gear.equipped : itemView() === "attuned" ? gear.attuned : gear.inventory) ?? [];
    });
    
    const currency = () => props.currentCharacter()?.items?.currency;

    const currencyLine = () => {
        const c = currency();
        if (!c) return "";
        return [
            c.platinumPieces ? `${c.platinumPieces} pp` : "",
            c.goldPieces ? `${c.goldPieces} gp` : "",
            c.electrumPieces ? `${c.electrumPieces} ep` : "",
            c.sliverPieces ? `${c.sliverPieces} sp` : "",
            c.copperPieces ? `${c.copperPieces} cp` : "",
        ].filter(Boolean).join(" · ");
    };

    // return <SectionCard icon={Backpack} title="Equipment">
    //     <div class={styles.segmented}>
    //         <Button transparent borderTheme={itemView() === "inventory" ? "primary" : "none"} onClick={() => setItemView("inventory")}>Inventory</Button>
    //         <Button transparent borderTheme={itemView() === "equipped" ? "primary" : "none"} onClick={() => setItemView("equipped")}>Equipped</Button>
    //         <Button transparent borderTheme={itemView() === "attuned" ? "primary" : "none"} onClick={() => setItemView("attuned")}>Attuned</Button>
    //     </div>

    //     <div class={styles.equipList}>
    //         <For each={equipmentEntries()} fallback={<div class={styles.hint}>Nothing here.</div>}>
    //             {(entry) => (
    //             <div class={styles.equipRow}><span>{itemRefName(entry)}</span></div>
    //             )}
    //         </For>
    //     </div>

    //     <Show when={currencyLine()}>
    //         <div class={styles.currencyLine}>
    //             <Icon icon={Paid} size="small" color="var(--primary-color)" />
    //             {currencyLine()}
    //         </div>
    //     </Show>
    // </SectionCard>


    return  <SectionCard icon={Backpack} title="Equipment">
      <div class={styles.segmented}>
        <Button transparent borderTheme={itemView() === "inventory" ? "primary" : "none"} onClick={() => setItemView("inventory")}>Inventory</Button>
        <Button transparent borderTheme={itemView() === "equipped" ? "primary" : "none"} onClick={() => setItemView("equipped")}>Equipped</Button>
        <Button transparent borderTheme={itemView() === "attuned" ? "primary" : "none"} onClick={() => setItemView("attuned")}>Attuned</Button>
      </div>
      <div class={styles.equipList}>
        <For each={equipmentEntries()} fallback={<div class={styles.hint}>Nothing here.</div>}>
          {(entry) => (
            <div class={styles.equipRow}><span>{itemRefName(entry)}</span></div>
          )}
        </For>
      </div>
      <Show when={currencyLine()}>
        <div class={styles.currencyLine}>
          <Icon icon={Paid} size="small" color="var(--primary-color)" />
          {currencyLine()}
        </div>
      </Show>
    </SectionCard>
}




  // ── Equipment (with inventory/equipped/attuned toggle) ──────────
//   const [itemView, setItemView] = createSignal<"inventory" | "equipped" | "attuned">("inventory");
//   const equipmentEntries = createMemo(() => {
//     const gear = props.currentCharacter()?.items;
//     if (!gear) return [];
//     return (itemView() === "equipped" ? gear.equipped : itemView() === "attuned" ? gear.attuned : gear.inventory) ?? [];
//   });
//   const currency = () => props.currentCharacter()?.items?.currency;
//   const currencyLine = () => {
//     const c = currency();
//     if (!c) return "";
//     return [
//       c.platinumPieces ? `${c.platinumPieces} pp` : "",
//       c.goldPieces ? `${c.goldPieces} gp` : "",
//       c.electrumPieces ? `${c.electrumPieces} ep` : "",
//       c.sliverPieces ? `${c.sliverPieces} sp` : "",
//       c.copperPieces ? `${c.copperPieces} cp` : "",
//     ].filter(Boolean).join(" · ");
//   };
//   const EquipmentCard = () => (
//     <SectionCard icon={Backpack} title="Equipment">
//       <div class={styles.segmented}>
//         <Button transparent borderTheme={itemView() === "inventory" ? "primary" : "none"} onClick={() => setItemView("inventory")}>Inventory</Button>
//         <Button transparent borderTheme={itemView() === "equipped" ? "primary" : "none"} onClick={() => setItemView("equipped")}>Equipped</Button>
//         <Button transparent borderTheme={itemView() === "attuned" ? "primary" : "none"} onClick={() => setItemView("attuned")}>Attuned</Button>
//       </div>
//       <div class={styles.equipList}>
//         <For each={equipmentEntries()} fallback={<div class={styles.hint}>Nothing here.</div>}>
//           {(entry) => (
//             <div class={styles.equipRow}><span>{itemRefName(entry)}</span></div>
//           )}
//         </For>
//       </div>
//       <Show when={currencyLine()}>
//         <div class={styles.currencyLine}>
//           <Icon icon={Paid} size="small" color="var(--primary-color)" />
//           {currencyLine()}
//         </div>
//       </Show>
//     </SectionCard>
//   );