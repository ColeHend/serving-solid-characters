import { Select, Option, Input, FormField, Button } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For } from "solid-js";

interface Props {
    setCurrecy: (type: string, amount: number) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const CurrencyFeature:Component<Props> = (props) => {
    const value = createMemo(() => props.getValue());
    
    const getMadValue = (key: string) => {
        console.log("key: ", key);
        console.log("returing: ", value()?.[key]);
        
        
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

    createEffect(() => {
        console.log("value: ", currType());
        
    })

    return <div>
        <div>
            <FormField name="Currency Type" formName="CurrencyMadType">
                <Select value={type()} onChange={(value)=>setType(value)}>
                    <For each={CurrencyTypes}>
                        {type => <Option value={switchTypeTokey(type)}>{type}</Option>}
                    </For>
                </Select>
            </FormField>

            <FormField name="Currency Amount" formName="CurrencyMadAmount">
                <Input value={amount()} type="number" onInput={(e)=>setAmount(+e.currentTarget.value)}/>
            </FormField>
        </div>
        
        <Button onClick={()=>props.setCurrecy(currType(), currAmount())}>
            Set Currency
        </Button>

        
    </div>
}