import { Accessor, Component, createMemo, createSignal, For, JSX, Show, useContext } from "solid-js";
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
import Paginator from "../../paginator/paginator";
import { Feature } from "../../../../models/core.model";
import { classFeatureNullCheck, Clone } from "../../../customHooks/utility/Tools";
import SubclassModal from "./subclassModal.component";

type props = {
    currentClass: Accessor<DnDClass>;
}

const ClassModal:Component<props> = (props)=> {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const [paginatedFeatures,setPaginatedFeatures] = createSignal<Feature<unknown, string>[]>([]);

    
    const currentSubclasses = createMemo(() => props.currentClass().subclasses?.length > 0 ? props.currentClass().subclasses : [] as Subclass[])
    
    const allFeatures = createMemo(()=> props.currentClass().classLevels.map(x=>x.features).flat())
    // props to pass in
    // the current class


    return (
        <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
                <div class={`${styles.eachPage}`}>

                    <h1>{props.currentClass().name}</h1>

                    {/* the feature table */}
                    <div>
                        <FeatureTable Class={() => props.currentClass()} />
                    </div>

                    <span class={`${styles.left}`}>
                        <h2>Proficiencies</h2>
                        <span>
                            Armor: {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("armor")).join(", ")}
                        </span>
                        <span>
                            <Show when={!!props.currentClass().proficiencies.filter(x => x.toLowerCase() === "shields").length}>
                                , Shields
                            </Show>
                        </span>

                        <br />

                        <span>Weapons: {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("weapons")).join(", ")} </span>

                        <br />

                        <span>
                            Tools:
                            {/* I give up! heres my fix ↓ */}
                            {/* if you want a tool to show up without the None */}
                            <Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools") && !props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
                                None
                            </Show>
                            <Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
                                {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("kit"))}
                            </Show>
                            <Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools")}>
                                {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("tools")).join(", ")}
                            </Show>

                        </span>

                        <br />
                        <br />

                        <span>
                            Saving Throws: {props.currentClass().savingThrows.join(", ")}
                        </span>
                    </span>


                    <br />
                    <br />

                    {/* Skills */}
                    <ExpansionPanel class={`${styles.dropCard}`}>
                        <div>
                            <h2>
                                Skills
                            </h2>
                        </div>
                        <div>
                            <Show when={props.currentClass().proficiencyChoices.length > 0}>
                                <For each={props.currentClass().proficiencyChoices}>
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
                    <ExpansionPanel class={`${styles.dropCard}`} >
                        <div>
                            <h2>
                                Starting Equipment
                            </h2>
                        </div>
                        <div>
                            <br />

                            <Show when={props.currentClass().startingEquipment.choice1.length >= 1}>
                                <For each={props.currentClass().startingEquipment.choice1}>
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

                            <Show when={props.currentClass().startingEquipment.choice2}>
                                <For each={props.currentClass().startingEquipment.choice2}>
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

                            <Show when={props.currentClass().startingEquipment.choice3}>
                                <For each={props.currentClass().startingEquipment.choice3}>
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

                            <Show when={props.currentClass().startingEquipment.choice4}>
                                <For each={props.currentClass().startingEquipment.choice4}>
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
                        
                    {/* Features */}
                    <ExpansionPanel class={`${styles.dropCard}`}>
                        <div>
                            <h2>
                                Features
                            </h2>
                        </div>
                        <div>
                            <For each={paginatedFeatures()}>
                                {(feature,i) =>
                                    <>
                                        <div class={`${styles.flexbox}`}>

                                                    <Show when={!!feature.name.trim() || !!(feature.value as string).trim()}>
                                                    <div class={`${styles.innerFlexBox}`}>
                                                        <h3>{feature.name}</h3>
                                                        <span>
                                                            {
                                                                classFeatureNullCheck(!!JSON.parse(JSON.stringify(feature.value)) && typeof JSON.parse(JSON.stringify(feature.value)) === "object" && JSON.parse((JSON.stringify(feature.value))) !== undefined ?
                                                                JSON.stringify(feature.value) : feature.value)
                                                            }
                                                        </span>
                                                    </div>
                                                    </Show>

                                        </div>
                                    </>
                                }
                            </For>

                            <div class={`${styles.Center}`}>
                                <Paginator items={allFeatures} setPaginatedItems={setPaginatedFeatures} itemsPerPage={[2,3,4,5,10]} />

                            </div>
                            
                            
                        </div>
                    </ExpansionPanel>

                    <div class={`${styles.subClasses}`}>
                        <For each={currentSubclasses()}>{(subclass)=>(
                            <SubclassModal subclass={subclass} />
                        )}</For>
                    </div>



                </div>

        </div>
        
    )
}
export default ClassModal;