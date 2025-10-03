import { Table, Column, Header, Cell, FormGroup, Row, Button, Icon, Chipbar, ChipType, Chip } from "coles-solid-library"
import { Accessor, Component, createEffect, createMemo, createSignal, Setter, Show, For } from "solid-js"
import { FlatCard } from "../../../../shared/components/flatCard/flatCard"
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { Class5E, Spell } from "../../../../models/data"
import { CharacterForm } from "../../../../models/character.model";
import styles from "./spellsSection.module.scss";
import SearchBar from "../../../../shared/components/SearchBar/SearchBar";
import { Clone, spellLevel } from "../../../../shared";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
interface SectionProps {
    knSpells: [Accessor<string[]>,Setter<string[]>];
    selectedClasses: Accessor<Class5E[]>; 
    selectedSubclass: Accessor<string>;
}

export const SpellsSection:Component<SectionProps> = (props) => {
    const [knownSpells,setKnownSpells] = props.knSpells;
    const srdSpells = useDnDSpells();

    const [searchResults, setSearchResults] = createSignal<Spell[]>([]);
    const [learnSpells,setLearnSpells] = createSignal<Spell[]>([]);
    const [currentSort, setCurrentSort] = createSignal<{
        sortKey: string;
        isAsc: boolean;
    }>({ sortKey: "level", isAsc: true });
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
 
    return <FlatCard icon="book_ribbon" headerName={`Spells (${knownSpells().length})`}>
        <div class={`${styles.spellChips}`}>
            <For each={knownSpells()}>
                {(spell) => <Chip value={spell} onClick={(()=>{
                    const Spell = getSpell(spell);

                    if (Spell) {
                        setSelectedSpell(Spell);
                        setShowSpellModal(old => !old);
                    }
                })}
                remove={()=>setKnownSpells(old => old.filter(s => s !== spell))}/>}
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