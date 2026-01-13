import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal, 
  For, 
  onMount, 
  Show 
} from "solid-js";
import styles from "./create.module.scss";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { 
  addSnackbar, 
  Body, 
  Button, 
  Form, 
  FormField, 
  FormGroup, 
  Input, 
  Select, 
  Validators,
  Option,
  ChipType
} from "coles-solid-library";
import { Character, CharacterForm, CharacterLevel, CharacterRace, CharacterSpell } from "../../../models/character.model";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { toCharacter5e } from "./characterMapper";
import { SpellsSection } from "./spellsSection/spellsSection";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDSubclasses } from "../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useSearchParams } from "@solidjs/router";
import { characterManager, Clone } from "../../../shared";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { Class5E, FeatureDetail, Race, Spell } from "../../../models/data";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { createStore } from "solid-js/store";
import { ClassesSection } from "./classesSection/classesSection";
import { useDnDRaces } from "../../../shared/customHooks/dndInfo/info/all/races";
import { RaceSection } from "./raceSection/raceSection";
import { LanguageSection } from "./languageSection/languageSection";
import { useDnDSubraces } from "../../../shared/customHooks/dndInfo/info/all/subraces";
import { BackgroundSection } from "./backgroundSection/backgroundSection";
import { Ass } from "./abilityScoreSection/abilityScoreSection";
import { HitPointSection } from "./hpSection/hpSection";
import { ItemSection } from "./itemSection/itemSection";
import { getStatBonus } from "../../../shared/customHooks/utility/tools/characterTools";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";

export type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy"|"Extended Point Buy";

export type charStats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

