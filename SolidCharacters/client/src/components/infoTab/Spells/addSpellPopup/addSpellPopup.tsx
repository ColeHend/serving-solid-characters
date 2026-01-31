import { 
    Accessor,
    Component, 
    createMemo, 
    Setter
} from "solid-js"
import {
    Cell,
    Column,
    Header,
    Modal, 
    Row, 
    Table
} from "coles-solid-library"
import { Spell } from "../../../../models/data";
import { characterManager } from "../../../../shared";
import { Character } from "../../../../models/character.model";
import styles from "./addSpellPopup.module.scss";
import { AddSpell } from "../../../../shared/customHooks/utility/tools/addSpellToChar";

interface modalProps {
    show: [Accessor<boolean>,Setter<boolean>];
    character: Setter<string>;
    spell: Spell;

}

export const AddSpellPopup:Component<modalProps> = (props) => {
    const characters = createMemo(()=>characterManager.characters());

    const [showPopup, setShowPopup] = props.show;

    const handleClick = (character: Character) => {
        AddSpell(props.spell,character.name);
        props.character(character.name);
        setShowPopup(false);
    }

    return <Modal show={props.show} title={`Add ${props.spell.name} to character`} >
        <h2>Choose a character</h2>
        
        <div class={`${styles.characterTable}`}>
            <Table columns={["name","level","class"]} data={characters}>
                <Column name="name">
                    <Header>Name</Header>
                    <Cell<Character>>
                        {(character)=><span>
                            {character.name}
                        </span>}
                    </Cell>
                </Column>

                <Column name="level">
                    <Header>Level</Header>
                    <Cell<Character>>
                        {(character)=><span>
                            {character.level}
                        </span>}
                    </Cell> 
                </Column>

                <Column name="class">
                    <Header>Class</Header>
                    <Cell<Character>>
                        {(character)=><span>
                            {character.className}
                        </span>}
                    </Cell>
                </Column>

                <Row class={`${styles.TableRow}`} onClick={(e,character:Character)=>handleClick(character)}/>
            </Table>
        </div>

    </Modal>
}