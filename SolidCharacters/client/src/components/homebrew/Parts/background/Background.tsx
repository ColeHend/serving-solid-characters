import { Body, Form, FormGroup, Validators } from "coles-solid-library";
import { Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BackgroundForm } from "../../../../models/data/formModels";
import styles from "./Background.module.scss";
import { Background, Feat, FeatureDetail, homebrewManager } from "../../../../shared";
import { Identity } from "./Sectons/Identity/Identity";
import { AbilityScore } from "./Sectons/AbilityScore/AbilityScore";
import { Equipment } from "./Sectons/Equipment/Equipment";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import { DebugConsole } from "../../../../shared/customHooks/DebugConsole";
import { OriginFeat } from "./Sectons/OriginFeat/OriginFeat";
import { Proficiencies } from "./Sectons/Proficiencies/Proficiencies";
import { Languages } from "./Sectons/Languages/Languages";
import { OptionalFeatures } from "./Sectons/Features/Features";
import { Saving } from "./Sectons/Saving/Saving";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { useDnDBackgrounds } from "../../../../shared/customHooks/dndInfo/info/all/backgrounds";

export const HomebrewBackgrounds: Component = () => {

    const formGroup = new FormGroup<BackgroundForm>({
        "id": [0, [Validators.Required]],
        "name": ["", [Validators.Required]],
        "desc": ["", []],
        "feat": ["", []],
        "abilityOptions": [[], [Validators.maxLength(3)]],
        "langChoiceAmount": [0, []]
    }) 

    const [armorProfs, setArmorProfs] = createSignal<string[]>([]);
    const [weaponProfs, setWeaponProfs] = createSignal<string[]>([]);
    const [toolProfs, setToolProfs] = createSignal<string[]>([]);
    const [skillProfs, setSkillProfs] = createSignal<string[]>([]);

    const abilityScores = createMemo(() => formGroup.get().abilityOptions ?? []);
    const featID = createMemo(() => formGroup.get().feat ?? "");

    const [startingEquipment, setStartingEquipment] = createSignal<Record<string, string>>({});

    const startItemKeys = createMemo(() => Object.keys(startingEquipment()));

    const [languages, setLanguages] = createSignal<string[]>([]);

    const [features, setFeatures] = createSignal<FeatureDetail[]>([]);

    // data 
    const homebrew = homebrewManager;

    const abillityOptions = [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma"
    ]

    const AllLanguages = [
        "Common",
        "Undercommon",
        "Abyssal",
        "Infernal",
        "Celestial",
        "Primordial",
        "Draconic",
        "Dwarvish",
        "Elvish",
        "Giant",
        "Gnomish",
        "Goblin",
        "Halfling",
        "Orc",
        "Sylvan",
        "Deep Speech",
    ]

    const srdFeats = useDnDFeats();

    const originFeats = createMemo(() => srdFeats().filter(x => x.prerequisites.length === 0));

    const srdItems = useDnDItems();

    const homebrewBackgrounds = createMemo<Background[]>(() => homebrew.backgrounds());

    const srdBackgrounds = useDnDBackgrounds();



    // functions



    const handleSubmit = (data: BackgroundForm) => {

    }

    const getSelectedFeat = (id: string): Feat | null => {
        if (id === "") {
            DebugConsole.error("No ID was given for the 'getSelectedFeat' function!");
            return null;
        }

        const toReturn = srdFeats().find(f => f.id === id);

        if (!toReturn) {
            DebugConsole.warn("No Feat could be found with the ID: ", id);
            return null;
        }

        return toReturn;
    }

    const is_Exist = (id: string) => {
        return srdBackgrounds().some(x => x.id === id);
    }

    const is_Homebrew = (id: string) => {
        return homebrewBackgrounds().some(x => x.id === id);
    }

    const fillForm = (search?:boolean) => {
        const name = search ? " " : formGroup.get().name;

        if (name === "") return;

        const background = srdBackgrounds().find(background => background.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (!background) {
            return;
        }

        formGroup.set("id", background.id);
        formGroup.set("name", background.name);
        formGroup.set("desc", background.desc);
        formGroup.set("abilityOptions", background.abilityOptions);
        // languages
        formGroup.set("langChoiceAmount", background.languages?.amount ?? 1);
        setLanguages(background.languages?.options ?? []);
        // items
        background.startEquipment.forEach(choice => {
            const key = choice.optionKeys?.join(',') ?? "";
            const value = choice.items?.join(",") ?? "";
            setStartingEquipment(old => ({...old,[key]: value}))
        })
        // feat
        formGroup.set("feat", background.feat);
        // proficiencies
        setArmorProfs(background.proficiencies.armor);
        setWeaponProfs(background.proficiencies.weapons);
        setSkillProfs(background.proficiencies.skills);
        setToolProfs(background.proficiencies.tools);
        // features
        setFeatures(background.features ?? []);
    }

    const cloneSRDBackground = () => {
        
    }

    // effects 

    onMount(() => {
        document.body.classList.add('backgrounds-bg');
    })


    onCleanup(() => {
        document.body.classList.remove('backgrounds-bg');
    })
    
    return <Body class={`${styles.body}`}>
        <h2>Backgrounds</h2>

        <Form data={formGroup} onSubmit={handleSubmit}>  
            <Identity 
                formGroup={formGroup} 
                existingBackgrounds={homebrewBackgrounds}
                srdBackgrounds={srdBackgrounds}
                clone={(e)=>{}}
                fill={(e)=>{}}
                delete={(e)=>{}}/>

            <AbilityScore 
                abilityScores={abilityScores} 
                formGroup={formGroup} 
                allStats={abillityOptions}/>

            <Equipment 
                startItemKeys={startItemKeys} 
                startingEquipment={[startingEquipment, setStartingEquipment]} 
                allItems={srdItems}/>

            <OriginFeat 
                featID={featID} 
                getSelectedFeat={getSelectedFeat} 
                originFeats={originFeats} />

            <Proficiencies 
                weaponProfs={weaponProfs} 
                armorProfs={armorProfs} 
                skillProfs={skillProfs} 
                toolProfs={toolProfs} />

            <Languages 
                languages={[languages, setLanguages]}
                form={formGroup}
                allLangs={AllLanguages}/>

            <OptionalFeatures />

            <Saving />
        </Form>
    </Body>
}