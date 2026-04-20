import { Accessor, Component, createMemo, Show} from "solid-js";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import { Markdown } from "../../../../../../shared";
import { Spell } from "../../../../../../models/generated";
import styles from './spellFeature.module.scss';


interface SpellFeatureProps {
    allSpells: Accessor<Spell[]>;
    getValue: Accessor<Record<string, string> | undefined>;
    toggleSpell: (id: string) => void;
}

export const SpellFeature:Component<SpellFeatureProps> = (props) => {
    const columns = ["Spell Name", "Level", "School", "Actions"];
    const allSpells = createMemo(() => props.allSpells());

    const learnedSpells = createMemo(() => props.getValue()?.['ID'] ?? "");

    const isLearned = (id: string) => learnedSpells() === id;

    const getSpellByID = (id: string) => allSpells().find(spell => spell.id === id);

    return <div style={{display:"flex", "flex-direction": "row"}}>
        <div class={`${styles.spellList}`}> 
            <Table data={allSpells} columns={columns} >
                <Column name="Spell Name">
                    <Header>Spell Name</Header>
                    <Cell<Spell>>
                        {spell => spell.name}
                    </Cell>
                </Column>
                <Column name="Level">
                    <Header>Level</Header>
                    <Cell<Spell>>
                        {spell => spell.level}
                    </Cell>
                </Column>
                <Column name="School">
                    <Header>School</Header>
                    <Cell<Spell>>
                        {spell => spell.school}
                    </Cell>
                </Column>
                <Column name="Casting Time">
                    <Header>Casting Time</Header>
                    <Cell<Spell>>
                        {spell => spell.castingTime}
                    </Cell>
                </Column>
                <Column name="Range">
                    <Header>Range</Header>
                    <Cell<Spell>>
                        {spell => spell.range}
                    </Cell>
                </Column>
                <Column name="Components">
                    <Header>Components</Header>
                    <Cell<Spell>>
                        {spell => spell.components}
                    </Cell>
                </Column>
                <Column name="Duration">
                    <Header>Duration</Header>
                    <Cell<Spell>>
                        {spell => spell.duration}
                    </Cell>
                </Column>
                <Column name="Actions">
                    <Header>Actions</Header>
                    <Cell<Spell>>
                        {spell => (
                            <Button type="button" onClick={() => {
                                props.toggleSpell(spell.id);
                           }}>
                                {isLearned(spell.id) ? "Unlearn" : "Learn"}
                            </Button>
                        )}
                    </Cell>
                </Column>
            </Table>
        </div>
        <Show when={learnedSpells() !== ""} fallback={<div style={{margin: "1rem"}}>Select a spell to see its details.</div>}>
            <div>
                <h2>{getSpellByID(learnedSpells())?.name}</h2>

                <h2>{getSpellByID(learnedSpells())?.level} {getSpellByID(learnedSpells())?.school}</h2>

                <p><strong>Casting Time:</strong> {getSpellByID(learnedSpells())?.castingTime}</p>

                <p><strong>Range:</strong> {getSpellByID(learnedSpells())?.range}</p>

                <p><strong>Components:</strong> {getSpellByID(learnedSpells())?.components}</p>

                <p><strong>Duration:</strong> {getSpellByID(learnedSpells())?.duration}</p>

                {/* <p>{}</p> */}
                <Markdown text={getSpellByID(learnedSpells())?.description ?? "**No description available.**"} />
            </div>
        </Show>
    </div>
}