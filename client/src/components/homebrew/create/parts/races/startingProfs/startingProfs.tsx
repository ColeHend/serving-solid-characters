import { Accessor, Component, createSignal, For, Setter, Show } from "solid-js";
import Modal from "../../../../../../shared/components/popup/popup.component";
import addSnackbar  from "../../../../../../shared/components/Snackbar/snackbar";
import {
    useStyle,
    getUserSettings,
    Body,
    homebrewManager,
    FormField,
    Input,
    Select,
    Option,
    Button,
    Chip,
    Clone,
    UniqueSet,
    UniqueStringArray,
    useGetItems,
    Tabs,
    Tab,
} from "../../../../../../shared";
import { ItemType } from "../../../../../../shared/customHooks/utility/itemType";
import { createStore, SetStoreFunction } from "solid-js/store";
import { Race } from "../../../../../../models";
import { Feature, FeatureTypes } from "../../../../../../models/core.model";

interface props {
    setClose: Setter<boolean>;
    setRaceStore: SetStoreFunction<Race>;
    currentRace: Race;
}

const StartingProf:Component<props> = (props) => {
    const allItems = useGetItems();
    const [showConfirm,setShowConfirm] = createSignal<boolean>(false);
    const [newProficeny,setNewProficeny] = createStore<Feature<string,string>>({} as Feature<string,string>);
    const [otherValue,setOtherValue] = createSignal<string>("")

    // functions
    const allWeapons = ():string[] => {
    const weapons:string[] = [];
    const foundWeapons = allItems().filter(item=>item.equipmentCategory === ItemType[1]).map(x=>x.name);

    if (foundWeapons.length > 0) {
        foundWeapons.forEach(weapon=>weapons.push(weapon));
    }

    return weapons
    }

    const allArmors = ():string[] => {
    const armors:string[] = []
    const foundArmors = allItems().filter(item=>item.equipmentCategory === ItemType[2]).map(x=>x.name);

    if (foundArmors.length > 0) {
        foundArmors.forEach(armor=>armors.push(armor));
    }

    return armors
    }

    const allTools = ():string[] => ([
    "Alchemist's Supplies",
    "Brewer's Supplies",
    "Calligrapher's Supplies",
    "Carpenter's Tools",
    "Cartographer's Tools",
    "Cobbler's Tools",
    "Cook's Utensils",
    "Glassblower's Tools",
    "Jeweler's Tools",
    "Leatherworker's Tools",
    "Mason's Tools",
    "Painter's Supplies",
    "Potter's Tools",
    "Smith's Tools",
    "Tinker's Tools",
    "Weaver's Tools",
    "Woodcarver's Tools",
    "Disguise Kit",
    "------------",
    "Forgery Kit",
    "Herbalism Kit",
    "Navigator's Tools",
    "Poisoner's Kit",
    "Thieves' Tools",
    "------------",
    "Dice Set",
    "Dragonchess Set",
    "Playing Card Set",
    "Three-Dragon Ante Set",
    "------------",
    "Bagpipes",
    "Drum",
    "Dulcimer",
    "Flute",
    "Lute",
    "Lyre",
    "Horn",
    "Pan Flute",
    "Shawm",
    "Viol",
    "------------",
    "other",
    ])

    const allSkills = ():string[] => ([
    "Athletics",
    "Acrobatics",
    "Sleight of Hand",
    "Stealth",
    "Arcana",
    "History",
    "Investigation",
    "Nature",
    "Religion",
    "Animal Handling",
    "Insight",
    "Medicine",
    "Perception",
    "Survival",
    "Deception",
    "Intimidation",
    "Performance",
    "Persuasion",
    "other"
    ])

    function addProfiencey() {

        // could set more profiencey info here
        props.setRaceStore("startingProficencies",(old)=>([...old,newProficeny]))

        // ------ clear and close ------ \\
        setNewProficeny({})

        props.setClose(false)
        
    }

    return (
        <Modal title="Add A Profiencey" setClose={props.setClose} >
            <div>
                <Tabs 
                transparent>
                  <Tab name="Armor">
                    <h2>General</h2>
                    
                    <Select
                    transparent
                    value={newProficeny.value}
                    onChange={e=>setNewProficeny("value",e.currentTarget.value)}
                    >
                        <For each={[
                            "All Armor",
                            "Light",
                            "Medium",
                            "Heavy",
                            "Sheilds"
                        ]}>
                            { (prof, i) => <Option value={prof.split(" ").join("")}>{prof}</Option> }
                        </For>
                    </Select>

                    <hr />

                    <h2>Specific</h2>
                    <Select
                    transparent
                    value={newProficeny.value}
                    onChange={(e)=>setNewProficeny("value",e.currentTarget.value)}>
                        <For each={allArmors()}>
                            { (armor, i) => <Option value={armor}>{armor}</Option> }
                        </For>
                    </Select>
                    
                    <div>
                        <Button onClick={(e)=>{
                            // set info depending on the tab
                            setNewProficeny("name","armors")
                            // then add 
                            addProfiencey()

                            e.stopPropagation()
                        }}>Add Proficencey</Button>
                    </div>
                  </Tab>  
                  <Tab name="Weapons">
                    <h2>General</h2>

                    <Select
                    transparent
                    value={newProficeny.value}
                    onChange={(e)=>setNewProficeny("value",e.currentTarget.value)}
                    >
                        <For each={[
                            "Simple",
                            "Martial"
                        ]}>
                            { (prof, i) => <Option value={prof}>{prof}</Option> }
                        </For>
                    </Select>

                    <hr />

                    <h2>Speific</h2>

                    <Select
                    transparent
                    value={newProficeny.value}
                    onChange={(e)=>setNewProficeny("value",e.currentTarget.value)}
                    >
                        <For each={allWeapons()}>
                            { (weapon, i) => <Option value={weapon}>{weapon}</Option> }
                        </For>
                    </Select>

                    <div>
                        <Button onClick={(e)=>{
                            setNewProficeny("name","weapons")

                            addProfiencey()

                            e.stopPropagation()
                        }}>Add Proficencey</Button>
                    </div>

                  </Tab>
                  <Tab name="Tools">
            
                  <Select
                    transparent
                    value={newProficeny.value}
                    onChange={(e)=>setNewProficeny("value",e.currentTarget.value)}
                    >
                        <For each={allTools()}>
                            { (tool, i) => <Option value={!tool.includes("------------")? tool :"" }>{tool}</Option> }
                        </For>
                  </Select>

                  <Show when={newProficeny.value === "other"}>
                    <FormField name="other">
                        <Input 
                        type="text"
                        transparent
                        value={otherValue()}
                        onInput={(e)=>setOtherValue(e.currentTarget.value)}
                        />
                    </FormField>
                  </Show>

                  <div>
                        <Button onClick={(e)=>{
                            setNewProficeny("name","tools")

                            if (newProficeny.value === "other") setNewProficeny("value",otherValue())

                            addProfiencey()

                            e.stopPropagation()
                        }}>Add Proficencey</Button>
                    </div>
                  </Tab>
                  <Tab name="Skills">
                    
                  <Select
                    transparent
                    value={newProficeny.value}
                    onChange={(e)=>setNewProficeny("value",e.currentTarget.value)}
                    >
                        <For each={allSkills()}>
                            { (skill, i) => <Option value={skill}>{skill}</Option> }
                        </For>
                  </Select>

                  <Show when={newProficeny.value === "other"}>
                    <FormField name="other">
                        <Input 
                        type="text"
                        transparent
                        value={otherValue()}
                        onInput={(e)=>setOtherValue(e.currentTarget.value)}
                        />
                    </FormField>
                  </Show>

                  <div>
                        <Button onClick={(e)=>{
                            setNewProficeny("name","Skills")

                            if (newProficeny.value === "other") setNewProficeny("value",otherValue())

                            addProfiencey()

                            e.stopPropagation()
                        }}>Add Proficencey</Button>
                    </div>
                  </Tab>
                </Tabs>
                
            </div>
        </Modal>
    )
}

export default StartingProf;