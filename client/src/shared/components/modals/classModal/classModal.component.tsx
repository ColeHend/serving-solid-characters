import { Accessor, Component, createMemo, createSignal, For, Show, useContext } from "solid-js";
import FeatureTable from "../../../../components/infoTab/viewClasses/featureTable";
import Carousel from "../../Carosel/Carosel";
import ExpansionPanel from "../../expansion/expansion";
import { DnDClass, Subclass } from "../../../../models/class.model";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { SharedHookContext } from "../../../../components/rootApp";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import getUserSettings from "../../../customHooks/userSettings";
import useStyles from "../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classModal.module.scss";
import Modal from "../../popup/popup.component";

type props = {
    currentClass: Accessor<DnDClass>;
}

const classModal:Component<props> = (props)=> {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));

    const currentClass: Accessor<DnDClass> = props.currentClass;
    
    const currentSubclasses = createMemo(() => currentClass().subclasses?.length > 0 ? currentClass().subclasses : [] as Subclass[])

    // props to pass in
    // the current class



        /**
     *  it takes in an unknown value, clones. making the value an object.
     * 
     *  then checks if its just a string or an array
     * 
     * @param {unknown} value the unknown value
     * @returns the cloned value as a nice string
     */
        const classFeatureNullCheck = (value: unknown) => {
            const val = JSON.parse(JSON.stringify(value))
            if (typeof val === 'string') return val
            if (Array.isArray(val)) return val.join("\n \n")
            return "-unknown-";
        }
    
        const currentSubClassElement = (subClasses: Accessor<Subclass[]>) => {
            return subClasses().map(subClass => ({
                name: subClass.name, element:
                    <div>
                        <h3>{subClass.name}</h3>
    
                        <span>
                            {subClass.desc?.join(" \n")}
                        </span>
    
                        <br />
    
                        <span>
                            {subClass.subclassFlavor}
                        </span>
    
                        <br />
    
                        <Show when={subClass.spells?.length >= 1}>
                            <h4>Spells Gained</h4>
    
                            <span>
                                {
                                    subClass.spells?.join("\n")
                                }
                            </span>
    
                            <br />
                        </Show>
    
                        <span>
                            <For each={subClass.features}>
                                {(feature) =>
                                    <>
                                        <h5> {feature.name} </h5>
    
                                        <span> {classFeatureNullCheck(feature?.value)} </span>
                                    </>
                                }
                            </For>
                        </span>
    
    
                    </div>
            }))
        }
    

    return (
        <Modal title={currentClass().name} width={sharedHooks.isMobile()? "100%" : "50%"}  height={sharedHooks.isMobile() ? "100%" : "50%"}>
            <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
                <div class={`${styles.eachPage}`}>

                    <h1>{currentClass().name}</h1>

                    {/* the feature table */}
                    <div>
                        <FeatureTable Class={() => currentClass()} />
                    </div>

                    <h2>Proficiencies</h2>
                    <span>
                        Armor: {currentClass().proficiencies.filter(x => x.toLowerCase().includes("armor")).join(", ")}
                    </span>
                    <span>
                        <Show when={!!currentClass().proficiencies.filter(x => x.toLowerCase() === "shields").length}>
                            , Shields
                        </Show>
                    </span>

                    <br />

                    <span>Weapons: {currentClass().proficiencies.filter(x => x.toLowerCase().includes("weapons")).join(", ")} </span>

                    <br />

                    <span>
                        Tools:
                        {/* I give up! heres my fix ↓ */}
                        {/* if you want a tool to show up without the None */}
                        <Show when={!currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools") && !currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
                            None
                        </Show>
                        <Show when={!currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
                            {currentClass().proficiencies.filter(x => x.toLowerCase().includes("kit"))}
                        </Show>
                        <Show when={!currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools")}>
                            {currentClass().proficiencies.filter(x => x.toLowerCase().includes("tools")).join(", ")}
                        </Show>

                    </span>

                    <br />
                    <br />

                    <span>
                        Saving Throws: {currentClass().savingThrows.join(", ")}
                    </span>

                    <br />
                    <br />

                    {/* Skills */}
                    <ExpansionPanel class={`${styles.Center}`} style={{ width: "50%" }}>
                        <div>
                            <h2>
                                Skills
                            </h2>
                        </div>
                        <div>
                            <Show when={currentClass().proficiencyChoices.length > 0}>
                                <For each={currentClass().proficiencyChoices}>
                                    {(Choice) =>
                                        <>
                                            <br />

                                            <span>Choose: {Choice.choose}</span>

                                            <br />

                                            <For each={Choice.choices}>
                                                {(choice) =>
                                                    <>
                                                        <span>{choice}</span>
                                                        <br />
                                                    </>
                                                }
                                            </For>
                                        </>
                                    }
                                </For>
                            </Show>

                            <br />
                        </div>
                    </ExpansionPanel>

                    <br />

                    {/* Starting Equipment */}
                    <ExpansionPanel class={`${styles.Center}`} style={{ width: "50%" }}>
                        <div>
                            <h2>
                                Starting Equipment
                            </h2>
                        </div>
                        <div>
                            <br />

                            <Show when={currentClass().startingEquipment.choice1.length >= 1}>
                                <For each={currentClass().startingEquipment.choice1}>
                                    {(choice, i) =>
                                        <div>
                                            <Show when={i() < 1}>
                                                <h3>choice 1</h3>
                                            </Show>

                                            <br />

                                            <Show when={i() < 1}>
                                                <span>choose:  {choice.choose}</span>
                                            </Show>

                                            <br />

                                            <span>
                                                <For each={choice.choices}>
                                                    {(item, i) =>
                                                        <>
                                                            <br />
                                                            <span>{item.item}</span>
                                                            <br />
                                                        </>
                                                    }
                                                </For>
                                            </span>

                                            <Show when={i() <= 0}>
                                                <br />
                                                <span>or</span>
                                            </Show>
                                        </div>
                                    }
                                </For>
                            </Show>

                            <Show when={currentClass().startingEquipment.choice2}>
                                <For each={currentClass().startingEquipment.choice2}>
                                    {(choice, i) =>
                                        <div>
                                            <Show when={i() < 1}>
                                                <h3>choice 2</h3>
                                            </Show>

                                            <br />

                                            <Show when={i() < 1}>
                                                <span>choose:  {choice.choose}</span>
                                            </Show>

                                            <br />

                                            <span>
                                                <For each={choice.choices}>
                                                    {(item) =>
                                                        <>
                                                            <br />
                                                            <span>{item.item}</span>

                                                            <br />
                                                        </>
                                                    }
                                                </For>
                                            </span>

                                            <Show when={i() <= 0}>
                                                <br />
                                                <span>or</span>
                                            </Show>
                                        </div>
                                    }
                                </For>
                            </Show>

                            <Show when={currentClass().startingEquipment.choice3}>
                                <For each={currentClass().startingEquipment.choice3}>
                                    {(choice, i) =>
                                        <div>
                                            <Show when={i() < 1}>
                                                <h3>choice 3</h3>
                                            </Show>

                                            <br />

                                            <Show when={i() < 1}>
                                                <span>choose:  {choice.choose}</span>
                                            </Show>

                                            <br />

                                            <span>
                                                <For each={choice.choices}>
                                                    {(item) =>
                                                        <>
                                                            <br />
                                                            <span>{item.item}</span>

                                                            <br />
                                                        </>
                                                    }
                                                </For>
                                            </span>

                                            <Show when={i() <= 0}>
                                                <br />
                                                <span>or</span>
                                            </Show>
                                        </div>
                                    }
                                </For>
                            </Show>

                            <Show when={currentClass().startingEquipment.choice4}>
                                <For each={currentClass().startingEquipment.choice4}>
                                    {(choice, i) =>
                                        <div>
                                            <Show when={i() < 1}>
                                                <h3>choice 4</h3>
                                            </Show>

                                            <br />

                                            <Show when={i() < 1}>
                                                <span>choose:  {choice.choose}</span>
                                            </Show>

                                            <span>
                                                <For each={choice.choices}>
                                                    {(item) =>
                                                        <>
                                                            <br />
                                                            <span>{item.item}</span>

                                                            <br />
                                                        </>
                                                    }
                                                </For>
                                            </span>

                                            <Show when={i() <= 0}>
                                                <br />
                                                <span>or</span>
                                            </Show>
                                        </div>
                                    }
                                </For>
                            </Show>
                        </div>
                    </ExpansionPanel>

                    <br />

                    <ExpansionPanel class={`${styles.Center}`} style={{ width: "50%" }}>
                        <div>
                            <h2>
                                Features
                            </h2>
                        </div>
                        <div>
                            <For each={currentClass().classLevels}>
                                {(classLevel) =>
                                    <>
                                        <Show when={(classLevel.features.filter((x)=>!!x.name.trim() || !!x.value)).length > 0}>
                                            <br />
                                        </Show>
                                        <For each={classLevel.features}>
                                            {(feature) =>
                                                <Show when={!!feature.name.trim() || !!(feature.value as string).trim()}>
                                                    <div>
                                                    <h3>{feature.name}</h3>
                                                    <span>
                                                        {
                                                            classFeatureNullCheck(!!JSON.parse(JSON.stringify(feature.value)) && typeof JSON.parse(JSON.stringify(feature.value)) === "object" && JSON.parse((JSON.stringify(feature.value))) !== undefined ?
                                                            JSON.stringify(feature.value) : feature.value)
                                                        }
                                                    </span>
                                                </div>
                                                </Show>
                                            }
                                        </For>
                                        <Show when={(classLevel.features.filter((x)=>!!x.name.trim() || !!x.value)).length > 0}>
                                            <br />
                                        </Show>
                                    </>
                                }
                            </For>
                        </div>
                    </ExpansionPanel>

                    <div class={`${styles.subClasses}`}>
                        <Carousel notFoundName="Subclasses"  elements={currentSubClassElement(currentSubclasses)} />
                    </div>



                </div>

            </div>
        </Modal>
    )
}