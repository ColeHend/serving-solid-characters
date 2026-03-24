import { addSnackbar, Body, Form, FormGroup, Validators } from "coles-solid-library";
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BackgroundForm } from "../../../../models/data/formModels";
import styles from "./Background.module.scss";
import { Background, ChoiceDetail, Clone, Feat, FeatureDetail, homebrewManager, Proficiencies as ProficienciesModel, StartingEquipment } from "../../../../shared";
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
import { useSearchParams } from "@solidjs/router";
import { EquipmentPopup } from "./Sectons/EquipmentPopup/EquipmentPopup";
import { ProficienciesPopup } from "./Sectons/proficienciesPopup/proficienciesPopup";
import { FeaturesPopup } from "../featuresPopup/featuresPopup";
import { createNewId } from "../../../../shared/customHooks/utility/tools/idGen";

export const HomebrewBackgrounds: Component = () => {

    const formGroup = new FormGroup<BackgroundForm>({
        "id": [0, [Validators.Required]],
        "name": ["", [Validators.Required]],
        "desc": ["", []],
        "feat": ["", []],
        "abilityOptions": [[], [Validators.maxLength(3)]],
        "langChoiceAmount": [0, []],
        "optionKey": ["", []],
        "PP": [0, []],
        "GP": [0, []],
        "EP": [0, []],
        "SP": [0, []],
        "CP": [0, []],
    }) 

    // proficiencies
    const [armorProfs, setArmorProfs] = createSignal<string[]>([]);
    const [weaponProfs, setWeaponProfs] = createSignal<string[]>([]);
    const [toolProfs, setToolProfs] = createSignal<string[]>([]);
    const [skillProfs, setSkillProfs] = createSignal<string[]>([]);

    // fetching form data
    const abilityScores = createMemo(() => formGroup.get().abilityOptions ?? []);
    const featID = createMemo(() => formGroup.get().feat ?? "");

    // starting items
    const [startingEquipment, setStartingEquipment] = createSignal<Record<string, string>>({});

    const startItemKeys = createMemo(() => Object.keys(startingEquipment()));

    // languages
    const [languages, setLanguages] = createSignal<string[]>([]);

    // features
    const [features, setFeatures] = createSignal<FeatureDetail[]>([]);

    const [currentFeature,setCurrentFeature] = createSignal<FeatureDetail>({
        name: "",
        description: "",
    });

    // state
    const [searchParam, setSearchParam] = useSearchParams();

    const selectedName = createMemo(()=>formGroup.get().name);

    const [showItemsPopup, setShowItemsPopup] = createSignal(false);

    const [showProfsPopup, setShowProfsPopup] = createSignal(false);

    const [showFeaturePopup, setShowFeaturePopup] = createSignal(false);

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

    const is_exist = createMemo(() => srdBackgrounds().some(b => b.id === formGroup.get().id)); 

    // functions
    const handleSubmit = (data: BackgroundForm) => {
        const formData: BackgroundForm = {
            ...data,
        };

        const newLangugaes: ChoiceDetail = {
            options: languages(),
            amount: formData.langChoiceAmount
        } 

        const newFeatures = features();

        const newProficiencies: ProficienciesModel = {
            weapons: weaponProfs(),
            armor: armorProfs(),
            skills: skillProfs(),
            tools: toolProfs(),
        }

        const itemKeys = startItemKeys();

        const newStartingEquipment = itemKeys.flatMap(key => {
            const items = startingEquipment()[key];
            const newStartingEquipment: StartingEquipment = {
                optionKeys: [key],
                items: items.split(','),
            }


            return newStartingEquipment;
        })
                
        let id: string = ""

        const exist = is_exist();

        if (exist) {
            id = formData.id;
        } else {
            id = createNewId();
        }

        const background: Background = {
            id: id,
            name: formData.name,
            desc: formData.desc,
            proficiencies: newProficiencies,
            startEquipment: newStartingEquipment,
            abilityOptions: formData.abilityOptions,
            feat: formData.feat,
            languages: newLangugaes,
            features: newFeatures
        }

        const valid = formGroup.validate();

        if (!valid) {
            const errs: string[] = [
                ...formGroup.getErrors("name"),
                ...formGroup.getErrors("id"),
                ...formGroup.getErrors("abilityOptions")
            ]

            errs.forEach(err => addSnackbar({
                severity: "error",
                message: err
            }))

            return;
        }

        if (exist) {
            addSnackbar({
                severity: "success",
                message: `Updateing background: ${formData.name}!`
            })
            homebrewManager.updateBackground(background);
            clearForm();
        } else {
            addSnackbar({
                severity: "success",
                message: `Adding new background: ${formData.name}`
            })
            homebrewManager.addBackground(background);
            clearForm();
        }
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

    const getBackground = (search?: boolean) => {
        const paramName = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(",");

        const formName = selectedName();

        const name = search ? paramName ?? "" : formName;

        if (name === "") return;

        const background = srdBackgrounds().find(background => background.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (!background) {
            return;
        }

        fillForm(background);
    }

    const fillForm = (background: Background) => {
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

        // non background stuff

        setSearchParam({name: background.name});
    }

    const cloneBackground = () => {
        const formName = selectedName();

        if (formName === "") return;

        const background = srdBackgrounds().find(background => background.name.toLowerCase().trim() === formName.toLowerCase().trim());

        if (!background) {
            return;
        }

        fillForm(Clone(background));
    }

    const clearForm = () => {

    }

    // effects 

    onMount(() => {
        document.body.classList.add('backgrounds-bg');

        const formName = selectedName();
    
        if (!searchParam.name && formName !== "") setSearchParam({name: formName});
    
        if (searchParam.name) getBackground(true);
    })

    onCleanup(() => {
        document.body.classList.remove('backgrounds-bg');
    })

    createEffect(()=>{
        const formName = selectedName();

        setSearchParam({name: formName});
    })
    
    return <Body class={`${styles.body}`}>
        <h2>Backgrounds</h2>

        <Form data={formGroup} onSubmit={(data)=> {
            if (Array.isArray(data)) {
                data.forEach((item) => handleSubmit(item));
            } else {
                handleSubmit(data);
            }
        }}>  
            <Identity 
                formGroup={formGroup} 
                existingBackgrounds={homebrewBackgrounds}
                srdBackgrounds={srdBackgrounds}
                clone={()=>cloneBackground()}
                fill={()=>getBackground()}
                delete={()=>{}} 
            />

            <AbilityScore 
                abilityScores={abilityScores} 
                formGroup={formGroup} 
                allStats={abillityOptions} 
            />

            <Equipment 
                startItemKeys={startItemKeys} 
                startingEquipment={[startingEquipment, setStartingEquipment]} 
                allItems={srdItems}
                setShowItems={setShowItemsPopup} 
            />

            <OriginFeat 
                featID={featID} 
                getSelectedFeat={getSelectedFeat} 
                originFeats={originFeats} 
            />

            <Proficiencies 
                weaponProfs={weaponProfs} 
                armorProfs={armorProfs} 
                skillProfs={skillProfs} 
                toolProfs={toolProfs} 
                setShowPopup={setShowProfsPopup} 
            />

            <Languages 
                languages={[languages, setLanguages]}
                form={formGroup}
                allLangs={AllLanguages} 
            />

            <OptionalFeatures 
                features={[features, setFeatures]}
                showPopup={setShowFeaturePopup}
            />

            <Saving 
                is_exist={is_exist} 
                onSubmit={() => handleSubmit(formGroup.get())}
            />
        </Form>

        <EquipmentPopup 
            show={[showItemsPopup, setShowItemsPopup]}
            startItemKeys={startItemKeys}
            startingEquipment={[startingEquipment, setStartingEquipment]}
            allItems={srdItems} 
            formGroup={formGroup} 
        />

        <ProficienciesPopup 
            show={[showProfsPopup, setShowProfsPopup]}
            setWeapons={[weaponProfs, setWeaponProfs]}
            setArmor={[armorProfs, setArmorProfs]}
            setSkills={[skillProfs, setSkillProfs]}
            setTools={[toolProfs, setToolProfs]}
        />

        <FeaturesPopup 
            Show={[showFeaturePopup, setShowFeaturePopup]}
            feature={[currentFeature, setCurrentFeature] as any}
        />
    </Body>
}