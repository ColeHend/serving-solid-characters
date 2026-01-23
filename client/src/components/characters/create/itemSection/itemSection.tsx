import { Accessor, Component, createMemo, For, Setter, Show, Switch, Match, createSignal, createEffect } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { Background, ChoiceDetail, Class5E, Item, Race } from "../../../../models/data";
import { Button, Checkbox, Chip, FormField, FormGroup, Input, RadioGroup } from "coles-solid-library";
import styles from "./itemSection.module.scss";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import { CharacterForm } from "../../../../models/character.model";
import { AddItem } from "./addItem/AddItem";

interface sectionProps {
    inventory: [Accessor<string[]>, Setter<string[]>];
    equipped: [Accessor<string[]>, Setter<string[]>];
    attuned: [Accessor<string[]>, Setter<string[]>];
    allItems: Accessor<Item[]>;
    class5e: Accessor<string>;
    background: Accessor<Background>;
    form: FormGroup<CharacterForm>;
    exist: Accessor<boolean>;
}

export const ItemSection:Component<sectionProps> = (props) => {
    const classes = useDnDClasses();
    const [inventory,setInventory] = props.inventory;
    const [equipped, setEquipped] = props.equipped;
    const [attuned, setAttuned] = props.attuned;
    const [isItems, setIsItems] = createSignal<boolean>(true);
    const [isBackgrndItems, setIsBackgrndItems] = createSignal<boolean>(true);
    
    const form = createMemo(()=>props.form);
    
    const clsChoice = createMemo<string | null>(()=>form().get().classItemChoice);
    const backgrndChoice = createMemo<string | null>(()=>form().get().backgrndItemChoice);

    const background = createMemo(()=>props.background());
    const allItems = createMemo(()=>props.allItems());
    const class5eName = createMemo(()=>props.class5e());
    const exist = createMemo(()=>props.exist());

    const currentGold = createMemo(()=>form().get().GP);

    const class5e = createMemo(()=>classes().find(c => c.name === class5eName()));

    const classStartItems = createMemo(()=>class5e()?.choices?.[class5e()?.startChoices?.equipment ?? ""].options ?? []);
    const backgroundStartItems = createMemo(()=>background()?.startEquipment ?? [])

    const goldFromClass = createMemo(()=>form().get().clsGold);
    const goldFromBackgrnd = createMemo(()=>form().get().backgrndGold);

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

    const setClsChoice = (value: string| null) => {
        form().set("classItemChoice",value);
    }

    const setBackgrndChoice = (value: string| null) => {
        form().set("backgrndItemChoice", value);
    }

    /**
     * Calculate the difference (delta) from the previous value
     * @param e 
     * @returns The difference (delta)
     */
    const calculateDelta = (e: InputEvent & {
        currentTarget: HTMLInputElement;
        target: HTMLInputElement
    }) => {
        const prevValue = +e.currentTarget.defaultValue || 0;
        const currValue = +e.currentTarget.value || 0;
        return currValue - prevValue;
    }

    /**
     * Handles checkbox state changes for item selection, specifically parsing currency values from the choice string.
     * If a currency value (PP, GP, EP, SP, CP) is found in the choice, it converts the amount to GP (gold pieces)
     * using standard D&D currency conversion rates and updates the form's GP value accordingly, 
     * as well as updating the inventory with the items from the choice string.
     *
     * @param checked - Indicates whether the checkbox is checked (true) or unchecked (false).
     * @param choice - The string representing the selected item, which may contain a currency value.
     */
    const handleCheckbox = (checked: boolean, choice: string) => {
        const target = choice;

        const currencyRegex = /\d+\s*(PP|GP|EP|SP|CP)\b/i;

        const match = target.match(currencyRegex);

        if (match) {
            const matchedText = match[0]; // e.g. "11 GP"
            const amountMatch = matchedText.match(/\d+(?:\.\d+)?/);
            const amount = amountMatch ? Number(amountMatch[0]) : 0;
            const currencyCode = (match[1] || "").toUpperCase();

            const itemsToAdd = target.split(",").filter(item => item.trim() !== matchedText.trim());

            // Convert found currency to GP value and add to form GP
            let addGp = 0;
            switch (currencyCode) {
                case "PP":
                    addGp = amount * 10; // 1 PP = 10 GP
                    break;
                case "GP":
                    addGp = amount;
                    break;
                case "EP":
                    addGp = amount * 0.5; // 2 EP = 1 GP
                    break;
                case "SP":
                    addGp = amount * 0.1; // 10 SP = 1 GP
                    break;
                case "CP":
                    addGp = amount * 0.01; // 100 CP = 1 GP
                    break;
            }
            
            if (checked) {
                const final = +currentGold() + addGp;
                props.form.set("GP", final);
                setInventory(old => [...old, ...itemsToAdd]);
            } else {
                const final = +currentGold() - addGp;
                props.form.set("GP", final);
                itemsToAdd.forEach((item)=> setInventory(old => old.filter(x => x !== item)));
            }
        }
    }

    const resetClassOptions = () => {
        setClsChoice(null);
        form().set("clsGold",0);
        form().set("GP", 0);
        setInventory([])
    };

    const resetBackgrndOptions = () => {
        setBackgrndChoice(null);
        form().set('backgrndGold', 0);
        form().set("GP", 0);
        setInventory([]);
    }

    return <FlatCard icon="backpack" headerName="Equipment">
        <Show when={!exist()}>
            <FlatCard headerName={<strong>Starting Equipment</strong>}>
                <div>
                    please note that selecting ether button will reset the inventory and any option made. so please select <strong>items</strong> or <strong>gold</strong> before making any final dections
                </div>

                <h3>{class5eName()} Starting Equipment</h3>
                

                <div>
                    <Button onClick={()=>{
                        setIsItems(true)
                        resetClassOptions();
                    }} disabled={clsChoice() !== null || goldFromClass() > 0}>Items</Button>
                    <span> OR </span>
                    <Button onClick={()=>{
                        setIsItems(false)
                        resetClassOptions();
                    }} disabled={clsChoice() !== null || goldFromClass() > 0}>Gold</Button>
                </div>
                    
                <Switch>
                    <Match when={!isItems()}>
                        <FormField name="Class Gold" formName="clsGold">
                            <div class={`${styles.noInputBtns}`}>
                                <Input
                                    type="number"
                                    step={1}                                
                                    onInput={e => {
                                        e.preventDefault();

                                        const AddAmt = calculateDelta(e);

                                        // setting defalut value to current value.
                                        e.currentTarget.defaultValue = e.currentTarget.value;

                                        const final = +currentGold() + AddAmt;

                                        props.form.set("GP",final);
                                    }}
                                />

                            </div>
                        </FormField>
                    </Match>
                    <Match when={isItems}>
                    
                        <div>
                            <For each={classStartItems()}>
                                {(choice, i) => <li>
                                    <Checkbox onChange={(checked)=>{
                                        handleCheckbox(checked, choice)
                                        setClsChoice(checked ? choice : null);
                                        if (!checked) {
                                            setClsChoice(null);
                                        }
                                    }} 
                                    checked={clsChoice() !== null  && clsChoice() === choice}
                                    label={<span>{choice}</span>} 
                                    disabled={clsChoice() !== null  && clsChoice() !== choice} />
                                </li>}
                            </For>
                        </div>
                    
                    </Match>
                </Switch>

                <h3>{background().name} Starting Equipment</h3>
                
                <div>
                    <Button onClick={()=>{
                        setIsBackgrndItems(true)
                        resetBackgrndOptions()
                    }} disabled={backgrndChoice() !== null || goldFromBackgrnd() > 0}>Items</Button>
                    <span> OR </span>
                    <Button onClick={()=>{
                        setIsBackgrndItems(false)
                        resetBackgrndOptions()
                    }} disabled={backgrndChoice() !== null || goldFromBackgrnd() > 0}>Gold</Button>
                </div>

                <Switch>
                    <Match when={!isBackgrndItems()}>
                        <FormField name="Background Gold" formName="backgrndGold">
                            <Input
                                type="number"
                                onInput={e => {
                                    e.preventDefault();

                                    const gold = +currentGold();
                                    
                                    // Calculate the difference (delta) from the previous value
                                    const AddAmt = calculateDelta(e);

                                    // setting defalut value to current value.
                                    e.currentTarget.defaultValue = e.currentTarget.value;

                                    const final = gold + AddAmt;

                                    props.form.set("GP",final);
                                }}
                            />
                        </FormField>
                    </Match>
                    <Match when={isBackgrndItems()}>
                        <div>
                            <For each={backgroundStartItems()}>
                                {(choice)=><li>
                                    <Checkbox onChange={(checked)=> {
                                        const choiceString = choice.items?.join(",");

                                        handleCheckbox(checked, choice.items?.join(",") || "");

                                        if (choiceString) {
                                            setBackgrndChoice(checked ? choiceString : null);
                                        }


                                        if (!checked) {
                                            setBackgrndChoice(null);
                                        }
                                    }} 
                                    checked={backgrndChoice() !== null && backgrndChoice() === choice.items?.join(",")}
                                    label={<span>({choice.optionKeys}): {choice.items?.join(",")}</span>}
                                    disabled={backgrndChoice() !== null && backgrndChoice() !== choice.items?.join(",")}  />        
                                </li>}
                            </For>
                        </div>
                    </Match>
                </Switch>

            </FlatCard>
        </Show>
        <FlatCard headerName={<strong>Inventory ({inventory().length})</strong>}>
            <div class={`${styles.inventoryBox}`}>
                <For each={inventory()}>
                    {(item)=><Chip value={item} />}
                </For>
            </div>
        </FlatCard>
        <FlatCard headerName={<strong>Add Item</strong>}>
            <AddItem 
                allItems={allItems} 
                inventory={[inventory, setInventory]}
            />
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