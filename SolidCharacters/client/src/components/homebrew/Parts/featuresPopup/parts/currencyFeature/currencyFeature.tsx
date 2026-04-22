import { Select, Option, Input, FormField, Button } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For } from "solid-js";
import styles from "./currencyFeature.module.scss"; 

interface Props {
    setCurrecy: (type: string, amount: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const CurrencyFeature:Component<Props> = (props) => {
    const value = createMemo(() => props.getValue());
    
    const getMadValue = (key: string) => {
        return value()?.[key];
    }

    const type = createMemo(() => getMadValue("type") ?? "");
    const amount = createMemo(() => +(getMadValue("amount") ?? ""));

    const [currAmount,setAmount] = createSignal(0);
    const [currType,setType] = createSignal("");

    const CurrencyTypes = [
        "Platinum",
        "Gold",
        "Electrum",
        "Silver",
        "Copper"
    ]

    const switchTypeTokey = (type:string): string => {
        switch (type) {
            case "Platinum":
                return "platinumPieces";
            case "Gold":
                return "goldPieces";
            case "Electrum":
                return "electrumPieces";
            case "Silver":
                return "silverPieces";
            case "Copper":
                return "copperPieces";
            default:
                return "";
        }
    }

    const switchKeyToType = (key:string): string => {
        switch (key) {
            case "platinumPieces":
                return "Platinum";
            case "goldPieces":
                return "Gold";
            case "electrumPieces":
                return "Electrum";
            case "silverPieces":
                return "Silver";
            case "copperPieces":
                return "Copper";
            default:
                return "";
        }
    }

    const getBarColor = (currency: string) => {
        switch (currency) {
            case "platinumPieces":
                return "#E5E4E2"; // Platinum
            
            case "goldPieces":
                return "#FFD700"; // Gold
            
            case "electrumPieces":
                return "#CDBA6C"; // Electrum (pale gold/silver)
            
            case "silverPieces":
                return "#C0C0C0"; // Silver

            case "copperPieces":
                return "#B87333"; // Copper

            default:
                return "#888888"; // fallback neutral color
        }
    }

    return <div>
        <div>
            <FormField name="Currency Type" formName="CurrencyMadType">
                <Select value={type()} onChange={(value)=>setType(value)}>
                    <For each={CurrencyTypes}>
                        {type => <Option value={switchTypeTokey(type)}>{type}</Option>}
                    </For>
                </Select>
            </FormField>

            <div class={`${styles.currencyDisplay}`}>
                <span class={`${styles.currencyHeader}`}>
                    <div class={`${styles.currencyBar}`} style={{"background-color": `${getBarColor(currType())}`}}></div>
                    <strong>{switchKeyToType(currType())}</strong>
                </span>
                <span class={`${styles.currencyAmount}`}>
                    <FormField name="Currency Amount" formName="CurrencyMadAmount">
                        <Input value={amount()} type="number" onInput={(e)=>setAmount(+e.currentTarget.value)} transparent/>
                    </FormField>
                </span>
            </div>
        </div>
        
        <Button onClick={()=>props.setCurrecy(currType(), currAmount())}>
            Set Currency
        </Button>

        
    </div>
}