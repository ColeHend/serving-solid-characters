import { Table, Column, Header, Cell, FormGroup, Row, Button, Icon, Chipbar, ChipType, Chip } from "coles-solid-library"
import { Accessor, Component, createEffect, createMemo, createSignal, Setter, Show, For } from "solid-js"
import { FlatCard } from "../../../../shared/components/flatCard/flatCard"
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../../models/data"
import { CharacterForm } from "../../../../models/character.model";
import styles from "./spellsSection.module.scss";
import SearchBar from "../../../../shared/components/SearchBar/SearchBar";
import { Clone, spellLevel } from "../../../../shared";
import SpellModal from "../../../../shared/components/modals/spellModal/spellModal.component";
interface SectionProps {
    knSpells: [Accessor<string[]>,Setter<string[]>];
    selectedClass: Accessor<string>; 
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

    const isLearned = (spellName: string) => {
        return knownSpells().includes(spellName);
    }

    const dataSort = (sortBy: keyof Spell) => {
        setCurrentSort((old) => {
          if (old.sortKey === sortBy) {
            return Clone({ sortKey: sortBy as string, isAsc: !old.isAsc });
          } else {
            return Clone({ sortKey: sortBy as string, isAsc: old.isAsc });
          }
        });
        setLearnSpells((old) => {
          const currentSorting = currentSort();
          const shouldAce = currentSorting.isAsc;
    
          const sorted = Clone(
            old.sort((a, b) => {
              const aSort =
                typeof a?.[sortBy] === "string"
                  ? a?.[sortBy].replaceAll(" ", "")
                  : a?.[sortBy];
              const bSort =
                typeof b?.[sortBy] === "string"
                  ? b?.[sortBy].replaceAll(" ", "")
                  : b?.[sortBy];
    
              if (aSort === undefined || bSort === undefined) {
                return 0;
              }
    
              if (aSort < bSort) return shouldAce ? 1 : -1;
              if (aSort > bSort) return shouldAce ? -1 : 1;
              return 0;
            })
          );
    
          setSearchResults(sorted);
    
          return sorted;
        });
    };

    const getSpell = (name: string): Spell|null  => {
        const spell = srdSpells().find((spell, i)=>spell.name === name);

        if (spell) return spell;

        return null;
    }

    const currentClass = createMemo(()=>props.selectedClass());

    const filterdSpells = createMemo(()=>srdSpells().filter(s => s.classes.includes(currentClass())).sort((a,b)=>+a.level - +b.level));
    
    let prev:string;
    createEffect(()=>{
        
        setLearnSpells(
            filterdSpells()
        )
        prev = currentClass();
        // if (currentClass() !== "") {
        // } 

        if (prev !== currentClass()) {
            setSearchResults(learnSpells());
            
        }

       
    })

    
    return <FlatCard icon="book_ribbon" headerName="spells">
        <FlatCard class={`${styles.SpellsCard}`} icon="book_5" headerName={`Known Spells (${knownSpells().length})`}>
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
        </FlatCard>
        <FlatCard class={`${styles.SpellsCard}`} icon="book_3" headerName="Add Spells" startOpen>
            <div class={`${styles.searchBar}`}>
                <SearchBar 
                dataSource={learnSpells} 
                setResults={setSearchResults} 
                searchFunction={(data,search)=>data.name.toLowerCase() === search.toLowerCase()}/>

            </div>
            <div class={`${styles.learnSpellsTable}`}>
                <Table data={searchResults} columns={["name","level","learnBtn"]}>
                    <Column name="name">
                        <Header onClick={()=>dataSort("name")}>
                            Name
                            <Show when={currentSort().sortKey === "name"}>
                                <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                            </Show>
                        </Header>
                        <Cell<Spell>>
                            {(spell)=><span>
                                <div>{spell.name}</div>
                                <div>
                                    <Show when={spell.is_concentration}>
                                        <span>concentration</span>
                                    </Show>
                                    <Show when={spell.is_ritual}>
                                        <span>ritual</span>
                                    </Show>
                                </div>

                            </span>}
                        </Cell>
                    </Column>

                    <Column name="level">
                        <Header onClick={()=>dataSort("level")}>
                        Level
                        <Show when={currentSort().sortKey === "level"}>
                            <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                        </Show>
                        </Header>
                        <Cell<Spell>>
                            {(spell)=><span>
                                <span>{spellLevel(+spell.level)}</span>
                            </span>}
                        </Cell>
                    </Column>

                    <Column name="learnBtn">
                       <Header><></></Header>
                       <Cell<Spell> onClick={(e)=>e.stopPropagation()}>
                        {(spell)=><span>
                            <Show when={!isLearned(spell.name)}>
                                <Button class={`${styles.LearnBtn}`} onClick={()=>{
                                    setKnownSpells(old=>[...old,spell.name])
                                }}>
                                    <Icon name="add"/> Learn
                                </Button>
                            </Show>
                            <Show when={isLearned(spell.name)}>
                                <Button class={`${styles.LearnBtn}`} onClick={()=>{
                                    setKnownSpells(old=>old.filter(s=>s !== spell.name));
                                }}>
                                    <Icon name="remove" /> Delete
                                </Button>
                            </Show>
                        </span>}
                       </Cell>
                    </Column>
                    
                    <Row onClick={(e,spell)=>{
                        setSelectedSpell(spell);
                        setShowSpellModal(old => !old);
                    }} />
                </Table>
            </div>
        </FlatCard>
        <Show when={showSpellModal()}>
            <SpellModal 
                spell={selectedSpell}
                backgroundClick={[showSpellModal,setShowSpellModal]}
            />
        </Show>
    </FlatCard>
}