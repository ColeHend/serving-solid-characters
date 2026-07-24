import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { Spell } from "../../../../models/generated";
import { Table, Column, Header, Cell, Row, Button, Icon, FlatCard } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import { Character } from "../../../../models/character.model";
import styles from "./SpellTable.module.scss";
import { characterManager } from "../../../../shared";
import { ConcBadge } from "../sheet/CoreTabParts/concBadge/concBadge";
import { FleuronDivider } from "../../../../shared/components/fleuronDivider/fleuronDivider";
import { LegacyBadge } from "../sheet/CoreTabParts/legacyBadge/legacyBadge";
import SearchBar from "../../../../shared/components/SearchBar/SearchBar";

interface tableProps {
    spells: Accessor<Spell[]>;
    show: (Spell: Spell) => void;
    currentCharacter: Accessor<Character>;
}

export const SpellTable:Component<tableProps> = (props) => {
    const [results, setResults] = createSignal<Spell[]>([]);

    const level = createMemo(() => props.spells()[0].level );

    const displayLevel = () => {
        switch(level()) {
        case "0":
            return "Cantrips";

        default:
            return `Level ${level()} Spells`
        }
    }

    const showLevel = (level: string) => {
        switch(level) {
            case "0":
                return "Cantrips";
            
            case "1":
                return "1st";

            case "2":
                return "2nd";

            case "3":
                return "3rd";
        
            default:
                return `${level}th`
    
        }
    }

    return <>
        <div class={`${styles.header}`}>
            <span>{displayLevel()}</span>

            <span>Spells: {props.spells().length}</span>            
        </div>

        <div class={`${styles.searchBar}`}>
            <SearchBar dataSource={props.spells} setResults={setResults} />
        </div>

        <div class={`${styles.spellList}`}>
            <Show when={props.spells().length}>
                <For each={results()}>
                    {(spell,i) => <FlatCard header={<div class={`${styles.clickyHeader}`} onClick={() => props.show(spell)}>
                        <span>{spell.name}</span> 
                        <span class={`${styles.dot}`}>·</span> 
                        <span>{spell.school}</span>
                        <Show when={spell.concentration}> 
                            <span class={`${styles.dot}`}>·</span> 

                            <span class={`${styles.badges}`}>
                                <ConcBadge />
                                <Show when={spell.legacy}>
                                    <LegacyBadge />
                                </Show>
                            </span>
                        </Show>   
                    </div>} hideBottomBorder={i() !== props.spells().length - 1}> 
                        <div>
                            <div class={`${styles.spellTopAttr}`}>
                                <span class={`${styles.attribute}`}>
                                    <span>Range</span> 

                                    {spell.range}
                                </span>

                                <span class={`${styles.attribute}`}>
                                    <span>Components</span> 

                                    {spell.components}
                                </span>

                                <span class={`${styles.attribute}`}>
                                    <span>Casting Time</span>

                                    {spell.castingTime}
                                </span>
                            </div>

                            <FleuronDivider color="#ffd875"/>

                            <div class={`${styles.ViewButton}`}>
                                <Button onClick={() => props.show(spell)}>View {spell.name}</Button>
                            </div>
                        </div>
                    </FlatCard>}
                </For>
            </Show>
        </div>
    </>
}