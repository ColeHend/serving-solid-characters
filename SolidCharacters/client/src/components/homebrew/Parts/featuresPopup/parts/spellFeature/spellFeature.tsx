import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, Setter, useContext } from "solid-js";
import { Spell } from "../../../../../../models/generated";
import { useDnDSpells } from "../../../../../../shared/customHooks/dndInfo/info/all/spells";
import { SharedHookContext } from "../../../../../rootApp";


interface SpellFeatureProps {
    learnedSpells: [Accessor<string[]>, Setter<string[]>];
}

export const spellFeature:Component<SpellFeatureProps> = (props) => {

    let columns = ["Spell Name", "Level", "School", "Casting Time", "Range", "Components", "Duration","Actions"];
    const allSpells = useDnDSpells();
    const context = useContext(SharedHookContext);

    const isMobile = createMemo(() => context.isMobile());

    const [learnedSpells, setLearnedSpells] = props.learnedSpells;

    const isLearned = (id: string) => learnedSpells().some(spellID => spellID === id);

    const getSpellByID = (id: string) => allSpells().find(spell => spell.id === id);

    const toggleLearnSpell = (id: string) => {
        if (isLearned(id)) {
            setLearnedSpells(learnedSpells().filter(spellID => spellID !== id));
        } else {
            setLearnedSpells([...learnedSpells(), id]);
        }
    }

    createEffect(() => {
        if (isMobile()) {
            columns = ["Spell Name", "Level", "School"];
        }
    })

    return <div>
        <div>
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
                            <Button onClick={() => toggleLearnSpell(spell.id)}>
                                {isLearned(spell.id) ? "Unlearn" : "Learn"}
                            </Button>
                        )}
                    </Cell>
                </Column>


            </Table>
        </div>
    </div>
}