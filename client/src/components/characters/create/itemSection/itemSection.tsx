import { Accessor, Component, createMemo, For, Setter, Show, Switch, Match, createSignal, createEffect } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { Background, ChoiceDetail, Class5E, Item, Race } from "../../../../models/data";
import { Button, Checkbox, Chip, FormField, FormGroup, Input } from "coles-solid-library";
import styles from "./itemSection.module.scss";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import { CharacterForm } from "../../../../models/character.model";

interface sectionProps {
    inventory: [Accessor<string[]>, Setter<string[]>];
    equipped: [Accessor<string[]>, Setter<string[]>];
    attuned: [Accessor<string[]>, Setter<string[]>];
    allItems: Accessor<Item[]>;
    class5e: Accessor<string>;
    background: Accessor<Background>;
    form: FormGroup<CharacterForm>;
}

export const ItemSection:Component<sectionProps> = (props) => {
    const classes = useDnDClasses();
    const [inventory,setInventory] = props.inventory;
    const [equipped, setEquipped] = props.equipped;
    const [attuned, setAttuned] = props.attuned;
    const [isItems, setIsItems] = createSignal<boolean>(true);

    const background = createMemo(()=>props.background());
    const allItems = createMemo(()=>props.allItems());
    const class5eName = createMemo(()=>props.class5e());

    const class5e = createMemo(()=>classes().find(c => c.name === class5eName()));


    const classStartItems = createMemo(()=>class5e()?.choices?.[class5e()?.startChoices?.equipment ?? ""].options ?? []);
    const backgroundStartItems = createMemo(()=>background()?.startEquipment ?? [])

    const currencies = ["PP","GP","EP","SP","CP"];

    const getMoneyName = (currency: string) => {
        switch (currency) {
            case "PP":
                return "Platinum";
            
            case "GP":
                return "Gold";

            case "EP":
                return "Electrum";

            case "SP":
                return "Sliver";

            case "CP":
                return "Copper"
        }
    }

    const getBarColor = (currency: string) => {
        switch (currency) {
            case "PP":
                return "#E5E4E2"; // Platinum
            
            case "GP":
                return "#FFD700"; // Gold
            
            case "EP":
                return "#CDBA6C"; // Electrum (pale gold/silver)
            
            case "SP":
                return "#C0C0C0"; // Silver

            case "CP":
                return "#B87333"; // Copper

            default:
                return "#888888"; // fallback neutral color
        }
    }

    createEffect(()=>{
        console.log("x: ",backgroundStartItems() );
        
    })

    return <FlatCard icon="backpack" headerName="Equipment">
        <FlatCard headerName={<strong>Starting Equipment</strong>}>
            <div>
                <Button onClick={()=>setIsItems(true)}>Items</Button>
                <span> OR </span>
                <Button onClick={()=>setIsItems(false)}>Gold</Button>
            </div>
            <Switch>
                <Match when={!isItems()}>
                    Gold
                </Match>
                <Match when={isItems}>
                    <h3>{class5eName()} Starting Equipment</h3>
                    
                    <div>
                        <For each={classStartItems()}>
                            {(choice) => <li>
                                <Checkbox label={<span>{choice}</span>} />
                            </li>}
                        </For>
                    </div>

                    <h3>{background().name} Starting Equipment</h3>

                    <div>
                        <For each={backgroundStartItems()}>
                            {(choice)=><li>
                                <Checkbox  label={<span>({choice.optionKeys}): {choice.items?.join(", ")}</span>}  />        
                            </li>}
                        </For>
                    </div>

                </Match>
            </Switch>
        </FlatCard>
        <FlatCard headerName={<strong>Inventory ({inventory().length})</strong>}>
            <For each={inventory()}>
                {(item)=><Chip value={item} />}
            </For>
        </FlatCard>
        <FlatCard headerName={<strong>Add Item</strong>}>
                <div>
                    test: {props.form.get().PP};
                </div>
        </FlatCard>
        <FlatCard headerName={<strong>Currency</strong>}>
            <div class={`${styles.moneySection}`}>
                <For each={currencies}>
                    {(currency, i)=><div>
                        <div class={`${styles.currenyBox}`}>
                            <span style={{display:"flex","flex-direction":"row", gap:"1%", height: "50%","margin-top":"3%"}}>
                                <div style={{"background-color":`${getBarColor(currency)}`,width:"0.5vw"}} />
                                <strong>{getMoneyName(currency)}</strong>
                            </span>
                            <span class={`${styles.moneyInput}`}>
                                <FormField name={`${currency}`} formName={currency}>
                                    <Input type="number" transparent/>
                                </FormField>
                            </span>
                        </div>
                        <div>
                            <Show when={i() !== currencies.length - 1}>
                                <Switch>
                                    <Match when={currency === "PP"}>
                                        = 10 GP
                                    </Match>
                                    <Match when={currency === "GP"}>
                                        = 2 EP, 10 SP
                                    </Match>
                                    <Match when={currency === "EP"}>
                                        = 5 SP
                                    </Match>
                                    <Match when={currency === "SP"}>
                                        = 10 CP
                                    </Match>
                                </Switch>
                            </Show>
                        </div>
                    </div>}
                </For>
            </div>
        </FlatCard>
    </FlatCard>
}