import {Accessor, Component, createSignal, For, Setter, Show } from "solid-js";
// import Modal from "../../../../../../shared/components/popup/popup.component";
import {
  FormField,
  Input,
  Select,
  Option,
  Button,
  TabBar,
  Modal
} from "coles-solid-library";
// import { ItemType } from "../../../../../../shared/customHooks/utility/tools/itemType";
import { SetStoreFunction } from "solid-js/store";
import { Feature } from "../../../../../../models/old/core.model";
import { useDnDItems } from "../../../../../../shared/customHooks/dndInfo/info/all/items";
import { ItemType } from "../../../../../../models/data";

interface props {
    show: [Accessor<boolean>,Setter<boolean>];
    addProfiencey: ()=>void;
    newProficeny: Feature<string, string>;
    setNewProficeny: SetStoreFunction<Feature<string, string>>;
}

const StartingProf:Component<props> = (props) => {
  const allItems = useDnDItems();
  const [otherValue,setOtherValue] = createSignal<string>("")

  const [activeTab, setActiveTab] = createSignal<number>(0);

  // functions
  const allWeapons = ():string[] => {
    const weapons:string[] = [];
    const foundWeapons = allItems().filter(item=>item.type === ItemType.Weapon).map(x=>x.name);

    if (foundWeapons.length > 0) {
      foundWeapons.forEach(weapon=>weapons.push(weapon));
    }

    return weapons
  }

  const allArmors = ():string[] => {
    const armors:string[] = []
    const foundArmors = allItems().filter(item=>item.type === ItemType.Armor).map(x=>x.name);

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

  return (
    <Modal title="Add A Profiencey" show={props.show} >
      <div>
        <TabBar tabs={["Armor","Weapons","Tools","Skills"]} activeTab={activeTab()} onTabChange={(label,index)=>setActiveTab(index)} />

        <Show when={activeTab() === 0}>
          <h2>General</h2>
                    
            <Select
              transparent
              value={props.newProficeny.value}
              onChange={e=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e,
              }))}
            >
              <For each={[
                "All Armor",
                "Light",
                "Medium",
                "Heavy",
                "Sheilds"
              ]}>
                { (prof) => <Option value={prof.split(" ").join("")}>{prof}</Option> }
              </For>
            </Select>

            <hr />

            <h2>Specific</h2>
            <Select
              transparent
              value={props.newProficeny.value}
              onChange={(e)=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e,
              }))}>
              <For each={allArmors()}>
                { (armor) => <Option value={armor}>{armor}</Option> }
              </For>
            </Select>
                    
            <div>
              <Button onClick={(e)=>{
                // set info depending on the tab
                props.setNewProficeny(old=>({
                  info: old.info,
                  metadata: old.metadata,
                  name: "armors",
                  choices: old.choices,
                  value: old.value
                }))

                // then add 
                props.addProfiencey()

                props.show[1](false)

                e.stopPropagation()
              }}>Add Proficencey</Button>
            </div>
        </Show>

        <Show when={activeTab() === 1}>
             <h2>General</h2>

            <Select
              transparent
              value={props.newProficeny.value}
              onChange={(e)=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e
              }))}
            >
              <For each={[
                "Simple",
                "Martial"
              ]}>
                { (prof) => <Option value={prof}>{prof}</Option> }
              </For>
            </Select>

            <hr />

            <h2>Speific</h2>

            <Select
              transparent
              value={props.newProficeny.value}
              onChange={(e)=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e
              }))}
            >
              <For each={allWeapons()}>
                { (weapon) => <Option value={weapon}>{weapon}</Option> }
              </For>
            </Select>

            <div>
              <Button onClick={(e)=>{
                props.setNewProficeny(old=>({
                  info: old.info,
                  metadata: old.metadata,
                  name: "weapons",
                  choices: old.choices,
                  value: old.value
                }))

                props.addProfiencey()

                props.show[1](false)

                e.stopPropagation()
              }}>Add Proficencey</Button>
            </div>

        </Show>

        <Show when={activeTab() === 2}>
             
            <Select
              transparent
              value={props.newProficeny.value}
              onChange={(e)=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e
              }))}
            >
              <For each={allTools()}>
                { (tool) => <Option value={!tool.includes("------------")? tool :"" }>{tool}</Option> }
              </For>
            </Select>

            <Show when={props.newProficeny.value === "other"}>
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
                props.setNewProficeny(old=>({
                  info: old.info,
                  metadata: old.metadata,
                  name: "tools",
                  choices: old.choices,
                  value: old.value,
                }))

                if (props.newProficeny.value === "other") props.setNewProficeny("value",otherValue())

                props.addProfiencey()

                props.show[1](false)

                e.stopPropagation()
              }}>Add Proficencey</Button>
            </div>
        </Show>

        <Show when={activeTab() === 4}>
            <Select
              transparent
              value={props.newProficeny.value}
              onChange={(e)=>props.setNewProficeny(old=>({
                info: old.info,
                metadata: old.metadata,
                name: old.name,
                choices: old.choices,
                value: e
              }))}
            >
              <For each={allSkills()}>
                { (skill) => <Option value={skill}>{skill}</Option> }
              </For>
            </Select>

            <Show when={props.newProficeny.value === "other"}>
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
                props.setNewProficeny(old=>({
                  info: old.info,
                  metadata: old.metadata,
                  name: "Skills",
                  choices: old.choices,
                  value: old.value
                }))

                if (props.newProficeny.value === "other") props.setNewProficeny("value",otherValue())

                props.addProfiencey()

                props.show[1](false)

                e.stopPropagation()
              }}>Add Proficencey</Button>
            </div>
        </Show>

      </div>
    </Modal>
  )
}

export default StartingProf;