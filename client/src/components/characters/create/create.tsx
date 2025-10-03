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
import { Character, CharacterForm } from "../../../models/character.model";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { toCharacter5e } from "./characterMapper";
import { SpellsSection } from "./spellsSection/spellsSection";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDSubclasses } from "../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useSearchParams } from "@solidjs/router";
import { characterManager, Clone } from "../../../shared";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { Class5E } from "../../../models/data";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { createStore } from "solid-js/store";
import { ClassesSection } from "./classesSection/classesSection";

const CharacterCreate: Component = () => {
  const [userSettings,] = getUserSettings();
  const [searchParams,setSearchParams] = useSearchParams();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  const group = new FormGroup<CharacterForm>({
    "name": ["", [Validators.Required,Validators.minLength(3)]],
    "className": ["", [Validators.Required]],
    "subclass": ["", []],
    "background": ["", []],
    "alignment": ["", []],
    "languages": [[], []]
  });

  const classes = useDnDClasses();
  const subClasses = useDnDSubclasses();
  const backgrounds = useDnDBackgrounds();
  const spells = useDnDSpells();

  const [knownSpells,setKnownSpells] = createSignal<string[]>([]);
  const [chips, setChips] = createSignal<ChipType[]>([]);
  const [charClasses,setCharClasses] = createSignal<{
    className: string;
    subclass?: string;
  }[]>([]);
  const [classLevels,setClassLevels] = createSignal<Record<string, number>>({});

  const newCharStore = createStore<Character>({
    name: `New character[${characterManager.characters().length + 1}]`,
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
      attuned: []
    }
  })
  
  const characterName = createMemo(()=>newCharStore[0].name);
  const selectedClass = createMemo(()=>newCharStore[0].className);
  const selectedSubclass =createMemo(()=>newCharStore[0].subclass);
  const subclassNames = createMemo<string[]>(()=>{
    const filteredSubclasses = subClasses().filter(sc => sc.parent_class === selectedClass());

    return filteredSubclasses.flatMap(sc => sc.name);
  });
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

    charClasses().forEach((level => toReturn.push(getClass(level.className))))

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
    if (newCharStore[0].name !== "" && newCharStore[0].className !== "") {
      return true
    }


    return false;
  })

  const resetForm = () => {
    group.set("name", `New character[${characterManager.characters().length + 1}]`);
    group.set("className", '');
    group.set("subclass", '');
    group.set("background", '');
    group.set("alignment", '');
    group.set("languages", []);
    setKnownSpells([]);
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
      className: selectedClass()
    }

    const adapted = toCharacter5e(fullData,knownSpells())

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
  const fillCharacterInfo = (search?:boolean) => {
    const param = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ") || "";
    const searchName = search ? param : newCharStore[0].name;
    const character = characterManager.getCharacter(searchName);

    if (character) {
      group.set("name",character.name);
      group.set("className",character.className);
      group.set("alignment",character.alignment);
      group.set("subclass",character.subclass);
      group.set("background",character.background);
      group.set("languages",character.languages);
      fillStore(character);
      setKnownSpells(character.spells.flatMap(s => s.name));
      knownSpells().forEach(spell => setChips(old=>[...old,{
        key: "",
        value: spell
      }]))
    }
  }
  const handleDelete = () => {
    const confirm = window.confirm("Are you sure?");

    if (confirm) {
      characterManager.deleteCharacter(characterName());
      resetForm();
    }
  }
  const fillStore = (char: Character) => {
    newCharStore[1]("name", char.name);
    newCharStore[1]("className", char.className);
    newCharStore[1]("alignment", char.alignment);
    newCharStore[1]("subclass", char.subclass);
    newCharStore[1]("background", char.background);
    newCharStore[1]("languages", char.languages);
    newCharStore[1]("spells", char.spells);

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

  const getClass = (className: string): Class5E => {
    return classes().find(c => c.name === className) ?? {} as Class5E;
  }

  onMount(()=>{
    group.set("name", `New character[${characterManager.characters().length + 1}]`);
    if (searchParams.name) fillCharacterInfo(true);
  })

  createEffect(()=>{
    if(characterName() !== "") setSearchParams({ name: characterName()});
  })
  

  return (
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <Form data={group} onSubmit={handleSubmit}>
        <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} extraHeaderJsx={
          <Show when={exist()}>
              <Button onClick={()=>fillCharacterInfo()}>Fill Info</Button>
              <Button onClick={handleDelete}>Delete</Button>
          </Show>
        } alwaysOpen>
          <div class={`${styles.SectionBody}`}>
            <FormField name="Name" formName="name">
              <Input 
              value={newCharStore[0].name} 
              onInput={(e)=>newCharStore[1]("name",e.currentTarget.value)}/>
            </FormField>

            <FormField name="Initial Class" formName="className">
              <Select value={newCharStore[0].className} onChange={(value)=>{
                newCharStore[1]("className",value);
                setCharClasses([{className: value, level: 0}]);
                setClassLevels({});
              }}>
                <For each={classNames()}>
                  {(className) => <Option value={className}>{className}</Option>}
                </For>
              </Select>
            </FormField>

            <FormField name="Alignment" formName="alignment">
              <Select value={newCharStore[0].alignment} onChange={(value)=>newCharStore[1]("alignment",value)}>
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
            <FormField name="subclass" formName="subclass">
              <Select value={newCharStore[0].subclass} onChange={(subclass)=>newCharStore[1]("subclass",subclass)}>
                <For each={subclassNames()}>
                  {(subclass)=> <Option value={subclass}>{subclass}</Option>}
                </For>
              </Select>
            </FormField>
            <FormField name="background" formName="background">
              <Select value={newCharStore[0].background} onChange={(value)=>newCharStore[1]("background",value)}>
                <For each={backgroundNames()}>
                  {(background)=><Option value={background}>{background}</Option>}
                </For>
              </Select>
            </FormField>
          </div>
        </FlatCard>
        
        <Show when={newCharStore[0].className !== ""}>
          <ClassesSection 
            charClasses={[charClasses, setCharClasses]}
            classLevels={[classLevels, setClassLevels]}
            getCharLevel={getCharacterLevel}
            setCharLevel={setCharacterLevel}
            knSpells={[knownSpells, setKnownSpells]}
            selectedSubclass={selectedSubclass}
          />
        </Show>

        <Show when={newCharStore[0].className !== "" && hasSpells()}>
          <SpellsSection 
            knSpells={[knownSpells,setKnownSpells]} 
            selectedClasses={selectedClasses} 
            selectedSubclass={selectedSubclass}
          />
        </Show>

        <FlatCard icon="save" headerName="Save" alwaysOpen> 
          <Button type="submit" aria-label="submit btn" disabled={!isDisabled()}>
            {exist() ? "update" : "create"}
          </Button>
        </FlatCard>
      </Form>
    </Body>
  )
};

export default CharacterCreate;