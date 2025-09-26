import { Accessor, Component, createMemo, Setter } from "solid-js";
import { Spell } from "../../../../models/data";
import { Table, Column, Header, Cell, Row, Button, Icon, Checkbox, addSnackbar } from "coles-solid-library";
import { Character, CharacterSpell } from "../../../../models/character.model";
import styles from "./SpellTable.module.scss";
import { characterManager } from "../../../../shared";

interface tableProps {
    spells: Accessor<Spell[]>;
    show: (Spell: Spell) => void;
    currentCharacter: Accessor<Character>;
}

export const SpellTable:Component<tableProps> = (props) => {
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

    const getCharSpell = (spell: Spell) => {
        return props.currentCharacter().spells.find(s => s.name === spell.name);
    }



    return <>
        <div class={`${styles.header}`}>
            <span>{displayLevel()}</span>

            <span>Spells: {props.spells().length}</span>                 
        </div>
        <Table<Spell> 
            columns={["prepaired","name","level"]} 
            data={(()=>props.spells())}
            class={styles.spellTable}>
            <Column name="name">
                <Header><></></Header>
                <Cell<Spell>>{(spell) => <span class={`${styles.nameColumn}`}>
                    <h4>{spell.name}</h4>
                    <span>{spell.school}</span>
                    <span>{spell.duration}</span>
                    <span>{spell.castingTime}</span>
                    <span>{spell.is_ritual && <em> (Ritual)</em>}</span>    
                </span>}</Cell>
            </Column>
            <Column name="level">
                <Header><></></Header>
                <Cell<Spell> onClick={(e)=>e.stopPropagation()}>{(spell) => <span class={`${styles.levelColumn}`}>
                    <span>{showLevel(spell.level)}</span>
                    
                    <Button transparent onClick={()=>{
                        const confirm = window.confirm("Are you sure?");

                        if (confirm) characterManager.deleteCharSpell(props.currentCharacter().name, spell.name);
                    }}><Icon color="red" name="delete" /></Button>
                </span>}</Cell>
            </Column>

            <Row onClick={(e, spell)=>props.show(spell)} />
        </Table>
    </>
}