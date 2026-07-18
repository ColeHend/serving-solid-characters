import { Component, For, Match, Setter, Show, Switch, createMemo, createSignal } from "solid-js";
import { Button, Checkbox, Chip } from "coles-solid-library";
import { CharacterItemRef } from "../../../../../models/character.model";
import { srdItem } from "../../../../../models/data/generated";
import { Item } from "../../../../../models/generated";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { entitySelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import { InfoButton } from "../../shell/infoButton";
import { useCreate } from "../../state/createContext";
import { AddItem } from "./addItem/AddItem";
import { CurrencyInput } from "./currencyInput";
import { parseEquipmentChoice } from "./equipmentChoice";
import styles from "./itemsSection.module.scss";

const CURRENCIES = [
  { key: "pp", name: "Platinum", color: "#E5E4E2", hint: "= 10 GP" },
  { key: "gp", name: "Gold", color: "#FFD700", hint: "= 2 EP, 10 SP" },
  { key: "ep", name: "Electrum", color: "#CDBA6C", hint: "= 5 SP" },
  { key: "sp", name: "Silver", color: "#C0C0C0", hint: "= 10 CP" },
  { key: "cp", name: "Copper", color: "#B87333", hint: "" },
] as const;

export const ItemsSection: Component = () => {
  const { draft, actions, derived, data, editId } = useCreate();
  const [classMode, setClassMode] = createSignal<"items" | "gold">("items");
  const [backgroundMode, setBackgroundMode] = createSignal<"items" | "gold">("items");

  const [viewedItem, setViewedItem] = createSignal<Item>();
  const [showItemView, setShowItemView] = createSignal(false);
  const viewItem = (item: Item) => {
    setViewedItem(item);
    setShowItemView(true);
  };
  /** Inventory holds {name, id?} refs — the id pins an exact catalog row; free-text falls back to name. */
  const itemByRef = (entry: CharacterItemRef) =>
    (entry.id ? data.items().find((item) => entitySelectorKey(item) === entry.id) : undefined) ??
    data.items().find((item) => item.name?.toLowerCase() === entry.name.toLowerCase());

  const initialClass = createMemo(() =>
    draft.classes[0] ? derived.classByKey(draft.classes[0]) : undefined);

  /**
   * Equipment choice GROUPS: 2024 classes have a single "equipment" group; 2014 classes
   * have several ("start_1", "start_2", …) and the player picks one option from EACH.
   */
  const classEquipmentGroups = createMemo((): { key: string; options: string[] }[] => {
    const class5e = initialClass();
    if (!class5e?.choices) return [];
    const equipmentKey = class5e.startChoices?.equipment;
    if (equipmentKey && class5e.choices[equipmentKey]) {
      return [{ key: equipmentKey, options: class5e.choices[equipmentKey].options ?? [] }];
    }
    return Object.entries(class5e.choices)
      .filter(([key]) => key !== "skills")
      .map(([key, choice]) => ({ key, options: choice.options ?? [] }));
  });

  const backgroundEquipment = createMemo(() => derived.selectedBackground()?.startEquipment ?? []);

  /**
   * Grant/revoke one equipment option: embedded currency ("14 GP", "10 SP") lands in the
   * matching coin pouch, everything else goes into the inventory.
   */
  const applyChoice = (checked: boolean, choice: string) => {
    const { items, coin } = parseEquipmentChoice(choice);
    if (coin) {
      const delta = checked ? coin.amount : -coin.amount;
      actions.setCurrency(coin.key, draft.items.currency[coin.key] + delta);
    }
    if (checked) {
      // Pack contents are free-text ("10 torches") — name-only refs, never id-keyed.
      actions.updateItems({
        inventory: [...draft.items.inventory, ...items.map((name) => ({ name }))],
      });
    } else {
      actions.updateItems({
        inventory: draft.items.inventory.filter((entry) => !items.includes(entry.name)),
      });
    }
  };

  const resetClassChoice = () => {
    Object.values(draft.items.classItemChoices).forEach((choice) => applyChoice(false, choice));
    actions.setCurrency("gp", draft.items.currency.gp - draft.items.classGold);
    actions.updateItems({ classItemChoices: {}, classGold: 0 });
  };

  const setGroupChoice = (groupKey: string, choice: string, checked: boolean) => {
    applyChoice(checked, choice);
    const next = { ...draft.items.classItemChoices };
    if (checked) next[groupKey] = choice;
    else delete next[groupKey];
    actions.updateItems({ classItemChoices: next });
  };

  const resetBackgroundChoice = () => {
    if (draft.items.backgroundItemChoice) applyChoice(false, draft.items.backgroundItemChoice);
    actions.setCurrency("gp", draft.items.currency.gp - draft.items.backgroundGold);
    actions.updateItems({ backgroundItemChoice: null, backgroundGold: 0 });
  };

  const setClassGold = (value: number) => {
    actions.setCurrency("gp", draft.items.currency.gp - draft.items.classGold + value);
    actions.updateItems({ classGold: value });
  };

  const setBackgroundGold = (value: number) => {
    actions.setCurrency("gp", draft.items.currency.gp - draft.items.backgroundGold + value);
    actions.updateItems({ backgroundGold: value });
  };

  // AddItem keeps its [Accessor, Setter] contract; adapt the store to it.
  const inventoryAccessor = () => draft.items.inventory.map((entry) => ({ ...entry }));
  const inventorySetter = ((
    value: CharacterItemRef[] | ((prev: CharacterItemRef[]) => CharacterItemRef[]),
  ) => {
    const next = typeof value === "function" ? value(inventoryAccessor()) : value;
    actions.updateItems({ inventory: next });
    return next;
  }) as Setter<CharacterItemRef[]>;

  return (
    <div>
      <Show when={!editId() && (initialClass() || derived.selectedBackground())}>
        <h5 class={styles.blockLabel}>Starting equipment</h5>
        <Show when={draft.classes.length > 1}>
          <p class={styles.multiclassHint}>
            Multiclass characters take starting equipment from their initial class only.
          </p>
        </Show>

        <Show when={initialClass()}>
          <div class={styles.sourceBlock}>
            <div class={styles.sourceHeader}>
              <strong>{initialClass()?.name}</strong>
              <span class={styles.modeButtons}>
                <Button
                  transparent={classMode() !== "items"}
                  onClick={() => {
                    resetClassChoice();
                    setClassMode("items");
                  }}
                >
                  Items
                </Button>
                <span class={styles.orText}>or</span>
                <Button
                  transparent={classMode() !== "gold"}
                  onClick={() => {
                    resetClassChoice();
                    setClassMode("gold");
                  }}
                >
                  Gold
                </Button>
              </span>
            </div>
            <Switch>
              <Match when={classMode() === "gold"}>
                <label class={styles.goldRow}>
                  Starting gold
                  <CurrencyInput value={draft.items.classGold} onCommit={setClassGold} />
                </label>
              </Match>
              <Match when={classMode() === "items"}>
                <For each={classEquipmentGroups()}>
                  {(group, groupIndex) => (
                    <div>
                      <Show when={classEquipmentGroups().length > 1}>
                        <span class={styles.choiceGroupLabel}>Choice {groupIndex() + 1}</span>
                      </Show>
                      <ul class={styles.choiceList}>
                        <For each={group.options}>
                          {(choice) => (
                            <li>
                              <Checkbox
                                checked={draft.items.classItemChoices[group.key] === choice}
                                disabled={
                                  !!draft.items.classItemChoices[group.key] &&
                                  draft.items.classItemChoices[group.key] !== choice
                                }
                                onChange={(checked: boolean) => setGroupChoice(group.key, choice, checked)}
                                label={<span>{choice}</span>}
                              />
                            </li>
                          )}
                        </For>
                      </ul>
                    </div>
                  )}
                </For>
              </Match>
            </Switch>
          </div>
        </Show>

        <Show when={derived.selectedBackground()}>
          <div class={styles.sourceBlock}>
            <div class={styles.sourceHeader}>
              <strong>{derived.selectedBackground()?.name}</strong>
              <span class={styles.modeButtons}>
                <Button
                  transparent={backgroundMode() !== "items"}
                  onClick={() => {
                    resetBackgroundChoice();
                    setBackgroundMode("items");
                  }}
                >
                  Items
                </Button>
                <span class={styles.orText}>or</span>
                <Button
                  transparent={backgroundMode() !== "gold"}
                  onClick={() => {
                    resetBackgroundChoice();
                    setBackgroundMode("gold");
                  }}
                >
                  Gold
                </Button>
              </span>
            </div>
            <Switch>
              <Match when={backgroundMode() === "gold"}>
                <label class={styles.goldRow}>
                  Starting gold
                  <CurrencyInput value={draft.items.backgroundGold} onCommit={setBackgroundGold} />
                </label>
              </Match>
              <Match when={backgroundMode() === "items"}>
                <ul class={styles.choiceList}>
                  <For each={backgroundEquipment()}>
                    {(choice) => {
                      const choiceString = (choice.items ?? []).join(", ");
                      return (
                        <li>
                          <Checkbox
                            checked={draft.items.backgroundItemChoice === choiceString}
                            disabled={
                              draft.items.backgroundItemChoice !== null &&
                              draft.items.backgroundItemChoice !== choiceString
                            }
                            onChange={(checked: boolean) => {
                              applyChoice(checked, choiceString);
                              actions.updateItems({
                                backgroundItemChoice: checked ? choiceString : null,
                              });
                            }}
                            label={
                              <span>
                                ({(choice.optionKeys ?? []).join("/")}): {choiceString}
                              </span>
                            }
                          />
                        </li>
                      );
                    }}
                  </For>
                </ul>
              </Match>
            </Switch>
          </div>
        </Show>
      </Show>

      <h5 class={styles.blockLabel}>Inventory ({draft.items.inventory.length})</h5>
      <Show when={draft.items.inventory.length > 0} fallback={<Chip value="None" />}>
        <div class={styles.inventoryBox}>
          <For each={draft.items.inventory}>
            {(entry) => (
              <span class={styles.chipWithInfo}>
                <Chip value={entry.name} remove={() => actions.removeInventoryItem(entry)} />
                <Show when={itemByRef(entry)}>
                  {(resolved) => (
                    <InfoButton label={`View ${entry.name} details`} onClick={() => viewItem(resolved())} />
                  )}
                </Show>
              </span>
            )}
          </For>
        </div>
      </Show>

      <h5 class={styles.blockLabel}>Add item</h5>
      <AddItem
        allItems={data.items}
        inventory={[inventoryAccessor, inventorySetter]}
        onView={viewItem}
        showLegacy={draft.edition === "both"}
      />

      <h5 class={styles.blockLabel}>Currency</h5>
      <div class={styles.moneySection}>
        <For each={CURRENCIES}>
          {(currency) => (
            <div>
              <div class={styles.currenyBox}>
                <span class={styles.currencyHeader}>
                  <div class={styles.currencyBar} style={{ "background-color": currency.color }} />
                  <strong>{currency.name}</strong>
                </span>
                <span class={styles.moneyInput}>
                  <CurrencyInput
                    value={draft.items.currency[currency.key]}
                    transparent
                    onCommit={(value) => actions.setCurrency(currency.key, value)}
                  />
                </span>
              </div>
              <div class={styles.conversionHint}>{currency.hint}</div>
            </div>
          )}
        </For>
      </div>

      <Show when={viewedItem()} keyed>
        {(item) => <ItemPopup item={() => item as srdItem} show={[showItemView, setShowItemView]} />}
      </Show>
    </div>
  );
};
