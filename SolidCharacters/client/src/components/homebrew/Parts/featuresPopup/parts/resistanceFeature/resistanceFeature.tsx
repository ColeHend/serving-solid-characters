import { Accessor, Component, createMemo, createSignal, For } from "solid-js";
import styles from "./resistanceFeature.module.scss";
import { Select, Option, FormField, Button } from "coles-solid-library";

interface props {
    toggleValue: (type: string) => void;
    getValue: Accessor<Record<string, string> | undefined>; 
    getCommandCategory: Accessor<string> | null;
}

export const ResistanceFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const damageTypes = [
        "Acid",
        "Cold",
        "Fire",
        "Force",
        "Lightning",
        "Necrotic",
        "Poison",
        "Psychic",
        "Radiant",
        "Thunder",
        "Bludgeoning",
        "Piercing",
        "Slashing"
    ]

    const getDmgTypeColor = (dmgType: string) => {
        switch (dmgType) {
            case "Acid":
                return "#22c55e";
            case "Cold":
                return "#3b82f6";
            case "Fire":
                return "#ef4444";
            case "Force":
                return "#6b7280"; // probably needs to be changed
            case "Lightning":
                return "#3cd4da"; // needs to be changed
            case "Necrotic":
                return "#16a34a";
            case "Poison":
                return "#8b5cf6";
            case "Psychic":
                return "#ec4899";
            case "Radiant":
                return "#249afb"; // needs to be changed
            case "Thunder":
                return "#eff172"; // needs to be changed
            case "Bludgeoning":
                return "#374151";
            case "Piercing":
                return "#d1d5db";
            case "Slashing":
                return "#9ca3af";
        }
    }

    const getMadValue = (key: string) => {
        return madValue()?.[key] ?? null;
    }

    const damageType = createMemo(() => getMadValue("damageType") ?? "");

    const [localType, setLocalType] = createSignal(damageType());
    
    return <div class={`${styles.damageTypeInput}`} style={{"border-block-color": `${getDmgTypeColor(localType())}`}}>
        <div class={`${styles.damageTypeHeader}`}>
            <div class={`${styles.damageTypeBar}`} style={{"background-color": `${getDmgTypeColor(localType())}`}}></div>
            {/* <strong>{currentDmgType()}</strong> */}
        </div>
        <div class={`${styles.damageTypeSelect}`}>
            <FormField name="Damage Type">
                <Select value={localType() ?? ""} onChange={(val) => setLocalType(val)}>
                    <For each={damageTypes}>
                        {(dmgType) => <Option value={dmgType}>{dmgType}</Option>}
                    </For>
                </Select>
            </FormField>
        </div>

        <Button onClick={() => props.toggleValue(localType())}>Set change</Button>
    </div>
}