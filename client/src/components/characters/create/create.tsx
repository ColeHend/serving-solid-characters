import { Component, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
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
import { characterManager } from "../../../shared";
import { useDnDBackgrounds } from "../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { Spell } from "../../../models/data";

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
  const classNames = createMemo<string[]>(()=>classes().flatMap(c => c.name));
  const [knownSpells,setKnownSpells] = createSignal<string[]>([]);
  const [selectedClass,setSelectedClass] = createSignal<string>("");
  const [characterName,setCharacterName] = createSignal<string>(`New character[${characterManager.characters().length + 1}]`);
  const [chips, setChips] = createSignal<ChipType[]>([]);
  const [spellSearchRes,setSpellSearchRes] = createSignal<Spell[]>([]);

  const subclassNames = createMemo<string[]>(()=>{
    const filteredSubclasses = subClasses().filter(sc => sc.parent_class === selectedClass());


    return filteredSubclasses.flatMap(sc => sc.name);
  });

  const backgroundNames = createMemo<string[]>(()=>backgrounds().flatMap(b => b.name));

  const exist = createMemo(()=>characterManager.characters().some(c => c.name.toLowerCase() === (characterName() || '').toLowerCase()))

  const resetForm = () => {
    group.set("name", '');
    group.set("className", '');
    group.set("subclass", '');
    group.set("background", '');
    group.set("alignment", '');
    group.set("languages", []);
    setKnownSpells([]);
    setSelectedClass("");
    setCharacterName(`New character[${characterManager.characters().length + 1}]`);
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
    const searchName = search ? param : characterName();
    const character = characterManager.getCharacter(searchName);

    if (character) {
      group.set("name",character.name);
      group.set("className",character.className);
      group.set("alignment",character.alignment);
      group.set("subclass",character.subclass);
      group.set("background",character.background);
      group.set("languages",character.languages);
      setCharacterName(character.name);
      setSelectedClass(character.className);
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

  onMount(()=>{
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
        }>
          <div style={{
            display: "flex",
            "flex-direction": "row"
          }}>
            <FormField name="Name" formName="name">
              <Input 
              value={characterName()} 
              onInput={(e)=>setCharacterName(e.currentTarget.value)}/>
            </FormField>

            <FormField name="Class" formName="className">
              <Select value={selectedClass()} onChange={(value)=>setSelectedClass(value)}>
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
            <FormField name="subclass" formName="subclass">
              <Select>
                <For each={subclassNames()}>
                  {(subclass)=> <Option value={subclass}>{subclass}</Option>}
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
          <SpellsSection knSpells={[knownSpells,setKnownSpells]} selectedClass={selectedClass} />
        </Show>

        <FlatCard icon="save" headerName="save" alwaysOpen> 
          <Button type="submit" aria-label="submit btn">
            {exist() ? "update" : "create"}
          </Button>
        </FlatCard>
      </Form>
    </Body>
  )
};

export default CharacterCreate;