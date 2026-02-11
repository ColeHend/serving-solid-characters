import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal, 
  For, 
  onCleanup, 
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
import { CharacterForm } from "../../../models/character.model";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { toCharacter5e } from "./characterMapper";
import { SpellsSection } from "./spellsSection/spellsSection";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDSubclasses } from "../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useSearchParams } from "@solidjs/router";
import { characterManager, Clone } from "../../../shared";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { Class5E, Race } from "../../../models/data";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { ClassesSection } from "./classesSection/classesSection";
import { useDnDRaces } from "../../../shared/customHooks/dndInfo/info/all/races";
import { RaceSection } from "./raceSection/raceSection";
import { LanguageSection } from "./languageSection/languageSection";
import { useDnDSubraces } from "../../../shared/customHooks/dndInfo/info/all/subraces";
import { BackgroundSection } from "./backgroundSection/backgroundSection";
import { Ass } from "./abilityScoreSection/abilityScoreSection";
import { HitPointSection } from "./hpSection/hpSection";
import { ItemSection } from "./itemSection/itemSection";
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

export type formSubclass = {
  subclass: string; 
  class5e: string;
}

const CharacterCreate: Component = () => {
  const [userSettings,] = getUserSettings();
  const [searchParams,setSearchParams] = useSearchParams();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  const charactersAmnt = createMemo(()=>characterManager.characters().length);

  const group = new FormGroup<CharacterForm>({
    "name": [`New Character ${charactersAmnt() + 1}`, [Validators.Required,Validators.minLength(3)]],
    "className": ["", [Validators.Required]],
    "subclass": [[], []],
    "background": ["", [Validators.Required]],
    "alignment": ["", []],
    "languages": [[], [Validators.maxLength(2)]],
    "race": ["",[]],
    "spells": [[], []],
    "maxHP": [0, []],
    "currentHP": [0, []],
    "tempHP": [0, []],
    "inventory": [[], []],
    "equipped": [[], []],
    "attuned": [[], []],
    "PP": [0, []],
    "GP": [0, []],
    "EP": [0, []],
    "SP": [0, []],
    "CP": [0, []],
    "STR": [0, []],
    "DEX": [0, []],
    "CON": [0, []],
    "INT": [0, []],
    "WIS": [0, []],
    "CHA": [0, []],
    "lineage": ["", []],
    "clsGold": [0, []],
    "backgrndGold": [0, []],
    "backgrndItemChoice": [null, []],
    "classItemChoice": [null, []],
    "BackgrndFeat": ["", []],
  });

  // data hooks
  const classes = useDnDClasses();
  const backgrounds = useDnDBackgrounds();
  const spells = useDnDSpells();
  const races = useDnDRaces();
  const subraces = useDnDSubraces();
  const items = useDnDItems();

  // Class Section
  const [charClasses,setCharClasses] = createSignal<string[]>([]);
  const [classLevels,setClassLevels] = createSignal<Record<string, number>>({});
  const [charSkills,setCharSkills] = createSignal<string[]>([]);
  const [currentSubclasses, setCurrentSubclasses] = createSignal<formSubclass[]>([]);
  const [skillChipJar, setSkillChipJar] = createSignal<ChipType[]>([]);

  // stats
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

  const [genMethod, setGenMethod] = createSignal<GenMethod>("Standard Array");
  const [pbPoints,setPBPoints] = createSignal<number>(34);
  const [selectedStat, setSelectedStat] = createSignal<number>(0);
  const [selectedStats, setSelectedStats] = createSignal<number[]>([]);
  const [modChips, setModChips] = createSignal<ChipType[]>([]);
  const [modStat, setModStat] = createSignal<string>("");
  const [isFocus, setIsFocus] = createSignal<boolean>(false);

  // inventory signals
  const [inventory,setInventory] = createSignal<string[]>([]);
  const [equipped, setEquipped] = createSignal<string[]>([]);
  const [attuned, setAttuned] = createSignal<string[]>([]);

  // spells

  const [knownSpells,setKnownSpells] = createSignal<string[]>([]);

  // items

  const [startingItemOptions, setStartingItemOptions] = createSignal<Record<string, boolean>>({});



  // -----Form Data-----

  const characterName = createMemo(()=>group.get().name);
  const characterRace = createMemo(()=>group.get().race);
  const selectedClass = createMemo(()=>group.get().className);
  const selectedSubclass =createMemo(()=>group.get().subclass);
  const charBackground = createMemo(()=>group.get().background);
  const charAlignment = createMemo(()=>group.get().alignment);
  const maxHP = createMemo(()=>group.get().maxHP);

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
    const subclassSpells = spells().filter(s => s.subClasses.includes(selectedSubclass()[0]));


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
    return races().find(r => r.name === characterRace()) ?? null;
  })

  const selectedBackground = createMemo(()=>{
    return backgrounds().find(b => b.name === charBackground());
  })


  // functions

  const resetForm = () => {
    group.reset();
    setClassLevels({});
    setCharClasses([]);
  }

  const handleSubmit = (data: CharacterForm) => {
    const fullData: CharacterForm = {
      ...data,
      name: characterName(),
      className: charClasses().join(",")
    }

    const is_Sure = window.confirm(`Are you Sure?                   Dev-test: ${fullData}`);

    if (!is_Sure) return;
    
    addSnackbar({
      message: "Saving Character",
      severity: "info"
    })


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

    const adapted = toCharacter5e(fullData,charClasses,[classLevels,setClassLevels],selectedRace as any,)  

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

  // function fillCharacterInfo(): void;
  // function fillCharacterInfo(search: boolean): void;
  // function fillCharacterInfo(search?:boolean): void {
  //   if (!exist()) {
  //     return;
  //   }
    
  //   const param = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ") || "";
  //   const searchName = search && search !== undefined ? param : newCharStore[0].name;
  //   const character = characterManager.getCharacter(searchName);
        
  //   if (character) {
  //     group.set("name",character.name);
  //     group.set("className",character.className.split(",")[0]);
  //     group.set("alignment",character.alignment);
  //     group.set("subclass",character.subclass);
  //     group.set("background",character.background);
  //     group.set("languages",character.languages.filter(l => l !== "Common"));
  //     setCharClasses([]);
      
  //     newCharStore[1]("name", character.name);
  //     // class levels
  //     const classes = character.className.split(",");
      
  //     classes.forEach((class5e,i)=>{
  //       const levels = character.levels.filter(l => l.class === class5e);
  //       setCharClasses(old => [...old, class5e]);
  //       setClassLevels(old => ({...old,[class5e]: levels.length}));
  //     })
      
  //     newCharStore[1]("spells", character.spells);
  //     newCharStore[1]("className", classes[0][0]);
  //     newCharStore[1]("race",character.race);
  //     newCharStore[1]("alignment", character.alignment);
  //     newCharStore[1]("subclass", character.subclass);
  //     newCharStore[1]("background", character.background);
  //     newCharStore[1]("languages", character.languages.filter(l => l !== "Common"));

  //     setCharRace(character.race.species);
  //     setCharSubrace(character.race.subrace ?? "");
  //     // setKnownSpells(character.spells.flatMap(s => s.name));
  //     
  //   }
  // }



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


  const getConMod = () => {
    const theStat = charStats()["con"];

    return Math.floor((theStat - 10)/2)
  }

  // effects on change

  onMount(()=>{
    // if (searchParams.name) fillCharacterInfo(true);

    document.body.classList.add('character-create-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('character-create-bg');
  })

  createEffect(()=>{
    if(characterName() !== "") setSearchParams({ name: characterName()});
    
  })


  return (
    <Body class={`${stylin().accent} ${styles.body}`}>
      <Form data={group} onSubmit={handleSubmit}>
        <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} extraHeaderJsx={
          <Show when={exist()}>
              <Button onClick={()=>{}}>Fill Info</Button>
              <Button onClick={handleDelete}>Delete</Button>
          </Show>
        } alwaysOpen transparent>
          <div class={`${styles.SectionBody}`}>
            <FormField name="Name" formName="name">
              <Input />
            </FormField>

            <FormField name="Initial Class" formName="className">
              <Select onChange={()=>{
                setClassLevels({});
                setCharClasses([group.get().className]);
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
                  group.set("lineage", "");
                }}>
                <For each={races()}>
                  {(race)=><Option value={race.name}>{race.name}</Option>}
                </For>
              </Select>
            </FormField>
            <FormField name="background" formName="background">
              <Select onChange={()=>{
                group.set("BackgrndFeat", selectedBackground()?.feat || "")
              }}>
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
            knownSpells={[knownSpells, setKnownSpells]}
            formGroup={group}
            currSubclasses={[currentSubclasses, setCurrentSubclasses]}
            charSkills={[charSkills,setCharSkills]}
            chipJar={[skillChipJar, setSkillChipJar]}
            stats={[charStats, setCharStats]}
            modifyers={[statMods, setStatMods]}
          />
        </Show>

        <Show when={characterRace() !== ""}>
          <RaceSection
            subraces={subraces}
            races={races}
            formGroup={group}
          />
        </Show>

        <Show when={charBackground() !== ""}>
            <BackgroundSection
              srdBackgrounds={backgrounds}
              formGroup={group}
            />
        </Show>

        <LanguageSection 
          group={group}
        />

        <Show when={selectedClass() !== "" && hasSpells()}>
          <SpellsSection
            spells={[knownSpells,setKnownSpells]}
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
            classLevels={[classLevels,setClassLevels]}
            classNames={charClasses}
            stat={charStats}
            mod={statMods}
            form={group}
          />
        </Show>
        
        <Show when={charBackground() !== "" && selectedClass() !== ""}>
          <ItemSection 
            inventory={[inventory,setInventory]}
            equipped={[equipped, setEquipped]}
            attuned={[attuned, setAttuned]}
            allItems={items}
            class5e={selectedClass}
            background={selectedBackground as any}
            form={group}
            exist={exist}
          />
        </Show>
       
        <FlatCard icon="save" headerName="Save" alwaysOpen transparent> 
          <Button type="submit" aria-label="submit btn" disabled={isDisabled()}>
            {exist() ? "update" : "save"}
          </Button>
        </FlatCard>
      </Form>
    </Body>
  )
};

export default CharacterCreate;