const CharacterCreate: Component = () => {
  const [userSettings,] = getUserSettings();
  const [searchParams,setSearchParams] = useSearchParams();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  const group = new FormGroup<CharacterForm>({
    "name": ["", [Validators.Required,Validators.minLength(3)]],
    "className": ["", [Validators.Required]],
    "subclass": ["", []],
    "background": ["", [Validators.Required]],
    "alignment": ["", []],
    "languages": [[], [Validators.maxLength(2)]],
    "race": ["",[]]
  });

  // data hooks
  const classes = useDnDClasses();
  const subClasses = useDnDSubclasses();
  const backgrounds = useDnDBackgrounds();
  const spells = useDnDSpells();
  const races = useDnDRaces();
  const subraces = useDnDSubraces();
  const items = useDnDItems();

  // signals
  const [chips, setChips] = createSignal<ChipType[]>([]);
  const [charClasses,setCharClasses] = createSignal<string[]>([]);
  const [classLevels,setClassLevels] = createSignal<Record<string, number>>({});
  const [charRace,setCharRace] = createSignal<string>("");
  const [charSubrace, setCharSubrace] = createSignal<string>("");
  const [charStats, setCharStats] = createSignal<Record<string, number>>({
    "str": 0,
    "dex": 0,
    "con": 0,
    "int": 0,
    "wis": 0,
    "cha": 0,
  });
  const [statMods, setStatMods] = createSignal<Record<string, number>>({
    "str": 0,
    "dex": 0,
    "con": 0,
    "int": 0,
    "wis": 0,
    "cha": 0,
  });
  const [maxHP, setMaxHP] = createSignal<number>(0);
  const [inventory,setInventory] = createSignal<string[]>([]);
  const [equipped, setEquipped] = createSignal<string[]>([]);
  const [attuned, setAttuned] = createSignal<string[]>([]);
  const [currency, setCurrency] = createSignal<Record<string, number>>({});

  // stats

  const [genMethod, setGenMethod] = createSignal<GenMethod>("Standard Array");
  const [pbPoints,setPBPoints] = createSignal<number>(34);
  const [selectedStat, setSelectedStat] = createSignal<number>(0);
  const [selectedStats, setSelectedStats] = createSignal<number[]>([]);
  const [modChips, setModChips] = createSignal<ChipType[]>([]);
  const [modStat, setModStat] = createSignal<string>("");
  const [isFocus, setIsFocus] = createSignal<boolean>(false);

  // store

  const newCharStore = createStore<Character>({
    name: "",
    level: 0,
    levels: [],
    spells: [],
    race: {
      species: "",
      features: []
    },
    className: "",
    subclass: "",
    background: "",
    alignment: "",
    proficiencies: {
      skills: {},
      other: {}
    },
    languages: [],
    health: {
      max: 0,
      current: 0,
      temp: 0,
    },
    stats: {
      str: 0,
      dex: 0,
      con: 0,
      int: 0,
      wis: 0,
      cha: 0
    },
    items: {
      inventory: [],
      equipped: [],
      attuned: [],
      currency: {
        platinumPieces: 0,
        goldPieces: 0,
        electrumPieces: 0,
        sliverPieces: 0,
        copperPieces: 0
      }
    }
  })

  // -----Form Data-----

  const characterName = createMemo(()=>group.data.name);
  const characterRace = createMemo(()=>group.data.race);
  const selectedClass = createMemo(()=>group.data.className);
  const selectedSubclass =createMemo(()=>group.data.subclass);
  const charBackground = createMemo(()=>group.data.background);
  const charAlignment = createMemo(()=>group.data.alignment);

  // -----levels-----

  const updateLevels = () => {

    // const charLevels: CharacterLevel[] = [];
    
    // const fulllevel = createMemo(()=>{
    //     let toreturn = 0;
    //     charClasses().forEach(value => toreturn += getCharacterLevel(value));

    //     return toreturn
    // })

    // let level = 1;

    // charClasses().forEach((charClass)=>{
    //     const class5e = getClass(charClass);
        

    //     for (let index = 1; index < fulllevel() - 1 && index < getCharacterLevel(charClass); index++) {
    //     charLevels.push({
    //         class: charClass,
    //         subclass: "",
    //         level: level,
    //         hitDie: hitDieToNumber(class5e.hitDie),
    //         features: [...class5e?.features?.[index] ?? []]
    //     })
    //     level += 1;
        
    //     }
    // })

    // newCharStore[1]("levels",charLevels);
    // newCharStore[1]("level" as any, charLevels.length);
  

    // change function to add one level propably rename it to add level then create another function to remove an level.
    // inside class component change logic to add or remove class levels.
    

  }

  // -----spells-----
  const characterSpells = createMemo(()=>newCharStore[0].spells);

  const updateSpells = (spell: Spell) => {
    const newSpell: CharacterSpell = {
      name: spell.name,
      prepared: false,
    }

    const oldSpells = characterSpells();

    if (oldSpells.includes(newSpell)) {
      console.warn("Spell already added!");
      return;
    }

    newCharStore[1]("spells",(old)=>[...old,newSpell])
  }

  // -----languages-----

  const characterLanguages = createMemo(()=>newCharStore[0].languages);

  const updateLanguages = (languages: string[]) => {
    const oldLanguages = characterLanguages();

    
    if (languages.some(lang => oldLanguages.includes(lang))) {
      console.warn("Languages didn't change!");
      return;
    }

    newCharStore[1]("languages",(old)=>[...old,...languages]);
  }

  // -----Hitpoints-----
  const charMaxHP = createMemo(()=>newCharStore[0].health.max);

  const updateMaxHP = (hp: number,) => {
    const oldMax = charMaxHP();

    if (oldMax === hp) {
      console.warn("HP didn't change!");
      return;
    }

    newCharStore[1]("health",(old) => ({
      max: hp,
      current: old.current,
      temp: old.temp
    }))
  };

  // -----Stats------
  const characterStats = createMemo(()=>newCharStore[0].stats);

  const updateStats = (stats: charStats) => {
    const oldStats = characterStats();

    // update stats
    ['str','dex','con','int','wis','cha'].forEach((stat)=>{
      if (oldStats[stat as keyof charStats] !== stats[stat as keyof charStats]) {
        newCharStore[1]("stats",(old)=>({
        ...old,
        [stat]: stats[stat as keyof charStats],
      }))
      }
    })

  };

  // -----Gear-----
  const characterInventory = createMemo(()=>newCharStore[0].items.inventory);
  const characterEquipped = createMemo(()=>newCharStore[0].items.equipped);
  const characterAttuned = createMemo(()=>newCharStore[0].items.attuned);
  const characterCurrency = createMemo(()=>newCharStore[0].items.currency);

  const updateInventory = (items: string[]) => {

    newCharStore[1]("items", (old) => ({
      inventory: items,
      equipped: old.equipped,
      attuned: old.attuned,
      currency: old.currency
    }))
  }



  // memos

  const classNames = createMemo<string[]>(()=>classes().flatMap(c => c.name));
 
  const alignments = createMemo<string[]>(()=>[
    "lawful good",
    "neutral good",
    "chaotic good",
    "lawful neutral",
    "true neutral",
    "chaotic neutral",
    "lawful evil",
    "neutral evil",
    "chaotic evil",
  ])
 
  const backgroundNames = createMemo<string[]>(()=>backgrounds().flatMap(b => b.name));
 
  const selectedClasses = createMemo(()=>{
    const toReturn:Class5E[] = [];

    charClasses().forEach((level => toReturn.push(getClass(level))))

    if (toReturn.length > 0) return toReturn;

    return [];
  })

  const exist = createMemo(()=>characterManager.characters().some(c => c.name.toLowerCase() === (characterName() || '').toLowerCase()))
  
  const hasSpells = createMemo(()=>{
    const filterdSpells = spells().filter(s => selectedClasses().some(c => s.classes.includes(c.name)));
    const subclassSpells = spells().filter(s => s.subClasses.includes(selectedSubclass()));


    const allSpells = Clone([...filterdSpells,...subclassSpells]);

    return allSpells.length > 0 ? true : false;
  })
  
  const isDisabled = createMemo<boolean>(()=>{
    const name = group.hasError("name");
    const className = group.hasError("className");
    const subclass = group.hasError("subclass");
    const background = group.hasError("background");
    const alignment = group.hasError("alignment");
    const languages = group.hasError("languages");
    
    if (name || className || subclass || background || alignment || languages) {
      return true
    } else {
      return false;
    }

    return false;
  })

  const selectedRace = createMemo<Race|null>(()=>{
    return races().find(r => r.name === charRace()) ?? null;
  })

  const selectedBackground = createMemo(()=>{
    return backgrounds().find(b => b.name === newCharStore[0].background);
  })


  // functions

  const resetForm = () => {
    group.set("name", "");
    group.set("className", '');
    group.set("subclass", '');
    group.set("background", '');
    group.set("alignment", '');
    group.set("languages", []);
    setCharRace("");
    setClassLevels({});
    setCharClasses([]);
    clearStore();
  }

  const handleSubmit = (data: CharacterForm) => {
    addSnackbar({
      message: "Saving Character",
      severity: "info"
    })

    const fullData: CharacterForm = {
      ...data,
      name: characterName(),
      className: charClasses().join(",")
    }

    const valid = group.validate();
    

    if (!valid) {
      console.log("asdf");
      
      const Langerr = group.getErrors("languages")
      addSnackbar({
        message: `Could Not save: ${Langerr}`,
        severity: "error"
      })
      console.error("error",Langerr);
      
      
      
      return;
    }

    const adapted = toCharacter5e(fullData,charClasses,[classLevels,setClassLevels],selectedRace as any,charSubrace)  

    const param = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ") || "";
    
    if (characterManager.characters().some(c => c.name.toLowerCase() === (adapted.name || '').toLowerCase() && param?.toLowerCase() !== (adapted.name || '').toLowerCase())) {
      addSnackbar({
        message: "Character name already exists",
        severity: "warning"
      });
      return;
    }
    
    if (exist()) {
      characterManager.updateCharacter(adapted);
    } else {
      characterManager.createCharacter(adapted);
    }

    addSnackbar({
      message: "Character saved",
      severity: "success"
    });
    resetForm();
  }

  const handleDelete = () => {
    const confirm = window.confirm("Are you sure?");

    if (confirm) {
      characterManager.deleteCharacter(characterName());
      resetForm();
    }
  }

  const clearStore = () => {
    newCharStore[1]("name", `New character[${characterManager.characters().length + 1}]`);
    newCharStore[1]("className", "");
    newCharStore[1]("alignment", "");
    newCharStore[1]("subclass", "");
    newCharStore[1]("background", "");
    newCharStore[1]("languages", []);
    newCharStore[1]("spells", []);

  }

  const getCharacterLevel = (className: string): number => {
  
      return classLevels()[className] ?? 0;
  }

  const setCharacterLevel = (className: string, level: number): void => {
      setClassLevels(old => ({...old,[className]: level}));
  }

  const hitDieToNumber = (hitdie:string): number => {
        switch (hitdie) {
            case "d12":
                return 12;
            case "d10":
                return 10;
            case "d8":
                return 8;
            case "d6":
                return 6;

            default:
                return 0;
        }
  }

  const getClass = (className: string): Class5E => {
    return classes().find(c => c.name === className) ?? {} as Class5E;
  }

  function fillCharacterInfo(): void;
  function fillCharacterInfo(search: boolean): void;
  function fillCharacterInfo(search?:boolean): void {
    const param = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ") || "";
    const searchName = search && search !== undefined ? param : newCharStore[0].name;
    const character = characterManager.getCharacter(searchName);

    if (character) {
      group.set("name",character.name);
      group.set("className",character.className.split(",")[0]);
      group.set("alignment",character.alignment);
      group.set("subclass",character.subclass);
      group.set("background",character.background);
      group.set("languages",character.languages.filter(l => l !== "Common"));
      setCharClasses([]);
      
      newCharStore[1]("name", character.name);
      // class levels
      const classes = character.className.split(",");
      
      classes.forEach((class5e,i)=>{
        const levels = character.levels.filter(l => l.class === class5e);
        setCharClasses(old => [...old, class5e]);
        setClassLevels(old => ({...old,[class5e]: levels.length}));
      })
      
      newCharStore[1]("spells", character.spells);
      newCharStore[1]("className", classes[0][0]);
      newCharStore[1]("race",character.race);
      newCharStore[1]("alignment", character.alignment);
      newCharStore[1]("subclass", character.subclass);
      newCharStore[1]("background", character.background);
      newCharStore[1]("languages", character.languages.filter(l => l !== "Common"));

      setCharRace(character.race.species);
      setCharSubrace(character.race.subrace ?? "");
      // setKnownSpells(character.spells.flatMap(s => s.name));
      newCharStore[0].spells.forEach(spell => setChips(old=>[...old,{
        key: "",
        value: spell.name
      }]))
    }
  }

  const getConMod = () => {
    const theStat = charStats()["con"];

    return getStatBonus(theStat);
  }

  // effects on change

  onMount(()=>{
    if (searchParams.name) fillCharacterInfo(true);
  })

  createEffect(()=>{
    if(characterName() !== "") setSearchParams({ name: characterName()});

    console.log(`${newCharStore[0].name}`,newCharStore[0]);
    
  })

  return (
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <Form data={group} onSubmit={handleSubmit}>
        <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} extraHeaderJsx={
          <Show when={exist()}>
              <Button onClick={fillCharacterInfo}>Fill Info</Button>
              <Button onClick={handleDelete}>Delete</Button>
          </Show>
        } alwaysOpen>
          <div class={`${styles.SectionBody}`}>
            <FormField name="Name" formName="name">
              <Input />
            </FormField>

            <FormField name="Initial Class" formName="className">
              <Select onChange={()=>{
                setClassLevels({});
                setCharClasses([group.data.className]);
              }}>
                <For each={classNames()}>
                  {(className) => <Option value={className}>{className}</Option>}
                </For>
              </Select>
            </FormField>

            <FormField name="Alignment" formName="alignment">
              <Select>
                <For  each={alignments()}>
                  { (alignment) => <Option value={alignment}>{alignment}</Option> }
                </For>
              </Select>
            </FormField>
          </div>
          <div style={{
            display: "flex",
            "flex-direction": "row",
            "margin-top": "1%"
          }}>
            <FormField name="Species" formName="race">
              <Select onChange={()=>{
                  setCharSubrace("");
                }}>
                <For each={races()}>
                  {(race)=><Option value={race.name}>{race.name}</Option>}
                </For>
              </Select>
            </FormField>
            <FormField name="background" formName="background">
              <Select>
                <For each={backgroundNames()}>
                  {(background)=><Option value={background}>{background}</Option>}
                </For>
              </Select>
            </FormField>
          </div>
        </FlatCard>
        
        <Show when={selectedClass() !== ""}>
          <ClassesSection 
            charClasses={[charClasses, setCharClasses]}
            classLevels={[classLevels, setClassLevels]}
            character={newCharStore}
            selectedSubclass={selectedSubclass}
          />
        </Show>

        <Show when={charRace() !== "" && selectedRace()}>
          <RaceSection
            selectedRace={selectedRace as any}
            subraces={subraces}
            charSubrace={[charSubrace, setCharSubrace]}
          />
        </Show>

        <Show when={newCharStore[0].background !== ""}>
            <BackgroundSection 
              background={selectedBackground as any}
            />
        </Show>

        <LanguageSection 
          group={group}
        />

        <Show when={newCharStore[0].className !== "" && hasSpells()}>
          <SpellsSection
            character={newCharStore}
          />
        </Show>

        <Ass 
          stats={[charStats, setCharStats]}
          modifers={[statMods, setStatMods]}
          genMethod={[genMethod, setGenMethod]}
          pbPoints={[pbPoints,setPBPoints]}
          selectedStat={[selectedStat, setSelectedStat]}
          selectedStats={[selectedStats, setSelectedStats]}
          modChips={[modChips, setModChips]}
          modStat={[modStat, setModStat]}
          isFocus={[isFocus, setIsFocus]}
        />

        <Show when={selectedClass() !== "" && getConMod() !== 0}>
          <HitPointSection 
            currentClass={selectedClass}
            maxHP={[maxHP, setMaxHP]}
            classLevels={[classLevels,setClassLevels]}
            classNames={charClasses}
            stat={charStats}
            mod={statMods}
          />
        </Show>
        
        <Show when={newCharStore[0].background !== "" && selectedClass() !== ""}>
          <ItemSection 
            inventory={[inventory,setInventory]}
            equipped={[equipped, setEquipped]}
            attuned={[attuned, setAttuned]}
            currecy={[currency, setCurrency]}
            allItems={items}
            class5e={selectedClass}
            background={selectedBackground as any}
          />
        </Show>
       
        <FlatCard icon="save" headerName="Save" alwaysOpen> 
          <Button type="submit" aria-label="submit btn" disabled={isDisabled()}>
            {exist() ? "update" : "create"}
          </Button>
        </FlatCard>
      </Form>
    </Body>
  )
};

export default CharacterCreate;