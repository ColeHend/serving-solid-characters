import { Accessor, Component, For, createMemo, runWithOwner } from "solid-js";
import { Chip, Icon, Input, Option, Select, addSnackbar } from "coles-solid-library";
import { Bolt, MenuBook } from "coles-solid-library/icons";
import { MadType } from "../../../../shared/customHooks/mads/madModels";
import { Spell } from "../../../../models/generated";
import { MadsApi, isConcreteSpellMad, isUsesMad, normalizeRecharge } from "./featuresPopup.shared";
import styles from "./featuresPopup.module.scss";

interface UsageSpellsTabProps {
    api: MadsApi;
    allSpells: Accessor<Spell[]>;
}

/**
 * Feature-level view over the mads the character sheet actually consumes:
 * one AddUses row (limited uses) and one AddSpells row per granted spell.
 * This tab holds no state of its own — it reads/writes the shared FormArray,
 * so save() flattens these rows like any other effect.
 */
export const UsageSpellsTab: Component<UsageSpellsTabProps> = (props) => {
    const usesIndex = createMemo(() => props.api.rows().findIndex(isUsesMad));
    const usesAmount = createMemo(() => {
        const i = usesIndex();
        return i < 0 ? "" : props.api.rows()[i].value?.["amount"] ?? "";
    });
    const usesRecharge = createMemo(() => {
        const i = usesIndex();
        return i < 0 ? "Long Rest" : normalizeRecharge(props.api.rows()[i].value?.["recharge"]);
    });

    const spellChips = createMemo(() =>
        props.api.rows().flatMap((mad, index) => {
            if (!isConcreteSpellMad(mad)) return [];
            const id = mad.value["ID"];
            return [{ index, id, label: props.allSpells().find(s => s.id === id)?.name ?? id }];
        })
    );

    const commitUses = (amountRaw: string, recharge: string) => {
        const index = usesIndex();
        const amount = parseInt(amountRaw, 10);
        if (!amountRaw.trim() || isNaN(amount) || amount <= 0) {
            // No limited uses — drop the row entirely rather than saving a 0-use mad.
            if (index >= 0) props.api.removeMad(index);
            return;
        }
        const value = { amount: String(amount), recharge };
        if (index >= 0) {
            props.api.setMadFeature("value", index, value);
            props.api.setMadFeature("type", index, MadType.Info);
        } else {
            props.api.addMadRow({
                command: "AddUses",
                commandType: "Add",
                commandCategory: "Uses",
                value,
                type: MadType.Info,
            });
        }
    };

    const addSpell = (typed: string) => {
        const query = typed.trim().toLowerCase();
        if (!query) return false;
        const spells = props.allSpells();
        const spell = spells.find(s => s.name.toLowerCase() === query)
            ?? spells.find(s => s.name.toLowerCase().startsWith(query));
        if (!spell) {
            addSnackbar({ message: `No spell named "${typed.trim()}" found`, severity: "warning" });
            return false;
        }
        const duplicate = props.api.rows().some(mad => isConcreteSpellMad(mad) && mad.value["ID"] === spell.id);
        if (!duplicate) {
            props.api.addMadRow({
                command: "AddSpells",
                commandType: "Add",
                commandCategory: "Spells",
                value: { ID: spell.id },
                type: MadType.Character,
            });
        }
        return true;
    };

    return (
        <div>
            <div class={styles.sectionLabel}>
                <Icon icon={Bolt} size="small" />
                Limited uses
            </div>
            <div class={styles.usesRow}>
                <div class={`${styles.underlineField} ${styles.usesNumber}`}>
                    <Input
                        transparent
                        type="number"
                        min={0}
                        value={usesAmount()}
                        onChange={(e) => commitUses(e.currentTarget.value, usesRecharge())}
                        placeholder="—"
                        aria-label="Number of uses"
                    />
                </div>
                <span class={styles.usesPer}>uses per</span>
                <Select
                    value={usesRecharge()}
                    onChange={(value: string) => runWithOwner(null, () => {
                        if (usesAmount() !== "") commitUses(usesAmount(), value);
                    })}
                >
                    <Option value={"Short Rest"}>Short Rest</Option>
                    <Option value={"Long Rest"}>Long Rest</Option>
                </Select>
            </div>

            <div class={styles.sectionLabel}>
                <Icon icon={MenuBook} size="small" />
                Spells granted
            </div>
            <div class={styles.underlineField}>
                <Input
                    transparent
                    value=""
                    placeholder="Type a spell and press Enter..."
                    onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const el = e.currentTarget as HTMLInputElement;
                        if (addSpell(el.value)) el.value = "";
                    }}
                />
            </div>
            <div class={styles.chipsRow}>
                <For each={spellChips()}>
                    {(chip) => <Chip value={chip.label} remove={() => props.api.removeMad(chip.index)} />}
                </For>
            </div>
        </div>
    );
};
