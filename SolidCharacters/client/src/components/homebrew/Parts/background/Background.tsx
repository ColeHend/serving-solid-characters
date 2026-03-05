import { Body, Form, FormGroup, Validators } from "coles-solid-library";
import { Component, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BackgroundForm } from "../../../../models/data/formModels";
import styles from "./Background.module.scss";
import { Feat, FeatureDetail } from "../../../../shared";
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

export const HomebrewBackgrounds: Component = () => {

    const formGroup = new FormGroup<BackgroundForm>({
        "id": [0, [Validators.Required]],
        "name": ["", [Validators.Required]],
        "newName": ["", []],
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

    const abillityOptions = [
        "Strength",
        "Dexterity",
        "Constitution",
        "Intelligence",
        "Wisdom",
        "Charisma"
    ]

    const srdFeats = useDnDFeats();

    const originFeats = createMemo(() => srdFeats().filter(x => x.prerequisites.length === 0))

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
            <Identity formGroup={formGroup} />

            <AbilityScore abilityScores={abilityScores} formGroup={formGroup} />

            <Equipment startItemKeys={startItemKeys} startingEquipment={startingEquipment} />

            <OriginFeat featID={featID} getSelectedFeat={getSelectedFeat} originFeats={originFeats} />

            <Proficiencies 
                weaponProfs={weaponProfs} 
                armorProfs={armorProfs} 
                skillProfs={skillProfs} 
                toolProfs={toolProfs} />

            <Languages />

            <OptionalFeatures />

            <Saving />
        </Form>
    </Body>
}