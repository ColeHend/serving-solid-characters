import { Accessor, Component, createMemo, createSignal, Show} from "solid-js";
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

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key] ?? null;
    }

    const learnedSpells = createMemo(() => getMadValue("ID"));

    const [localID, setLocalID] = createSignal(learnedSpells() ?? ""); 

    const isLearned = (id: string) => localID() === id;

    const getSpellByID = (id: string) => allSpells().find(spell => spell.id === id) ?? null;

    const handleSubmit = () => {
        props.toggleSpell(localID());
    }

    return <div class={`${styles.wrapper}`}>
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
                                // props.toggleSpell(spell.id);
                                if (isLearned(spell.id)) {
                                    setLocalID("");
                                } else {
                                    setLocalID(spell.id);
                                }
                           }}>
                                {isLearned(spell.id) ? "Unlearn" : "Learn"}
                            </Button>
                        )}
                    </Cell>
                </Column>
            </Table>

            <Button onClick={handleSubmit}>Set Change</Button>
        </div>
        <Show when={localID() !== ""} fallback={<div style={{margin: "1rem"}}>Select a spell to see its details.</div>}>
            <div>
                <h2>{getSpellByID(localID())?.name}</h2>

                <h2>{getSpellByID(localID())?.level} {getSpellByID(localID())?.school}</h2>

                <p><strong>Casting Time:</strong> {getSpellByID(localID())?.castingTime}</p>

                <p><strong>Range:</strong> {getSpellByID(localID())?.range}</p>

                <p><strong>Components:</strong> {getSpellByID(localID())?.components}</p>

                <p><strong>Duration:</strong> {getSpellByID(localID())?.duration}</p>

                {/* <p>{}</p> */}
                <Markdown text={getSpellByID(localID())?.description ?? "**No description available.**"} />
            </div>
        </Show>

        
    </div>
}