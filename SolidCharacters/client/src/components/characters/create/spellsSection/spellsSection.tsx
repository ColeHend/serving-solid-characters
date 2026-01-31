import { Chip, FormGroup } from "coles-solid-library"
import { Component, createMemo, createSignal, Show, For, Accessor, Setter } from "solid-js"
import { FlatCard } from "../../../../shared/components/flatCard/flatCard"
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../../models/data"
import { Character, CharacterForm } from "../../../../models/character.model";
import styles from "./spellsSection.module.scss";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
import { SetStoreFunction } from "solid-js/store";
interface SectionProps {
    spells: [Accessor<string[]>, Setter<string[]>];
}

export const SpellsSection:Component<SectionProps> = (props) => {

    const [knownSpells,setKnownSpells] = props.spells;

    const characterSpells = createMemo(()=>knownSpells());

    const removeSpell = (spell: string) => {
        setKnownSpells((old)=>old.filter(old=>old !== spell))
    }

    const srdSpells = useDnDSpells();

    const [showSpellModal,setShowSpellModal] = createSignal<boolean>(false);
    const [selectedSpell,setSelectedSpell] = createSignal<Spell>({
        id: "",
        name: "",
        description: "",
        duration: "",
        is_concentration: false,
        level: "0",
        range: "",
        is_ritual: false,
        school: "",
        castingTime: "",
        damageType: "",
        page: "",
        components: "",
        isMaterial: false,
        isSomatic: false,
        isVerbal: false,
        materials_Needed: "",
        higherLevel: "",
        classes: [],
        subClasses: []
    });

    const getSpell = (name: string): Spell|null  => {
        const spell = srdSpells().find((spell, i)=>spell.name === name);

        if (spell) return spell;

        return null;
    }
 
    return <FlatCard icon="book_ribbon" headerName={`Spells (${characterSpells().length})`}>
        <div class={`${styles.spellChips}`}>
            <For each={characterSpells()}>
                {(spell) => <Chip value={spell} onClick={(()=>{
                    const Spell = getSpell(spell);

                    if (Spell) {
                        setSelectedSpell(Spell);
                        setShowSpellModal(old => !old);
                    }
                })}
                remove={()=>removeSpell(spell)}/>}
            </For>
        </div>
       
        <Show when={showSpellModal()}>
            <SpellModal 
                spell={selectedSpell}
                backgroundClick={[showSpellModal,setShowSpellModal]}
            />
        </Show>
    </FlatCard>
}