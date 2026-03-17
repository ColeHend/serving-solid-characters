import { Chip, FormField, Modal, Option, Select } from "coles-solid-library";
import { Accessor, Component, For, Setter, Show } from "solid-js";
import { Clone } from "../../../../../../shared";

interface popupProps {
    show: [Accessor<boolean>, Setter<boolean>];
    setWeapons: [Accessor<string[]> ,Setter<string[]>];
    setArmor: [Accessor<string[]> ,Setter<string[]>];
    setSkills: [Accessor<string[]> ,Setter<string[]>];
    setTools: [Accessor<string[]> ,Setter<string[]>];
}

export const ProficienciesPopup: Component<popupProps> = (props) => {

    const [show, setShow] = props.show;

    const [weapons, setWeapons] = props.setWeapons;
    const [armor, setArmor] = props.setArmor;
    const [skills, setSkills] = props.setSkills;
    const [tools, setTools] = props.setTools;

    const profs = ["Weapons", "Armor", "Skills", "Tools"];


    const setData = (prof: string, data: string[]) => {        
        switch (prof) {
            case "Weapons":
                setWeapons(Clone([...data]));
                break;
    
            case "Armor":
                setArmor(Clone([...data]));
                break;
        
            case "Skills":
                setSkills(Clone([ ...data]));
                break;
            
            case "Tools":
                setTools(Clone([...data]));
                break;

            default:
                break;
        }

    }

    const getData = (prof: string) => {
        switch (prof) {
            case "Weapons":
                return weapons();
    
            case "Armor":
                return armor();
        
            case "Skills":
                return skills();
            
            case "Tools":
                return tools();

            default:
                return [];
        }
    }

    const getSourceData = (prof: string) => {
        switch (prof) {
            case "Weapons":
                return WEAPONS;
    
            case "Armor":
                return ARMOR;
        
            case "Skills":
                return SKILLS;
            
            case "Tools":
                return TOOLS;

            default:
                return [];
        }
    }

    const remove = (prof:string, value: string) => {
        switch (prof) {
            case "Weapons":
                setWeapons(old => Clone(old.filter(x => x !== value)));
                break;

            case "Armor":
                setArmor(old => Clone(old.filter(x => x !== value)));
                break;

            case "Skills":
                setSkills(old => Clone(old.filter(x => x !== value)));
                break;

            case "Tools":
                setTools(old => Clone(old.filter(x => x !== value)));
                break;

            default:
                break;
        }
    }
    
    return <Modal title="Edit Proficiencies!" show={[show, setShow]}>
        <div>
            <For each={profs}>
                {prof => <div>
                    <strong>{prof}</strong>
                    
                    <FormField name={prof} formName={`${prof.toLowerCase()}Prof`}>
                        <Select value={getData(prof)} onChange={(value)=>setData(prof,value)} multiple>
                            <For each={getSourceData(prof)}>
                                {source => <Option value={source}>{source}</Option>}
                            </For>
                        </Select>
                    </FormField>

                    <Show when={getData(prof).length > 0} fallback={<Chip value="None" />}>
                        <div>
                            <For each={getData(prof)}>
                                {proficency => <Chip value={proficency} remove={()=>remove(prof, proficency)}/>}
                            </For>
                        </div>
                    </Show>
                </div>}
            </For>    
        </div>
    </Modal>
}



export const SKILLS = [
  'Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'
];

export const TOOLS = [
  "Artisan's Tools","Smith's Tools","Brewer's Supplies","Calligrapher's Supplies","Carpenter's Tools","Cobbler's Tools","Cook's Utensils","Glassblower's Tools","Jeweler's Tools","Leatherworker's Tools","Mason's Tools","Painter's Supplies","Potter's Tools","Tinker's Tools","Weaver's Tools","Woodcarver's Tools","Disguise Kit","Forgery Kit","Gaming Set","Herbalism Kit","Musical Instrument","Navigator's Tools","Poisoner's Kit","Thieves' Tools","Vehicles (Land)","Vehicles (Water)"
];

export const ARMOR = [
    'Light Armor',
    'Medium Armor',
    'Heavy Armor',
    'Shields'
];

export const WEAPONS = [
  'Club','Dagger','Greatclub','Handaxe','Javelin','Light Hammer','Mace','Quarterstaff','Sickle','Spear','Light Crossbow','Dart','Shortbow','Sling','Battleaxe','Flail','Glaive','Greataxe','Greatsword','Halberd','Lance','Longsword','Maul','Morningstar','Pike','Rapier','Scimitar','Shortsword','Trident','War Pick','Warhammer','Whip','Blowgun','Hand Crossbow','Heavy Crossbow','Longbow','Net','Simple','Martial','Simple Melee','Simple Ranged','Martial Melee','Martial Ranged'
];