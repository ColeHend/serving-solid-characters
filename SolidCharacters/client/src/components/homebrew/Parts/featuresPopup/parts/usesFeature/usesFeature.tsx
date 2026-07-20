import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";
import { Button } from "coles-solid-library";
import { UsesInputs } from "../usesInputs/usesInputs";

interface props {
    toggleValue: (amount: string, proficiencyBonus: string, recharge: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const UsesFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [amount, setAmount] = createSignal(GetMadValue("amount"));
    const [pbChoice, setPbChoice] = createSignal(GetMadValue("proficiencyBonus"));
    const [recharge, setRecharge] = createSignal(GetMadValue("recharge") || "Long Rest");

    const usable = createMemo(() => pbChoice() !== "" || +amount() > 0);

    return <div>
        <UsesInputs
            amount={amount} setAmount={setAmount}
            pbChoice={pbChoice} setPbChoice={setPbChoice}
            recharge={recharge} setRecharge={setRecharge}
        />

        <Show when={!usable()}>
            <p>Enter a number of uses or pick a Proficiency Bonus fraction.</p>
        </Show>

        <Button disabled={!usable()} onClick={() => props.toggleValue(pbChoice() ? "" : amount().trim(), pbChoice(), recharge())}>
            Set Uses
        </Button>
    </div>
}
